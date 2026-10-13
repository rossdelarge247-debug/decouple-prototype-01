import { findingEvidence, findings as copy, gaps as gapCopy } from '@/copy/build'
import { fill } from '@/copy/rules'
import type { DetectedPayment, ExtractedIncome } from '@/lib/ai/extraction-schemas'
import { normaliseDescription } from '@/lib/bank/csv-parser'
import { runSignalDetection, type DetectedSignal } from '@/lib/bank/signal-rules'
import type { StartAnswers } from '@/lib/start/answers'
import type { BankAccount, BankData } from './bank'
import { displayPayee, slug, toMonthly } from './money'
import type { ProfileAnswers } from './profile'

// The wiring the previous prototype never had: questions come from detected signals,
// not from raw bank data. Each signal becomes a finding with a tier from its confidence
// and the profile's gates; the generator's step id is carried as the contract so its
// follow-up ladders can attach later. Nothing here asks what a signal already answered.

/** JOURNEY gives the spec's 0.90 and the inherited code's 0.95; the spec was chosen. */
export const TIER1_THRESHOLD = 0.9
export const TIER2_THRESHOLD = 0.7

export type SectionKey = 'children' | 'home' | 'property' | 'pensions' | 'savings' | 'debts' | 'income' | 'spending' | 'business' | 'needs'
export type Tier = 1 | 2 | 3
export type FindingKind = keyof typeof copy
export type Frequency = DetectedPayment['frequency']

export interface Finding {
  id: string
  kind: FindingKind
  tier: Tier
  section: SectionKey
  formEField: string
  confidence: number
  signalId: string
  ruleId: string
  payee: string | null
  /** Monthly amount, or null for a finding about an absence. */
  amount: number | null
  frequency: Frequency | null
  /** The tier 1 statement; null when the finding is only a question. */
  line: string | null
  note: string | null
  evidence: string
  question: string
  hint: string | null
  why: string
  options: Array<{ value: string; label: string }>
  source: { provider: string; last4: string | null }
  generatorStep: string | null
}

export interface Gap {
  id: string
  kind: keyof typeof gapCopy
  section: SectionKey
  what: string
  from: string
  why: string
  howLong: string
  help: string
  note: string | null
}

export type Confirmations = Record<string, { value: string; at: string }>

export interface ConfirmPlan {
  findings: Finding[]
  tier1: Finding[]
  questions: Finding[]
  gaps: Gap[]
  /** Internal flags such as gambling. Never shown as a question. */
  flags: string[]
}

export const SKIPPED = 'skipped'
export const NOT_MINE = 'not-mine'
export const CONFIRMED = 'confirmed'
export const REQUESTED = 'requested'
export const NOTED = 'noted'

/** The inherited generator's step for each rule: the contract the wiring honours. */
export const GENERATOR_STEP: Record<string, string | null> = {
  'income.regular-salary': 'income-salary',
  'income.benefits-hmrc': 'income-hmrc-confirmed',
  'income.benefits-dwp': 'income-dwp-type',
  'income.self-employment-signal': 'business-detected',
  'income.none-visible': 'income-none',
  'property.mortgage-detected': 'property-mortgage',
  'property.rent-detected': 'property-mortgage',
  'property.council-tax': null,
  'property.no-housing': 'property-no-signal',
  'pension.contribution-detected': 'pensions-detected',
  'pension.no-contribution': 'pensions-no-signal',
  'accounts.investment-platform': 'accounts-investment-0',
  'debt.credit-card': 'debts-cc-0-confirm',
  'debt.loan': 'debts-loan-0',
  'debt.bnpl': 'debts-bnpl',
  'flag.gambling': null,
}

export function isConfirmations(x: unknown): x is Confirmations {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  return Object.values(x as Record<string, unknown>).every(v => {
    if (!v || typeof v !== 'object') return false
    const e = v as Record<string, unknown>
    return typeof e.value === 'string' && typeof e.at === 'string'
  })
}

// ═══ Matching a profile answer to a bank payee ═══

const STOP = new Set(['bank', 'building', 'society', 'financial', 'finance', 'services', 'service', 'the', 'ltd', 'plc', 'limited', 'uk', 'group', 'mortgage', 'mortgages', 'pension', 'pensions', 'consumer', 'motor', 'credit'])

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9&\s]/g, ' ').split(/\s+/).filter(t => t.length >= 2)
}

