import { describe, expect, it } from 'vitest'
import { resolveBank } from '@/lib/build/bank'
import { answer, confirmTier1, planConfirmation, REQUESTED, SKIPPED } from '@/lib/build/confirm'
import { displayPayee, pounds, toMonthly } from '@/lib/build/money'
import { buildPicture, TRUST_LEVELS } from '@/lib/build/picture'
import { EMPTY_PROFILE, type ProfileAnswers } from '@/lib/build/profile'
import { revealItems } from '@/lib/build/reveal'
import { EMPTY_ANSWERS, type StartAnswers } from '@/lib/start/answers'

const start: StartAnswers = { ...EMPTY_ANSWERS, stage: 'decided', relationship: 'married', living: 'yes', children: 2, home: 'mortgage', quality: 'amicable', devicePrivate: true, selfEmployed: 'no', awareness: 'some' }
const profile: ProfileAnswers = { ...EMPTY_PROFILE, lender: 'Halifax', vehicles: 'one', vehicleFinance: false, pensions: 'one', pensionProvider: 'Aviva', pensionKind: 'none', children: 2, otherAssets: ['savings'], accountsNoted: true, pensionsAnsweredAt: '2026-09-11T00:00:00.000Z' }
const now = new Date('2026-09-11T12:00:00.000Z')

function sarahPicture(extra?: (c: Record<string, { value: string; at: string }>) => Record<string, { value: string; at: string }>) {
  const bank = resolveBank({ kind: 'scenario', id: 'sarah-employed-homeowner', connectedAt: '2026-09-11T09:00:00.000Z' })!
  const plan = planConfirmation(bank, profile, start)
  let c = confirmTier1(plan, {}, '2026-09-11T10:00:00.000Z')
  c = answer(c, 'investment-hl-savings', 'isa', '2026-09-11T10:01:00.000Z')
  if (extra) c = extra(c)
  return { bank, plan, picture: buildPicture({ bank, plan, confirmations: c, profile, start, now }) }
}

