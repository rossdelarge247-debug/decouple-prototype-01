/* Tester codes (spec §3 and §6). The "Codes" tab of the sheet, read through the Google script and
   cached for 60 seconds. TESTER_CODES ("CODE:label,CODE2:label2") is the fallback when the script
   is unreachable. A code works if active is true and expires is empty or today or later.
   A code's track says which prototypes its tester may open (lib/tracks.ts); mode is how the session
   runs: "un" on their own, "mod" with Ross. */
import { normaliseMode, normaliseTrack, type TrackMode } from './tracks.js'

export interface CodeRow {
  code: string
  label: string
  active: boolean
  test: boolean
  /** YYYY-MM-DD, or "" for never */
  expires: string
  /** "" for the guide only, "full", "mvp" or a list like "p03,m05" */
  track: string
  mode: TrackMode
  created?: string
  uses?: number
  last_used?: string
}

export const CODE_RE = /^[A-Z]{2,6}-[A-Z]{2,6}-\d{2}$/
export const LABEL_MAX = 40
export const CODES_PER_REQUEST = 20
export const CODES_TTL_MS = 60_000
/** a new code works within seconds, not a minute: a miss re-reads the list once this old */
export const MISS_REFRESH_MS = 5_000

export const normaliseCode = (s: unknown): string => String(s ?? '').trim().toUpperCase()

export function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

const truthy = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  const s = String(v ?? '').trim().toLowerCase()
  return s === 'true' || s === 'yes' || s === '1' || s === 'y'
}

/* A sheet cell can come back as a Date, an ISO string or "" */
const dateOnly = (v: unknown): string => {
  if (v == null || v === '') return ''
  const s = String(v).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : isoDate(d)
}

export function normaliseRow(raw: unknown): CodeRow | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const code = normaliseCode(r.code)
  if (!code) return null
  const row: CodeRow = {
    code,
    label: String(r.label ?? '').trim().slice(0, LABEL_MAX),
    active: truthy(r.active),
    test: truthy(r.test),
    expires: dateOnly(r.expires),
    track: normaliseTrack(r.track),
    mode: normaliseMode(r.mode),
  }
  if (r.created != null && r.created !== '') row.created = String(r.created)
  if (r.uses != null && r.uses !== '') row.uses = Number(r.uses) || 0
  if (r.last_used != null && r.last_used !== '') row.last_used = String(r.last_used)
  return row
}

export function normaliseRows(raw: unknown): CodeRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normaliseRow).filter((x): x is CodeRow => !!x)
}

export function isLive(row: CodeRow, today: string = isoDate()): boolean {
  return row.active && (!row.expires || row.expires >= today)
}

/* "CODE:label,CODE2:label2" → rows that are active and never expire */
export function parseFallback(s: string | undefined | null): CodeRow[] {
  if (!s) return []
  return s
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const i = part.indexOf(':')
      const code = normaliseCode(i < 0 ? part : part.slice(0, i))
      const label = i < 0 ? '' : part.slice(i + 1).trim().slice(0, LABEL_MAX)
      return { code, label, active: true, test: false, expires: '', track: '', mode: '' as const }
    })
    .filter((r) => r.code)
}

export function findCode(rows: CodeRow[], code: unknown): CodeRow | undefined {
  const c = normaliseCode(code)
  return c ? rows.find((r) => r.code === c) : undefined
}

export interface CodeStoreDeps {
  fetchCodes: () => Promise<CodeRow[]>
  fallback: () => CodeRow[]
  now?: () => number
  ttlMs?: number
  /** a code that is not in the cached list triggers one fresh read, if the cache is older than this */
  missRefreshMs?: number
}

export interface CodeLookup {
  /** the code's row when it exists and is live; null when it is not; 'unknown' when nothing could be read */
  row: CodeRow | null | 'unknown'
}

export interface CodeStore {
  list(force?: boolean): Promise<CodeRow[]>
  /** whether `code` works now, or 'unknown' when neither the script nor the fallback answered */
  check(code: unknown, today?: string): Promise<CodeLookup>
  clear(): void
}

export function createCodeStore(deps: CodeStoreDeps): CodeStore {
  const now = deps.now ?? Date.now
  const ttl = deps.ttlMs ?? CODES_TTL_MS
  const missRefresh = deps.missRefreshMs ?? MISS_REFRESH_MS
  let cache: { at: number; rows: CodeRow[] } | null = null
  let pending: Promise<CodeRow[]> | null = null

  async function fetchFresh(): Promise<CodeRow[]> {
    const rows = await deps.fetchCodes()
    cache = { at: now(), rows }
    return rows
  }

  return {
    async list(force = false) {
      if (!force && cache && now() - cache.at < ttl) return cache.rows
      if (!pending) {
        pending = fetchFresh().finally(() => {
          pending = null
        })
      }
      try {
        return await pending
      } catch {
        if (cache) return cache.rows
        throw new Error('codes unavailable')
      }
    },
    async check(code, today = isoDate()) {
      const c = normaliseCode(code)
      if (!c) return { row: null }
      let rows: CodeRow[]
      try {
        rows = await this.list()
      } catch {
        const fb = deps.fallback()
        if (!fb.length) return { row: 'unknown' }
        rows = fb
      }
      let row = findCode(rows, c)
      if (!row && cache && now() - cache.at >= missRefresh) {
        try {
          rows = await this.list(true)
          row = findCode(rows, c)
        } catch {
          /* the cached answer stands */
        }
      }
      return { row: row && isLive(row, today) ? row : null }
    },
    clear() {
      cache = null
    },
  }
}
