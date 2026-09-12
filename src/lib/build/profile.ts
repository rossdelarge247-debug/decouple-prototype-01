import { profile as copy } from '@/copy/build'
import type { StartAnswers } from '@/lib/start/answers'

// The pre-bank profile: seven screens, each gated by the interview, each answer gating
// what the bank confirmation may ask. Names and ages of children wait for the bank.
export type ProfileStep = 'home' | 'work' | 'vehicles' | 'pensions' | 'children' | 'other-assets' | 'accounts'
export const PROFILE_STEPS: readonly ProfileStep[] = ['home', 'work', 'vehicles', 'pensions', 'children', 'other-assets', 'accounts']

export type RentTo = 'landlord' | 'agent'
export type BusinessStructure = 'sole' | 'ltd' | 'partnership' | 'other'
export type PayMethod = 'paye' | 'dividends' | 'both' | 'drawings' | 'notSure'
export type IncomeChannel = 'clients' | 'rental' | 'other' | 'none'
export type Vehicles = 'none' | 'one' | 'more'
export type Pensions = 'one' | 'more' | 'drawing' | 'notSure' | 'no'
export type PensionKind = 'publicSector' | 'largeCompany' | 'none'
export type OtherAsset = 'savings' | 'investments' | 'crypto' | 'lifeInsurance' | 'valuables' | 'owed' | 'none'

export interface ProfileAnswers {
  lender: string | null
  rentTo: RentTo | null
  rentAmount: number | null
  rentDay: number | null
  businessName: string | null
  businessStructure: BusinessStructure | null
  payMethod: PayMethod | null
  incomeChannels: IncomeChannel[]
  vehicles: Vehicles | null
  vehicleFinance: boolean | null
  financeProvider: string | null
  pensions: Pensions | null
  pensionProvider: string | null
  pensionKind: PensionKind | null
  /** Confirmed count of children under 18; 4 means four or more. */
  children: number | null
  otherAssets: OtherAsset[]
  accountsNoted: boolean
  /** When the pension screen was answered: the CETV clock starts here. */
  pensionsAnsweredAt: string | null
}

export const EMPTY_PROFILE: ProfileAnswers = {
  lender: null,
  rentTo: null,
  rentAmount: null,
  rentDay: null,
  businessName: null,
  businessStructure: null,
  payMethod: null,
  incomeChannels: [],
  vehicles: null,
  vehicleFinance: null,
  financeProvider: null,
  pensions: null,
  pensionProvider: null,
  pensionKind: null,
  children: null,
  otherAssets: [],
  accountsNoted: false,
  pensionsAnsweredAt: null,
}

export const RENT_TO: readonly RentTo[] = ['landlord', 'agent']
export const STRUCTURES: readonly BusinessStructure[] = ['sole', 'ltd', 'partnership', 'other']
export const PAY_METHODS: readonly PayMethod[] = ['paye', 'dividends', 'both', 'drawings', 'notSure']
export const CHANNELS: readonly IncomeChannel[] = ['clients', 'rental', 'other', 'none']
export const VEHICLES: readonly Vehicles[] = ['none', 'one', 'more']
export const PENSIONS: readonly Pensions[] = ['one', 'more', 'drawing', 'notSure', 'no']
export const PENSION_KINDS: readonly PensionKind[] = ['publicSector', 'largeCompany', 'none']
export const OTHER_ASSETS: readonly OtherAsset[] = ['savings', 'investments', 'crypto', 'lifeInsurance', 'valuables', 'owed', 'none']
export const LENDERS: readonly string[] = [...copy.home.lenders, copy.home.otherLender]
export const FINANCE_PROVIDERS: readonly string[] = [...copy.vehicles.providers, copy.vehicles.otherProvider]

function isOneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (list as readonly string[]).includes(v)
}
const nullable = (list: readonly string[], v: unknown) => v === null || isOneOf(list, v)
const nullableString = (v: unknown) => v === null || typeof v === 'string'
const nullableNumber = (v: unknown) => v === null || typeof v === 'number'

