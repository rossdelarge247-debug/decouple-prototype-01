/* Environment: every variable the site reads, in one place. Vercel sets these (spec §9). */
export type Env = Record<string, string | undefined>

export const env = (): Env => process.env as Env

export function siteOrigin(e: Env = env()): string {
  return (e.SITE_ORIGIN || 'https://decouple.uk').replace(/\/+$/, '')
}

export function loginPath(e: Env = env()): string {
  const p = (e.LOGIN_PATH || '/studio').trim()
  return p.startsWith('/') ? p.replace(/\/+$/, '') || '/' : '/' + p
}

export function testersCanOpenProtos(e: Env = env()): boolean {
  return (e.TESTERS_CAN_OPEN_PROTOS || '').trim().toLowerCase() === 'true'
}

export function sessionSecret(e: Env = env()): string | null {
  const s = e.SESSION_SECRET
  return s && s.length >= 16 ? s : null
}
