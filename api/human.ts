import { sessionSecret } from '../lib/env.ts'
import { bad, clientIp, json, readJson } from '../lib/http.ts'
import { humanCookie } from '../lib/session.ts'
import { verifyTurnstile } from '../lib/turnstile.ts'

export async function POST(request: Request): Promise<Response> {
  const secret = sessionSecret()
  if (!secret) return bad('Sessions are not configured.', 503)
  const body = await readJson(request)
  if (!body.ok) return body.response
  const token = (body.body as { token?: unknown }).token
  const ok = await verifyTurnstile(token, clientIp(request))
  if (!ok) return json({ ok: false, error: 'The check did not pass.' }, 403)
  return json({ ok: true }, 200, { 'set-cookie': await humanCookie(secret) })
}