export function isProfileAnswers(x: unknown): x is ProfileAnswers {
  if (!x || typeof x !== 'object') return false
  const a = x as Record<string, unknown>
  return (
    nullableString(a.lender) &&
    nullable(RENT_TO, a.rentTo) &&
    nullableNumber(a.rentAmount) &&
    nullableNumber(a.rentDay) &&
    nullableString(a.businessName) &&
    nullable(STRUCTURES, a.businessStructure) &&
    nullable(PAY_METHODS, a.payMethod) &&
    Array.isArray(a.incomeChannels) && a.incomeChannels.every(c => isOneOf(CHANNELS, c)) &&
    nullable(VEHICLES, a.vehicles) &&
    (a.vehicleFinance === null || typeof a.vehicleFinance === 'boolean') &&
    nullableString(a.financeProvider) &&
    nullable(PENSIONS, a.pensions) &&
    nullableString(a.pensionProvider) &&
    nullable(PENSION_KINDS, a.pensionKind) &&
    nullableNumber(a.children) &&
    Array.isArray(a.otherAssets) && a.otherAssets.every(o => isOneOf(OTHER_ASSETS, o)) &&
    typeof a.accountsNoted === 'boolean' &&
    nullableString(a.pensionsAnsweredAt)
  )
}

/** The interview gates the screens: no mortgage, no lender question; not self-employed, no business screen. */
export function stepApplies(step: ProfileStep, start: StartAnswers | null): boolean {
  switch (step) {
    case 'home': return start?.home === 'mortgage' || start?.home === 'rent'
    case 'work': return start?.selfEmployed === 'me' || start?.selfEmployed === 'both'
    case 'children': return (start?.children ?? 0) > 0
    default: return true
  }
}

export function applicableSteps(start: StartAnswers | null): ProfileStep[] {
  return PROFILE_STEPS.filter(s => stepApplies(s, start))
}

export function isStepAnswered(step: ProfileStep, p: ProfileAnswers, start: StartAnswers | null): boolean {
  switch (step) {
    case 'home':
      if (start?.home === 'mortgage') return p.lender !== null
      if (start?.home === 'rent') return p.rentTo !== null && p.rentAmount !== null
      return true
    case 'work': return p.businessStructure !== null && p.payMethod !== null
    case 'vehicles': return p.vehicles !== null
    case 'pensions': return p.pensions !== null
    case 'children': return p.children !== null
    case 'other-assets': return p.otherAssets.length > 0
    case 'accounts': return p.accountsNoted
  }
}

export function isProfileComplete(p: ProfileAnswers | null, start: StartAnswers | null): boolean {
  return p !== null && applicableSteps(start).every(s => isStepAnswered(s, p, start))
}

/** The first applicable screen not yet answered, or null when the profile is complete. */
export function firstUnanswered(p: ProfileAnswers | null, start: StartAnswers | null): ProfileStep | null {
  return applicableSteps(start).find(s => !p || !isStepAnswered(s, p, start)) ?? null
}

export function profileRoute(step: ProfileStep): string {
  return `/build/profile/${step}`
}

export const CONNECT_ROUTE = '/build/connect'

export function nextProfileRoute(step: ProfileStep, start: StartAnswers | null): string {
  const steps = applicableSteps(start)
  const i = steps.indexOf(step)
  const next = steps[i + 1]
  return next ? profileRoute(next) : CONNECT_ROUTE
}

export function previousProfileRoute(step: ProfileStep, start: StartAnswers | null): string {
  const steps = applicableSteps(start)
  const i = steps.indexOf(step)
  return i > 0 ? profileRoute(steps[i - 1]) : '/build'
}

export function stepPosition(step: ProfileStep, start: StartAnswers | null): { n: number; total: number } {
  const steps = applicableSteps(start)
  return { n: steps.indexOf(step) + 1, total: steps.length }
}

export function isProfileStep(x: unknown): x is ProfileStep {
  return isOneOf(PROFILE_STEPS, x)
}

export type ProfileStepResult =
  | { ok: true; patch: Partial<ProfileAnswers> }
  | { ok: false; errors: Record<string, string> }

