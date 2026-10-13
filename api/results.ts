import { unauthorised, who } from '../lib/api.js'
import { json } from '../lib/http.js'
import { ScriptError, scriptGet } from '../lib/script.js'

export async function GET(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner) return unauthorised()
  const u = new URL(request.url)
  const test = (u.searchParams.get('test') || '').slice(0, 60)
  const since = (u.searchParams.get('since') || '').slice(0, 40)
  if (since && isNaN(Date.parse(since))) return json({ ok: false, error: 'since must be an ISO date.' }, 400)
  try {
    const data = (await scriptGet('results', { test, since })) as { rows?: unknown; signups?: unknown }
    return json({ rows: Array.isArray(data.rows) ? data.rows : [], signups: data.signups ?? { count: 0, byStage: {}, byDay: {} } })
  } catch (e) {
    const status = e instanceof ScriptError ? e.status : 502
    return json({ ok: false, error: 'The spreadsheet did not answer.' }, status === 503 ? 503 : 502)
  }
}
