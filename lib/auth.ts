/* Who is asking (spec §3): the sessions from the cookies, the tester code re-checked against the
   codes list, and whether this request is in test mode. Used by the middleware and every function. */
import { waitUntil } from '@vercel/functions'
import { env, sessionSecret, type Env } from './env.js'
import { createCodeStore, normaliseRows, parseFallback, type CodeRow, type CodeStore } from './codes.js'
import { scriptConfigured, scriptGet, scriptPost } from './script.js'
import { readSessions, sessionKey, type Session } from './session.js'
import { readSettings, type Settings } from './settings.js'
import type { TrackMode } from './tracks.js'

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
      background: (p) => waitUntil(p),
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
  /** a tester's track, read from the live codes list: "" means the guide only (lib/tracks.ts) */
  track?: string
  /** a tester's session type: "un" on their own, "mod" with Ross */
  trackMode?: TrackMode
  /** key for rate limiting */
  key: string
  settings: Settings
  sessions: { owner: Session | null; tester: Session | null; human: Session | null }
}

export interface WhoOptions {
  /** how old a cached settings read may be before it is read again: 5 s in the functions, 30 s in the middleware */
  settingsTtlMs?: number
  /** a settings copy older than settingsTtlMs but younger than this is used while a fresh one is read */
  settingsStaleMs?: number
  /** the middleware only: past the minute, use the last codes list (up to this old) and refresh it in the
      background, so a page doesn't wait for the Google script */
  codesStaleMs?: number
}

/** how old a codes list the middleware may use while it fetches a fresh one. A code turned off still
    opens one more page after the minute; the functions (answers, session) always read fresh. */
export const CODES_STALE_MS = 10 * 60_000

export async function whoami(request: Request, ip = 'unknown', now: number = Date.now(), opts: WhoOptions = {}): Promise<Who> {
  const cookie = request.headers.get('cookie')
  const [sessions, settings, key] = await Promise.all([
    readSessions(cookie, sessionSecret(), now),
    readSettings(now, opts.settingsTtlMs, opts.settingsStaleMs),
    sessionKey(cookie, ip),
  ])
  const owner = !!sessions.owner
  let tester = false
  let label: string | undefined
  let code: string | undefined
  let track = ''
  let trackMode: TrackMode = ''
  let testCode = false
  if (sessions.tester) {
    const t = sessions.tester
    if (t.c) {
      const found = await codeStore().check(t.c, undefined, opts.codesStaleMs)
      /* 'unknown' means nothing could be read: an existing session stays valid rather than throwing
         testers out, but with no track, so it opens the guide only until the list can be read */
      if (found.row === 'unknown') tester = true
      else if (found.row) {
        tester = true
        testCode = found.row.test
        track = found.row.track
        trackMode = found.row.mode
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
  if (tester) {
    who.track = track
    who.trackMode = trackMode
  }
  return who
}

/** the live row for a code someone is trying to redeem, or null */
export async function redeemable(code: unknown): Promise<CodeRow | null> {
  const found = await codeStore().check(code)
  return found.row && found.row !== 'unknown' ? found.row : null
}
