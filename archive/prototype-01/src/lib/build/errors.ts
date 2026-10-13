import { profile as copy } from '@/copy/build'
import type { ScreenErrors, SearchParams } from '@/lib/start/errors'

// Validation errors travel in the query string as `e=field:code`, as in Start.
const MESSAGES: Record<string, string> = {
  chooseOne: copy.chooseOne,
  enterAmount: copy.enterAmount,
  enterDay: copy.enterDay,
}

export function readBuildErrors(params: SearchParams): ScreenErrors {
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
