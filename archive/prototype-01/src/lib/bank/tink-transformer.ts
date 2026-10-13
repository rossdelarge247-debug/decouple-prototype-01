// Transforms Tink Open Banking data → BankStatementExtraction
// The existing transformExtractionResult pipeline then handles everything downstream:
// keyword lookup, payment aggregation, Q&A flow, section cards, category grouping.
//
// Tink gives us structured, categorised transactions — no AI extraction needed.
// This transformer normalises Tink's format into the same shape the AI pipeline produces.

import type { TinkAccount, TinkTransaction } from './tink-client'
import { parseTinkAmount } from './tink-client'
import type {
  BankStatementExtraction,
  ExtractedIncome,
  DetectedPayment,
  SpendingCategory,
} from '@/lib/ai/extraction-schemas'

// ═══ Tink financial institution → human-readable provider name ═══

const INSTITUTION_NAMES: Record<string, string> = {
  'barclays-ob': 'Barclays',
  'hsbc-ob': 'HSBC',
  'lloyds-ob': 'Lloyds',
  'natwest-ob': 'NatWest',
  'santander-ob': 'Santander',
  'nationwide-ob': 'Nationwide',
  'rbs-ob': 'Royal Bank of Scotland',
  'halifax-ob': 'Halifax',
  'tsb-ob': 'TSB',
  'monzo-ob': 'Monzo',
  'starling-ob': 'Starling',
  'revolut-ob': 'Revolut',
  'metro-ob': 'Metro Bank',
  'coop-ob': 'Co-operative Bank',
  'virgin-ob': 'Virgin Money',
  'first-direct-ob': 'first direct',
}

function getProviderName(institutionId: string): string {
  return INSTITUTION_NAMES[institutionId] || institutionId.replace(/-ob$/, '').replace(/-/g, ' ')
}

// ═══ Tink PFM category → our DetectedPayment likely_category ═══

const TINK_CATEGORY_MAP: Record<string, DetectedPayment['likely_category']> = {
  'expenses:house.mortgage': 'mortgage',
  'expenses:house.rent': 'rent',
  'expenses:house.insurance': 'insurance',
  'expenses:house.utilities': 'utilities',
  'expenses:house.council-tax': 'council_tax',
  'expenses:transport.fuel': 'unknown',
  'expenses:transport.public': 'unknown',
  'expenses:health.insurance': 'insurance',
  'expenses:kids.childcare': 'childcare',
  'expenses:entertainment.subscriptions': 'subscription',
  'expenses:misc.insurance': 'insurance',
  'expenses:savings.pension': 'pension_contribution',
  'transfers:loan-payment': 'loan_repayment',
}

function mapTinkCategory(categoryId: string): DetectedPayment['likely_category'] {
  // Try exact match first
  if (TINK_CATEGORY_MAP[categoryId]) return TINK_CATEGORY_MAP[categoryId]
  // Try partial match on parent category
  for (const [key, value] of Object.entries(TINK_CATEGORY_MAP)) {
    if (categoryId.startsWith(key.split('.')[0])) return value
  }
  return 'unknown'
}

// ═══ Tink income category detection ═══

const INCOME_CATEGORIES = new Set([
  'income:salary',
  'income:pension',
  'income:benefits',
  'income:rental',
  'income:refund',
  'income:other',
])

function mapIncomeType(categoryId: string): ExtractedIncome['type'] {
  if (categoryId.includes('salary')) return 'employment'
  if (categoryId.includes('pension')) return 'pension_income'
  if (categoryId.includes('benefits')) return 'benefits'
  if (categoryId.includes('rental')) return 'rental'
  return 'other'
}

// ═══ Account type mapping ═══

function mapAccountType(tinkType: TinkAccount['type']): BankStatementExtraction['account_type'] {
  switch (tinkType) {
    case 'CHECKING': return 'current'
    case 'SAVINGS': return 'savings'
    default: return 'unknown'
  }
}

// ═══ Main transformer ═══

export function transformTinkAccount(
  account: TinkAccount,
  transactions: TinkTransaction[],
  resolvedProviderName?: string,
): BankStatementExtraction {
  const provider = resolvedProviderName || getProviderName(account.financialInstitutionId)
  const last4 = extractLast4(account)
  const balance = parseTinkAmount(account.balances.booked.amount)

  // Separate credits (income) from debits (spending)
  const credits = transactions.filter((t) => parseTinkAmount(t.amount) > 0)
  const debits = transactions.filter((t) => parseTinkAmount(t.amount) < 0)

  // Calculate statement period from transaction dates
  const dates = transactions.map((t) => t.dates.booked).filter(Boolean).sort()
  const periodStart = dates[0] || null
  const periodEnd = dates[dates.length - 1] || null

  return {
    document_type: 'bank_statement',
    provider,
    account_number_last4: last4,
    account_type: mapAccountType(account.type),
    is_joint: false, // Tink doesn't reliably indicate joint accounts
    joint_holder_name: null,
    statement_period_start: periodStart,
    statement_period_end: periodEnd,
    closing_balance: balance,
    income_deposits: identifyIncome(credits),
    regular_payments: identifyRegularPayments(debits),
    spending_categories: aggregateSpendingCategories(debits),
    notable_transactions: [],
  }
}

