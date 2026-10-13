import { unauthorised, who } from '../../lib/api.js'
import { bad, json, readJson } from '../../lib/http.js'
import { parsePatch, readSettings, writeSettings } from '../../lib/settings.js'

export async function GET(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner) return unauthorised()
  return json(await readSettings())
}

export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner) return unauthorised()
  const body = await readJson(request)
  if (!body.ok) return body.response
  const parsed = parsePatch(body.body)
  if (!parsed.ok) return bad(parsed.error)
  try {
    return json(await writeSettings(parsed.patch))
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 502)
  }
}
