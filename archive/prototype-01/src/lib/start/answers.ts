import { o6 } from '@/copy/start'

// The pre-sign-up state: eleven answers from the eight interview screens. The
// twelfth field in JOURNEY, the plan, is derived from these and never stored.
export type Stage = 'decided' | 'thinking' | 'process'
export type Relationship = 'married' | 'civil' | 'cohabiting' | 'other'
export type Living = 'yes' | 'no' | 'complicated'
export type Home = 'mortgage' | 'outright' | 'rent' | 'other'
export type Quality = 'amicable' | 'difficult' | 'highConflict' | 'safety'
export type SelfEmployed = 'no' | 'me' | 'ex' | 'both'
export type Awareness = 'good' | 'some' | 'little' | 'hiding'
export type Priority = keyof typeof o6.priorities.options
export type Worry = keyof typeof o6.worries.options

export interface StartAnswers {
  stage: Stage | null
  relationship: Relationship | null
  living: Living | null
  /** Children under 18: 0 for none, 4 for four or more. */
  children: number | null
  home: Home | null
  quality: Quality | null
  devicePrivate: boolean | null
  selfEmployed: SelfEmployed | null
  awareness: Awareness | null
  priorities: Priority[]
  worries: Worry[]
}

export const EMPTY_ANSWERS: StartAnswers = {
  stage: null,
  relationship: null,
  living: null,
  children: null,
  home: null,
  quality: null,
  devicePrivate: null,
  selfEmployed: null,
  awareness: null,
  priorities: [],
  worries: [],
}

export const STAGES: readonly Stage[] = ['decided', 'thinking', 'process']
export const RELATIONSHIPS: readonly Relationship[] = ['married', 'civil', 'cohabiting', 'other']
export const LIVINGS: readonly Living[] = ['yes', 'no', 'complicated']
export const HOMES: readonly Home[] = ['mortgage', 'outright', 'rent', 'other']
export const QUALITIES: readonly Quality[] = ['amicable', 'difficult', 'highConflict', 'safety']
export const SELF_EMPLOYED: readonly SelfEmployed[] = ['no', 'me', 'ex', 'both']
export const AWARENESS: readonly Awareness[] = ['good', 'some', 'little', 'hiding']
export const PRIORITIES = Object.keys(o6.priorities.options) as Priority[]
export const WORRIES = Object.keys(o6.worries.options) as Worry[]
export const MAX_PICKS = 3

export type StepKey = 'o1' | 'o2' | 'o3' | 'o4' | 'o5' | 'o6' | 'o7' | 'o8'

export const STEPS: ReadonlyArray<{ key: StepKey; slug: string }> = [
  { key: 'o1', slug: 'where-you-are' },
  { key: 'o2', slug: 'situation' },
  { key: 'o3', slug: 'between-you' },
  { key: 'o4', slug: 'work' },
  { key: 'o5', slug: 'what-you-know' },
  { key: 'o6', slug: 'priorities' },
  { key: 'o7', slug: 'plan' },
  { key: 'o8', slug: 'next' },
]

export const QUESTION_STEPS: readonly StepKey[] = ['o1', 'o2', 'o3', 'o4', 'o5', 'o6']

export function stepRoute(key: StepKey): string {
  return `/start/${STEPS.find(s => s.key === key)!.slug}`
}

export function stepNumber(key: StepKey): number {
  return STEPS.findIndex(s => s.key === key) + 1
}

export const NOT_FOR_YOU_ROUTE = '/start/not-for-you'

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

export function isStartAnswers(x: unknown): x is StartAnswers {
  if (!x || typeof x !== 'object') return false
  const a = x as Record<string, unknown>
  const nullable = (list: readonly string[], v: unknown) => v === null || isOneOf(list, v)
  return (
    nullable(STAGES, a.stage) &&
    nullable(RELATIONSHIPS, a.relationship) &&
    nullable(LIVINGS, a.living) &&
    (a.children === null || (typeof a.children === 'number' && a.children >= 0 && a.children <= 4)) &&
    nullable(HOMES, a.home) &&
    nullable(QUALITIES, a.quality) &&
    (a.devicePrivate === null || typeof a.devicePrivate === 'boolean') &&
    nullable(SELF_EMPLOYED, a.selfEmployed) &&
    nullable(AWARENESS, a.awareness) &&
    Array.isArray(a.priorities) && a.priorities.every(p => isOneOf(PRIORITIES, p)) &&
    Array.isArray(a.worries) && a.worries.every(w => isOneOf(WORRIES, w))
  )
}

export type StepResult =
  | { ok: true; patch: Partial<StartAnswers> }
  | { ok: false; errors: Record<string, string> }