/** "Halifax" names "DD HALIFAX MORTGAGE 87234561"; "BMW Financial Services" names "DD BMW FINANCIAL SERVICES". */
export function namesPayee(answer: string | null, payee: string): boolean {
  if (!answer) return false
  const key = tokens(answer).filter(t => !STOP.has(t))
  if (key.length === 0) return false
  const haystack = tokens(payee)
  return key.every(k => haystack.includes(k))
}

// ═══ Per-account detection ═══

export function detectSignals(account: BankAccount): DetectedSignal[] {
  const { extraction, transactions } = account
  return runSignalDetection({
    incomes: extraction.income_deposits,
    payments: extraction.regular_payments,
    transactions,
    accountMeta: { provider: extraction.provider, isJoint: extraction.is_joint, type: extraction.account_type },
  }).signals
}

function countOf(account: BankAccount, payee: string): number {
  const key = normaliseDescription(payee)
  return account.transactions.filter(t => normaliseDescription(t.description) === key).length
}

const FREQUENCY_LABEL: Record<Frequency, string> = { monthly: 'monthly', weekly: 'weekly', quarterly: 'quarterly', annual: 'yearly', one_off: 'once' }

function tierFor(confidence: number, linked: boolean): Tier {
  if (linked || confidence >= TIER1_THRESHOLD) return 1
  if (confidence >= TIER2_THRESHOLD) return 2
  return 3
}

interface Context {
  account: BankAccount
  profile: ProfileAnswers | null
  start: StartAnswers | null
}

interface Draft {
  kind: FindingKind
  section: SectionKey
  item: DetectedPayment | ExtractedIncome | null
  confidence: number
  linked?: boolean
  note?: string | null
  hint?: string | null
  question?: string
  options?: Array<{ value: string; label: string }>
  /** Findings about an absence are always a genuine question. */
  absent?: boolean
  evidence?: string
  idSuffix?: string
}

function opts(record: Record<string, string>): Array<{ value: string; label: string }> {
  return Object.entries(record).map(([value, label]) => ({ value, label }))
}

function isPayment(item: DetectedPayment | ExtractedIncome): item is DetectedPayment {
  return 'payee' in item
}

