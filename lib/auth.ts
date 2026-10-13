/* Who is asking (spec §3): the sessions from the cookies, the tester code re-checked against the
   codes list, and whether this request is in test mode. Used by the middleware and every function. */
import { env, sessionSecret, type Env } from './env.ts'
import { createCodeStore, normaliseRows, parseFallback, type CodeRow, type CodeStore } from './codes.ts'
import { scriptConfigured, scriptGet, scriptPost } from './script.ts'
import { readSessions, sessionKey, type Session } from './session.ts'
import { readSettings, type Settings } from './settings.ts'

let store: CodeStore | null = null

export function codeStore(e: Env = env()): CodeStore {
  if (!store) {
    store = createCodeStore({
      fetchCodes: async () => {
        if (!scriptConfigured(e)) throw new Error('script not configured')
        const data = (await scriptGet('codes', {}, e)) as { codes?: unknown } | unknown[]
        return normaliseRows(Array.isArray(data) ? data : (data as { codes?: unknown }).codes)
      },
      fallback: () => parseFallback(e.TESTER_CODES),
    })
  }
  return store
}

/** tests inject a store */
export function useCodeStore(s: CodeStore | null): void {
  store = s
}

/* Tell the script a code was redeemed. Failure is not the tester's problem. */
export async function noteCodeUsed(code: string, e: Env = env()): Promise<void> {
  if (!scriptConfigured(e)) return
  try {
    await scriptPost('code_used', { code }, e)
  } catch {
    /* the sheet will catch up on the next redeem */
  }
}

export interface Who {
  owner: boolean
  tester: boolean
  human: boolean
  testing: boolean
  label?: string
  code?: string
  /** key for rate limiting */
  key: string
  settings: Settings
  sessions: { owner: Session | null; tester: Session | null; human: Session | null }
}

export interface WhoOptions {
  /** how old a cached settings read may be; the middleware keeps the spec's 60 s, the functions read fresher */
  settingsTtlMs?: number
}

export async function whoami(request: Request, ip = 'unknown', now: number = Date.now(), opts: WhoOptions = {}): Promise<Who> {
  const cookie = request.headers.get('cookie')
  const [sessions, settings, key] = await Promise.all([
    readSessions(cookie, sessionSecret(), now),
    opts.settingsTtlMs === undefined ? readSettings(now) : readSettings(now, opts.settingsTtlMs),
    sessionKey(cookie, ip),
  ])
  const owner = !!sessions.owner
  let tester = false
  let label: string | undefined
  let code: string | undefined
  let testCode = false
  if (sessions.tester) {
    const t = sessions.tester
    if (t.c) {
      const found = await codeStore().check(t.c)
      /* 'unknown' means nothing could be read: an existing session stays valid rather than throwing testers out */
      if (found.row === 'unknown') tester = true
      else if (found.row) {
        tester = true
        testCode = found.row.test
      }
    } else {
      tester = true
    }
    if (tester) {
      label = t.l
      code = t.c
      if (t.t === 1) testCode = true
    }
  }
  const human = !!sessions.human
  const testing = (owner && settings.testMode) || (tester && testCode)
  const who: Who = { owner, tester, human, testing, key, settings, sessions }
  if (label !== undefined) who.label = label
  if (code !== undefined) who.code = code
  return who
}

/** the live row for a code someone is trying to redeem, or null */
export async function redeemable(code: unknown): Promise<CodeRow | null> {
  const found = await codeStore().check(code)
  return found.row && found.row !== 'unknown' ? found.row : null
}
