// Parses bank statement CSVs into BankStatementExtraction shape.
// Supports: Monzo, Barclays, Starling, generic (auto-detected from headers).
// Used in dev mode to load real bank data without Tink credentials.

import type {
  BankStatementExtraction,
  ExtractedIncome,
  DetectedPayment,
  SpendingCategory,
} from '@/lib/ai/extraction-schemas'
import { lookupCorrection } from '@/lib/bank/user-corrections'

// ═══ Format detection ═══

type BankFormat = 'monzo' | 'barclays' | 'starling' | 'generic'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number // positive = credit, negative = debit
  category?: string
}

function detectFormat(headers: string[]): BankFormat {
  const h = headers.map((s) => s.toLowerCase().trim())
  if (h.includes('emoji') || (h.includes('money out') && h.includes('money in'))) return 'monzo'
  if (h.includes('subcategory') && h.includes('memo')) return 'barclays'
  if (h.includes('counter party') && h.includes('spending category')) return 'starling'
  return 'generic'
}

// ═══ CSV parsing ═══

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseDate(dateStr: string): string {
  // Handle DD/MM/YYYY and YYYY-MM-DD
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
  const iso = dateStr.match(/^\d{4}-\d{2}-\d{2}/)
  if (iso) return iso[0]
  return dateStr
}

function parseMonzo(headers: string[], rows: string[][]): ParsedTransaction[] {
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase())
  const dateIdx = idx('Date')
  const nameIdx = idx('Name')
  const amountIdx = idx('Amount')
  const categoryIdx = idx('Category')
  const moneyOutIdx = idx('Money Out')
  const moneyInIdx = idx('Money In')

  return rows.map((row) => {
    let amount: number
    if (amountIdx >= 0 && row[amountIdx]) {
      amount = parseFloat(row[amountIdx].replace(/[£,]/g, ''))
    } else {
      const out = parseFloat((row[moneyOutIdx] || '0').replace(/[£,]/g, ''))
      const inc = parseFloat((row[moneyInIdx] || '0').replace(/[£,]/g, ''))
      amount = inc > 0 ? inc : -out
    }
    return {
      date: parseDate(row[dateIdx] || ''),
      description: row[nameIdx] || '',
      amount,
      category: row[categoryIdx] || undefined,
    }
  }).filter((t) => !isNaN(t.amount) && t.amount !== 0)
}

function parseBarclays(headers: string[], rows: string[][]): ParsedTransaction[] {
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase())
  const dateIdx = idx('Date')
  const amountIdx = idx('Amount')
  const memoIdx = idx('Memo')
  const subcatIdx = idx('Subcategory')

  return rows.map((row) => ({
    date: parseDate(row[dateIdx] || ''),
    description: row[memoIdx] || '',
    amount: parseFloat((row[amountIdx] || '0').replace(/[£,]/g, '')),
    category: row[subcatIdx] || undefined,
  })).filter((t) => !isNaN(t.amount) && t.amount !== 0)
}

function parseStarling(headers: string[], rows: string[][]): ParsedTransaction[] {
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase())
  const dateIdx = idx('Date')
  const counterPartyIdx = idx('Counter Party')
  const amountIdx = idx('Amount (GBP)')
  const categoryIdx = idx('Spending Category')

  return rows.map((row) => ({
    date: parseDate(row[dateIdx] || ''),
    description: row[counterPartyIdx] || '',
    amount: parseFloat((row[amountIdx] || '0').replace(/[£,]/g, '')),
    category: row[categoryIdx] || undefined,
  })).filter((t) => !isNaN(t.amount) && t.amount !== 0)
}

