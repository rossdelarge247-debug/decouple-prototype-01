import { unauthorised, who } from '../lib/api.js'
import { cleanParticipant } from '../lib/clean.js'
import { bad, json, readJson } from '../lib/http.js'
import { participantLimiter } from '../lib/ratelimit.js'
import { ScriptError, scriptPost } from '../lib/script.js'

/* The participant hub's thank-you step (spec §7). Testers and the owner. Test codes and test mode
   store nothing. The row goes to the Participants tab with the tester's label as pid. */
export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!(w.owner || w.tester)) return unauthorised()
  const body = await readJson(request)
  if (!body.ok) return body.response
  const cleaned = cleanParticipant(body.body)
  if (cleaned.kind === 'bad') return bad(cleaned.error)
  if (cleaned.kind === 'drop') return json({ ok: true })
  if (w.testing) return json({ ok: true, test: true })
  if (!participantLimiter.hit('sid:' + cleaned.participant.sid)) return bad('That has been sent already.', 429)
  const pid = (w.tester && w.label) || (w.owner ? 'owner' : 'anon')
  try {
    await scriptPost('participant', { ...cleaned.participant, pid: pid.slice(0, 40) })
  } catch (e) {
    const status = e instanceof ScriptError ? e.status : 502
    return json({ ok: false, error: 'That could not be saved just now.' }, status === 503 ? 503 : 502)
  }
  return json({ ok: true })
}
