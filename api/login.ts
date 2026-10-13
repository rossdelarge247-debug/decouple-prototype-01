import { env, sessionSecret } from '../lib/env.js'
import { bad, clientIp, json, readJson, sleep } from '../lib/http.js'
import { verifyPassword } from '../lib/password.js'
import { loginLimiter } from '../lib/ratelimit.js'
import { ownerCookie } from '../lib/session.js'

export async function POST(request: Request): Promise<Response> {
  const secret = sessionSecret()
  const hash = env().OWNER_PASSWORD_HASH
  if (!secret || !hash) return bad('Sign-in is not configured.', 503)
  if (!loginLimiter.hit(clientIp(request))) return bad('Too many attempts. Wait a few minutes.', 429)
  const body = await readJson(request)
  if (!body.ok) return body.response
  const password = (body.body as { password?: unknown }).password
  if (typeof password !== 'string' || !password) return bad('Enter your password.')
  if (!verifyPassword(password, hash)) {
    await sleep(800)
    return json({ ok: false, error: 'That is not the password.' }, 401)
  }
  return json({ ok: true }, 200, { 'set-cookie': await ownerCookie(secret) })
}
