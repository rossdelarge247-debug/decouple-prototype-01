import { codeStore } from '../../lib/auth.js'
import { unauthorised, who } from '../../lib/api.js'
import { CODES_PER_REQUEST, CODE_RE, LABEL_MAX, normaliseCode, normaliseRows } from '../../lib/codes.js'
import { bad, json, readJson } from '../../lib/http.js'
import { ScriptError, scriptGet, scriptPost } from '../../lib/script.js'
import { TRACK_RE, type TrackMode } from '../../lib/tracks.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

type NewCode = { code: string; label: string; expires: string; test: boolean; track: string; mode: TrackMode }
type Op = { op: 'create'; codes: NewCode[] } | { op: 'update'; code: string; active?: boolean; label?: string; expires?: string; test?: boolean; track?: string; mode?: TrackMode } | { op: 'delete'; code: string }

/* track: "", "full", "mvp" or "p03,m05" (spec §7). mode: "un" or "mod"; a code without a track has no
   mode, and a code with one defaults to "un". */
function parseTrack(v: unknown): { ok: true; track: string } | { ok: false; error: string } {
  const track = String(v ?? '').trim().toLowerCase()
  return TRACK_RE.test(track) ? { ok: true, track } : { ok: false, error: 'track must be empty, full, mvp, or a list like p03,m05.' }
}
function parseMode(v: unknown, track: string | undefined): { ok: true; mode: TrackMode } | { ok: false; error: string } {
  const mode = String(v ?? '').trim().toLowerCase()
  if (mode === 'un' || mode === 'mod') return { ok: true, mode: track === '' ? '' : mode }
  if (mode === '') return { ok: true, mode: track === '' ? '' : 'un' }
  return { ok: false, error: 'mode must be un or mod.' }
}

function parseOp(body: unknown): { ok: true; op: Op } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Expected an object.' }
  const b = body as Record<string, unknown>
  if (b.action === 'create') {
    if (!Array.isArray(b.codes) || !b.codes.length) return { ok: false, error: 'codes must be a non-empty array.' }
    if (b.codes.length > CODES_PER_REQUEST) return { ok: false, error: `At most ${CODES_PER_REQUEST} codes per request.` }
    const seen = new Set<string>()
    const codes = []
    for (const raw of b.codes) {
      const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
      const code = normaliseCode(c.code)
      if (!CODE_RE.test(code)) return { ok: false, error: `${code || 'A code'} is not in the form WORD-WORD-00.` }
      if (seen.has(code)) return { ok: false, error: `${code} appears twice.` }
      seen.add(code)
      const label = String(c.label ?? '').trim()
      if (label.length > LABEL_MAX) return { ok: false, error: `Labels have at most ${LABEL_MAX} characters.` }
      const expires = String(c.expires ?? '').trim()
      if (expires && !DATE_RE.test(expires)) return { ok: false, error: 'expires must be YYYY-MM-DD or empty.' }
      const track = parseTrack(c.track)
      if (!track.ok) return track
      const mode = parseMode(c.mode, track.track)
      if (!mode.ok) return mode
      codes.push({ code, label, expires, test: c.test === true, track: track.track, mode: mode.mode })
    }
    return { ok: true, op: { op: 'create', codes } }
  }
  if (b.action === 'update' || b.action === 'delete') {
    const code = normaliseCode(b.code)
    if (!code) return { ok: false, error: 'code is required.' }
    if (b.action === 'delete') return { ok: true, op: { op: 'delete', code } }
    const op: Op = { op: 'update', code }
    if ('active' in b) {
      if (typeof b.active !== 'boolean') return { ok: false, error: 'active must be true or false.' }
      op.active = b.active
    }
    if ('test' in b) {
      if (typeof b.test !== 'boolean') return { ok: false, error: 'test must be true or false.' }
      op.test = b.test
    }
    if ('label' in b) {
      const label = String(b.label ?? '').trim()
      if (label.length > LABEL_MAX) return { ok: false, error: `Labels have at most ${LABEL_MAX} characters.` }
      op.label = label
    }
    if ('expires' in b) {
      const expires = String(b.expires ?? '').trim()
      if (expires && !DATE_RE.test(expires)) return { ok: false, error: 'expires must be YYYY-MM-DD or empty.' }
      op.expires = expires
    }
    if ('track' in b) {
      const track = parseTrack(b.track)
      if (!track.ok) return track
      op.track = track.track
    }
    if ('mode' in b) {
      const mode = parseMode(b.mode, op.track)
      if (!mode.ok) return mode
      op.mode = mode.mode
    }
    if (Object.keys(op).length === 2) return { ok: false, error: 'Nothing to change.' }
    return { ok: true, op }
  }
  return { ok: false, error: 'action must be create, update or delete.' }
}

const failed = (e: unknown): Response => {
  const status = e instanceof ScriptError ? e.status : 502
  return json({ ok: false, error: 'The codes could not be read just now.' }, status === 503 ? 503 : 502)
}

const list = (data: unknown): unknown[] => normaliseRows(Array.isArray(data) ? data : (data as { codes?: unknown })?.codes)

export async function GET(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner) return unauthorised()
  try {
    return json({ codes: list(await scriptGet('codes')) })
  } catch (e) {
    return failed(e)
  }
}

export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner) return unauthorised()
  const body = await readJson(request)
  if (!body.ok) return body.response
  const parsed = parseOp(body.body)
  if (!parsed.ok) return bad(parsed.error)
  try {
    const data = await scriptPost('codes', parsed.op)
    codeStore().clear()
    return json({ codes: list(data) })
  } catch (e) {
    return failed(e)
  }
}
