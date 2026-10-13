// Transforms AI pipeline extraction results into hero panel Q&A format
// Bridge between pipeline.ts (typed extraction) and use-hub.ts (UI state)
//
// Spec 13 decision tree logic lives HERE, not in the AI prompt.
// AI extracts pure financial facts. This module generates:
// - Auto-confirm items (confidence >= 0.95 and unambiguous)
// - Clarification questions (deterministic, from spec 13 signal→question map)
// - Gap detection (checks what's present vs what Form E requires)

import type {
  AutoConfirmItem,
  ClarificationQuestion,
  FinancialItem,
  SectionKey,
} from '@/types/hub'

import type {
  BankStatementExtraction,
  PayslipExtraction,
  MortgageStatementExtraction,
  PensionCETVExtraction,
  SavingsStatementExtraction,
  CreditCardStatementExtraction,
  P60Extraction,
  DocumentClassification,
  DetectedPayment,
} from './extraction-schemas'

import type { ExtractionResult } from './pipeline'

// Confidence thresholds (from research implications — conservative for financial disclosure)
const AUTO_CONFIRM_THRESHOLD = 0.95
const CLARIFICATION_THRESHOLD = 0.80

// ═══ Spec 19: Keyword lookup table ═══
// Before asking "What is this?" for unknown payments, check payee against keywords.
// Each entry: keywords to match, resolved category, Form E field, confidence level.

interface KeywordEntry {
  keywords: string[]
  category: string
  categoryLabel: string
  formEField: string
  confidence: number
}

const KEYWORD_LOOKUP_TABLE: KeywordEntry[] = [
  // Healthcare
  { keywords: ['therapy', 'counselling', 'counseling', 'physio', 'osteopath', 'chiropractor', 'psychologist', 'cbt', 'nhs', 'hospital', 'clinic', 'doctor', 'gp surgery', 'optician', 'specsavers', 'boots opticians'], category: 'healthcare', categoryLabel: 'Healthcare', formEField: '3.1', confidence: 0.90 },
  { keywords: ['dentist', 'dental', 'orthodont', 'mydentist'], category: 'dental', categoryLabel: 'Healthcare / dental', formEField: '3.1', confidence: 0.92 },
  { keywords: ['pharmacy', 'chemist', 'lloyds pharmacy', 'boots pharmacy', 'prescription'], category: 'healthcare', categoryLabel: 'Healthcare', formEField: '3.1', confidence: 0.88 },
  // Vehicle & transport
  { keywords: ['dvla', 'halfords', 'kwik fit', 'mot', 'arnold clark', 'eurocar', 'national tyres', 'ats euromaster', 'green flag'], category: 'vehicle', categoryLabel: 'Vehicle costs', formEField: '3.1', confidence: 0.92 },
  { keywords: ['aa ', 'rac ', 'aa breakdown', 'rac breakdown'], category: 'vehicle', categoryLabel: 'Vehicle costs', formEField: '3.1', confidence: 0.90 },
  { keywords: ['parking', 'ncp', 'ringo', 'justpark', 'ringgo', 'paybyphone'], category: 'vehicle', categoryLabel: 'Vehicle costs', formEField: '3.1', confidence: 0.88 },
  { keywords: ['train', 'rail', 'trainline', 'national rail', 'tfl', 'oyster', 'bus'], category: 'transport', categoryLabel: 'Public transport', formEField: '3.1', confidence: 0.90 },
  // Childcare & education
  { keywords: ['nursery', 'nurseries', 'childminder', 'childminding', 'after school', 'breakfast club', 'holiday club', 'kids club', 'nanny', 'bright horizons', 'busy bees', 'kidsunlimited'], category: 'childcare', categoryLabel: 'Childcare', formEField: '3.1', confidence: 0.93 },
  { keywords: ['school', 'tuition', 'uniform', 'academy', 'college', 'university'], category: 'education', categoryLabel: 'Children / education', formEField: '3.1', confidence: 0.88 },
  // Leisure & fitness
  { keywords: ['gym', 'fitness', 'david lloyd', 'puregym', 'better leisure', 'nuffield', 'the gym', 'jd gyms', 'anytime fitness', 'bannatyne', 'virgin active'], category: 'leisure', categoryLabel: 'Personal / leisure', formEField: '3.1', confidence: 0.90 },
  // Legal
  { keywords: ['solicitor', 'solicitors', 'law firm', 'mediator', 'mediation', 'legal', 'barrister', 'chambers'], category: 'legal', categoryLabel: 'Legal costs', formEField: '3.1', confidence: 0.95 },
  // Phone & comms
  { keywords: ['vodafone', 'o2 ', 'ee ', 'three ', 'giffgaff', 'sky mobile', 'id mobile', 'tesco mobile', 'voxi', 'lebara', 'lycamobile', 'smarty'], category: 'phone', categoryLabel: 'Phone / communications', formEField: '3.1', confidence: 0.95 },
  // Broadband & TV
  { keywords: ['virgin media', 'plusnet', 'talktalk', 'now tv', 'now broadband', 'bt broadband', 'bt sport', 'zen internet', 'hyperoptic', 'community fibre', 'gigaclear'], category: 'broadband', categoryLabel: 'Broadband / TV', formEField: '3.1', confidence: 0.93 },
  // Subscriptions & streaming
  { keywords: ['spotify', 'netflix', 'disney', 'apple music', 'apple tv', 'amazon prime', 'youtube', 'audible', 'tidal', 'deezer', 'paramount', 'crunchyroll', 'adobe', 'microsoft 365', 'icloud'], category: 'subscription', categoryLabel: 'Subscriptions', formEField: '3.1', confidence: 0.97 },
  // Pets
  { keywords: ['pet', 'vet', 'veterinary', 'petplan', 'pets at home', 'vets4pets', 'pdsa', 'rspca'], category: 'pets', categoryLabel: 'Pet costs', formEField: '3.1', confidence: 0.90 },
  // Household
  { keywords: ['cleaner', 'gardener', 'window clean', 'plumber', 'electrician', 'handyman', 'decorator'], category: 'household', categoryLabel: 'Household maintenance', formEField: '3.1', confidence: 0.88 },
  // Insurance (lower confidence — could be pension too, handled by disambiguation in csv-parser)
  { keywords: ['insurance', 'vitality', 'bupa', 'axa', 'lv=', 'zurich', 'direct line', 'hastings', 'esure', 'churchill', 'privilege', 'swiftcover', 'nfu mutual', 'more than'], category: 'insurance', categoryLabel: 'Insurance', formEField: '3.1', confidence: 0.85 },
  // Groceries (helps catch supermarkets in unknown payments)
  { keywords: ['tesco', 'sainsbury', 'asda', 'morrisons', 'aldi', 'lidl', 'waitrose', 'co-op', 'coop', 'marks spencer', 'm&s', 'iceland', 'ocado'], category: 'groceries', categoryLabel: 'Groceries', formEField: '3.1', confidence: 0.95 },
  // Dining
  { keywords: ['mcdonalds', 'kfc', 'pizza', 'nandos', 'greggs', 'costa', 'starbucks', 'pret', 'wetherspoon', 'deliveroo', 'uber eats', 'just eat'], category: 'dining', categoryLabel: 'Dining & takeaway', formEField: '3.1', confidence: 0.93 },
  // BNPL (detected but classified as debt)
  { keywords: ['klarna', 'clearpay', 'afterpay', 'laybuy', 'zilch', 'paypal credit'], category: 'bnpl', categoryLabel: 'Buy now pay later', formEField: '2.14', confidence: 0.95 },
  // Gambling (red flag — spec 22 §10)
  { keywords: ['bet365', 'paddy power', 'william hill', 'betfair', 'ladbrokes', 'coral', 'sky bet', 'betfred', 'fanduel', 'unibet', 'tombola', 'lottoland', 'camelot', 'national lottery', 'gala bingo'], category: 'gambling', categoryLabel: 'Gambling', formEField: 'flag', confidence: 0.97 },
  // Crypto (red flag / other assets — spec 22 §9)
  { keywords: ['coinbase', 'binance', 'kraken', 'crypto.com', 'gemini', 'bitstamp', 'bitfinex'], category: 'crypto', categoryLabel: 'Cryptocurrency', formEField: '2.4/2.9', confidence: 0.95 },
  // Investment platforms
  { keywords: ['hargreaves', 'lansdown', 'vanguard', 'aj bell', 'fidelity', 'interactive investor', 'nutmeg', 'wealthify', 'moneybox', 'freetrade', 'trading 212', 'etoro'], category: 'investment', categoryLabel: 'Investment platform', formEField: '2.4', confidence: 0.93 },
]

