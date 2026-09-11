import { describe, expect, it } from 'vitest'
import { generateSectionSteps, type ConfirmationSectionKey } from '@/lib/bank/confirmation-questions'
import { getTestScenarioById } from '@/lib/bank/test-scenarios'
import { resolveBank, scenarioAccount } from '@/lib/build/bank'
import { answer, confirmTier1, GENERATOR_STEP, isConfirmDone, namesPayee, nextConfirmRoute, planConfirmation, SKIPPED, TIER1_THRESHOLD } from '@/lib/build/confirm'
import { EMPTY_PROFILE, type ProfileAnswers } from '@/lib/build/profile'
import { EMPTY_ANSWERS, type StartAnswers } from '@/lib/start/answers'

const start: StartAnswers = { ...EMPTY_ANSWERS, stage: 'decided', relationship: 'married', living: 'yes', children: 2, home: 'mortgage', quality: 'amicable', devicePrivate: true, selfEmployed: 'no', awareness: 'some' }
const profile: ProfileAnswers = { ...EMPTY_PROFILE, lender: 'Halifax', vehicles: 'one', vehicleFinance: false, pensions: 'one', pensionProvider: 'Aviva', pensionKind: 'none', children: 2, otherAssets: ['savings'], accountsNoted: true, pensionsAnsweredAt: '2026-09-11T00:00:00.000Z' }
const sarah = () => resolveBank({ kind: 'scenario', id: 'sarah-employed-homeowner', connectedAt: '2026-09-11T00:00:00.000Z' })!

describe('the scenarios are deterministic', () => {
  it('renders the same extraction twice', () => {
    const a = scenarioAccount(getTestScenarioById('sarah-employed-homeowner')!)
    const b = scenarioAccount(getTestScenarioById('sarah-employed-homeowner')!)
    expect(a).toEqual(b)
    expect(a.extraction.provider).toBe('Barclays')
    expect(a.extraction.account_number_last4).toMatch(/^\d{4}$/)
  })
})

describe('signals become findings', () => {
  it('Sarah: five taken as read, one quick check, five gaps, within the tap budget', () => {
    const plan = planConfirmation(sarah(), profile, start)
    expect(plan.tier1.map(f => f.id)).toEqual(['salary-acme-corporation', 'child-benefit-hmrc-child-benefit', 'mortgage-halifax', 'council-tax-exeter-city-council', 'pension-aviva'])
    expect(plan.questions.map(f => [f.id, f.tier])).toEqual([['investment-hl-savings', 2]])
    expect(plan.gaps.map(g => g.kind)).toEqual(['cetv', 'valuation', 'mortgageStatement', 'payslips', 'accountStatement'])
    expect(plan.flags).toEqual([])
    const taps = 1 + plan.questions.length + 1
    expect(taps).toBeLessThanOrEqual(5)
  })

  it('reads the lines as a person would', () => {
    const plan = planConfirmation(sarah(), profile, start)
    const salary = plan.tier1[0]
    expect(salary.line).toBe('Salary: £3,218 a month from Acme Corporation')
    expect(salary.evidence).toBe('12 credits, 0% variation')
    expect(salary.formEField).toBe('2.15')
    expect(salary.source).toEqual({ provider: 'Barclays', last4: expect.stringMatching(/^\d{4}$/) })
    const cb = plan.tier1[1]
    expect(cb.note).toBe('Matches the 2 children you told us about')
    const mortgage = plan.tier1[2]
    expect(mortgage.note).toBe('Matches the lender you named')
    expect(plan.gaps[0].from).toBe('Aviva')
    expect(plan.gaps[2].from).toBe('Halifax')
    expect(plan.gaps[3].from).toBe('Acme Corporation')
  })

  it('the profile gates the questions', () => {
    // Provider known: Aviva is disambiguated, not asked. Unknown: one tap with a hint.
    const withoutProvider = planConfirmation(sarah(), { ...profile, pensionProvider: null }, start)
    const aviva = withoutProvider.questions.find(f => f.id === 'pension-aviva')!
    expect(aviva.tier).toBe(2)
    expect(aviva.question).toBe('£200 a month to Aviva. Pension or insurance?')
    expect(aviva.hint).toBeNull()
    const other = planConfirmation(sarah(), { ...profile, pensionProvider: 'Scottish Widows' }, start)
    expect(other.questions.find(f => f.id === 'pension-aviva')!.hint).toBe('You told us your pension is with Scottish Widows.')
    // A workplace pension the profile named is expected to be invisible: never a gap question.
    const david = planConfirmation(resolveBank({ kind: 'scenario', id: 'david-high-earner-investments', connectedAt: 'x' })!, profile, start)
    expect(david.findings.some(f => f.kind === 'noPension')).toBe(false)
    expect(david.flags).toEqual(['flag.gambling'])
    expect(david.questions.some(f => f.kind === 'loan')).toBe(true)
    // No vehicle: a large payment is never assumed to be a car.
    const noCar = planConfirmation(resolveBank({ kind: 'scenario', id: 'david-high-earner-investments', connectedAt: 'x' })!, { ...profile, vehicles: 'none' }, start)
    expect(noCar.questions.find(f => f.kind === 'loan')!.options.map(o => o.value)).not.toContain('carFinance')
    // Finance provider named: the loan is taken as read.
    const bmw = planConfirmation(resolveBank({ kind: 'scenario', id: 'david-high-earner-investments', connectedAt: 'x' })!, { ...profile, vehicleFinance: true, financeProvider: 'BMW Financial Services' }, start)
    expect(bmw.tier1.some(f => f.kind === 'loan' && f.note === 'Matches the finance provider you named')).toBe(true)
  })

  it('without a profile the absence signals are genuine questions', () => {
    const plan = planConfirmation(resolveBank({ kind: 'scenario', id: 'david-high-earner-investments', connectedAt: 'x' })!, null, null)
    const noPension = plan.questions.find(f => f.kind === 'noPension')!
    expect(noPension.tier).toBe(3)
    expect(noPension.line).toBeNull()
  })

  it('a retired user is never told they have no pension', () => {
    const jean = planConfirmation(resolveBank({ kind: 'scenario', id: 'jean-retired-outright', connectedAt: 'x' })!, { ...profile, pensions: 'drawing' }, { ...start, home: 'outright' })
    expect(jean.findings.some(f => f.kind === 'noPension')).toBe(false)
    expect(jean.questions.map(f => f.kind)).toEqual(['dwp', 'investment'])
  })

  it('honours the spec threshold', () => {
    expect(TIER1_THRESHOLD).toBe(0.9)
  })
})

