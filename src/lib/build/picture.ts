import { picture as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import type { StartAnswers } from '@/lib/start/answers'
import type { BankData } from './bank'
import { CONFIRMED, NOT_MINE, REQUESTED, SKIPPED, labelFor, type ConfirmPlan, type Confirmations, type Finding, type Gap, type SectionKey } from './confirm'
import { displayPayee } from './money'
import type { ProfileAnswers } from './profile'

// Your Picture as data: ten §-numbered sections in the court's shape, every line with
// an evidence state and, where a value is evidenceable, a trust level. Null is unknown,
// never zero. No split, share or percentage exists in this model on purpose.

export type EvidenceState = 'proved' | 'inferred' | 'gap' | 'invisible'
export type TrustLevel = 'self-declared' | 'bank-evidenced' | 'credit-verified' | 'document-evidenced' | 'both-party-agreed' | 'court-sealed'
export type Confidence = 'known' | 'estimated' | 'unknown'
export type Fidelity = 'sketch' | 'draft' | 'evidenced' | 'locked'
export type LineStatus = 'confirmed' | 'skipped' | null

/** LOCKED: six ascending levels. */
export const TRUST_LEVELS: readonly TrustLevel[] = ['self-declared', 'bank-evidenced', 'credit-verified', 'document-evidenced', 'both-party-agreed', 'court-sealed']

export interface Line {
  id: string
  label: string
  /** Pounds. Null means unknown. */
  value: number | null
  text: string | null
  period: 'month' | null
  evidence: EvidenceState
  trust: TrustLevel | null
  confidence: Confidence
  source: string | null
  note: string | null
  findingId: string | null
  gapId: string | null
  status: LineStatus
}

export interface Change {
  at: string
  section: SectionKey
  text: string
}

export interface Section {
  key: SectionKey
  number: number
  title: string
  formE: string
  lines: Line[]
  state: 'complete' | 'attention' | 'empty' | 'none'
  noneText: string | null
  toConfirm: number
  history: Change[]
}

export interface Snapshot {
  assets: number | null
  debts: number | null
  netWorth: number | null
  income: number
  outgoings: number
  monthlyGap: number
  withoutValue: number
}

export interface Attention {
  id: string
  kind: 'gap' | 'unconfirmed'
  section: SectionKey
  label: string
  detail: string
}

export interface Picture {
  sections: Section[]
  snapshot: Snapshot
  sources: Array<{ label: string; detail: string }>
  attention: Attention[]
  fidelity: Fidelity
  readiness: string
  updatedAt: string | null
  changes: Change[]
  nextStep: string
}

export interface PictureInput {
  bank: BankData | null
  plan: ConfirmPlan | null
  confirmations: Confirmations
  profile: ProfileAnswers | null
  start: StartAnswers | null
  now: Date
}

const SECTION_ORDER: Array<{ key: SectionKey; formE: string }> = [
  { key: 'children', formE: '1' },
  { key: 'home', formE: '2.1 to 2.2' },
  { key: 'property', formE: '2.6 to 2.8' },
  { key: 'pensions', formE: '2.13' },
  { key: 'savings', formE: '2.3 to 2.4' },
  { key: 'debts', formE: '2.14' },
  { key: 'income', formE: '2.15 to 2.20' },
  { key: 'spending', formE: '3.1' },
  { key: 'business', formE: '2.10, 2.11, 2.16' },
  { key: 'needs', formE: '3' },
]

const ASSET_SECTIONS: SectionKey[] = ['home', 'property', 'pensions', 'savings']
const READINESS: Record<Fidelity, keyof typeof copy.readiness> = { sketch: 'sketch', draft: 'draft', evidenced: 'evidenced', locked: 'complete' }

function line(partial: Partial<Line> & { id: string; label: string; evidence: EvidenceState }): Line {
  return {
    value: null,
    text: null,
    period: null,
    trust: null,
    confidence: partial.value !== null && partial.value !== undefined ? 'known' : partial.text ? 'known' : 'unknown',
    source: null,
    note: null,
    findingId: null,
    gapId: null,
    status: null,
    ...partial,
  }
}

function sourceOf(f: Finding): string {
  return f.source.last4 ? fill(copy.sources.bank, { provider: f.source.provider, last4: f.source.last4 }) : fill(copy.sources.bankNoLast4, { provider: f.source.provider })
}

/** A bank line's evidence comes from its tier and what the user did with it. */
function bankLine(f: Finding, c: Confirmations, label: string): Line | null {
  const a = c[f.id]
  if (a?.value === NOT_MINE) return null
  const skipped = a?.value === SKIPPED
  const proved = f.tier === 1 && (!a || a.value === CONFIRMED)
  const answerLabel = a && a.value !== CONFIRMED && !skipped ? labelFor(f, a.value) : null
  return line({
    id: `${f.id}`,
    label,
    value: f.amount,
    period: 'month',
    evidence: proved ? 'proved' : 'inferred',
    trust: 'bank-evidenced',
    confidence: 'known',
    source: sourceOf(f),
    note: [f.note, answerLabel].filter(Boolean).join('. ') || null,
    findingId: f.id,
    status: skipped ? 'skipped' : a ? 'confirmed' : null,
  })
}

function gapLine(id: string, label: string, gap: Gap | undefined, c: Confirmations, now: Date): Line {
  const requested = gap && c[gap.id]?.value === REQUESTED
  return line({
    id,
    label,
    evidence: 'gap',
    gapId: gap?.id ?? null,
    note: requested ? fill(copy.lines.cetvRequested, { when: shortDate(new Date(c[gap!.id].at), now) }) : null,
  })
}

export function shortDate(d: Date, now: Date): string {
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return 'today'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function declared(id: string, label: string, text: string | null): Line {
  return line({ id, label, text, evidence: 'invisible', trust: text ? 'self-declared' : null, confidence: text ? 'known' : 'unknown' })
}

export function buildPicture(input: PictureInput): Picture {
  const { bank, plan, confirmations: c, profile, start, now } = input
  const findings = plan?.findings ?? []
  const gaps = plan?.gaps ?? []
  const by = (kind: Finding['kind']) => findings.filter(f => f.kind === kind)
  const gapOf = (id: string) => gaps.find(g => g.id === id)
  const children = profile?.children ?? start?.children ?? null
  const fidelity: Fidelity = bank ? 'draft' : 'sketch'

  const sections: Section[] = []
  const add = (key: SectionKey, lines: Line[], noneText: string | null = null) => {
    const meta = SECTION_ORDER.find(s => s.key === key)!
    const filtered = lines.filter((l): l is Line => l !== null)
    const toConfirm = filtered.filter(l => l.status === 'skipped').length
    const unknown = filtered.some(l => l.value === null && l.text === null)
    const state: Section['state'] = filtered.length === 0 ? (noneText ? 'none' : 'empty') : toConfirm > 0 || unknown ? 'attention' : 'complete'
    sections.push({ key, number: sections.length + 1, title: copy.sections[key], formE: meta.formE, lines: filtered, state, noneText: filtered.length === 0 ? noneText : null, toConfirm, history: [] })
  }

  // §1 The children
  {
    const cb = by('childBenefit')[0]
    if (children === 0) add('children', [], copy.lines.childrenNone)
    else {
      const count = declared('children-count', copy.lines.childrenCount, children === null ? null : children === 4 ? '4 or more' : String(children))
      if (cb && children !== null) {
        count.evidence = 'inferred'
        count.note = cb.note
      }
      add('children', [count, declared('children-names', copy.lines.childrenNames, null)])
    }
  }

  // §2 Your home
  {
    const lines: Line[] = []
    const tenure = start?.home ? copy.lines.tenureValues[start.home] : null
    lines.push(declared('home-tenure', copy.lines.tenure, tenure))
    if (start?.home === 'rent') {
      const rent = by('rent')[0]
      const rentLine = rent ? bankLine(rent, c, copy.lines.rentPayment) : profile?.rentAmount ? line({ id: 'home-rent', label: copy.lines.rentPayment, value: profile.rentAmount, period: 'month', evidence: 'invisible', trust: 'self-declared', confidence: 'known' }) : null
      if (rentLine) lines.push(rentLine)
      if (profile?.rentTo) lines.push(declared('home-landlord', copy.lines.landlord, copy.lines.landlordValues[profile.rentTo]))
    } else if (start?.home === 'mortgage' || start?.home === 'outright') {
      lines.push(gapLine('home-value', copy.lines.homeValue, gapOf('gap-valuation'), c, now))
      if (start.home === 'mortgage') {
        const m = by('mortgage')[0]
        const payment = m ? bankLine(m, c, copy.lines.mortgagePayment) : null
        if (payment) lines.push(payment)
        else if (profile?.lender) lines.push(declared('home-lender', copy.lines.mortgagePayment, profile.lender))
        lines.push(gapLine('home-mortgage-balance', copy.lines.mortgageBalance, gapOf('gap-mortgage-statement'), c, now))
      }
    }
    add('home', lines)
  }

  // §3 Other property and valuables
  {
    const lines: Line[] = []
    if (profile?.vehicles && profile.vehicles !== 'none') {
      lines.push(declared('property-vehicles', copy.lines.vehicles, copy.lines.vehiclesValues[profile.vehicles]))
      lines.push(declared('property-vehicle-value', copy.lines.vehicleValue, null))
    }
    if (profile?.otherAssets.includes('valuables')) lines.push(declared('property-valuables', copy.lines.valuables, null))
    if (profile?.otherAssets.includes('owed')) lines.push(declared('property-owed', copy.lines.owed, null))
    if (profile?.otherAssets.includes('lifeInsurance')) lines.push(declared('property-life-insurance', copy.lines.lifeInsurance, null))
    add('property', lines, profile ? copy.lines.propertyNone : null)
  }

  // §4 Your pensions
  {
    const lines: Line[] = []
    const contributions = by('pension').map(f => bankLine(f, c, copy.lines.pensionContribution)).filter((l): l is Line => l !== null)
    const hasPension = (profile?.pensions && profile.pensions !== 'no') || contributions.length > 0
    if (profile?.pensions) lines.push(declared('pensions-declared', copy.lines.pensionDeclared, copy.lines.pensionDeclaredValues[profile.pensions]))
    if (hasPension) {
      if (profile?.pensionProvider) lines.push(declared('pensions-provider', copy.lines.pensionProvider, profile.pensionProvider))
      if (profile?.pensionKind) lines.push(declared('pensions-kind', copy.lines.pensionKind, copy.lines.pensionKindValues[profile.pensionKind]))
      lines.push(...contributions)
      lines.push(gapLine('pensions-cetv', copy.lines.cetv, gapOf('gap-cetv'), c, now))
    }
    add('pensions', profile?.pensions === 'no' && contributions.length === 0 ? [] : lines, copy.lines.pensionsNone)
  }

  // §5 Savings and investments
  {
    const lines: Line[] = []
    for (const account of bank?.accounts ?? []) {
      const e = account.extraction
      const label = fill(copy.lines.account, { provider: e.provider })
      lines.push(line({
        id: `savings-account-${e.provider}-${e.account_number_last4 ?? ''}`.toLowerCase(),
        label,
        value: e.closing_balance,
        evidence: e.closing_balance === null ? 'gap' : 'proved',
        trust: e.closing_balance === null ? null : 'bank-evidenced',
        confidence: e.closing_balance === null ? 'unknown' : 'known',
        source: e.account_number_last4 ? fill(copy.sources.bank, { provider: e.provider, last4: e.account_number_last4 }) : fill(copy.sources.bankNoLast4, { provider: e.provider }),
        note: copy.lines.balance,
      }))
    }
    const investments = by('investment')
    for (const f of investments) {
      const paidIn = bankLine(f, c, `${f.payee}: ${copy.lines.paidIn}`)
      if (!paidIn) continue
      lines.push(paidIn)
      lines.push(gapLine(`${f.id}-value`, `${f.payee}: ${copy.lines.value}`, gapOf(`gap-account-${slugOf(f)}`), c, now))
    }
    if (investments.length === 0) {
      if (profile?.otherAssets.includes('savings')) lines.push(declared('savings-declared', copy.lines.savingsDeclared, null))
      if (profile?.otherAssets.includes('investments')) lines.push(declared('investments-declared', copy.lines.investmentsDeclared, null))
    }
    if (profile?.otherAssets.includes('crypto')) lines.push(declared('crypto-declared', copy.lines.crypto, null))
    add('savings', lines, copy.lines.savingsNone)
  }

  // §6 Your debts
  {
    const lines: Line[] = []
    const debts = [...by('creditCard'), ...by('loan'), ...by('bnpl')]
    for (const f of debts) {
      const label = f.kind === 'creditCard' ? copy.lines.creditCard : f.kind === 'bnpl' ? copy.lines.bnpl : copy.lines.loan
      const payment = bankLine(f, c, `${label}: ${f.payee}`)
      if (!payment) continue
      lines.push(payment)
      lines.push(gapLine(`${f.id}-balance`, `${f.payee}: ${copy.lines.balance}`, gapOf(`gap-card-${slugOf(f)}`), c, now))
    }
    if (profile?.vehicleFinance && !debts.some(d => d.kind === 'loan')) {
      lines.push(declared('debts-vehicle-finance', copy.lines.vehicleFinance, profile.financeProvider ?? copy.lines.vehicleFinanceUnnamed))
    }
    add('debts', lines, copy.lines.debtsNone)
  }

  // §7 Your income
  let income = 0
  {
    const lines: Line[] = []
    const covered = new Set<string>()
    const push = (f: Finding, label: string) => {
      const l = bankLine(f, c, label)
      if (l) lines.push(l)
      covered.add(f.id)
    }
    for (const f of by('salary')) push(f, `${copy.lines.salary}: ${f.payee}`)
    for (const f of by('childBenefit')) push(f, copy.lines.childBenefit)
    for (const f of by('dwp')) push(f, `${copy.lines.benefit}: ${f.payee}`)
    for (const f of by('selfEmployment')) push(f, `${copy.lines.businessIncome}: ${f.payee}`)
    // Income the rules have no signal for yet (a pension in payment, rent, maintenance) is still bank-proved.
    for (const account of bank?.accounts ?? []) {
      for (const i of account.extraction.income_deposits) {
        const known = findings.some(f => f.section === 'income' && f.payee && namesSame(f.payee, i.source))
        if (known || i.type === 'employment' || i.type === 'benefits') continue
        const label = i.type === 'pension_income' ? copy.lines.pensionIncome : i.type === 'self_employment' ? copy.lines.businessIncome : copy.lines.otherIncome
        lines.push(line({
          id: `income-${slugText(i.source)}`,
          label: `${label}: ${displayPayee(i.source)}`,
          value: Math.round(i.amount),
          period: 'month',
          evidence: 'proved',
          trust: 'bank-evidenced',
          confidence: 'known',
          source: account.extraction.account_number_last4 ? fill(copy.sources.bank, { provider: account.extraction.provider, last4: account.extraction.account_number_last4 }) : fill(copy.sources.bankNoLast4, { provider: account.extraction.provider }),
        }))
      }
    }
    income = lines.reduce((s, l) => s + (l.value ?? 0), 0)
    if (lines.length > 0) lines.push(line({ id: 'income-total', label: copy.lines.incomeTotal, value: income, period: 'month', evidence: 'proved', trust: 'bank-evidenced', confidence: 'known' }))
    add('income', lines, bank ? copy.lines.incomeNone : null)
  }

  // §8 Your spending
  let outgoings = 0
  {
    const totals = new Map<string, { value: number; count: number }>()
    for (const account of bank?.accounts ?? []) {
      for (const s of account.extraction.spending_categories) {
        const key = s.category in copy.categories ? s.category : 'unknown'
        const t = totals.get(key) ?? { value: 0, count: 0 }
        t.value += s.monthly_average
        t.count += s.transaction_count
        totals.set(key, t)
      }
    }
    const lines: Line[] = [...totals.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .map(([key, t]) => line({
        id: `spending-${key}`,
        label: copy.categories[key as keyof typeof copy.categories],
        value: t.value,
        period: 'month',
        evidence: 'proved',
        trust: 'bank-evidenced',
        confidence: 'known',
        note: fill(copy.lines.transactions, { n: t.count }),
      }))
    outgoings = lines.reduce((s, l) => s + (l.value ?? 0), 0)
    if (lines.length > 0) lines.push(line({ id: 'spending-total', label: copy.lines.spendingTotal, value: outgoings, period: 'month', evidence: 'proved', trust: 'bank-evidenced', confidence: 'known' }))
    add('spending', lines)
  }

  // §9 Your business
  {
    const lines: Line[] = []
    const self = start?.selfEmployed === 'me' || start?.selfEmployed === 'both' || by('selfEmployment').length > 0
    if (self) {
      if (profile?.businessName) lines.push(declared('business-name', copy.lines.businessName, profile.businessName))
      if (profile?.businessStructure) lines.push(declared('business-structure', copy.lines.businessStructure, copy.lines.businessStructureValues[profile.businessStructure]))
      if (profile?.payMethod) lines.push(declared('business-pay', copy.lines.businessPay, copy.lines.businessPayValues[profile.payMethod]))
      lines.push(declared('business-value', copy.lines.businessValue, null))
      if (profile?.businessStructure === 'ltd') lines.push(declared('business-directors-loan', copy.lines.directorsLoan, null))
    }
    add('business', lines, start ? copy.lines.businessNone : null)
  }

  // §10 Your needs
  {
    if (fidelity === 'sketch') add('needs', [], copy.lines.needsLocked)
    else add('needs', [line({ id: 'needs-now', label: copy.lines.needsNow, value: outgoings, period: 'month', evidence: 'proved', trust: 'bank-evidenced', confidence: 'known', note: copy.lines.needsBody })])
  }

  // Snapshot: only known values count; the rest are named, not guessed.
  const assetLines = sections.filter(s => ASSET_SECTIONS.includes(s.key)).flatMap(s => s.lines).filter(l => l.period === null && !l.id.startsWith('pensions-declared'))
  const debtLines = sections.find(s => s.key === 'debts')!.lines.filter(l => l.period === null)
  const knownAssets = assetLines.filter(l => l.value !== null)
  const knownDebts = debtLines.filter(l => l.value !== null)
  const assets = knownAssets.length ? knownAssets.reduce((s, l) => s + (l.value ?? 0), 0) : null
  const debts = knownDebts.length ? knownDebts.reduce((s, l) => s + (l.value ?? 0), 0) : null
  const homeBalanceLines = sections.find(s => s.key === 'home')!.lines.filter(l => l.id === 'home-mortgage-balance')
  const withoutValue = [...assetLines, ...debtLines, ...homeBalanceLines].filter(l => l.value === null && l.text === null).length
  const snapshot: Snapshot = {
    assets,
    debts,
    netWorth: assets === null && debts === null ? null : (assets ?? 0) - (debts ?? 0),
    income,
    outgoings,
    monthlyGap: income - outgoings,
    withoutValue,
  }

  // History: every confirmation is a timestamped, per-section change.
  const changes: Change[] = []
  if (bank) changes.push({ at: bank.source.connectedAt, section: 'savings', text: fill(copy.history.bankConnected, { provider: bank.label }) })
  for (const [id, a] of Object.entries(c)) {
    const f = findings.find(x => x.id === id)
    if (f) {
      const subject = f.line ?? f.payee ?? f.question
      const text = a.value === CONFIRMED ? fill(copy.history.confirmed, { line: subject })
        : a.value === SKIPPED ? fill(copy.history.skipped, { line: subject })
          : a.value === NOT_MINE ? fill(copy.history.removed, { line: subject })
            : fill(copy.history.answered, { line: `${subject}: ${labelFor(f, a.value) ?? a.value}` })
      changes.push({ at: a.at, section: f.section, text })
      continue
    }
    const g = gaps.find(x => x.id === id)
    if (g && a.value === REQUESTED) changes.push({ at: a.at, section: g.section, text: fill(copy.history.requested, { what: g.what, from: g.from }) })
  }
  changes.sort((a, b) => a.at.localeCompare(b.at))
  for (const s of sections) s.history = changes.filter(ch => ch.section === s.key)

  const attention: Attention[] = [
    ...gaps.map(g => ({ id: g.id, kind: 'gap' as const, section: g.section, label: g.what, detail: g.from })),
    ...findings.filter(f => c[f.id]?.value === SKIPPED).map(f => ({ id: f.id, kind: 'unconfirmed' as const, section: f.section, label: f.line ?? f.question, detail: copy.attention.unconfirmed })),
  ]

  const sources: Picture['sources'] = []
  for (const account of bank?.accounts ?? []) {
    const e = account.extraction
    sources.push({
      label: e.account_number_last4 ? fill(copy.sources.bank, { provider: e.provider, last4: e.account_number_last4 }) : fill(copy.sources.bankNoLast4, { provider: e.provider }),
      detail: fill(copy.sources.months, { n: bank!.months, t: account.transactions.length }),
    })
  }
  if (bank?.source.kind === 'scenario') sources.push({ label: copy.sources.scenario, detail: bank.source.id })
  sources.push({ label: copy.sources.profile, detail: '' })

  const stamps = [bank?.source.connectedAt ?? null, ...Object.values(c).map(a => a.at)].filter((x): x is string => !!x).sort()
  const firstGap = gaps[0]

  return {
    sections,
    snapshot,
    sources,
    attention,
    fidelity,
    readiness: copy.readiness[READINESS[fidelity]],
    updatedAt: stamps[stamps.length - 1] ?? null,
    changes,
    nextStep: firstGap ? copy.nextStep[firstGap.kind] : copy.nextStep.none,
  }
}

function slugOf(f: Finding): string {
  return (f.payee ?? f.id).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function slugText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function namesSame(a: string, b: string): boolean {
  const key = a.toLowerCase().split(/\s+/).filter(w => w.length > 2)[0]
  return !!key && b.toLowerCase().includes(key)
}
