import { createCodeStore, parseFallback, type CodeRow } from '../lib/codes.js'
import { useCodeStore } from '../lib/auth.js'
import { clearSettingsCache, useSettingsReader, type Settings } from '../lib/settings.js'
import { COOKIE, sign } from '../lib/session.js'
import { answersLimiter, claudeLimiter, emailLimiter, loginLimiter, participantLimiter } from '../lib/ratelimit.js'

export const SECRET = 'test-secret-for-the-site-cookies'

export const CODES: CodeRow[] = [
  { code: 'FERN-LARK-27', label: 'P01', active: true, test: false, expires: '', track: '', mode: '' },
  { code: 'MINT-OWL-12', label: 'Me · phone', active: true, test: true, expires: '', track: '', mode: '' },
  { code: 'CLAY-RIVER-81', label: 'Old', active: false, test: false, expires: '', track: 'mvp', mode: 'un' },
  { code: 'OAK-WREN-40', label: 'P02', active: true, test: false, expires: '', track: 'mvp', mode: 'un' },
  { code: 'ASH-FINCH-55', label: 'P03', active: true, test: false, expires: '', track: 'p03,m05', mode: 'mod' },
  { code: 'ELM-TERN-60', label: 'P04', active: true, test: false, expires: '', track: 'full', mode: 'un' },
]

export function setup(settings: Partial<Settings> = {}, codes: CodeRow[] = CODES, env: Record<string, string> = {}): void {
  process.env.SESSION_SECRET = SECRET
  process.env.LOGIN_PATH = '/studio'
  process.env.SITE_ORIGIN = 'https://decouple.uk'
  delete process.env.TESTER_CODES
  for (const k of ['APPS_SCRIPT_URL', 'APPS_SCRIPT_SECRET', 'OWNER_PASSWORD_HASH', 'RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'DEPLOY_HOOK_URL', 'CRON_SECRET', 'GLOBAL_CONFIG', 'GLOBAL_CONFIG_ID', 'EDGE_CONFIG', 'EDGE_CONFIG_ID', 'VERCEL_API_TOKEN', 'VERCEL_TEAM_ID']) delete process.env[k]
  Object.assign(process.env, env)
  useSettingsReader(async () => ({ mode: 'holding', requireCode: true, testMode: false, landing: 'a', indexing: false, ...settings }))
  clearSettingsCache()
  useCodeStore(createCodeStore({ fetchCodes: async () => codes, fallback: () => parseFallback(process.env.TESTER_CODES) }))
  answersLimiter.reset()
  emailLimiter.reset()
  loginLimiter.reset()
  participantLimiter.reset()
  claudeLimiter.reset()
}

export async function cookieFor(role: 'owner' | 'tester' | 'human', extra: Record<string, unknown> = {}): Promise<string> {
  const name = role === 'owner' ? COOKIE.owner : role === 'tester' ? COOKIE.tester : COOKIE.human
  const token = await sign({ r: role, exp: Date.now() + 60_000, ...extra } as never, SECRET)
  return `${name}=${token}`
}

export const req = (path: string, init: RequestInit & { cookie?: string } = {}): Request => {
  const headers = new Headers(init.headers || {})
  if (init.cookie) headers.set('cookie', init.cookie)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  const { cookie: _c, ...rest } = init
  void _c
  return new Request('https://decouple.uk' + path, { ...rest, headers })
}

export const post = (path: string, body: unknown, cookie?: string): Request => {
  const init: RequestInit & { cookie?: string } = { method: 'POST', body: JSON.stringify(body) }
  if (cookie) init.cookie = cookie
  return req(path, init)
}
