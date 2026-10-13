import { parseCSVToExtraction } from '@/lib/bank/csv-parser'
import { getAllTestScenarios, getTestScenarioById, type TestScenario } from '@/lib/bank/test-scenarios'
import type { BankStatementExtraction } from '@/lib/ai/extraction-schemas'
import { hash } from './money'
import { fits } from './pack'

// Where bank data comes from. A scenario stores only its id and is recomputed on every
// request through the same engine path a CSV takes; a Tink connection stores what the
// callback fetched, because nothing else persists it yet.
export interface RawTransaction {
  date: string
  description: string
  amount: number
}

export interface BankAccount {
  extraction: BankStatementExtraction
  transactions: RawTransaction[]
}

export type BankSource =
  | { kind: 'scenario'; id: string; connectedAt: string }
  | { kind: 'tink'; accounts: BankAccount[]; connectedAt: string }

export interface BankData {
  source: BankSource
  accounts: BankAccount[]
  /** "Barclays", or "Barclays and Monzo". */
  label: string
  months: number
  transactionCount: number
}

function isRawTransaction(x: unknown): x is RawTransaction {
  if (!x || typeof x !== 'object') return false
  const t = x as Record<string, unknown>
  return typeof t.date === 'string' && typeof t.description === 'string' && typeof t.amount === 'number'
}

function isAccount(x: unknown): x is BankAccount {
  if (!x || typeof x !== 'object') return false
  const a = x as Record<string, unknown>
  const e = a.extraction as Record<string, unknown> | undefined
  return (
    !!e && e.document_type === 'bank_statement' && typeof e.provider === 'string' &&
    Array.isArray(e.income_deposits) && Array.isArray(e.regular_payments) && Array.isArray(e.spending_categories) &&
    Array.isArray(a.transactions) && a.transactions.every(isRawTransaction)
  )
}

export function isBankSource(x: unknown): x is BankSource {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  if (typeof s.connectedAt !== 'string') return false
  if (s.kind === 'scenario') return typeof s.id === 'string'
  if (s.kind === 'tink') return Array.isArray(s.accounts) && s.accounts.every(isAccount)
  return false
}

/** A scenario's transactions go through the CSV parser, the engine's own path for raw statements. */
export function scenarioAccount(scenario: TestScenario): BankAccount {
  const csv = ['date,description,amount', ...scenario.transactions.map(t => `${t.date},"${t.description}",${t.amount}`)].join('\n')
  const { extraction } = parseCSVToExtraction(csv, `${scenario.provider}.csv`)
  extraction.provider = scenario.provider
  extraction.account_type = scenario.accountType
  extraction.is_joint = scenario.isJoint
  extraction.account_number_last4 = String(1000 + (hash(scenario.id) % 9000))
  return {
    extraction,
    transactions: scenario.transactions.map(t => ({ date: t.date, description: t.description, amount: t.amount })),
  }
}

export function scenarioChoices(): Array<{ id: string; name: string; description: string }> {
  return getAllTestScenarios().map(s => ({ id: s.id, name: s.name, description: s.description }))
}

function monthsCovered(accounts: BankAccount[]): number {
  const dates = accounts.flatMap(a => [a.extraction.statement_period_start, a.extraction.statement_period_end]).filter((d): d is string => !!d).sort()
  if (dates.length < 2) return 12
  const ms = new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()
  return Math.max(1, Math.round(ms / (30 * 24 * 60 * 60 * 1000)))
}

function providerLabel(accounts: BankAccount[]): string {
  const names = [...new Set(accounts.map(a => a.extraction.provider))]
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

export function resolveBank(source: BankSource | null): BankData | null {
  if (!source) return null
  let accounts: BankAccount[]
  if (source.kind === 'scenario') {
    const scenario = getTestScenarioById(source.id)
    if (!scenario) return null
    accounts = [scenarioAccount(scenario)]
  } else {
    accounts = source.accounts
  }
  if (accounts.length === 0) return null
  return {
    source,
    accounts,
    label: providerLabel(accounts),
    months: monthsCovered(accounts),
    transactionCount: accounts.reduce((n, a) => n + a.transactions.length, 0),
  }
}

/** Trim a Tink source until it fits the cookie budget, oldest transactions first. */
export function fitTinkSource(source: Extract<BankSource, { kind: 'tink' }>): Extract<BankSource, { kind: 'tink' }> {
  const accounts = source.accounts.map(a => ({
    extraction: a.extraction,
    transactions: a.transactions
      .map(t => ({ date: t.date, description: t.description.slice(0, 40), amount: Math.round(t.amount * 100) / 100 }))
      .sort((x, y) => x.date.localeCompare(y.date)),
  }))
  let trimmed = { ...source, accounts }
  while (!fits(trimmed) && trimmed.accounts.some(a => a.transactions.length > 0)) {
    trimmed = { ...trimmed, accounts: trimmed.accounts.map(a => ({ ...a, transactions: a.transactions.slice(Math.ceil(a.transactions.length * 0.2)) })) }
  }
  return trimmed
}