/** Validate one screen's form post. Messages are keyed so the screen can place them. */
export function parseStep(step: StepKey, form: FormData): StepResult {
  const one = (name: string) => {
    const v = form.get(name)
    return typeof v === 'string' ? v : null
  }
  const many = (name: string) => form.getAll(name).filter((v): v is string => typeof v === 'string')
  const errors: Record<string, string> = {}
  const patch: Partial<StartAnswers> = {}

  switch (step) {
    case 'o1': {
      const v = one('stage')
      if (isOneOf(STAGES, v)) patch.stage = v
      else errors.stage = 'chooseOne'
      break
    }
    case 'o2': {
      const r = one('relationship')
      if (isOneOf(RELATIONSHIPS, r)) patch.relationship = r
      else errors.relationship = 'chooseOne'
      const l = one('living')
      if (isOneOf(LIVINGS, l)) patch.living = l
      else errors.living = 'chooseOne'
      const c = one('children')
      if (c === 'no') patch.children = 0
      else if (c === 'yes') {
        const n = one('childrenCount')
        if (n && ['1', '2', '3', '4+'].includes(n)) patch.children = n === '4+' ? 4 : Number(n)
        else errors.childrenCount = 'chooseOne'
      } else errors.children = 'chooseOne'
      const h = one('home')
      if (isOneOf(HOMES, h)) patch.home = h
      else errors.home = 'chooseOne'
      break
    }
    case 'o3': {
      const q = one('quality')
      if (isOneOf(QUALITIES, q)) patch.quality = q
      else errors.quality = 'chooseOne'
      const d = one('device')
      if (d === 'yes') patch.devicePrivate = true
      else if (d === 'notSure') patch.devicePrivate = false
      else errors.device = 'chooseOne'
      break
    }
    case 'o4': {
      const v = one('selfEmployed')
      if (isOneOf(SELF_EMPLOYED, v)) patch.selfEmployed = v
      else errors.selfEmployed = 'chooseOne'
      break
    }
    case 'o5': {
      const v = one('awareness')
      if (isOneOf(AWARENESS, v)) patch.awareness = v
      else errors.awareness = 'chooseOne'
      break
    }
    case 'o6': {
      const p = many('priorities').filter((v): v is Priority => isOneOf(PRIORITIES, v))
      const w = many('worries').filter((v): v is Worry => isOneOf(WORRIES, v))
      if (p.length > MAX_PICKS) errors.priorities = 'chooseUpToThree'
      if (w.length > MAX_PICKS) errors.worries = 'chooseUpToThree'
      patch.priorities = p.slice(0, MAX_PICKS)
      patch.worries = w.slice(0, MAX_PICKS)
      break
    }
    default:
      break
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, patch }
}

export function isAnswered(step: StepKey, a: StartAnswers): boolean {
  switch (step) {
    case 'o1': return a.stage !== null
    case 'o2': return a.relationship !== null && a.living !== null && a.children !== null && a.home !== null
    case 'o3': return a.quality !== null && a.devicePrivate !== null
    case 'o4': return a.selfEmployed !== null
    case 'o5': return a.awareness !== null
    case 'o6': return true
    default: return true
  }
}

export function isComplete(a: StartAnswers): boolean {
  return QUESTION_STEPS.every(s => isAnswered(s, a))
}

/** Where the Continue button goes. Cohabiting couples get the honest exit. */
export function nextRoute(step: StepKey, a: StartAnswers): string {
  if (step === 'o2' && a.relationship === 'cohabiting') return NOT_FOR_YOU_ROUTE
  const i = STEPS.findIndex(s => s.key === step)
  const next = STEPS[Math.min(i + 1, STEPS.length - 1)]
  return `/start/${next.slug}`
}

export function previousRoute(step: StepKey): string {
  const i = STEPS.findIndex(s => s.key === step)
  return i <= 0 ? '/' : `/start/${STEPS[i - 1].slug}`
}

export interface Flags {
  safety: boolean
  devicePrivate: boolean
  complexity: boolean
}

/** Flags are set silently and never leave the app. */
export function deriveFlags(a: StartAnswers): Flags {
  return {
    safety: a.quality === 'safety',
    devicePrivate: a.devicePrivate !== false,
    complexity: (a.selfEmployed !== null && a.selfEmployed !== 'no') || a.awareness === 'hiding',
  }
}

export function isFlagged(a: StartAnswers): boolean {
  const f = deriveFlags(a)
  return f.safety || !f.devicePrivate
}

/** 0 to 1, over the six question screens. */
export function progress(a: StartAnswers): number {
  const done = QUESTION_STEPS.filter(s => s !== 'o6' && isAnswered(s, a)).length + (a.priorities.length || a.worries.length ? 1 : 0)
  return done / QUESTION_STEPS.length
}

/** A stable short hash of the answers, used to key the cached plan prose. */
export function answersHash(a: StartAnswers): string {
  const s = JSON.stringify(a, Object.keys(a).sort())
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