function parseGeneric(headers: string[], rows: string[][]): ParsedTransaction[] {
  // Try to find date, description, and amount columns by name
  const h = headers.map((s) => s.toLowerCase().trim())
  const dateIdx = h.findIndex((s) => s.includes('date'))
  const descIdx = h.findIndex((s) => s.includes('description') || s.includes('memo') || s.includes('name') || s.includes('reference'))
  const amountIdx = h.findIndex((s) => s.includes('amount') || s.includes('value'))

  if (dateIdx < 0 || amountIdx < 0) return []

  return rows.map((row) => ({
    date: parseDate(row[dateIdx] || ''),
    description: row[descIdx >= 0 ? descIdx : 0] || '',
    amount: parseFloat((row[amountIdx] || '0').replace(/[£,]/g, '')),
  })).filter((t) => !isNaN(t.amount) && t.amount !== 0)
}

// ═══ Transaction → Extraction ═══

export function normaliseDescription(desc: string): string {
  return desc
    .toLowerCase()
    // Strip common bank prefixes
    .replace(/^(card payment to|faster payment to|direct debit|standing order|bank transfer to|visa deb|visa credit|mastercard|contactless)\s+/i, '')
    // Strip DD/SO/S/O/D/D markers
    .replace(/\b(dd|so|s\/o|d\/d|spc|bgt|bgc|bac|chq|tfr|cr|dr)\b/gi, '')
    // Strip reference numbers (REF:xxx, ref xxx, /xxx, #xxx)
    .replace(/\b(ref:?\s*\S+|reference\s*\S+)\b/gi, '')
    .replace(/[/#]\S+/g, '')
    // Strip dates (12MAR26, 12 MAR, 12/03/2026, 2026-03-12, ON 12 MAR, etc.)
    .replace(/\b\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{0,4}\b/gi, '')
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{0,4}\b/gi, '')
    .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}\b/g, '')
    .replace(/\b(on|at)\s+\d{1,2}\b/gi, '')  // "ON 21", "AT 14"
    // Strip GBP amounts (GBP 47.50, £47.50)
    .replace(/\b(gbp\s*)?\d+\.\d{2}\b/gi, '')
    .replace(/£\d+(\.\d{2})?/g, '')
    // Strip trailing card/account numbers
    .replace(/\b\d{4,}\b/g, '')
    // Strip common suffixes
    .replace(/\b(ltd|plc|limited|inc|co|uk|com|services?|group|grp)\b/gi, '')
    // Clean up
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function groupByPayee(transactions: ParsedTransaction[], isCredit: boolean): Map<string, ParsedTransaction[]> {
  const groups = new Map<string, ParsedTransaction[]>()
  const filtered = transactions.filter((t) => isCredit ? t.amount > 0 : t.amount < 0)
  for (const tx of filtered) {
    const key = normaliseDescription(tx.description)
    if (!key) continue
    const group = groups.get(key) || []
    group.push(tx)
    groups.set(key, group)
  }
  return groups
}

function identifyIncomeFromCSV(credits: Map<string, ParsedTransaction[]>): ExtractedIncome[] {
  const result: ExtractedIncome[] = []
  for (const [, group] of credits) {
    if (group.length < 2) continue
    const amounts = group.map((t) => t.amount)
    const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
    const source = group[0].description
    const variation = amounts.length > 1
      ? (Math.max(...amounts) - Math.min(...amounts)) / avg
      : 0
    result.push({
      source,
      amount: avg,
      period: 'monthly',
      confidence: variation < 0.05 ? 0.95 : variation < 0.15 ? 0.85 : 0.75,
      type: inferIncomeType(source),
    })
  }
  return result.sort((a, b) => b.amount - a.amount)
}

function inferIncomeType(source: string): ExtractedIncome['type'] {
  const s = source.toLowerCase()
  // Benefits — government sources
  if (s.includes('hmrc') || s.includes('dwp') || s.includes('universal credit') ||
      s.includes('child benefit') || s.includes('tax credit') || s.includes('pip') ||
      s.includes('esa') || s.includes('jsa') || s.includes('housing benefit') ||
      s.includes('carers allowance') || s.includes('attendance allowance')) return 'benefits'
  // Pension income (receiving, not contributing)
  if (s.includes('pension') || s.includes('retirement') || s.includes('annuity') ||
      s.includes('teachers pension') || s.includes('nhs pension') ||
      s.includes('civil service pension') || s.includes('armed forces pension')) return 'pension_income'
  // Rental income
  if (s.includes('rent') || s.includes('tenant') || s.includes('letting')) return 'rental'
  // Maintenance received
  if (s.includes('maintenance') || s.includes('cms') || s.includes('child support') || s.includes('csa')) return 'maintenance'
  // Self-employment indicators
  if (s.includes('invoice') || s.includes('stripe') || s.includes('paypal') ||
      s.includes('square') || s.includes('sumup') || s.includes('wise business') ||
      s.includes('freelance')) return 'self_employment'
  // Dividend
  if (s.includes('dividend')) return 'other'
  // Default: most regular income is employment
  return 'employment'
}