describe('the generator contract', () => {
  it('every mapped step exists in the inherited generator for the scenario that fires its rule', () => {
    const cases: Array<[string, ConfirmationSectionKey, string]> = [
      ['sarah-employed-homeowner', 'income', 'income-salary'],
      ['sarah-employed-homeowner', 'property', 'property-mortgage'],
      ['sarah-employed-homeowner', 'pensions', 'pensions-detected'],
      ['sarah-employed-homeowner', 'income', 'income-hmrc-confirmed'],
      ['jean-retired-outright', 'income', 'income-dwp-type'],
      ['jean-retired-outright', 'pensions', 'pensions-no-signal'],
      ['aisha-part-time-benefits', 'debts', 'debts-cc-0-confirm'],
      ['aisha-part-time-benefits', 'debts', 'debts-bnpl'],
      ['david-high-earner-investments', 'debts', 'debts-loan-0'],
    ]
    for (const [id, section, step] of cases) {
      const account = scenarioAccount(getTestScenarioById(id)!)
      const ids = generateSectionSteps(section, [account.extraction]).map(s => s.id)
      expect(ids, `${id} ${section}`).toContain(step)
      expect(Object.values(GENERATOR_STEP)).toContain(step)
    }
  })
})

describe('progress', () => {
  it('walks batch, question, gaps, picture, and is idempotent', () => {
    const plan = planConfirmation(sarah(), profile, start)
    let c = {}
    expect(nextConfirmRoute(plan, c)).toBe('/build/confirm')
    c = confirmTier1(plan, c, '2026-09-11T10:00:00.000Z')
    expect(nextConfirmRoute(plan, c)).toBe('/build/confirm/investment-hl-savings')
    c = answer(c, 'investment-hl-savings', SKIPPED, '2026-09-11T10:01:00.000Z')
    expect(nextConfirmRoute(plan, c)).toBe('/build/confirm/gaps')
    for (const g of plan.gaps) c = answer(c, g.id, 'noted', '2026-09-11T10:02:00.000Z')
    expect(isConfirmDone(plan, c)).toBe(true)
    const again = confirmTier1(plan, c, '2026-09-11T11:00:00.000Z')
    expect(again).toEqual(c)
  })

  it('matches a named provider to a bank payee', () => {
    expect(namesPayee('Halifax', 'DD HALIFAX MORTGAGE 87234561')).toBe(true)
    expect(namesPayee('Coventry Building Society', 'DD COVENTRY BS')).toBe(true)
    expect(namesPayee('Nationwide', 'DD HALIFAX MORTGAGE')).toBe(false)
    expect(namesPayee(null, 'anything')).toBe(false)
  })
})
