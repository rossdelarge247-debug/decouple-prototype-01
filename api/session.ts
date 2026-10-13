import { who } from '../lib/api.ts'
import { env } from '../lib/env.ts'
import { json } from '../lib/http.ts'

export async function GET(request: Request): Promise<Response> {
  const w = await who(request)
  const out: Record<string, unknown> = {
    owner: w.owner,
    tester: w.tester,
    human: w.human,
    testing: w.testing,
    mode: w.settings.mode,
    requireCode: w.settings.requireCode,
    turnstileSiteKey: env().TURNSTILE_SITE_KEY || '',
  }
  if (w.tester && w.label !== undefined) out.label = w.label
  return json(out)
}
