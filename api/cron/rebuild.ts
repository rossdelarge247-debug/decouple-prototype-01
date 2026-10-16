import { callDeployHook, cronAllowed } from '../../lib/deploy.js'
import { json } from '../../lib/http.js'

/* Weekly, from Vercel Cron (vercel.json, Mondays 05:00 UTC): rebuild, so the help content refreshes
   from GOV.UK (spec §5.2, §7). Anything without the cron's secret gets 401. */
export async function GET(request: Request): Promise<Response> {
  if (!cronAllowed(request)) return json({ ok: false, error: 'Not allowed.' }, 401)
  const r = await callDeployHook()
  console.log(JSON.stringify({ at: new Date().toISOString(), route: '/api/cron/rebuild', status: r.ok ? 200 : r.status }))
  return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error }, r.status)
}
