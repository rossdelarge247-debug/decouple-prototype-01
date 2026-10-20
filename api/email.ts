import { mayAnswer, unauthorised, who } from '../lib/api.js'
import { EMAIL_RE, stripControl } from '../lib/clean.js'
import { guideEmail, sendEmail, validGuideLink } from '../lib/email.js'
import { bad, json, readJson } from '../lib/http.js'
import { guidePdf, type PdfResult } from '../lib/pdf.js'
import { emailLimiter, pdfLimiter } from '../lib/ratelimit.js'

/* The guide email (spec §7). With pdf: true it also attaches the guide as a PDF, made from the same
   link (lib/pdf.ts); if that fails, the email goes without it and the reply says pdf: false. Logs
   whether the PDF was attached and how long it took. Never the link or the address. */

const log = (fields: Record<string, unknown>): void => console.log(JSON.stringify({ at: new Date().toISOString(), route: '/api/email', ...fields }))

export async function POST(request: Request): Promise<Response> {
  const started = Date.now()
  const w = await who(request)
  if (!mayAnswer(w)) return unauthorised()
  const body = await readJson(request)
  if (!body.ok) return body.response
  const b = body.body as { email?: unknown; link?: unknown; sid?: unknown; pdf?: unknown }
  const email = typeof b.email === 'string' ? stripControl(b.email).trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 254) return bad('That is not an email address.')
  if (!validGuideLink(b.link)) return bad('That link is not one of ours.')
  const sid = typeof b.sid === 'string' ? stripControl(b.sid).trim().slice(0, 64) : ''
  if (!sid) return bad('sid is required.')
  if (!emailLimiter.hit('sid:' + sid)) return bad('That guide has been emailed three times today.', 429)
  const wantPdf = b.pdf === true
  let pdf: Uint8Array | undefined
  if (wantPdf) {
    const t0 = Date.now()
    const made: PdfResult = pdfLimiter.hit('all') ? await guidePdf(b.link, started) : { ok: false, reason: 'limit' }
    if (made.ok) pdf = made.pdf
    log({ pdf: made.ok, ...(made.ok ? { bytes: made.pdf.byteLength } : { reason: made.reason }), ms: Date.now() - t0 })
  }
  const sent = await sendEmail(email, guideEmail(b.link, pdf))
  if (!sent.ok) {
    console.error('[email] send failed:', sent.error)
    const out: Record<string, unknown> = { ok: false, error: 'The email could not be sent just now.' }
    if (w.owner) out.detail = sent.error
    return json(out, sent.status === 503 ? 503 : 502)
  }
  return json(wantPdf ? { ok: true, pdf: !!pdf } : { ok: true })
}
