import { mayAnswer, unauthorised, who } from '../lib/api.js'
import { EMAIL_RE, stripControl } from '../lib/clean.js'
import { guideEmail, sendEmail, validGuideLink } from '../lib/email.js'
import { bad, json, readJson } from '../lib/http.js'
import { emailLimiter } from '../lib/ratelimit.js'

export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!mayAnswer(w)) return unauthorised()
  const body = await readJson(request)
  if (!body.ok) return body.response
  const b = body.body as { email?: unknown; link?: unknown; sid?: unknown }
  const email = typeof b.email === 'string' ? stripControl(b.email).trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 254) return bad('That is not an email address.')
  if (!validGuideLink(b.link)) return bad('That link is not one of ours.')
  const sid = typeof b.sid === 'string' ? stripControl(b.sid).trim().slice(0, 64) : ''
  if (!sid) return bad('sid is required.')
  if (!emailLimiter.hit('sid:' + sid)) return bad('That guide has been emailed three times today.', 429)
  const sent = await sendEmail(email, guideEmail(b.link))
  if (!sent.ok) return json({ ok: false, error: 'The email could not be sent just now.' }, sent.status === 503 ? 503 : 502)
  return json({ ok: true })
}