/** Validate one screen's form post. Error codes are keyed so the screen can place them. */
export function parseProfileStep(step: ProfileStep, form: FormData, start: StartAnswers | null, now: () => Date = () => new Date()): ProfileStepResult {
  const one = (name: string) => {
    const v = form.get(name)
    return typeof v === 'string' ? v.trim() : null
  }
  const many = (name: string) => form.getAll(name).filter((v): v is string => typeof v === 'string')
  const errors: Record<string, string> = {}
  const patch: Partial<ProfileAnswers> = {}

  switch (step) {
    case 'home': {
      if (start?.home === 'mortgage') {
        const lender = one('lender')
        if (isOneOf(LENDERS, lender)) patch.lender = lender
        else errors.lender = 'chooseOne'
      } else if (start?.home === 'rent') {
        const to = one('rentTo')
        if (isOneOf(RENT_TO, to)) patch.rentTo = to
        else errors.rentTo = 'chooseOne'
        const amount = Number((one('rentAmount') ?? '').replace(/[£,\s]/g, ''))
        if (amount > 0 && Number.isFinite(amount)) patch.rentAmount = Math.round(amount)
        else errors.rentAmount = 'enterAmount'
        const day = Number(one('rentDay') ?? '')
        if (Number.isInteger(day) && day >= 1 && day <= 31) patch.rentDay = day
        else errors.rentDay = 'enterDay'
      }
      break
    }
    case 'work': {
      patch.businessName = one('businessName') || null
      const s = one('businessStructure')
      if (isOneOf(STRUCTURES, s)) patch.businessStructure = s
      else errors.businessStructure = 'chooseOne'
      const pay = one('payMethod')
      if (isOneOf(PAY_METHODS, pay)) patch.payMethod = pay
      else errors.payMethod = 'chooseOne'
      patch.incomeChannels = many('incomeChannels').filter((c): c is IncomeChannel => isOneOf(CHANNELS, c))
      break
    }
    case 'vehicles': {
      const v = one('vehicles')
      if (!isOneOf(VEHICLES, v)) {
        errors.vehicles = 'chooseOne'
        break
      }
      patch.vehicles = v
      if (v === 'none') {
        patch.vehicleFinance = null
        patch.financeProvider = null
        break
      }
      const f = one('vehicleFinance')
      if (f === 'yes') {
        patch.vehicleFinance = true
        const provider = one('financeProvider')
        patch.financeProvider = isOneOf(FINANCE_PROVIDERS, provider) ? provider : null
      } else if (f === 'no') {
        patch.vehicleFinance = false
        patch.financeProvider = null
      } else errors.vehicleFinance = 'chooseOne'
      break
    }
    case 'pensions': {
      const p = one('pensions')
      if (!isOneOf(PENSIONS, p)) {
        errors.pensions = 'chooseOne'
        break
      }
      patch.pensions = p
      patch.pensionsAnsweredAt = now().toISOString()
      if (p === 'no') {
        patch.pensionProvider = null
        patch.pensionKind = null
        break
      }
      patch.pensionProvider = one('pensionProvider') || null
      const kind = one('pensionKind')
      if (isOneOf(PENSION_KINDS, kind)) patch.pensionKind = kind
      else errors.pensionKind = 'chooseOne'
      break
    }
    case 'children': {
      const c = one('children')
      if (c === 'yes') patch.children = start?.children ?? null
      else if (c === 'no') {
        const n = one('childrenCount')
        if (n && ['1', '2', '3', '4+'].includes(n)) patch.children = n === '4+' ? 4 : Number(n)
        else errors.childrenCount = 'chooseOne'
      } else errors.children = 'chooseOne'
      break
    }
    case 'other-assets': {
      let picks = many('otherAssets').filter((o): o is OtherAsset => isOneOf(OTHER_ASSETS, o))
      if (picks.length > 1) picks = picks.filter(o => o !== 'none')
      if (picks.length === 0) errors.otherAssets = 'chooseOne'
      else patch.otherAssets = picks
      break
    }
    case 'accounts':
      patch.accountsNoted = true
      break
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, patch }
}