const CATEGORY_KEYWORDS: Record<DetectedPayment['likely_category'], string[]> = {
  mortgage: [
    'mortgage',
    // Major UK mortgage lenders
    'halifax', 'nationwide', 'santander', 'natwest', 'barclays mortgage',
    'hsbc mortgage', 'tsb', 'virgin money', 'coventry bs', 'yorkshire bs',
    'leeds bs', 'skipton bs', 'building society', 'principality',
    'accord mortgage', 'kensington mortgage', 'metro bank mortgage',
  ],
  rent: [
    'rent', 'letting', 'lettings', 'openrent', 'estate agent',
    'property management',
    // Major UK letting agents
    'marsh and parsons', 'marsh & parsons', 'foxtons', 'knight frank',
    'savills', 'chestertons', 'winkworth', 'dexters', 'hamptons',
    'ludlow thompson', 'benham and reeves', 'benham & reeves',
    'jll', 'jones lang', 'kfh', 'kinleigh folkard',
    'barnard marcus', 'haart', 'countrywide', 'connells',
    'leaders', 'romans', 'martin co',
    // Housing associations omitted — ambiguous (rent vs shared ownership mortgage).
    // Falls to 'unknown' and triggers mortgage/rent disambiguation question.
  ],
  insurance: [
    'insurance', 'admiral', 'direct line', 'axa', 'lv=', 'lv ',
    'zurich', 'vitality', 'bupa', 'hastings', 'more than', 'legal and general', 'legal & general',
    'esure', 'churchill', 'privilege', 'swiftcover',
    'rac', 'aa insurance', 'nfu mutual',
  ],
  pension_contribution: [
    'pension', 'nest', 'scottish widows', 'standard life', 'royal london',
    'aegon', 'legal & general', 'l&g pension', 'aviva pension',
    'fidelity pension', 'hargreaves pension',
  ],
  childcare: [
    'childcare', 'nursery', 'nurseries', 'after school', 'breakfast club',
    'holiday club', 'childminder', 'childm', 'nanny', 'kids club',
    'bright horizons', 'busy bees',
  ],
  loan_repayment: [
    'loan', 'finance', 'zopa', 'funding circle', 'ratesetter',
    'hitachi', 'creation', 'ikano', 'novuna', 'shawbrook',
    'bamboo', 'oakbrook', 'everyday loans',
    // Car finance
    'bmw financ', 'volkswagen financ', 'pcp', 'black horse',
    'moneybarn', 'startline', 'blue motor',
    // Student loans
    'student loan', 'slc',
  ],
  child_maintenance: ['cms', 'child maintenance', 'csa', 'child support'],
  utilities: [
    // Energy
    'gas', 'electric', 'energy', 'british gas', 'eon', 'e.on',
    'edf', 'octopus', 'sse', 'ovo', 'bulb', 'shell energy',
    'scottish power', 'utilita', 'utility warehouse', 'so energy',
    // Water
    'water', 'thames water', 'united utilities', 'anglian water',
    'severn trent', 'yorkshire water', 'southern water',
    'south west water', 'northumbrian water', 'welsh water',
    'dwr cymru', 'affinity water',
  ],
  council_tax: [
    'council tax', 'council', 'borough', 'city council',
    'county council', 'district council', 'lbc', ' cc ',
    'metropolitan', 'unitary',
  ],
  subscription: [
    'netflix', 'spotify', 'amazon prime', 'disney', 'now tv',
    'apple', 'google', 'youtube', 'audible', 'tidal',
    // Broadband / TV / mobile
    'sky', 'bt broadband', 'bt group', 'virgin media', 'talktalk', 'plusnet',
    'vodafone', 'ee limited', 'ee mobile', 'o2', 'three', 'giffgaff',
    'sky mobile', 'id mobile', 'tesco mobile', 'voxi',
    // Gym / leisure (subscription in Form E terms)
    'david lloyd', 'puregym', 'the gym', 'nuffield', 'virgin active',
    'anytime fitness', 'jd gyms', 'bannatyne',
  ],
  credit_card: [
    'barclaycard', 'amex', 'american express', 'mbna', 'capital one',
    'vanquis', 'aqua', 'marbles', 'newday', 'tesco bank card',
    'sainsburys bank card', 'virgin money card',
  ],
  investment: [
    'hargreaves lansdown', 'vanguard', 'aj bell', 'interactive investor',
    'fidelity', 'nutmeg', 'wealthify', 'moneybox', 'freetrade',
    'trading 212', 'etoro', 'hl isa', 'hl savings',
    // Crypto exchanges
    'coinbase', 'binance', 'kraken', 'crypto.com', 'gemini', 'bitstamp',
  ],
  gambling: [
    'bet365', 'paddy power', 'william hill', 'betfair', 'ladbrokes',
    'coral', 'sky bet', 'betfred', 'tombola', 'lottoland',
    'national lottery', 'camelot', 'gala bingo', 'unibet', 'fanduel',
  ],
  groceries: [
    'tesco', 'sainsbury', 'asda', 'morrisons', 'aldi', 'lidl',
    'waitrose', 'co-op', 'coop', 'co op', 'marks spencer', 'm&s ',
    'iceland', 'ocado', 'farmfoods', 'heron foods',
  ],
  dining: [
    'mcdonalds', 'mcdonald', 'kfc', 'burger king', 'pizza hut', 'dominos',
    'nandos', 'greggs', 'costa coffee', 'starbucks', 'pret a manger',
    'wetherspoon', 'deliveroo', 'uber eats', 'just eat',
    'dishoom', 'hakkasan', 'wagamama', 'the ivy', 'zizzi', 'prezzo',
    'franco manca', 'wahaca', 'tortilla', 'leon ', 'itsu',
  ],
  fuel: [
    'shell', 'bp ', 'esso', 'texaco', 'jet ', 'total energies',
    'gulf', 'murco', 'applegreen',
  ],
  transport: [
    'tfl', 'transport for london', 'oyster', 'trainline', 'national rail',
    'northern rail', 'gwr', 'avanti', 'lner', 'scotrail',
  ],
  education: [
    'school', 'academy', 'college', 'university', 'tuition',
  ],
  healthcare: [
    'pharmacy', 'chemist', 'boots pharmacy', 'lloyds pharmacy',
    'dentist', 'dental', 'mydentist', 'orthodont',
    'optician', 'specsavers',
  ],
  unknown: [],
}

