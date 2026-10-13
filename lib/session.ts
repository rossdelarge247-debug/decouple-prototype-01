/* Sessions (spec §3). A cookie value is base64url(JSON{r, l, c, t, exp}).base64url(HMAC-SHA256),
   keyed with SESSION_SECRET. Web Crypto only, so this runs in middleware and in functions alike. */
export type Role = 'owner' | 'tester' | 'human'

export interface Session {
  r: Role
  /** tester label: becomes the participant ID */
  l?: string
  /** the tester code itself, re-checked so that turning a code off ends its sessions */
  c?: string
  /** 1 for a test code */
  t?: 0 | 1
  /** expiry, ms since the epoch */
  exp: number
}

export const COOKIE = { owner: 'dc_owner', tester: 'dc_tester', human: 'dc_human' } as const
export const DAYS_30 = 30 * 24 * 60 * 60
export const HOURS_24 = 24 * 60 * 60

const enc = new TextEncoder()

export function toBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function sign(session: Session, secret: string): Promise<string> {
  const payload = toBase64Url(enc.encode(JSON.stringify(session)))
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(payload)))
  return `${payload}.${toBase64Url(sig)}`
}

/* A valid, unexpired session, or null. The signature check is constant-time (crypto.subtle.verify). */
export async function verify(token: string | undefined | null, secret: string, now: number = Date.now()): Promise<Session | null> {
  if (!token || typeof token !== 'string' || token.length > 2048) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sigPart = token.slice(dot + 1)
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(sigPart)) return null
  let ok = false
  try {
    ok = await crypto.subtle.verify('HMAC', await key(secret), fromBase64Url(sigPart), enc.encode(payload))
  } catch {
    return null
  }
  if (!ok) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)))
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const s = parsed as Partial<Session>
  if (s.r !== 'owner' && s.r !== 'tester' && s.r !== 'human') return null
  if (typeof s.exp !== 'number' || !(s.exp > now)) return null
  const out: Session = { r: s.r, exp: s.exp }
  if (typeof s.l === 'string') out.l = s.l
  if (typeof s.c === 'string') out.c = s.c
  if (s.t === 1) out.t = 1
  return out
}

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const name = part.slice(0, i).trim()
    if (!name || name in out) continue
    out[name] = part.slice(i + 1).trim()
  }
  return out
}

export interface CookieOptions {
  maxAge: number
  secure?: boolean
}

export function serializeCookie(name: string, value: string, opts: CookieOptions): string {
  const parts = [`${name}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.max(0, Math.floor(opts.maxAge))}`]
  if (opts.secure !== false) parts.push('Secure')
  return parts.join('; ')
}

export function clearCookie(name: string): string {
  return serializeCookie(name, '', { maxAge: 0 })
}

export interface Sessions {
  owner: Session | null
  tester: Session | null
  human: Session | null
}

export async function readSessions(cookieHeader: string | null | undefined, secret: string | null, now: number = Date.now()): Promise<Sessions> {
  const none: Sessions = { owner: null, tester: null, human: null }
  if (!secret) return none
  const c = parseCookies(cookieHeader)
  const [owner, tester, human] = await Promise.all([
    verify(c[COOKIE.owner], secret, now),
    verify(c[COOKIE.tester], secret, now),
    verify(c[COOKIE.human], secret, now),
  ])
  return {
    owner: owner && owner.r === 'owner' ? owner : null,
    tester: tester && tester.r === 'tester' ? tester : null,
    human: human && human.r === 'human' ? human : null,
  }
}

export async function ownerCookie(secret: string, now: number = Date.now()): Promise<string> {
  return serializeCookie(COOKIE.owner, await sign({ r: 'owner', exp: now + DAYS_30 * 1000 }, secret), { maxAge: DAYS_30 })
}

export async function testerCookie(secret: string, label: string, code: string, test: boolean, now: number = Date.now()): Promise<string> {
  const s: Session = { r: 'tester', l: label, c: code, exp: now + DAYS_30 * 1000 }
  if (test) s.t = 1
  return serializeCookie(COOKIE.tester, await sign(s, secret), { maxAge: DAYS_30 })
}

export async function humanCookie(secret: string, now: number = Date.now()): Promise<string> {
  return serializeCookie(COOKIE.human, await sign({ r: 'human', exp: now + HOURS_24 * 1000 }, secret), { maxAge: HOURS_24 })
}

/* A short, stable key for rate limiting: the first cookie that identifies the session, hashed */
export async function sessionKey(cookieHeader: string | null | undefined, fallback: string): Promise<string> {
  const c = parseCookies(cookieHeader)
  const v = c[COOKIE.owner] || c[COOKIE.tester] || c[COOKIE.human]
  if (!v) return 'ip:' + fallback
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(v)))
  return 'c:' + toBase64Url(d).slice(0, 22)
}