describe('Your Picture', () => {
  it('has ten §-numbered sections in the court’s order', () => {
    const { picture } = sarahPicture()
    expect(picture.sections.map(s => `§${s.number} ${s.key}`)).toEqual(['§1 children', '§2 home', '§3 property', '§4 pensions', '§5 savings', '§6 debts', '§7 income', '§8 spending', '§9 business', '§10 needs'])
    expect(picture.sections.find(s => s.key === 'income')!.formE).toBe('2.15 to 2.20')
  })

  it('every line is evidenced, entered or explicitly none', () => {
    const { picture } = sarahPicture()
    for (const s of picture.sections) {
      if (s.lines.length === 0) expect(s.noneText, s.key).toBeTruthy()
      for (const l of s.lines) expect(['proved', 'inferred', 'gap', 'invisible']).toContain(l.evidence)
    }
    const debts = picture.sections.find(s => s.key === 'debts')!
    expect(debts.state).toBe('none')
    expect(debts.noneText).toMatch(/none/i)
    const business = picture.sections.find(s => s.key === 'business')!
    expect(business.state).toBe('none')
  })

  it('evidence states and trust badges follow the source', () => {
    const { picture } = sarahPicture()
    const income = picture.sections.find(s => s.key === 'income')!
    const salary = income.lines[0]
    expect(salary.label).toBe('Salary: Acme Corporation')
    expect(salary.value).toBe(3218)
    expect(salary.evidence).toBe('proved')
    expect(salary.trust).toBe('bank-evidenced')
    expect(salary.source).toMatch(/^Barclays ending \d{4}$/)
    const home = picture.sections.find(s => s.key === 'home')!
    expect(home.lines.map(l => [l.label, l.evidence])).toEqual([
      ['How you hold your home', 'invisible'],
      ['Value of your home', 'gap'],
      ['Mortgage payment', 'proved'],
      ['Mortgage balance', 'gap'],
    ])
    expect(home.lines[0].trust).toBe('self-declared')
    const savings = picture.sections.find(s => s.key === 'savings')!
    const hl = savings.lines.find(l => l.findingId === 'investment-hl-savings')!
    expect(hl.evidence).toBe('inferred')
    expect(hl.note).toBe('An ISA')
    const children = picture.sections.find(s => s.key === 'children')!
    expect(children.lines[0].text).toBe('2')
    expect(children.lines[0].note).toBe('Matches the 2 children you told us about')
    expect(TRUST_LEVELS).toHaveLength(6)
  })

  it('computes the monthly gap and never a split', () => {
    const { picture } = sarahPicture()
    const { snapshot } = picture
    expect(snapshot.income).toBe(3218 + 173)
    expect(snapshot.outgoings).toBeGreaterThan(2500)
    expect(snapshot.monthlyGap).toBe(snapshot.income - snapshot.outgoings)
    expect(snapshot.assets).toBe(4334)
    expect(snapshot.debts).toBeNull()
    expect(snapshot.netWorth).toBe(4334)
    expect(snapshot.withoutValue).toBeGreaterThan(0)
    expect(JSON.stringify(picture)).not.toMatch(/split|%|percent/i)
    expect(picture.fidelity).toBe('draft')
    expect(picture.readiness).toBe('Ready for a first conversation')
  })

  it('logs every change per section and lists what needs attention', () => {
    const { picture } = sarahPicture(c => answer(answer(c, 'gap-cetv', REQUESTED, '2026-09-11T10:02:00.000Z'), 'investment-hl-savings', SKIPPED, '2026-09-11T10:03:00.000Z'))
    const pensions = picture.sections.find(s => s.key === 'pensions')!
    expect(pensions.history.map(h => h.text)).toEqual(['Confirmed: Pension contributions: £200 a month to Aviva', 'Requested: A cash equivalent transfer value letter from Aviva'])
    expect(pensions.lines.find(l => l.id === 'pensions-cetv')!.note).toBe('Requested today. Allow 6 to 12 weeks.')
    const savings = picture.sections.find(s => s.key === 'savings')!
    expect(savings.toConfirm).toBe(1)
    expect(picture.attention.map(a => a.kind)).toEqual(['gap', 'gap', 'gap', 'gap', 'gap', 'unconfirmed'])
    expect(picture.nextStep).toBe('Ask for your CETV')
    expect(picture.updatedAt).toBe('2026-09-11T10:03:00.000Z')
  })

  it('stands at sketch from the profile alone', () => {
    const picture = buildPicture({ bank: null, plan: null, confirmations: {}, profile, start, now })
    expect(picture.fidelity).toBe('sketch')
    expect(picture.sections.find(s => s.key === 'needs')!.state).toBe('none')
    expect(picture.snapshot.income).toBe(0)
  })

  it('the reveal lists the findings then the bank-only spending, ending with the count', () => {
    const { bank, plan } = sarahPicture()
    const items = revealItems(bank, plan)
    expect(items.map(i => i.label)).toEqual(['Salary', 'Mortgage', 'Child Benefit', 'Council tax', 'Pension contributions', 'Investments', 'Insurance', 'Utilities', 'Childcare', 'Transactions read'])
    expect(items[2].detail).toBe('Matches the 2 children you told us about')
    expect(items[items.length - 1].value).toBe(bank.transactionCount)
  })
})

describe('money and names', () => {
  it('formats pounds with negatives in parentheses', () => {
    expect(pounds(3218)).toBe('£3,218')
    expect(pounds(-892)).toBe('(£892)')
    expect(toMonthly(300, 'quarterly')).toBe(100)
    expect(toMonthly(43.3, 'weekly')).toBe(188)
  })
  it('reads bank payees as names', () => {
    expect(displayPayee('DD HALIFAX MORTGAGE 87234561')).toBe('Halifax')
    expect(displayPayee('BGC ACME CORPORATION LTD SALARY')).toBe('Acme Corporation')
    expect(displayPayee('FPI HMRC CHILD BENEFIT')).toBe('HMRC Child Benefit')
    expect(displayPayee('DD EXETER CITY COUNCIL TAX')).toBe('Exeter City Council')
    expect(displayPayee('FPO HL SAVINGS')).toBe('HL Savings')
    expect(displayPayee('DD L&Q HOUSING TRUST')).toBe('L&Q Housing Trust')
  })
})
