import { unauthorised, who } from '../../lib/api.js'
import { callDeployHook } from '../../lib/deploy.js'
import { json } from '../../lib/http.js'

export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner) return unauthorised()
  const r = await callDeployHook()
  return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error }, r.status)
}
