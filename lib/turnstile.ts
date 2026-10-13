/* Cloudflare Turnstile: proves a visitor is a person when there is no tester or owner session. */
import { env, type Env } from './env.js'

export async function verifyTurnstile(token: unknown, ip: string | undefined, e: Env = env()): Promise<boolean> {
  const secret = e.TURNSTILE_SECRET_KEY
  if (!secret || typeof token !== 'string' || !token || token.length > 2048) return false
  const body = new URLSearchParams({ secret, response: token })
  if (ip && ip !== 'unknown') body.set('remoteip', ip)
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 8_000)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: ctl.signal })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
