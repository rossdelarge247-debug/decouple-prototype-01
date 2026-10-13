/* Shared HTTP bits for the functions and the middleware. */
export const MAX_BODY = 64 * 1024

export function securityHeaders(isPrivate = false): Record<string, string> {
  const h: Record<string, string> = {
    'x-robots-tag': 'noindex, nofollow',
    'strict-transport-security': 'max-age=63072000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'x-frame-options': 'DENY',
  }
  if (isPrivate) h['cache-control'] = 'private, no-store'
  return h
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...securityHeaders(true), ...headers },
  })
}

export const noContent = (headers: Record<string, string> = {}): Response => json({ ok: true }, 200, headers)

export const bad = (error: string, status = 400): Response => json({ ok: false, error }, status)

export const methodNotAllowed = (): Response => json({ ok: false, error: 'Method not allowed.' }, 405, { allow: 'GET, POST' })

export type Body = { ok: true; body: unknown } | { ok: false; response: Response }

/* JSON body, at most 64 KB. 413 over the limit, 400 when it is not JSON. */
export async function readJson(request: Request, max: number = MAX_BODY): Promise<Body> {
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > max) return { ok: false, response: bad('Body too large.', 413) }
  let text: string
  try {
    text = await request.text()
  } catch {
    return { ok: false, response: bad('Could not read the body.') }
  }
  if (new TextEncoder().encode(text).length > max) return { ok: false, response: bad('Body too large.', 413) }
  if (!text.trim()) return { ok: true, body: {} }
  try {
    return { ok: true, body: JSON.parse(text) }
  } catch {
    return { ok: false, response: bad('Expected JSON.') }
  }
}

export function clientIp(request: Request): string {
  const h = request.headers
  return (h.get('x-real-ip') || h.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
}

/* "?next=" must be a same-site path: starts with one slash, no scheme, no protocol-relative trick */
export function safeNext(next: string | null | undefined, fallback = '/hub'): string {
  if (!next || typeof next !== 'string') return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || /[\r\n]/.test(next) || next.length > 512) return fallback
  return next
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
