import { describe, expect, it } from 'vitest'
import { applicableSteps, EMPTY_PROFILE, firstUnanswered, isProfileAnswers, isProfileComplete, nextProfileRoute, parseProfileStep, previousProfileRoute, stepPosition } from '@/lib/build/profile'
import { EMPTY_ANSWERS, type StartAnswers } from '@/lib/start/answers'

const sarah: StartAnswers = { ...EMPTY_ANSWERS, stage: 'decided', relationship: 'married', living: 'yes', children: 2, home: 'mortgage', quality: 'amicable', devicePrivate: true, selfEmployed: 'no', awareness: 'some' }
const marcus: StartAnswers = { ...sarah, children: 0, home: 'rent', selfEmployed: 'me' }

function form(entries: Record<string, string | string[]>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) for (const x of Array.isArray(v) ? v : [v]) f.append(k, x)
  return f
}

describe('profile gates', () => {
  it('the interview decides which screens exist', () => {
    expect(applicableSteps(sarah)).toEqual(['home', 'vehicles', 'pensions', 'children', 'other-assets', 'accounts'])
    expect(applicableSteps(marcus)).toEqual(['home', 'work', 'vehicles', 'pensions', 'other-assets', 'accounts'])
    expect(applicableSteps({ ...sarah, home: 'outright' })).not.toContain('home')
    expect(applicableSteps(null)).toEqual(['vehicles', 'pensions', 'other-assets', 'accounts'])
  })

  it('routes step to step and ends at connect', () => {
    expect(nextProfileRoute('home', sarah)).toBe('/build/profile/vehicles')
    expect(nextProfileRoute('home', marcus)).toBe('/build/profile/work')
    expect(nextProfileRoute('accounts', sarah)).toBe('/build/connect')
    expect(previousProfileRoute('home', sarah)).toBe('/build')
    expect(previousProfileRoute('children', sarah)).toBe('/build/profile/pensions')
    expect(stepPosition('pensions', sarah)).toEqual({ n: 3, total: 6 })
  })
})

describe('parseProfileStep', () => {
  it('P1 asks the lender only for a mortgage, the landlord facts only for rent', () => {
    expect(parseProfileStep('home', form({ lender: 'Halifax' }), sarah)).toEqual({ ok: true, patch: { lender: 'Halifax' } })
    expect(parseProfileStep('home', form({ lender: 'Not a lender' }), sarah)).toEqual({ ok: false, errors: { lender: 'chooseOne' } })
    expect(parseProfileStep('home', form({ rentTo: 'agent', rentAmount: '£1,650', rentDay: '1' }), marcus)).toEqual({ ok: true, patch: { rentTo: 'agent', rentAmount: 1650, rentDay: 1 } })
    expect(parseProfileStep('home', form({ rentTo: 'agent', rentAmount: '0', rentDay: '40' }), marcus)).toEqual({ ok: false, errors: { rentAmount: 'enterAmount', rentDay: 'enterDay' } })
  })

  it('P3 drops finance answers when there is no vehicle', () => {
    expect(parseProfileStep('vehicles', form({ vehicles: 'none', vehicleFinance: 'yes', financeProvider: 'Black Horse' }), sarah)).toEqual({ ok: true, patch: { vehicles: 'none', vehicleFinance: null, financeProvider: null } })
    expect(parseProfileStep('vehicles', form({ vehicles: 'one', vehicleFinance: 'yes', financeProvider: 'Black Horse' }), sarah)).toEqual({ ok: true, patch: { vehicles: 'one', vehicleFinance: true, financeProvider: 'Black Horse' } })
    expect(parseProfileStep('vehicles', form({ vehicles: 'one' }), sarah)).toEqual({ ok: false, errors: { vehicleFinance: 'chooseOne' } })
  })

  it('P4 starts the pension clock and keeps the DB proxy in plain words', () => {
    const now = () => new Date('2026-09-11T10:00:00.000Z')
    const r = parseProfileStep('pensions', form({ pensions: 'one', pensionProvider: 'Aviva', pensionKind: 'none' }), sarah, now)
    expect(r).toEqual({ ok: true, patch: { pensions: 'one', pensionsAnsweredAt: '2026-09-11T10:00:00.000Z', pensionProvider: 'Aviva', pensionKind: 'none' } })
    expect(parseProfileStep('pensions', form({ pensions: 'no', pensionProvider: 'x' }), sarah, now)).toEqual({ ok: true, patch: { pensions: 'no', pensionsAnsweredAt: '2026-09-11T10:00:00.000Z', pensionProvider: null, pensionKind: null } })
    expect(parseProfileStep('pensions', form({ pensions: 'more' }), sarah, now).ok).toBe(false)
  })

  it('P5 confirms the count or takes a new one', () => {
    expect(parseProfileStep('children', form({ children: 'yes' }), sarah)).toEqual({ ok: true, patch: { children: 2 } })
    expect(parseProfileStep('children', form({ children: 'no', childrenCount: '4+' }), sarah)).toEqual({ ok: true, patch: { children: 4 } })
    expect(parseProfileStep('children', form({ children: 'no' }), sarah)).toEqual({ ok: false, errors: { childrenCount: 'chooseOne' } })
  })

  it('P6 makes "none" exclusive and requires a tick', () => {
    expect(parseProfileStep('other-assets', form({ otherAssets: ['savings', 'none'] }), sarah)).toEqual({ ok: true, patch: { otherAssets: ['savings'] } })
    expect(parseProfileStep('other-assets', form({}), sarah)).toEqual({ ok: false, errors: { otherAssets: 'chooseOne' } })
  })

  it('completion follows the applicable steps', () => {
    const p = { ...EMPTY_PROFILE, lender: 'Halifax', vehicles: 'one' as const, vehicleFinance: false, pensions: 'one' as const, pensionKind: 'none' as const, children: 2, otherAssets: ['savings' as const], accountsNoted: true }
    expect(isProfileComplete(p, sarah)).toBe(true)
    expect(isProfileComplete({ ...p, accountsNoted: false }, sarah)).toBe(false)
    expect(firstUnanswered({ ...p, pensions: null }, sarah)).toBe('pensions')
    expect(firstUnanswered(null, sarah)).toBe('home')
    expect(isProfileAnswers(p)).toBe(true)
    expect(isProfileAnswers({ ...p, vehicles: 'bus' })).toBe(false)
  })
})