// BNPL providers — detected separately from general loan repayments
const BNPL_KEYWORDS = [
  'klarna', 'clearpay', 'afterpay', 'laybuy', 'zilch',
  'paypal credit', 'splitit', 'divido',
]

// Levenshtein distance for fuzzy matching truncated BACS payee names.
// UK BACS descriptions are max 18 chars, so "SAINSBURY" often appears as "SAINSBUR".
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = tmp
    }
  }
  return dp[n]
}

// Check if words in the description fuzzy-match a keyword.
// Handles both single-word keywords and multi-word keywords (e.g. "hargreaves lansdown").
// Only tries fuzzy matching for keywords ≥5 chars. Threshold: ≤2 edits per word.
function fuzzyMatchesKeyword(description: string, keyword: string): boolean {
  if (keyword.length < 5) return false
  const descWords = description.split(/\s+/)
  const kwWords = keyword.split(/\s+/)

  if (kwWords.length === 1) {
    // Single-word keyword: check each description word
    for (const word of descWords) {
      if (word.length < 4) continue
      if (keyword.startsWith(word) && word.length >= keyword.length - 3) return true
      if (levenshtein(word, keyword) <= 2) return true
    }
    return false
  }

  // Multi-word keyword: every keyword word must fuzzy-match a description word
  return kwWords.every((kw) => {
    if (kw.length < 4) return descWords.some((w) => w === kw)
    return descWords.some((w) => {
      if (w.length < 4) return false
      if (kw.startsWith(w) && w.length >= kw.length - 3) return true
      return levenshtein(w, kw) <= 2
    })
  })
}