// ═══ Income identification ═══
// Groups credit transactions by source, identifies recurring deposits

function identifyIncome(credits: TinkTransaction[]): ExtractedIncome[] {
  const bySource = new Map<string, TinkTransaction[]>()

  for (const tx of credits) {
    const name = tx.merchantInformation?.merchantName || tx.descriptions.display
    const key = name.toLowerCase().trim()
    const group = bySource.get(key) || []
    group.push(tx)
    bySource.set(key, group)
  }

  const result: ExtractedIncome[] = []

  for (const [, group] of bySource) {
    // Only include sources with 2+ occurrences or from income categories
    const isIncomeCategory = group.some((t) => INCOME_CATEGORIES.has(t.categories?.pfm?.id || ''))
    if (group.length < 2 && !isIncomeCategory) continue

    const amounts = group.map((t) => parseTinkAmount(t.amount))
    const avgAmount = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
    const source = group[0].merchantInformation?.merchantName || group[0].descriptions.display
    const categoryId = group[0].categories?.pfm?.id || ''

    // Confidence: high if amounts are consistent, lower if they vary
    const variation = amounts.length > 1
      ? (Math.max(...amounts) - Math.min(...amounts)) / avgAmount
      : 0
    const confidence = variation < 0.05 ? 0.97 : variation < 0.15 ? 0.90 : 0.80

    result.push({
      source,
      amount: avgAmount,
      period: 'monthly',
      confidence,
      type: mapIncomeType(categoryId),
    })
  }

  return result
}

// ═══ Regular payment identification ═══
// Groups debit transactions by payee, identifies recurring payments

function identifyRegularPayments(debits: TinkTransaction[]): DetectedPayment[] {
  const byPayee = new Map<string, TinkTransaction[]>()

  for (const tx of debits) {
    const name = tx.merchantInformation?.merchantName || tx.descriptions.display
    const key = name.toLowerCase().replace(/\b(dd|so|s\/o|d\/d)\b/gi, '').trim()
    const group = byPayee.get(key) || []
    group.push(tx)
    byPayee.set(key, group)
  }

  const result: DetectedPayment[] = []

  for (const [, group] of byPayee) {
    // Only include payees with 2+ transactions (regular payments)
    if (group.length < 2) continue

    const amounts = group.map((t) => Math.abs(parseTinkAmount(t.amount)))
    const avgAmount = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
    const payee = group[0].merchantInformation?.merchantName || group[0].descriptions.display
    const categoryId = group[0].categories?.pfm?.id || ''

    // Infer frequency from transaction spacing
    const frequency = inferFrequency(group)

    // Tink's enriched categories give us high confidence
    const confidence = categoryId !== 'uncategorized' ? 0.92 : 0.70

    result.push({
      payee,
      amount: avgAmount,
      frequency,
      confidence,
      likely_category: mapTinkCategory(categoryId),
    })
  }

  return result
}

// ═══ Spending category aggregation ═══
// Produces the same shape as the AI extraction for the spending confirmation question

function aggregateSpendingCategories(debits: TinkTransaction[]): SpendingCategory[] {
  const categories = new Map<string, { total: number; count: number }>()

  for (const tx of debits) {
    const categoryName = tx.categories?.pfm?.name || 'Other'
    const amount = Math.abs(parseTinkAmount(tx.amount))
    const existing = categories.get(categoryName) || { total: 0, count: 0 }
    existing.total += amount
    existing.count += 1
    categories.set(categoryName, existing)
  }

  // Calculate months covered to get monthly averages
  const dates = debits.map((t) => t.dates.booked).filter(Boolean).sort()
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

// ═══ Helpers ═══

function extractLast4(account: TinkAccount): string | null {
  if (account.identifiers.sortCode?.accountNumber) {
    return account.identifiers.sortCode.accountNumber.slice(-4)
  }
  if (account.identifiers.iban?.iban) {
    return account.identifiers.iban.iban.slice(-4)
  }
  return null
}

function inferFrequency(transactions: TinkTransaction[]): DetectedPayment['frequency'] {
  if (transactions.length < 2) return 'one_off'

  const dates = transactions.map((t) => new Date(t.dates.booked).getTime()).sort()
  const gaps: number[] = []
  for (let i = 1; i < dates.length; i++) {
    gaps.push((dates[i] - dates[i - 1]) / (24 * 60 * 60 * 1000))
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length

  if (avgGap < 10) return 'weekly'
  if (avgGap < 45) return 'monthly'
  if (avgGap < 120) return 'quarterly'
  return 'annual'
}
