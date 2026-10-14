import { who } from '../lib/api.js'
import { env } from '../lib/env.js'
import { json } from '../lib/http.js'

export async function GET(request: Request): Promise<Response> {
  const w = await who(request)
  const out: Record<string, unknown> = {
    owner: w.owner,
    tester: w.tester,
    human: w.human,
    testing: w.testing,
    mode: w.settings.mode,
    requireCode: w.settings.requireCode,
    landing: w.settings.landing,
    turnstileSiteKey: env().TURNSTILE_SITE_KEY || '',
  }
  if (w.tester && w.label !== undefined) out.label = w.label
  /* testers only: the participant hub shows the prototypes in the track, run the way mode says */
  if (w.tester) {
    out.track = w.track ?? ''
    out.trackMode = w.trackMode || 'un'
  }
  return json(out)
}
