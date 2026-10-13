import { mayAnswer, unauthorised, who } from '../lib/api.js'
import { cleanAnswers } from '../lib/clean.js'
import { bad, json, readJson } from '../lib/http.js'
import { answersLimiter } from '../lib/ratelimit.js'
import { ScriptError, scriptPost } from '../lib/script.js'

export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!mayAnswer(w)) return unauthorised()
  if (!answersLimiter.hit(w.key)) return bad('Too many answers. Try again in an hour.', 429)
  const body = await readJson(request)
  if (!body.ok) return body.response
  const sender: { owner: boolean; label?: string } = { owner: w.owner }
  if (w.label !== undefined) sender.label = w.label
  const cleaned = cleanAnswers(body.body, sender)
  if (cleaned.kind === 'bad') return bad(cleaned.error)
  if (cleaned.kind === 'drop') return json({ ok: true })
  if (w.testing) return json({ ok: true, test: true })
  if (!cleaned.batch.rows.length) return json({ ok: true })
  try {
    await scriptPost('answers', cleaned.batch)
  } catch (e) {
    const status = e instanceof ScriptError ? e.status : 502
    return json({ ok: false, error: 'The answers could not be saved just now.' }, status === 503 ? 503 : 502)
  }
  return json({ ok: true })
}