function inferCategory(description: string): DetectedPayment['likely_category'] {
  const d = description.toLowerCase()
  // Check BNPL first — these are loan_repayment for Form E purposes
  if (BNPL_KEYWORDS.some((kw) => d.includes(kw))) return 'loan_repayment'
  // Aviva disambiguation: "aviva pension" → pension, otherwise → insurance
  if (d.includes('aviva')) {
    return d.includes('pension') ? 'pension_contribution' : 'insurance'
  }
  // Exact substring match first (fast path)
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'unknown') continue
    if (keywords.some((kw) => d.includes(kw))) return category as DetectedPayment['likely_category']
  }
  // Fuzzy match for truncated BACS descriptions (slow path, only if exact failed)
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'unknown') continue
    if (keywords.some((kw) => fuzzyMatchesKeyword(d, kw))) return category as DetectedPayment['likely_category']
  }
  return 'unknown'
}

// Amount-range guards: plausible per-occurrence ranges (£) for each category.
// If keyword-matched amount falls outside the range, the category is kept but
// confidence is downgraded — the keyword match is still informative, just less certain.
const AMOUNT_RANGE_GUARDS: Partial<Record<DetectedPayment['likely_category'], { min: number; max: number }>> = {
  mortgage: { min: 200, max: 5000 },
  rent: { min: 150, max: 4000 },
  insurance: { min: 8, max: 500 },
  pension_contribution: { min: 20, max: 2000 },
  childcare: { min: 50, max: 3000 },
  loan_repayment: { min: 15, max: 3000 },
  child_maintenance: { min: 30, max: 2000 },
  utilities: { min: 10, max: 500 },
  council_tax: { min: 50, max: 500 },
  subscription: { min: 3, max: 300 },
  credit_card: { min: 10, max: 5000 },
  investment: { min: 5, max: 15000 },
  // gambling: no range — any amount is valid for red-flag detection
  education: { min: 50, max: 25000 },
}

function isAmountPlausible(category: DetectedPayment['likely_category'], amount: number): boolean {
  const range = AMOUNT_RANGE_GUARDS[category]
  if (!range) return true // No guard for this category
  return amount >= range.min && amount <= range.max
}

function identifyPaymentsFromCSV(debits: Map<string, ParsedTransaction[]>): DetectedPayment[] {
  const result: DetectedPayment[] = []
  for (const [, group] of debits) {
    // High-value payments (£100+) or known-category payments are relevant even with 1 occurrence
    // (e.g., annual insurance, quarterly HMRC). Low-value unknowns still need ≥2 to filter noise.
    const payee = group[0].description
    const normalisedKey = normaliseDescription(payee)

    // User corrections always win (confidence = 1.0) — layered pipeline top priority
    const userOverride = lookupCorrection(normalisedKey)

    const category = userOverride ?? inferCategory(payee)
    const maxAmount = Math.max(...group.map((t) => Math.abs(t.amount)))
    if (group.length < 2 && category === 'unknown' && maxAmount < 100) continue
    const amounts = group.map((t) => Math.abs(t.amount))
    const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
    const dates = group.map((t) => new Date(t.date).getTime()).sort()
    const gaps = dates.slice(1).map((d, i) => (d - dates[i]) / (24 * 60 * 60 * 1000))
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0

    // Frequency: one_off for single payments, otherwise derive from average gap between dates
    let frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'one_off'
    if (group.length === 1) {
      frequency = 'one_off'
    } else if (avgGap < 10) {
      frequency = 'weekly'
    } else if (avgGap < 45) {
      frequency = 'monthly'
    } else if (avgGap < 120) {
      frequency = 'quarterly'
    } else {
      frequency = 'annual'
    }

    // Confidence scoring: user corrections = 1.0, then category-aware with amount guards
    let confidence: number
    if (userOverride) {
      confidence = 1.0  // User corrections are highest authority
    } else {
      const plausible = isAmountPlausible(category, avg)
      const categoryConfidence = category !== 'unknown'
        ? (plausible ? 0.92 : 0.72)  // Implausible amount → lower confidence than unknown
        : 0.75
      const recurrenceBoost = group.length >= 6 ? 0.03 : group.length >= 3 ? 0.01 : 0
      confidence = Math.min(0.96, categoryConfidence + recurrenceBoost)
    }

    result.push({
      payee,
      amount: avg,
      frequency,
      confidence,
      likely_category: category,
    })
  }
  return result.sort((a, b) => b.amount - a.amount)
}

