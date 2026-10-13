/* The guide email (spec §7), sent through Resend. The body is a fixed template: only the link varies. */
import { env, siteOrigin, type Env } from './env.js'

export const SUBJECT = 'Your guide'
export const MAX_LINK = 8 * 1024

export function validGuideLink(link: unknown, origin: string = siteOrigin()): link is string {
  if (typeof link !== 'string') return false
  if (link.length >= MAX_LINK) return false
  if (!link.startsWith(origin + '/')) return false
  if (/[\s<>"']/.test(link)) return false
  return true
}

const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export function guideEmail(link: string): { subject: string; html: string; text: string } {
  const safe = escapeHtml(link)
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#F7F5F2;font-family:Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1B1726;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F2;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;">
<tr><td style="padding:32px 32px 8px;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Decouple<span style="color:#7C3AED;">.</span></td></tr>
<tr><td style="padding:8px 32px 0;font-size:16px;line-height:1.55;">Here&#8217;s the guide you made. It opens on this device or any other.</td></tr>
<tr><td style="padding:24px 32px 8px;">
<a href="${safe}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:#7C3AED;color:#FFFFFF;font-weight:600;font-size:15px;text-decoration:none;">Open your guide</a>
</td></tr>
<tr><td style="padding:16px 32px 0;font-size:14px;line-height:1.55;color:#5C5668;">If someone else reads your email, you can delete this message. The guide isn&#8217;t stored by us.</td></tr>
<tr><td style="padding:28px 32px 32px;font-size:12px;line-height:1.5;color:#8A8495;border-top:1px solid #ECE9F1;">Decouple is not a law firm. This guide is not legal advice.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`
  const text = [
    'Decouple.',
    '',
    "Here's the guide you made. It opens on this device or any other.",
    '',
    `Open your guide: ${link}`,
    '',
    "If someone else reads your email, you can delete this message. The guide isn't stored by us.",
    '',
    'Decouple is not a law firm. This guide is not legal advice.',
    '',
  ].join('\n')
  return { subject: SUBJECT, html, text }
}

export interface SendResult {
  ok: boolean
  status: number
  error?: string
}

export async function sendEmail(to: string, msg: { subject: string; html: string; text: string }, e: Env = env()): Promise<SendResult> {
  const key = e.RESEND_API_KEY
  if (!key) return { ok: false, status: 503, error: 'Email is not configured.' }
  const from = e.MAIL_FROM || 'Decouple <hello@decouple.uk>'
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 12_000)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: 'hello@decouple.uk', subject: msg.subject, html: msg.html, text: msg.text }),
      signal: ctl.signal,
    })
    if (!res.ok) return { ok: false, status: 502, error: `Resend returned ${res.status}.` }
    return { ok: true, status: 200 }
  } catch (err) {
    return { ok: false, status: 502, error: (err as Error).message }
  } finally {
    clearTimeout(timer)
  }
}
