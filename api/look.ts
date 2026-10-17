import { FUNCTION_SETTINGS_TTL_MS } from '../lib/api.js'
import { securityHeaders } from '../lib/http.js'
import { lookScript } from '../lib/look.js'
import { readSettings } from '../lib/settings.js'

/* GET /api/look, served at /shared/dc-look.js (spec §4, §7). Public: no session read, no cookie set. */
export async function GET(): Promise<Response> {
  const { theme } = await readSettings(Date.now(), FUNCTION_SETTINGS_TTL_MS)
  return new Response(lookScript(theme), {
    status: 200,
    headers: { ...securityHeaders(false), 'content-type': 'text/javascript', 'cache-control': 'public, max-age=60' },
  })
}
