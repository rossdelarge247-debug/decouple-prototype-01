import { noteCodeUsed, redeemable } from '../lib/auth.ts'
import { sessionSecret } from '../lib/env.ts'
import { bad, json, readJson } from '../lib/http.ts'
import { testerCookie } from '../lib/session.ts'

export async function POST(request: Request): Promise<Response> {
  const secret = sessionSecret()
  if (!secret) return bad('Sessions are not configured.', 503)
  const body = await readJson(request)
  if (!body.ok) return body.response
  const code = (body.body as { code?: unknown }).code
  if (typeof code !== 'string' || !code.trim()) return bad('Enter a code.')
  const row = await redeemable(code)
  if (!row) return json({ ok: false, error: 'That code is not right, or it has expired.' }, 404)
  await noteCodeUsed(row.code)
  return json({ ok: true, label: row.label }, 200, { 'set-cookie': await testerCookie(secret, row.label, row.code, row.test) })
}
