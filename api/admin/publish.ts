import { unauthorised, who } from '../../lib/api.ts'
import { env } from '../../lib/env.ts'
import { json } from '../../lib/http.ts'

export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner) return unauthorised()
  const hook = env().DEPLOY_HOOK_URL
  if (!hook || !/^https:\/\/api\.vercel\.com\//.test(hook)) return json({ ok: false, error: 'Publishing is not configured.' }, 503)
  try {
    const res = await fetch(hook, { method: 'POST' })
    if (!res.ok) return json({ ok: false, error: `Vercel returned ${res.status}.` }, 502)
  } catch {
    return json({ ok: false, error: 'Vercel did not answer.' }, 502)
  }
  return json({ ok: true })
}
