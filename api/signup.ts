import { who } from '../lib/api.js'
import { cleanSignup } from '../lib/clean.js'
import { bad, json, readJson } from '../lib/http.js'
import { ScriptError, scriptPost } from '../lib/script.js'

export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!(w.owner || w.tester || w.human)) return json({ ok: false, error: 'Please complete the check first.' }, 403)
  const body = await readJson(request)
  if (!body.ok) return body.response
  const cleaned = cleanSignup(body.body)
  if (cleaned.kind === 'bad') return bad(cleaned.error)
  if (cleaned.kind === 'drop') return json({ ok: true })
  if (w.testing) return json({ ok: true, test: true })
  try {
    await scriptPost('signup', cleaned.signup)
  } catch (e) {
    const status = e instanceof ScriptError ? e.status : 502
    return json({ ok: false, error: 'The sign-up could not be saved just now.' }, status === 503 ? 503 : 502)
  }
  return json({ ok: true })
}