/**
 * Spec 19: Check payee name against keyword lookup table.
 * Returns matched entry or null if no match found.
 */
function lookupPayeeCategory(payee: string): KeywordEntry | null {
  const normalised = payee.toLowerCase()
  for (const entry of KEYWORD_LOOKUP_TABLE) {
    for (const keyword of entry.keywords) {
      if (normalised.includes(keyword)) {
        return entry
      }
    }
  }
  return null
}

// ═══ Spec 19: Payment aggregation ═══
// Groups multiple payments to the same payee into single line items.
// Runs before the payment decision tree so grouped items get one question, not many.

interface AggregatedPayment {
  payee: string               // Original payee name (from first occurrence)
  normalisedPayee: string     // Normalised for grouping
  totalAmount: number         // Sum of all payment amounts
  averageAmount: number       // Average per occurrence
  count: number               // Number of payments grouped
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'annual' | 'one_off'
  annualisedAmount: number    // Projected annual cost
  confidence: number          // Lowest confidence in the group
  likely_category: string     // Category from first payment (or most common)
  isDividend: boolean         // Spec 19: dividend detection
}

function normalisePayee(payee: string): string {
  return payee
    .toLowerCase()
    .replace(/\b(ltd|plc|limited|inc|co|dd|so|s\/o|d\/d)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function annualise(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly': return amount * 52
    case 'monthly': return amount * 12
    case 'quarterly': return amount * 4
    case 'annual': return amount
    case 'one_off': return amount
    default: return amount * 12
  }
}

function aggregatePayments(payments: DetectedPayment[]): AggregatedPayment[] {
  const groups = new Map<string, DetectedPayment[]>()

  for (const payment of payments) {
    const key = normalisePayee(payment.payee)
    const existing = groups.get(key)
    if (existing) {
      existing.push(payment)
    } else {
      groups.set(key, [payment])
    }
  }

  const result: AggregatedPayment[] = []

  for (const [normalisedPayee, group] of groups) {
    if (group.length === 1) {
      // Single payment — pass through as-is
      const p = group[0]
      result.push({
        payee: p.payee,
        normalisedPayee,
        totalAmount: p.amount,
        averageAmount: p.amount,
        count: 1,
        frequency: p.frequency,
        annualisedAmount: annualise(p.amount, p.frequency),
        confidence: p.confidence,
        likely_category: p.likely_category,
        isDividend: false,
      })
    } else {
      // Multiple payments — aggregate
      const totalAmount = group.reduce((sum, p) => sum + p.amount, 0)
      const averageAmount = totalAmount / group.length
      const lowestConfidence = Math.min(...group.map((p) => p.confidence))
      const frequency = group[0].frequency // Use first payment's frequency
      const mostCommonCategory = getMostCommonCategory(group)

      // Spec 19: Dividend detection — irregular amounts from a company name
      const payeeLower = group[0].payee.toLowerCase()
      const isDividend = payeeLower.includes('dividend') ||
        (mostCommonCategory === 'unknown' && group.every((p) => p.likely_category === 'unknown') &&
         amountsVary(group))

      result.push({
        payee: group[0].payee,
        normalisedPayee,
        totalAmount,
        averageAmount: Math.round(averageAmount),
        count: group.length,
        frequency,
        annualisedAmount: annualise(averageAmount, frequency),
        confidence: lowestConfidence,
        likely_category: mostCommonCategory,
        isDividend,
      })
    }
  }

  return result
}

function getMostCommonCategory(payments: DetectedPayment[]): DetectedPayment['likely_category'] {
  const counts = new Map<string, number>()
  for (const p of payments) {
    counts.set(p.likely_category, (counts.get(p.likely_category) || 0) + 1)
  }
  let maxCategory: DetectedPayment['likely_category'] = payments[0].likely_category
  let maxCount = 0
  for (const [cat, count] of counts) {
    if (count > maxCount) { maxCount = count; maxCategory = cat as DetectedPayment['likely_category'] }
  }
  return maxCategory
}

function amountsVary(payments: DetectedPayment[]): boolean {
  if (payments.length < 2) return false
  const amounts = payments.map((p) => p.amount)
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  return min > 0 && (max - min) / min > 0.1 // >10% variation
}

export interface TransformedResult {
  autoConfirmItems: AutoConfirmItem[]
  questions: ClarificationQuestion[]
  financialItems: FinancialItem[]
  processingMessages: string[]
}

export function transformExtractionResult(
  classification: DocumentClassification,
  extraction: ExtractionResult | null,
): TransformedResult {
  if (!extraction) {
    return { autoConfirmItems: [], questions: [], financialItems: [], processingMessages: [] }
  }

  switch (classification.document_type) {
    case 'bank_statement':
      return transformBankStatement(extraction as BankStatementExtraction)
    case 'payslip':
      return transformPayslip(extraction as PayslipExtraction)
    case 'mortgage_statement':
      return transformMortgageStatement(extraction as MortgageStatementExtraction)
    case 'pension_cetv':
      return transformPensionCETV(extraction as PensionCETVExtraction)
    case 'savings_statement':
      return transformSavingsStatement(extraction as SavingsStatementExtraction)
    case 'credit_card_statement':
      return transformCreditCardStatement(extraction as CreditCardStatementExtraction)
    case 'p60':
    case 'tax_return':
      return transformP60(extraction as P60Extraction)
    default:
      return transformBankStatement(extraction as BankStatementExtraction)
  }
}

// ═══ Bank statement transformer ═══

function transformBankStatement(data: BankStatementExtraction): TransformedResult {
  const autoConfirmItems: AutoConfirmItem[] = []
  const questions: ClarificationQuestion[] = []
  const financialItems: FinancialItem[] = []
  const now = new Date().toISOString()

  const processingMessages = [
    `Reading your ${data.provider} statement...`,
    data.income_deposits.length > 0
      ? `Found ${data.income_deposits.length} income source${data.income_deposits.length !== 1 ? 's' : ''}...`
      : 'Analysing transactions...',
    `Categorising your spending across ${data.spending_categories.length} categories...`,
  ]

  // ═══ Income: spec 13 auto-confirm rules ═══
  // Employment with named employer + consistent amount = auto-confirm
  // Benefits (HMRC/DWP) with known CB amounts = auto-confirm
  // Everything else = clarify
  for (const income of data.income_deposits) {
    const id = `income-${income.source.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`
    const sourceDesc = `${formatCurrency(income.amount)}/${income.period} from ${income.source}`

    if (income.confidence >= AUTO_CONFIRM_THRESHOLD && (income.type === 'employment' || income.type === 'benefits')) {
      const label = income.type === 'employment'
        ? `Monthly salary: ${formatCurrency(income.amount)} net from ${income.source}`
        : `${income.source}: ${formatCurrency(income.amount)}/month`
      autoConfirmItems.push({ id, label, detail: income.type === 'employment' ? 'Employment income' : 'Benefits income', accepted: true })
      financialItems.push({
        id: `fi-${id}`, sectionKey: 'income',
        label: income.type === 'employment' ? `Salary from ${income.source}` : income.source,
        value: income.amount, period: income.period, ownership: 'yours', confidence: 'confirmed',
        sourceDocumentId: null, sourceDescription: sourceDesc,
        formECategory: income.type === 'employment' ? 'Employment income' : 'Benefits',
        isInherited: false, isPreMarital: false, asAtDate: now, createdAt: now, updatedAt: now,
      })
    } else {
      // Spec 13: varying income or low confidence → clarify type
      // Options refined per UX feedback: distinguish company dividends from self-employment,
      // and provide progressive disclosure for less common income types
      questions.push({
        id, questionText: `We found regular deposits of ${sourceDesc}. What is this income?`,
        reasoning: null,
        options: [
          { label: 'Salary from my employer', value: 'employment' },
          { label: 'Dividends from my own company', value: 'own_company_dividends' },
          { label: 'Salary from my own company', value: 'own_company_salary' },
          { label: 'Benefits', value: 'benefits' },
          { label: 'Rental income', value: 'rental' },
          { label: 'Something else', value: 'other_income' },
        ],
        primaryOption: null, secondaryLabel: "I'm not sure", formEField: '2.15-2.20',
        answered: false, answer: null,
      })
    }
  }

  // ═══ Payments: spec 19 aggregation + spec 13 decision tree ═══
  const aggregated = aggregatePayments(data.regular_payments)

  for (const payment of aggregated) {
    const id = `payment-${payment.payee.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`
    const categoryLabel = CATEGORY_LABELS[payment.likely_category] || payment.likely_category
    const countNote = payment.count > 1 ? ` (${payment.count} payments)` : ''
    const displayAmount = payment.count > 1 ? payment.averageAmount : payment.totalAmount
    const paymentDesc = `${formatCurrency(displayAmount)}/${payment.frequency} to ${payment.payee}${countNote}`

    // Spec 19: Dividend detection → limited company question
    if (payment.isDividend && payment.count >= 2) {
      const annualised = formatCurrency(payment.totalAmount)
      questions.push({
        id,
        questionText: `You received ${annualised} in dividends from ${payment.payee} this year. Is this from your own limited company?`,
        reasoning: 'Dividends from your own company are treated differently from investment dividends for disclosure.',
        options: [
          { label: 'Yes, my company', value: 'own_company' },
          { label: 'No, investment dividends', value: 'investment' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: null, secondaryLabel: "I'm not sure",
        formEField: '2.16 or 2.4',
        answered: false, answer: null,
      })
      continue
    }

    if (payment.confidence >= AUTO_CONFIRM_THRESHOLD) {
      // High confidence — auto-confirm (spec 13: obvious items)
      autoConfirmItems.push({ id, label: `${categoryLabel}: ${paymentDesc}`, detail: `${categoryLabel} — monthly spending`, accepted: true })
      financialItems.push({
        id: `fi-${id}`, sectionKey: paymentToSection(payment.likely_category),
        label: `${payment.payee} (${categoryLabel.toLowerCase()})`,
        value: displayAmount, period: payment.frequency === 'monthly' || payment.frequency === 'annual' ? payment.frequency : 'monthly',
        ownership: 'yours', confidence: 'confirmed',
        sourceDocumentId: null, sourceDescription: paymentDesc,
        formECategory: categoryLabel,
        isInherited: false, isPreMarital: false, asAtDate: now, createdAt: now, updatedAt: now,
      })
    } else if (payment.likely_category === 'unknown') {
      // Spec 19: keyword lookup before falling through to generic question
      const keywordMatch = lookupPayeeCategory(payment.payee)
      if (keywordMatch && keywordMatch.confidence >= 0.90) {
        // High-confidence keyword match → auto-confirm
        autoConfirmItems.push({
          id, label: `${keywordMatch.categoryLabel}: ${paymentDesc}`,
          detail: `${keywordMatch.categoryLabel} (matched from payee name)`, accepted: true,
        })
        financialItems.push({
          id: `fi-${id}`, sectionKey: 'spending',
          label: `${payment.payee} (${keywordMatch.categoryLabel.toLowerCase()})`,
          value: displayAmount, period: payment.frequency === 'monthly' || payment.frequency === 'annual' ? payment.frequency : 'monthly',
          ownership: 'yours', confidence: 'confirmed',
          sourceDocumentId: null, sourceDescription: paymentDesc,
          formECategory: keywordMatch.categoryLabel,
          isInherited: false, isPreMarital: false, asAtDate: now, createdAt: now, updatedAt: now,
        })
      } else if (keywordMatch) {
        // Lower-confidence keyword match → targeted confirmation question
        questions.push({
          id,
          questionText: `${paymentDesc}. Is this ${keywordMatch.categoryLabel.toLowerCase()}?`,
          reasoning: null,
          options: [
            { label: `Yes, ${keywordMatch.categoryLabel.toLowerCase()}`, value: keywordMatch.category },
            { label: 'No, something else', value: 'other' },
          ],
          primaryOption: `Yes, ${keywordMatch.categoryLabel.toLowerCase()}`,
          secondaryLabel: 'No, something else',
          formEField: keywordMatch.formEField,
          answered: false, answer: null,
        })
      } else {
        // No keyword match → fall through to generic question (spec 13)
        const question = generatePaymentQuestion({ payee: payment.payee, amount: displayAmount, frequency: payment.frequency, confidence: payment.confidence, likely_category: payment.likely_category })
        if (question) {
          questions.push({ id, ...question, answered: false, answer: null })
        }
      }
    } else {
      // Known category but below confidence threshold → spec 13 decision tree
      const question = generatePaymentQuestion({ payee: payment.payee, amount: displayAmount, frequency: payment.frequency, confidence: payment.confidence, likely_category: payment.likely_category })
      if (question) {
        questions.push({ id, ...question, answered: false, answer: null })
      }
    }
  }

  // ═══ Account details → human-readable labels ═══
  const accountTypeLabel = data.account_type === 'current' || data.account_type === 'joint_current'
    ? 'current account'
    : data.account_type === 'savings' || data.account_type === 'joint_savings'
    ? 'savings account'
    : 'account'
  const ownershipPrefix = data.is_joint ? 'Your joint' : 'Your'
  const accountRef = data.account_number_last4 ? ` ending ${data.account_number_last4}` : ''
  const accountLabel = `${ownershipPrefix} ${data.provider} ${accountTypeLabel}${accountRef}`

  // Calculate months covered and remaining
  let monthsCovered = 1
  if (data.statement_period_start && data.statement_period_end) {
    const start = new Date(data.statement_period_start)
    const end = new Date(data.statement_period_end)
    monthsCovered = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  }
  const monthsRemaining = Math.max(0, 12 - monthsCovered)
  const monthsNote = monthsRemaining > 0
    ? `${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''} remaining for full disclosure`
    : 'Full 12 months provided'

  const isOverdrawn = data.closing_balance !== null && data.closing_balance < 0

  // Account always appears in Accounts section — it's an account regardless of balance
  financialItems.push({
    id: `fi-account-${data.provider.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
    sectionKey: 'accounts',
    label: accountLabel,
    value: data.closing_balance,
    period: 'total',
    ownership: data.is_joint ? 'joint' : 'yours',
    confidence: 'confirmed',
    sourceDocumentId: null,
    sourceDescription: isOverdrawn
      ? `Overdrawn by ${formatCurrency(Math.abs(data.closing_balance!))} · ${monthsNote}`
      : monthsNote,
    formECategory: null,
    isInherited: false, isPreMarital: false,
    asAtDate: data.statement_period_end || now,
    createdAt: now, updatedAt: now,
  })

  // Overdraft also appears in Debts section — it's a liability
  if (isOverdrawn) {
    financialItems.push({
      id: `fi-overdraft-${data.provider.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      sectionKey: 'debts',
      label: `${accountLabel} — overdraft`,
      value: Math.abs(data.closing_balance!),
      period: 'total',
      ownership: data.is_joint ? 'joint' : 'yours',
      confidence: 'confirmed',
      sourceDocumentId: null,
      sourceDescription: monthsNote,
      formECategory: 'Overdraft',
      isInherited: false, isPreMarital: false,
      asAtDate: data.statement_period_end || now,
      createdAt: now, updatedAt: now,
    })
  }

  // ═══ Spec 13: Joint account detection ═══
  if (data.is_joint) {
    questions.push({
      id: `joint-account-${Date.now()}`,
      questionText: `This account has two names.${data.joint_holder_name ? ` (${data.joint_holder_name})` : ''} Is this a joint account with your partner?`,
      reasoning: null,
      options: [
        { label: 'Yes, joint with partner', value: 'joint_partner' },
        { label: 'No, it\'s sole', value: 'not_joint' },
      ],
      primaryOption: 'Yes, joint with partner',
      secondaryLabel: 'No, it\'s sole',
      formEField: '2.3',
      answered: false, answer: null,
    })
  }

  // ═══ Spec 13: Spending total confirmation ═══
  if (data.spending_categories.length > 0) {
    const totalSpending = data.spending_categories.reduce((sum, c) => sum + c.monthly_average, 0)
    questions.push({
      id: `spending-total-${Date.now()}`,
      questionText: `We've categorised your monthly spending as roughly ${formatCurrency(totalSpending)}. Does that feel about right?`,
      reasoning: null,
      options: [
        { label: 'That sounds right', value: 'correct' },
        { label: 'Let me review the categories', value: 'review' },
      ],
      primaryOption: 'That sounds right',
      secondaryLabel: 'Let me review the categories',
      formEField: '3.1',
      answered: false, answer: null,
    })
  }

  // ═══ Spec 13: Gap detection (app logic, not AI) ═══
  const hasEmploymentIncome = data.income_deposits.some(i => i.type === 'employment')
  const hasPensionContrib = data.regular_payments.some(p => p.likely_category === 'pension_contribution')
  const hasCouncilTax = data.regular_payments.some(p => p.likely_category === 'council_tax')

  if (hasEmploymentIncome && !hasPensionContrib) {
    questions.push({
      id: `gap-pension-${Date.now()}`,
      questionText: "We didn't find pension contributions in this account. Are they deducted from your salary before it reaches your bank?",
      reasoning: null,
      options: [
        { label: 'Yes, deducted at source', value: 'deducted' },
        { label: 'No pension', value: 'none' },
        { label: 'Paid from another account', value: 'other_account' },
        { label: "Don't know", value: 'unknown' },
      ],
      primaryOption: null, secondaryLabel: "I'll answer this later",
      formEField: '2.13', answered: false, answer: null,
    })
  }

  if (!hasCouncilTax) {
    questions.push({
      id: `gap-council-tax-${Date.now()}`,
      questionText: "We didn't find council tax payments. Do you pay this from a different account?",
      reasoning: null,
      options: [
        { label: 'Different account', value: 'other_account' },
        { label: 'Included in rent', value: 'in_rent' },
        { label: "Don't pay council tax", value: 'exempt' },
        { label: 'Partner pays', value: 'partner' },
      ],
      primaryOption: null, secondaryLabel: "I'll answer this later",
      formEField: '3.1', answered: false, answer: null,
    })
  }

  // ═══ Spec 13: Notable transaction signals ═══
  for (const notable of data.notable_transactions) {
    const flagLower = notable.reason_flagged.toLowerCase()
    if (flagLower.includes('crypto')) {
      questions.push({
        id: `notable-crypto-${Date.now()}`,
        questionText: `We found payments to ${notable.description}. Do you hold cryptocurrency?`,
        reasoning: null,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: "No, I've sold it all", value: 'sold' },
          { label: "I'd rather not say right now", value: 'skip' },
        ],
        primaryOption: null, secondaryLabel: "I'll answer this later",
        formEField: '2.4/2.9', answered: false, answer: null,
      })
    }
  }

  return { autoConfirmItems, questions, financialItems, processingMessages }
}

// ═══ Spec 13 payment question generator ═══
// Deterministic: signal → question. No AI reasoning needed.

function generatePaymentQuestion(payment: { payee: string; amount: number; frequency: string; confidence: number; likely_category: string }): Omit<ClarificationQuestion, 'id' | 'answered' | 'answer'> | null {
  const amt = formatCurrency(payment.amount)

  switch (payment.likely_category) {
    case 'mortgage':
    case 'rent':
      return {
        questionText: `${amt} goes to ${payment.payee} each month. Is this your mortgage?`,
        reasoning: null,
        options: [
          { label: 'Mortgage', value: 'mortgage' },
          { label: 'Rent', value: 'rent' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: 'Mortgage', secondaryLabel: 'Something else',
        formEField: '3.1 + 2.1',
      }

    case 'insurance':
    case 'pension_contribution':
      return {
        questionText: `${amt}/month to ${payment.payee}. Is this a pension contribution or insurance?`,
        reasoning: null,
        options: [
          { label: 'Pension', value: 'pension_contribution' },
          { label: 'Life insurance', value: 'life_insurance' },
          { label: 'Home insurance', value: 'home_insurance' },
          { label: 'Car insurance', value: 'car_insurance' },
          { label: 'Other', value: 'other' },
        ],
        primaryOption: null, secondaryLabel: 'Something else',
        formEField: payment.likely_category === 'pension_contribution' ? '2.13' : '3.1',
      }

    case 'unknown':
      // Standing order to a person — spec 13 catch-all
      return {
        questionText: `${amt} goes to ${payment.payee} each month. What is this?`,
        reasoning: null,
        options: [
          { label: 'Childcare', value: 'childcare' },
          { label: 'Rent to landlord', value: 'rent' },
          { label: 'Maintenance payment', value: 'child_maintenance' },
          { label: 'Loan repayment', value: 'loan_repayment' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: null, secondaryLabel: 'Something else',
        formEField: '3.1',
      }

    case 'utilities':
      return {
        questionText: `${amt}/month to ${payment.payee}. Is this a utility bill?`,
        reasoning: null,
        options: [
          { label: 'Yes, gas/electric', value: 'utilities' },
          { label: 'Yes, water', value: 'utilities' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: 'Yes, gas/electric', secondaryLabel: 'Something else',
        formEField: '3.1',
      }

    case 'council_tax':
      return {
        questionText: `${amt}/month to ${payment.payee}. Is this council tax?`,
        reasoning: null,
        options: [
          { label: 'Yes, council tax', value: 'council_tax' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: 'Yes, council tax', secondaryLabel: 'Something else',
        formEField: '3.1',
      }

    case 'subscription':
      return {
        questionText: `${amt}/month to ${payment.payee}. Is this a subscription or phone contract?`,
        reasoning: null,
        options: [
          { label: 'Yes, subscription', value: 'subscription' },
          { label: 'Phone contract', value: 'subscription' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: 'Yes, subscription', secondaryLabel: 'Something else',
        formEField: '3.1',
      }

    case 'childcare':
      return {
        questionText: `${amt}/month to ${payment.payee}. Is this childcare?`,
        reasoning: null,
        options: [
          { label: 'Yes, childcare', value: 'childcare' },
          { label: 'School fees', value: 'school_fees' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: 'Yes, childcare', secondaryLabel: 'Something else',
        formEField: '3.1',
      }

    case 'loan_repayment':
      return {
        questionText: `${amt}/month to ${payment.payee}. What type of debt repayment is this?`,
        reasoning: null,
        options: [
          { label: 'Personal loan', value: 'loan_repayment' },
          { label: 'Car finance', value: 'car_finance' },
          { label: 'Credit card', value: 'credit_card' },
          { label: 'Student loan', value: 'student_loan' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: null, secondaryLabel: 'Something else',
        formEField: '2.14 + 3.1',
      }

    case 'child_maintenance':
      return {
        questionText: `${amt}/month to ${payment.payee}. Is this a child maintenance payment?`,
        reasoning: null,
        options: [
          { label: 'Yes, child maintenance', value: 'child_maintenance' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: 'Yes, child maintenance', secondaryLabel: 'Something else',
        formEField: '3.1',
      }

    case 'credit_card':
      return {
        questionText: `${amt}/month to ${payment.payee}. Is this a credit card payment?`,
        reasoning: null,
        options: [
          { label: 'Yes, credit card', value: 'credit_card' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: 'Yes, credit card', secondaryLabel: 'Something else',
        formEField: '2.14',
      }

    case 'investment':
      return {
        questionText: `${amt}/month to ${payment.payee}. Do you have investments or savings here?`,
        reasoning: null,
        options: [
          { label: 'Yes, investments', value: 'investment' },
          { label: 'Cryptocurrency', value: 'crypto' },
          { label: 'Closed / no longer active', value: 'closed' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: null, secondaryLabel: 'Something else',
        formEField: '2.4',
      }

    case 'gambling':
      // Red flag per spec 22 §10 — flagged internally, but confirm with user
      return {
        questionText: `${amt} to ${payment.payee}. Is this a gambling transaction?`,
        reasoning: null,
        options: [
          { label: 'Yes', value: 'gambling' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: 'Yes', secondaryLabel: 'Something else',
        formEField: 'flag',
      }

    // Spending categories — auto-confirm at high confidence, question only at low
    case 'groceries':
    case 'dining':
    case 'fuel':
    case 'transport':
    case 'healthcare':
    case 'education':
      return null  // Spending categories auto-confirm; no question needed

    default:
      // Truly unhandled category — should not happen but don't silently drop
      return {
        questionText: `${amt}/month to ${payment.payee}. What is this payment for?`,
        reasoning: null,
        options: [
          { label: 'Bill or utility', value: 'utilities' },
          { label: 'Insurance', value: 'insurance' },
          { label: 'Subscription', value: 'subscription' },
          { label: 'Loan or debt repayment', value: 'loan_repayment' },
          { label: 'Something else', value: 'other' },
        ],
        primaryOption: null, secondaryLabel: 'Something else',
        formEField: '3.1',
      }
  }
}

// ═══ Payslip transformer ═══

function transformPayslip(data: PayslipExtraction): TransformedResult {
  const autoConfirmItems: AutoConfirmItem[] = []
  const questions: ClarificationQuestion[] = []
  const financialItems: FinancialItem[] = []
  const now = new Date().toISOString()

  const processingMessages = [
    `Reading your payslip from ${data.employer}...`,
    'Extracting income details...',
  ]

  // Payslips are structured — most fields auto-confirm
  autoConfirmItems.push({
    id: `payslip-income-${Date.now()}`,
    label: `Salary from ${data.employer}: ${formatCurrency(data.gross_pay)} gross, ${formatCurrency(data.net_pay)} net`,
    detail: `Tax: ${formatCurrency(data.tax_deducted)}, NI: ${formatCurrency(data.national_insurance)}${data.tax_code ? `, Tax code: ${data.tax_code}` : ''}`,
    accepted: true,
  })

  financialItems.push({
    id: `fi-payslip-income-${Date.now()}`,
    sectionKey: 'income',
    label: `Salary from ${data.employer}`,
    value: data.net_pay,
    period: 'monthly',
    ownership: 'yours',
    confidence: 'confirmed',
    sourceDocumentId: null,
    sourceDescription: `Payslip: ${formatCurrency(data.gross_pay)} gross, ${formatCurrency(data.net_pay)} net`,
    formECategory: 'Employment income',
    isInherited: false,
    isPreMarital: false,
    asAtDate: now,
    createdAt: now,
    updatedAt: now,
  })

  // Pension contribution detected — link to pensions section
  if (data.pension_contribution && data.pension_contribution > 0) {
    questions.push({
      id: `payslip-pension-${Date.now()}`,
      questionText: `Your payslip shows pension contributions of ${formatCurrency(data.pension_contribution)}/month. Is this a workplace pension?`,
      reasoning: 'Pension contributions are deducted before your net pay reaches your bank account.',
      options: [
        { label: 'Yes, workplace pension', value: 'workplace' },
        { label: 'Yes, personal pension', value: 'personal' },
        { label: "I'm not sure", value: 'unsure' },
      ],
      primaryOption: 'Yes, workplace pension',
      secondaryLabel: "I'm not sure",
      formEField: '2.13',
      answered: false,
      answer: null,
    })
  }

  // Overtime/commission
  if (data.overtime_or_commission && data.overtime_or_commission > 0) {
    questions.push({
      id: `payslip-overtime-${Date.now()}`,
      questionText: `Your payslip includes ${formatCurrency(data.overtime_or_commission)} in overtime or commission. Is this a regular part of your income?`,
      reasoning: 'Courts need to understand whether variable pay is a reliable income component.',
      options: [
        { label: 'Yes, most months', value: 'regular' },
        { label: 'Sometimes', value: 'sometimes' },
        { label: 'This was unusual', value: 'unusual' },
      ],
      primaryOption: null,
      secondaryLabel: "I'm not sure",
      formEField: '2.15',
      answered: false,
      answer: null,
    })
  }

  return { autoConfirmItems, questions, financialItems, processingMessages }
}

// ═══ Mortgage statement transformer ═══

function transformMortgageStatement(data: MortgageStatementExtraction): TransformedResult {
  const autoConfirmItems: AutoConfirmItem[] = []
  const questions: ClarificationQuestion[] = []
  const financialItems: FinancialItem[] = []
  const now = new Date().toISOString()

  const processingMessages = [
    `Reading your mortgage statement from ${data.lender}...`,
    'Extracting property and debt details...',
  ]

  // Mortgage details are structured — auto-confirm most fields
  const parts = data.multiple_parts && data.parts.length > 1
    ? ` (${data.parts.length} parts)`
    : ''
  const rateInfo = data.interest_rate ? ` at ${data.interest_rate}%` : ''

  autoConfirmItems.push({
    id: `mortgage-balance-${Date.now()}`,
    label: `Mortgage with ${data.lender}: ${formatCurrency(data.outstanding_balance)} outstanding${rateInfo}${parts}`,
    detail: `Monthly payment: ${formatCurrency(data.monthly_payment)}${data.term_end_date ? `, term ends ${data.term_end_date}` : ''}`,
    accepted: true,
  })

  financialItems.push({
    id: `fi-mortgage-${Date.now()}`,
    sectionKey: 'property',
    label: `Mortgage with ${data.lender}`,
    value: data.outstanding_balance,
    period: 'total',
    ownership: data.is_joint ? 'joint' : 'yours',
    confidence: 'confirmed',
    sourceDocumentId: null,
    sourceDescription: `${data.lender} mortgage statement: ${formatCurrency(data.outstanding_balance)} at ${data.interest_rate ?? '?'}%`,
    formECategory: 'Mortgage',
    isInherited: false,
    isPreMarital: false,
    asAtDate: now,
    createdAt: now,
    updatedAt: now,
  })

  // Joint mortgage confirmation
  if (data.is_joint) {
    questions.push({
      id: `mortgage-joint-${Date.now()}`,
      questionText: `This mortgage is in joint names. Is this correct?`,
      reasoning: 'Joint mortgages affect how the property equity is divided.',
      options: [
        { label: 'Yes, joint with partner', value: 'joint' },
        { label: 'No, it\'s in my name only', value: 'sole' },
      ],
      primaryOption: 'Yes, joint with partner',
      secondaryLabel: "No it's something else",
      formEField: '2.1',
      answered: false,
      answer: null,
    })
  }

  // ERC flag
  if (data.early_repayment_charge && data.early_repayment_charge > 0) {
    autoConfirmItems.push({
      id: `mortgage-erc-${Date.now()}`,
      label: `Early repayment charge: ${formatCurrency(data.early_repayment_charge)}${data.erc_end_date ? ` until ${data.erc_end_date}` : ''}`,
      detail: 'This is relevant if the property might be sold or remortgaged.',
      accepted: true,
    })
  }

  // Arrears flag
  if (data.arrears && data.arrears > 0) {
    autoConfirmItems.push({
      id: `mortgage-arrears-${Date.now()}`,
      label: `Mortgage arrears: ${formatCurrency(data.arrears)}`,
      detail: 'This is a liability that needs to be disclosed.',
      accepted: true,
    })
  }

  return { autoConfirmItems, questions, financialItems, processingMessages }
}

// ═══ Pension CETV transformer ═══

function transformPensionCETV(data: PensionCETVExtraction): TransformedResult {
  const autoConfirmItems: AutoConfirmItem[] = []
  const questions: ClarificationQuestion[] = []
  const financialItems: FinancialItem[] = []
  const now = new Date().toISOString()

  const processingMessages = [
    `Reading your pension letter from ${data.provider}...`,
    'Extracting CETV and scheme details...',
  ]

  const typeLabel = data.pension_type === 'defined_benefit' ? 'Defined benefit'
    : data.pension_type === 'defined_contribution' ? 'Defined contribution'
    : data.pension_type === 'sipp' ? 'SIPP'
    : 'Pension'

  autoConfirmItems.push({
    id: `pension-cetv-${Date.now()}`,
    label: `${data.scheme_name}: CETV ${formatCurrency(data.cetv_value)}`,
    detail: `${typeLabel} pension with ${data.provider}${data.cetv_date ? `, valued ${data.cetv_date}` : ''}`,
    accepted: true,
  })

  financialItems.push({
    id: `fi-pension-${Date.now()}`,
    sectionKey: 'pensions',
    label: `${data.scheme_name} (${typeLabel})`,
    value: data.cetv_value,
    period: 'total',
    ownership: 'yours',
    confidence: 'confirmed',
    sourceDocumentId: null,
    sourceDescription: `CETV: ${formatCurrency(data.cetv_value)} from ${data.provider}${data.cetv_date ? ` as at ${data.cetv_date}` : ''}`,
    formECategory: 'Pensions',
    isInherited: false,
    isPreMarital: false,
    asAtDate: data.cetv_date || now,
    createdAt: now,
    updatedAt: now,
  })

  // DB pension warning — CETV may understate value
  if (data.pension_type === 'defined_benefit') {
    const annualPensionInfo = data.annual_pension_at_retirement
      ? ` Your annual pension at retirement would be ${formatCurrency(data.annual_pension_at_retirement)}/year.`
      : ''

    questions.push({
      id: `pension-db-warning-${Date.now()}`,
      questionText: `This is a defined benefit pension with a CETV of ${formatCurrency(data.cetv_value)}.${annualPensionInfo} CETVs often understate the true value of defined benefit pensions. Would you like to understand why?`,
      reasoning: 'A DB pension provides guaranteed income for life, inflation-linked. The CETV is a lump-sum estimate that may not reflect this guarantee.',
      options: [
        { label: 'Tell me more', value: 'learn_more' },
        { label: 'I understand', value: 'understood' },
        { label: 'Skip for now', value: 'skip' },
      ],
      primaryOption: null,
      secondaryLabel: 'Skip for now',
      formEField: '2.13',
      answered: false,
      answer: null,
    })
  }

  // PODE recommendation for high-value pensions
  if (data.cetv_value >= 100000) {
    questions.push({
      id: `pension-pode-${Date.now()}`,
      questionText: `Your pension CETV is ${formatCurrency(data.cetv_value)}. For pensions of this value, a specialist pension report (PODE) is usually recommended to ensure fair treatment in settlement. These typically cost £1,500–£3,000, shared between parties.`,
      reasoning: 'The PAG2 guidance (2024) recommends specialist pension advice for CETVs above £100,000.',
      options: [
        { label: 'Tell me more', value: 'learn_more' },
        { label: "I'll consider this", value: 'noted' },
        { label: 'Not now', value: 'skip' },
      ],
      primaryOption: null,
      secondaryLabel: 'Not now',
      formEField: '2.13',
      answered: false,
      answer: null,
    })
  }

  // CETV age check
  if (data.cetv_date) {
    const cetvDate = new Date(data.cetv_date)
    const monthsOld = Math.floor((Date.now() - cetvDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (monthsOld > 12) {
      questions.push({
        id: `pension-cetv-age-${Date.now()}`,
        questionText: `This CETV is from ${data.cetv_date} — over 12 months ago. You'll need an updated one for formal disclosure.`,
        reasoning: 'Form E requires CETV statements dated within 12 months.',
        options: [
          { label: "I'll request a new one", value: 'will_request' },
          { label: 'I have a newer one', value: 'have_newer' },
        ],
        primaryOption: "I'll request a new one",
        secondaryLabel: 'I have a newer one',
        formEField: '2.13',
        answered: false,
        answer: null,
      })
    }
  }

  // Pre-marital membership
  if (data.membership_start_date) {
    questions.push({
      id: `pension-premarital-${Date.now()}`,
      questionText: `You joined this pension scheme on ${data.membership_start_date}. Was this before your marriage?`,
      reasoning: 'The pre-marital portion of a pension may be treated differently in settlement (Standish v Standish [2025]).',
      options: [
        { label: 'Yes, before marriage', value: 'pre_marital' },
        { label: 'No, during marriage', value: 'during_marriage' },
        { label: "I'm not sure", value: 'unsure' },
      ],
      primaryOption: null,
      secondaryLabel: "I'm not sure",
      formEField: '2.13 + Part 4',
      answered: false,
      answer: null,
    })
  }

  return { autoConfirmItems, questions, financialItems, processingMessages }
}

// ═══ Savings statement transformer ═══

function transformSavingsStatement(data: SavingsStatementExtraction): TransformedResult {
  const autoConfirmItems: AutoConfirmItem[] = []
  const questions: ClarificationQuestion[] = []
  const financialItems: FinancialItem[] = []
  const now = new Date().toISOString()

  const typeLabel = ACCOUNT_TYPE_LABELS[data.account_type] || 'Savings account'

  // Savings statements are structured — auto-confirm balance
  autoConfirmItems.push({
    id: `savings-balance-${Date.now()}`,
    label: `${typeLabel} with ${data.provider}: ${formatCurrency(data.current_balance)}`,
    detail: `Balance: ${formatCurrency(data.current_balance)}`,
    accepted: true,
  })

  financialItems.push({
    id: `fi-savings-${Date.now()}`,
    sectionKey: 'accounts',
    label: `${typeLabel} — ${data.provider}`,
    value: data.current_balance,
    period: 'total',
    ownership: data.is_joint ? 'joint' : 'yours',
    confidence: 'confirmed',
    sourceDocumentId: null,
    sourceDescription: `${typeLabel} with ${data.provider}`,
    formECategory: null,
    isInherited: false,
    isPreMarital: false,
    asAtDate: null,
    createdAt: now,
    updatedAt: now,
  })

  // Clarify: ownership if unclear
  if (data.is_joint) {
    questions.push({
      id: `savings-joint-${Date.now()}`,
      questionText: `Is this ${typeLabel} a joint account with your partner?`,
      reasoning: null,
      options: [
        { label: 'Yes, joint with partner', value: 'joint' },
        { label: 'No, it\'s in my name only', value: 'sole' },
      ],
      primaryOption: 'Yes, joint with partner',
      secondaryLabel: 'No, it\'s in my name only',
      formEField: '2.3',
      answered: false,
      answer: null,
    })
  }

  // Clarify: large recent withdrawals
  for (const withdrawal of data.large_recent_withdrawals) {
    questions.push({
      id: `savings-withdrawal-${Date.now()}-${withdrawal.amount}`,
      questionText: `There's been a withdrawal of ${formatCurrency(withdrawal.amount)} recently. Has this been spent or moved to another account?`,
      reasoning: null,
      options: [
        { label: 'Spent', value: 'spent' },
        { label: 'Moved to another account', value: 'moved' },
        { label: 'Separation costs', value: 'separation' },
        { label: 'Other', value: 'other' },
      ],
      primaryOption: null,
      secondaryLabel: 'I\'d rather not say',
      formEField: '2.3',
      answered: false,
      answer: null,
    })
  }

  // Clarify: ISA type if unclear
  if (data.account_type === 'other') {
    questions.push({
      id: `savings-type-${Date.now()}`,
      questionText: 'Is this a Cash ISA or Stocks & Shares ISA?',
      reasoning: null,
      options: [
        { label: 'Cash ISA', value: 'cash_isa' },
        { label: 'Stocks & Shares ISA', value: 'stocks_and_shares_isa' },
        { label: 'Lifetime ISA', value: 'lifetime_isa' },
        { label: 'Regular savings', value: 'savings' },
        { label: 'Not sure', value: 'unknown' },
      ],
      primaryOption: null,
      secondaryLabel: 'Not sure',
      formEField: '2.3 / 2.4',
      answered: false,
      answer: null,
    })
  }

  const processingMessages = [
    `Found ${typeLabel} with ${data.provider}`,
    `Balance: ${formatCurrency(data.current_balance)}`,
  ]

  return { autoConfirmItems, questions, financialItems, processingMessages }
}

// ═══ Credit card statement transformer ═══

function transformCreditCardStatement(data: CreditCardStatementExtraction): TransformedResult {
  const autoConfirmItems: AutoConfirmItem[] = []
  const questions: ClarificationQuestion[] = []
  const financialItems: FinancialItem[] = []
  const now = new Date().toISOString()

  // Credit card statements are structured — auto-confirm balance
  const balanceDetail = [
    `Balance: ${formatCurrency(data.outstanding_balance)}`,
    data.credit_limit ? `Credit limit: ${formatCurrency(data.credit_limit)}` : null,
    data.interest_rate_apr ? `APR: ${data.interest_rate_apr}%` : null,
  ].filter(Boolean).join('. ')

  autoConfirmItems.push({
    id: `cc-balance-${Date.now()}`,
    label: `${data.provider} credit card: ${formatCurrency(data.outstanding_balance)} outstanding`,
    detail: balanceDetail,
    accepted: true,
  })

  financialItems.push({
    id: `fi-cc-${Date.now()}`,
    sectionKey: 'debts',
    label: `${data.provider} credit card`,
    value: data.outstanding_balance,
    period: 'total',
    ownership: data.is_joint ? 'joint' : 'yours',
    confidence: 'confirmed',
    sourceDocumentId: null,
    sourceDescription: balanceDetail,
    formECategory: 'Credit cards',
    isInherited: false,
    isPreMarital: false,
    asAtDate: null,
    createdAt: now,
    updatedAt: now,
  })

  // If minimum payment exists, add as expenditure item
  if (data.minimum_payment) {
    financialItems.push({
      id: `fi-cc-payment-${Date.now()}`,
      sectionKey: 'spending',
      label: `${data.provider} credit card payment`,
      value: data.minimum_payment,
      period: 'monthly',
      ownership: data.is_joint ? 'joint' : 'yours',
      confidence: 'estimated',
      sourceDocumentId: null,
      sourceDescription: 'Minimum payment — actual payment may be higher',
      formECategory: 'Credit card payments',
      isInherited: false,
      isPreMarital: false,
      asAtDate: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Clarify: ownership
  if (data.is_joint) {
    questions.push({
      id: `cc-joint-${Date.now()}`,
      questionText: `Is this ${data.provider} credit card in joint names with your partner?`,
      reasoning: null,
      options: [
        { label: 'Yes, joint', value: 'joint' },
        { label: 'No, it\'s mine only', value: 'sole' },
        { label: 'It\'s my partner\'s', value: 'partners' },
      ],
      primaryOption: null,
      secondaryLabel: 'It\'s my partner\'s',
      formEField: '2.14',
      answered: false,
      answer: null,
    })
  }

  // Clarify: high balance
  if (data.outstanding_balance > 5000) {
    questions.push({
      id: `cc-highbalance-${Date.now()}`,
      questionText: `This card has a balance of ${formatCurrency(data.outstanding_balance)}. Is this typical, or has spending increased recently?`,
      reasoning: null,
      options: [
        { label: 'Normal for me', value: 'normal' },
        { label: 'Increased due to separation', value: 'separation' },
        { label: 'Increased for other reasons', value: 'other' },
      ],
      primaryOption: null,
      secondaryLabel: 'I\'d rather not say',
      formEField: '2.14',
      answered: false,
      answer: null,
    })
  }

  const processingMessages = [
    `Found ${data.provider} credit card statement`,
    `Outstanding balance: ${formatCurrency(data.outstanding_balance)}`,
  ]

  return { autoConfirmItems, questions, financialItems, processingMessages }
}

// ═══ P60 / Tax return transformer ═══

function transformP60(data: P60Extraction): TransformedResult {
  const autoConfirmItems: AutoConfirmItem[] = []
  const questions: ClarificationQuestion[] = []
  const financialItems: FinancialItem[] = []
  const now = new Date().toISOString()

  const yearLabel = data.tax_year ? ` (${data.tax_year})` : ''

  // P60/SA302 are structured — auto-confirm income
  autoConfirmItems.push({
    id: `p60-income-${Date.now()}`,
    label: `Annual income${yearLabel}: ${formatCurrency(data.total_pay)} gross from ${data.employer_or_source}`,
    detail: `Tax: ${formatCurrency(data.total_tax_deducted)}${data.total_ni ? `, NI: ${formatCurrency(data.total_ni)}` : ''}`,
    accepted: true,
  })

  financialItems.push({
    id: `fi-p60-income-${Date.now()}`,
    sectionKey: 'income',
    label: `Annual income — ${data.employer_or_source}`,
    value: data.total_pay,
    period: 'annual',
    ownership: 'yours',
    confidence: 'confirmed',
    sourceDocumentId: null,
    sourceDescription: `${data.document_type === 'p60' ? 'P60' : 'Tax return'}${yearLabel}`,
    formECategory: 'Employment income',
    isInherited: false,
    isPreMarital: false,
    asAtDate: null,
    createdAt: now,
    updatedAt: now,
  })

  // Self-employment profit
  if (data.self_employment_profit != null && data.self_employment_profit > 0) {
    autoConfirmItems.push({
      id: `p60-selfempl-${Date.now()}`,
      label: `Self-employment profit${yearLabel}: ${formatCurrency(data.self_employment_profit)}`,
      detail: 'Net profit after expenses, from tax return',
      accepted: true,
    })

    financialItems.push({
      id: `fi-p60-selfempl-${Date.now()}`,
      sectionKey: 'income',
      label: 'Self-employment profit',
      value: data.self_employment_profit,
      period: 'annual',
      ownership: 'yours',
      confidence: 'confirmed',
      sourceDocumentId: null,
      sourceDescription: `SA302${yearLabel}`,
      formECategory: 'Self-employment',
      isInherited: false,
      isPreMarital: false,
      asAtDate: null,
      createdAt: now,
      updatedAt: now,
    })

    // Clarify: is this still current?
    questions.push({
      id: `p60-selfempl-current-${Date.now()}`,
      questionText: `Your tax return shows self-employment profit of ${formatCurrency(data.self_employment_profit)}. Is this still your current income level?`,
      reasoning: 'Courts need to understand maintainable income — whether this figure is likely to continue.',
      options: [
        { label: 'Yes, roughly the same', value: 'same' },
        { label: 'It\'s increased', value: 'increased' },
        { label: 'It\'s decreased', value: 'decreased' },
        { label: 'I\'ve stopped self-employment', value: 'stopped' },
      ],
      primaryOption: null,
      secondaryLabel: 'I\'m not sure',
      formEField: '2.16',
      answered: false,
      answer: null,
    })
  }

  // Dividend income
  if (data.dividend_income != null && data.dividend_income > 0) {
    autoConfirmItems.push({
      id: `p60-dividends-${Date.now()}`,
      label: `Dividend income${yearLabel}: ${formatCurrency(data.dividend_income)}`,
      detail: 'From tax return',
      accepted: true,
    })

    questions.push({
      id: `p60-dividend-source-${Date.now()}`,
      questionText: `Your tax return shows dividend income of ${formatCurrency(data.dividend_income)}. Is this from your own company?`,
      reasoning: 'Dividends from your own company are treated differently from investment dividends for disclosure.',
      options: [
        { label: 'Yes, my company', value: 'own_company' },
        { label: 'No, investments', value: 'investments' },
        { label: 'Both', value: 'both' },
      ],
      primaryOption: null,
      secondaryLabel: 'I\'m not sure',
      formEField: '2.16 or 2.4',
      answered: false,
      answer: null,
    })
  }

  // Rental income
  if (data.rental_income != null && data.rental_income > 0) {
    autoConfirmItems.push({
      id: `p60-rental-${Date.now()}`,
      label: `Rental income${yearLabel}: ${formatCurrency(data.rental_income)}`,
      detail: 'From tax return',
      accepted: true,
    })

    financialItems.push({
      id: `fi-p60-rental-${Date.now()}`,
      sectionKey: 'income',
      label: 'Rental income',
      value: data.rental_income,
      period: 'annual',
      ownership: 'yours',
      confidence: 'confirmed',
      sourceDocumentId: null,
      sourceDescription: `Tax return${yearLabel}`,
      formECategory: 'Rental income',
      isInherited: false,
      isPreMarital: false,
      asAtDate: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Multiple income sources
  if (data.other_income.length > 0) {
    questions.push({
      id: `p60-multiple-${Date.now()}`,
      questionText: `Your tax return shows income from ${data.other_income.length + 1} sources. Are all of these current?`,
      reasoning: 'Courts need to know your current income, not just historical.',
      options: [
        { label: 'Yes, all current', value: 'all_current' },
        { label: 'Some have changed', value: 'changed' },
      ],
      primaryOption: 'Yes, all current',
      secondaryLabel: 'Some have changed',
      formEField: '2.15–2.16',
      answered: false,
      answer: null,
    })
  }

  const processingMessages = [
    `Found ${data.document_type === 'p60' ? 'P60' : 'tax return'} from ${data.employer_or_source}`,
    `Annual income: ${formatCurrency(data.total_pay)}`,
  ]

  return { autoConfirmItems, questions, financialItems, processingMessages }
}

// ═══ Helpers ═══

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  savings: 'Savings account',
  cash_isa: 'Cash ISA',
  stocks_and_shares_isa: 'Stocks & Shares ISA',
  lifetime_isa: 'Lifetime ISA',
  investment_fund: 'Investment fund',
  premium_bonds: 'Premium Bonds',
  other: 'Savings / investment account',
}

const CATEGORY_LABELS: Record<string, string> = {
  mortgage: 'Mortgage payment',
  rent: 'Rent',
  insurance: 'Insurance',
  pension_contribution: 'Pension contribution',
  childcare: 'Childcare',
  loan_repayment: 'Loan repayment',
  child_maintenance: 'Child maintenance',
  utilities: 'Utilities',
  council_tax: 'Council tax',
  subscription: 'Subscription',
  unknown: 'Regular payment',
}

function getFormEField(category: string): string {
  switch (category) {
    case 'mortgage': return '2.1 + 3.1'
    case 'rent': return '3.1'
    case 'insurance': return '3.1'
    case 'pension_contribution': return '2.13'
    case 'childcare': return '3.1'
    case 'loan_repayment': return '2.14 + 3.1'
    case 'child_maintenance': return '3.1'
    case 'utilities': return '3.1'
    case 'council_tax': return '3.1'
    default: return '3.1'
  }
}

function paymentToSection(category: string): SectionKey {
  switch (category) {
    case 'mortgage': return 'property'
    case 'rent': return 'spending'
    case 'pension_contribution': return 'pensions'
    case 'loan_repayment': return 'debts'
    case 'child_maintenance': return 'spending'
    default: return 'spending'
  }
}
