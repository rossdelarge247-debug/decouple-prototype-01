import { interview } from '@/copy/start'

// Validation errors travel in the query string as `e=field:code`.
export type SearchParams = Record<string, string | string[] | undefined>

export interface ScreenErrors {
  byField: Record<string, string>
  messages: string[]
  reference: string
}

const MESSAGES: Record<string, string> = {
  chooseOne: interview.chooseOne,
  chooseUpToThree: interview.chooseUpToThree,
}

export function readErrors(params: SearchParams): ScreenErrors {
  const raw = params.e
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const byField: Record<string, string> = {}
  for (const entry of list) {
    const [field, code] = entry.split(':')
    if (field && code && MESSAGES[code]) byField[field] = MESSAGES[code]
  }
  const messages = [...new Set(Object.values(byField))]
  const ref = typeof params.ref === 'string' ? params.ref : ''
  return { byField, messages, reference: ref }
}
