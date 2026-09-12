import { reveal as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import type { BankData } from './bank'
import type { ConfirmPlan, Finding } from './confirm'

// The reveal: per account, the items that fade in one by one. They come from the
// findings the signals produced plus the spending the bank alone proves.
export interface RevealItem {
  id: string
  label: string
  detail: string
  value: number | null
}

const KIND_LABEL: Partial<Record<Finding['kind'], keyof typeof copy.items>> = {
  salary: 'salary',
  childBenefit: 'childBenefit',
  dwp: 'benefits',
  selfEmployment: 'selfEmployment',
  mortgage: 'mortgage',
  rent: 'rent',
  councilTax: 'councilTax',
  pension: 'pension',
  investment: 'investment',
  loan: 'loan',
  creditCard: 'creditCard',
  bnpl: 'creditCard',
}

const ORDER: Array<Finding['kind']> = ['salary', 'selfEmployment', 'mortgage', 'rent', 'loan', 'childBenefit', 'dwp', 'councilTax', 'pension', 'investment', 'creditCard', 'bnpl']

export function revealItems(bank: BankData, plan: ConfirmPlan): RevealItem[] {
  const items: RevealItem[] = []
  const findings = plan.findings.filter(f => f.line !== null).sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
  for (const f of findings) {
    const key = KIND_LABEL[f.kind]
    if (!key || f.amount === null) continue
    const detail = f.kind === 'childBenefit' && f.note ? f.note : fill(copy.fromPayee, { amount: f.amount.toLocaleString('en-GB'), payee: f.payee ?? '' })
    items.push({ id: f.id, label: copy.items[key], detail, value: f.amount })
  }
  const categories = new Map<string, number>()
  for (const account of bank.accounts) {
    for (const s of account.extraction.spending_categories) categories.set(s.category, (categories.get(s.category) ?? 0) + s.monthly_average)
  }
  for (const [category, key] of [['insurance', 'insurance'], ['utilities', 'utilities'], ['childcare', 'childcare']] as const) {
    const value = categories.get(category)
    if (value) items.push({ id: `spending-${category}`, label: copy.items[key], detail: fill(copy.perMonth, { amount: value.toLocaleString('en-GB') }), value })
  }
  items.push({ id: 'transactions', label: copy.items.transactions, detail: fill(copy.count, { n: bank.transactionCount, months: bank.months }), value: bank.transactionCount })
  return items
}