function make(signal: DetectedSignal, ctx: Context, d: Draft): Finding {
  const raw = d.item ? (isPayment(d.item) ? d.item.payee : d.item.source) : null
  const payee = raw ? displayPayee(raw) : null
  const frequency: Frequency | null = d.item ? (isPayment(d.item) ? d.item.frequency : 'monthly') : null
  const amount = d.item ? (isPayment(d.item) ? toMonthly(d.item.amount, d.item.frequency) : Math.round(d.item.amount)) : null
  const c = copy[d.kind]
  const values = { amount: amount?.toLocaleString('en-GB') ?? '', payee: payee ?? '' }
  const tier = d.absent ? 3 : tierFor(d.confidence, !!d.linked)
  const count = raw ? countOf(ctx.account, raw) : 0
  const evidence = d.evidence ?? (raw ? fill(findingEvidence[d.item && isPayment(d.item) ? 'payments' : 'credits'], { n: count, frequency: frequency ? FREQUENCY_LABEL[frequency] : '' }) : '')
  const kind = slug(d.kind.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`))
  const id = d.idSuffix ? `${kind}-${d.idSuffix}` : payee ? `${kind}-${slug(payee)}` : kind
  return {
    id,
    kind: d.kind,
    tier,
    section: d.section,
    formEField: signal.formEField,
    confidence: d.confidence,
    signalId: signal.id,
    ruleId: signal.ruleId,
    payee,
    amount,
    frequency,
    line: d.absent || !('line' in c) ? null : fill(c.line, values),
    note: d.note ?? null,
    evidence,
    question: d.question ?? fill(c.question, values),
    hint: d.hint ?? null,
    why: c.why,
    options: d.options ?? opts(c.options),
    source: { provider: ctx.account.extraction.provider, last4: ctx.account.extraction.account_number_last4 },
    generatorStep: GENERATOR_STEP[signal.ruleId] ?? null,
  }
}

const BNPL = ['klarna', 'clearpay', 'laybuy', 'zilch', 'openpay']

function findingsFor(signal: DetectedSignal, ctx: Context): Finding[] {
  const { extraction } = ctx.account
  const payments = extraction.regular_payments
  const incomes = extraction.income_deposits
  const declaredChildren = ctx.profile?.children ?? ctx.start?.children ?? null

  switch (signal.ruleId) {
    case 'income.regular-salary': {
      const item = incomes.find(i => i.type === 'employment')
      if (!item) return []
      const variation = signal.evidence[0]?.metrics?.find(m => m.name === 'Variation')?.value ?? '0%'
      const n = signal.evidence[0]?.metrics?.find(m => m.name === 'Occurrences')?.value ?? '0'
      return [make(signal, ctx, { kind: 'salary', section: 'income', item, confidence: signal.confidence, evidence: fill(copy.salary.evidence, { n, variation: variation.replace('%', '') }) })]
    }
    case 'income.benefits-hmrc': {
      const item = incomes.find(i => i.type === 'benefits' && /hmrc|child benefit/i.test(i.source))
      if (!item) return []
      const inferred = Number(signal.evidence[0]?.metrics?.find(m => m.name === 'Inferred children')?.value ?? 0)
      const note = inferred > 0 && declaredChildren !== null
        ? inferred === declaredChildren
          ? fill(copy.childBenefit.match, { n: inferred })
          : fill(copy.childBenefit.mismatch, { n: inferred, declared: declaredChildren })
        : null
      return [make(signal, ctx, { kind: 'childBenefit', section: 'income', item, confidence: signal.confidence, note })]
    }
    case 'income.benefits-dwp': {
      const item = incomes.find(i => i.type === 'benefits' && /dwp/i.test(i.source))
      return item ? [make(signal, ctx, { kind: 'dwp', section: 'income', item, confidence: signal.confidence })] : []
    }
    case 'income.self-employment-signal': {
      const item = incomes.find(i => i.type === 'self_employment') ?? null
      const known = ctx.profile?.businessStructure ?? null
      if (item && known) {
        return [make(signal, ctx, { kind: 'selfEmployment', section: 'business', item, confidence: signal.confidence, linked: true, note: copy.selfEmployment.matchesProfile })]
      }
      return item ? [make(signal, ctx, { kind: 'selfEmployment', section: 'business', item, confidence: signal.confidence })] : []
    }
    case 'income.none-visible':
      return [make(signal, ctx, { kind: 'noIncome', section: 'income', item: null, confidence: signal.confidence, absent: true })]
    case 'property.mortgage-detected': {
      const item = payments.find(p => p.likely_category === 'mortgage')
      if (!item) return []
      const linked = namesPayee(ctx.profile?.lender ?? null, item.payee)
      return [make(signal, ctx, { kind: 'mortgage', section: 'home', item, confidence: signal.confidence, linked, note: linked ? copy.mortgage.matchesLender : null })]
    }
    case 'property.rent-detected': {
      const item = payments.find(p => p.likely_category === 'rent')
        ?? payments.filter(p => p.likely_category === 'unknown' && p.frequency === 'monthly' && p.amount >= 400 && p.amount <= 4000).sort((a, b) => b.amount - a.amount)[0]
      if (!item) return []
      const linked = ctx.start?.home === 'rent' && ctx.profile?.rentAmount !== null && ctx.profile?.rentAmount !== undefined && Math.abs(ctx.profile.rentAmount - item.amount) <= 5
      return [make(signal, ctx, { kind: 'rent', section: 'home', item, confidence: signal.confidence, linked, note: linked ? copy.rent.matchesProfile : null })]
    }
    case 'property.no-housing':
      // The interview already asked; the absence only informs the picture.
      if (ctx.start?.home) return []
      return [make(signal, ctx, { kind: 'noHousing', section: 'home', item: null, confidence: signal.confidence, absent: true })]
    case 'property.council-tax': {
      const item = payments.find(p => p.likely_category === 'council_tax')
      return item ? [make(signal, ctx, { kind: 'councilTax', section: 'spending', item, confidence: signal.confidence })] : []
    }
    case 'pension.contribution-detected': {
      const provider = ctx.profile?.pensionProvider ?? null
      return payments.filter(p => p.likely_category === 'pension_contribution').map(item => {
        const linked = namesPayee(provider, item.payee)
        return make(signal, ctx, {
          kind: 'pension', section: 'pensions', item, confidence: signal.confidence, linked,
          note: linked ? copy.pension.matchesProvider : null,
          hint: !linked && provider ? fill(copy.pension.hint, { provider }) : null,
        })
      })
    }
    case 'pension.no-contribution':
      // A workplace pension the profile named is expected to be invisible here; drawing one, too.
      if (ctx.profile?.pensions) return []
      return [make(signal, ctx, { kind: 'noPension', section: 'pensions', item: null, confidence: signal.confidence, absent: true })]
    case 'accounts.investment-platform':
      return payments.filter(p => p.likely_category === 'investment').map(item =>
        make(signal, ctx, { kind: 'investment', section: 'savings', item, confidence: signal.confidence }),
      )
    case 'debt.credit-card':
      return payments.filter(p => p.likely_category === 'credit_card').map(item =>
        make(signal, ctx, { kind: 'creditCard', section: 'debts', item, confidence: signal.confidence }),
      )
    case 'debt.loan': {
      const noVehicle = ctx.profile?.vehicles === 'none'
      const provider = ctx.profile?.vehicleFinance ? ctx.profile.financeProvider : null
      return payments
        .filter(p => p.likely_category === 'loan_repayment' && !BNPL.some(b => p.payee.toLowerCase().includes(b)))
        .map(item => {
          const linked = namesPayee(provider, item.payee)
          const options = opts(copy.loan.options).filter(o => !(noVehicle && o.value === 'carFinance'))
          return make(signal, ctx, {
            kind: 'loan', section: 'debts', item, confidence: signal.confidence, linked, options,
            note: linked ? copy.loan.matchesProvider : null,
            hint: !linked && provider ? fill(copy.loan.hintVehicle, { provider }) : null,
          })
        })
    }
    case 'debt.bnpl':
      return payments.filter(p => BNPL.some(b => p.payee.toLowerCase().includes(b))).map(item =>
        make(signal, ctx, { kind: 'bnpl', section: 'debts', item, confidence: signal.confidence }),
      )
    default:
      return []
  }
}

// ═══ The gap engine: six rules, ordered by lead time ═══

const GAP_ORDER: Array<Gap['kind']> = ['cetv', 'valuation', 'mortgageStatement', 'payslips', 'cardStatement', 'accountStatement']

function planGaps(profile: ProfileAnswers | null, start: StartAnswers | null, findings: Finding[]): Gap[] {
  const gaps: Gap[] = []
  const by = (kind: FindingKind) => findings.filter(f => f.kind === kind)
  const gap = (id: string, kind: Gap['kind'], section: SectionKey, from: string, note: string | null = null): Gap => {
    const c = gapCopy[kind]
    return { id, kind, section, what: c.what, from, why: c.why, howLong: c.howLong, help: c.help, note }
  }

  const pension = by('pension')[0]
  const hasPension = (profile?.pensions && profile.pensions !== 'no') || !!pension
  if (hasPension) {
    const from = profile?.pensionProvider || pension?.payee || null
    const publicSector = profile?.pensionKind === 'publicSector'
    gaps.push(gap('gap-cetv', 'cetv', 'pensions', from ? fill(gapCopy.cetv.from, { provider: from }) : gapCopy.cetv.fromUnknown, publicSector ? gapCopy.cetv.mccloud : null))
  }
  if (start?.home === 'mortgage' || start?.home === 'outright') {
    gaps.push(gap('gap-valuation', 'valuation', 'home', gapCopy.valuation.from))
  }
  const mortgage = by('mortgage')[0]
  if (mortgage || profile?.lender) {
    gaps.push(gap('gap-mortgage-statement', 'mortgageStatement', 'home', fill(gapCopy.mortgageStatement.from, { lender: profile?.lender ?? mortgage?.payee ?? '' })))
  }
  const salary = by('salary')[0]
  if (salary) {
    gaps.push(gap('gap-payslips', 'payslips', 'income', fill(gapCopy.payslips.from, { employer: salary.payee ?? '' })))
  }
  for (const debt of [...by('creditCard'), ...by('loan'), ...by('bnpl')]) {
    gaps.push(gap(`gap-card-${slug(debt.payee ?? debt.id)}`, 'cardStatement', 'debts', fill(gapCopy.cardStatement.from, { provider: debt.payee ?? '' })))
  }
  const investments = by('investment')
  for (const inv of investments) {
    gaps.push(gap(`gap-account-${slug(inv.payee ?? inv.id)}`, 'accountStatement', 'savings', fill(gapCopy.accountStatement.from, { provider: inv.payee ?? '' })))
  }
  // Unticked items on the profile are never asked about; ticked ones the bank cannot see get one statement each.
  if (investments.length === 0) {
    for (const key of ['savings', 'investments'] as const) {
      if (profile?.otherAssets.includes(key)) gaps.push(gap(`gap-account-${key}`, 'accountStatement', 'savings', gapCopy.accountStatement.fromDeclared[key]))
    }
  }
  if (profile?.otherAssets.includes('crypto')) gaps.push(gap('gap-account-crypto', 'accountStatement', 'savings', gapCopy.accountStatement.fromDeclared.crypto))

  return gaps.sort((a, b) => GAP_ORDER.indexOf(a.kind) - GAP_ORDER.indexOf(b.kind))
}

// ═══ The plan ═══

export function planConfirmation(bank: BankData, profile: ProfileAnswers | null, start: StartAnswers | null): ConfirmPlan {
  const findings: Finding[] = []
  const flags: string[] = []
  const seen = new Set<string>()
  for (const account of bank.accounts) {
    const ctx: Context = { account, profile, start }
    for (const signal of detectSignals(account)) {
      if (signal.section === 'flags') {
        flags.push(signal.ruleId)
        continue
      }
      for (const f of findingsFor(signal, ctx)) {
        if (seen.has(f.id)) continue
        seen.add(f.id)
        findings.push(f)
      }
    }
  }
  const order: SectionKey[] = ['income', 'home', 'spending', 'pensions', 'savings', 'debts', 'business', 'children', 'property', 'needs']
  findings.sort((a, b) => a.tier - b.tier || order.indexOf(a.section) - order.indexOf(b.section))
  return {
    findings,
    tier1: findings.filter(f => f.tier === 1),
    questions: findings.filter(f => f.tier !== 1),
    gaps: planGaps(profile, start, findings),
    flags,
  }
}

// ═══ Progress through the confirmation ═══

export const CONFIRM_ROUTE = '/build/confirm'
export const GAPS_ROUTE = '/build/confirm/gaps'
export const PICTURE_ROUTE = '/build/picture'

export function questionRoute(id: string): string {
  return `${CONFIRM_ROUTE}/${id}`
}

export function tier1Done(plan: ConfirmPlan, c: Confirmations): boolean {
  return plan.tier1.every(f => !!c[f.id])
}

export function gapsDone(plan: ConfirmPlan, c: Confirmations): boolean {
  return plan.gaps.every(g => !!c[g.id])
}

export function nextQuestion(plan: ConfirmPlan, c: Confirmations): Finding | null {
  return plan.questions.find(f => !c[f.id]) ?? null
}

/** Where to go next: the batch, the next unanswered question, the gaps, then the picture. */
export function nextConfirmRoute(plan: ConfirmPlan, c: Confirmations): string {
  if (plan.tier1.length > 0 && !tier1Done(plan, c)) return CONFIRM_ROUTE
  const q = nextQuestion(plan, c)
  if (q) return questionRoute(q.id)
  if (plan.gaps.length > 0 && !gapsDone(plan, c)) return GAPS_ROUTE
  return PICTURE_ROUTE
}

export function isConfirmDone(plan: ConfirmPlan, c: Confirmations): boolean {
  return nextConfirmRoute(plan, c) === PICTURE_ROUTE
}

export function questionPosition(plan: ConfirmPlan, id: string): { n: number; total: number } {
  return { n: plan.questions.findIndex(f => f.id === id) + 1, total: plan.questions.length }
}

/** Tier 1 is confirmed as a batch; an answer already given is never overwritten. */
export function confirmTier1(plan: ConfirmPlan, c: Confirmations, at: string): Confirmations {
  const next = { ...c }
  for (const f of plan.tier1) if (!next[f.id]) next[f.id] = { value: CONFIRMED, at }
  return next
}

export function answer(c: Confirmations, id: string, value: string, at: string): Confirmations {
  return { ...c, [id]: { value, at } }
}

export function isAnswerValid(f: Finding, value: string): boolean {
  return value === SKIPPED || value === NOT_MINE || value === CONFIRMED || f.options.some(o => o.value === value)
}

export function labelFor(f: Finding, value: string): string | null {
  return f.options.find(o => o.value === value)?.label ?? null
}