function aggregateSpending(transactions: ParsedTransaction[]): SpendingCategory[] {
  const debits = transactions.filter((t) => t.amount < 0)
  const categories = new Map<string, { total: number; count: number }>()
  for (const tx of debits) {
    const cat = tx.category || inferCategory(tx.description) || 'Other'
    const existing = categories.get(cat) || { total: 0, count: 0 }
    existing.total += Math.abs(tx.amount)
    existing.count += 1
    categories.set(cat, existing)
  }
  const dates = debits.map((t) => t.date).sort()
  const months = dates.length > 1
    ? Math.max(1, Math.round(
        (new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / (30 * 24 * 60 * 60 * 1000)
      ))
    : 1

  return Array.from(categories.entries())
    .map(([category, { total, count }]) => ({
      category,
      monthly_average: Math.round(total / months),
      transaction_count: count,
    }))
    .sort((a, b) => b.monthly_average - a.monthly_average)
}

// ═══ Main export ═══

export interface CSVParseResult {
  extraction: BankStatementExtraction
  format: BankFormat
  transactionCount: number
  provider: string
  rawTransactions: ParsedTransaction[]
}

export function parseCSVToExtraction(csvText: string, fileName?: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row.')

  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(parseCSVLine)

  const format = detectFormat(headers)

  let transactions: ParsedTransaction[]
  switch (format) {
    case 'monzo': transactions = parseMonzo(headers, rows); break
    case 'barclays': transactions = parseBarclays(headers, rows); break
    case 'starling': transactions = parseStarling(headers, rows); break
    default: transactions = parseGeneric(headers, rows); break
  }

  if (transactions.length === 0) throw new Error('No valid transactions found in CSV.')

  // Derive provider from format or filename
  const provider = format !== 'generic'
    ? format.charAt(0).toUpperCase() + format.slice(1)
    : (fileName?.replace(/[._-]/g, ' ').replace(/\.(csv)$/i, '').trim() || 'Imported bank')

  const credits = groupByPayee(transactions, true)
  const debits = groupByPayee(transactions, false)
  const dates = transactions.map((t) => t.date).filter(Boolean).sort()

  const extraction: BankStatementExtraction = {
    document_type: 'bank_statement',
    provider,
    account_number_last4: null,
    account_type: 'current',
    is_joint: false,
    joint_holder_name: null,
    statement_period_start: dates[0] || null,
    statement_period_end: dates[dates.length - 1] || null,
    closing_balance: Math.round(transactions.reduce((sum, t) => sum + t.amount, 0)),
    income_deposits: identifyIncomeFromCSV(credits),
    regular_payments: identifyPaymentsFromCSV(debits),
    spending_categories: aggregateSpending(transactions),
    notable_transactions: [],
  }

  return {
    extraction,
    format,
    transactionCount: transactions.length,
    provider,
    rawTransactions: transactions,
  }
}
