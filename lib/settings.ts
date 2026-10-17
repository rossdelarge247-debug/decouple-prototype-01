/* Site settings (spec §4): mode, requireCode, testMode, landing, indexing and theme, read from the Global
   Config store (Vercel renamed Edge Config in 2026; the old names still work) and cached for 60 seconds per
   instance. Written through the Vercel REST API (spec §7, /api/admin/site). */
import { createClient } from '@vercel/global-config'
import { env, type Env } from './env.js'

export type Landing = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'random'

export const LANDINGS: readonly Landing[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'random']

/** the site-wide look (Site settings › Look and feel): "page" leaves each page's own look */
export type Theme = 'page' | 'studio' | 'flat' | 'lilac' | 'field' | 'service'

export const THEMES: readonly Theme[] = ['page', 'studio', 'flat', 'lilac', 'field', 'service']

export interface Settings {
  mode: 'guide' | 'holding'
  requireCode: boolean
  testMode: boolean
  /** which of the guide's landing designs visitors see, or one of the nine at random */
  landing: Landing
  /** search engines may list / and /privacy (spec §5.1). Nothing else, ever. */
  indexing: boolean
  /** the look the guide and the help page open in, served by /api/look (spec §4, §7) */
  theme: Theme
}

export const DEFAULTS: Readonly<Settings> = { mode: 'holding', requireCode: true, testMode: false, landing: 'a', indexing: false, theme: 'page' }

/** the items read from the store */
export const SETTINGS_KEYS = ['mode', 'requireCode', 'testMode', 'landing', 'indexing', 'theme'] as const

const isLanding = (v: unknown): v is Landing => typeof v === 'string' && (LANDINGS as readonly string[]).includes(v)
const isTheme = (v: unknown): v is Theme => typeof v === 'string' && (THEMES as readonly string[]).includes(v)
export const SETTINGS_TTL_MS = 60_000

export function normaliseSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    mode: r.mode === 'guide' ? 'guide' : 'holding',
    requireCode: typeof r.requireCode === 'boolean' ? r.requireCode : DEFAULTS.requireCode,
    testMode: typeof r.testMode === 'boolean' ? r.testMode : DEFAULTS.testMode,
    landing: isLanding(r.landing) ? r.landing : DEFAULTS.landing,
    indexing: r.indexing === true,
    theme: isTheme(r.theme) ? r.theme : DEFAULTS.theme,
  }
}

/* A patch from the owner: only the known keys, only the right types */
export function parsePatch(body: unknown): { ok: true; patch: Partial<Settings> } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Expected an object.' }
  const b = body as Record<string, unknown>
  const patch: Partial<Settings> = {}
  if ('mode' in b) {
    if (b.mode !== 'guide' && b.mode !== 'holding') return { ok: false, error: 'mode must be "guide" or "holding".' }
    patch.mode = b.mode
  }
  if ('requireCode' in b) {
    if (typeof b.requireCode !== 'boolean') return { ok: false, error: 'requireCode must be true or false.' }
    patch.requireCode = b.requireCode
  }
  if ('testMode' in b) {
    if (typeof b.testMode !== 'boolean') return { ok: false, error: 'testMode must be true or false.' }
    patch.testMode = b.testMode
  }
  if ('landing' in b) {
    if (!isLanding(b.landing)) return { ok: false, error: 'landing must be "a" to "i" or "random".' }
    patch.landing = b.landing
  }
  if ('indexing' in b) {
    if (typeof b.indexing !== 'boolean') return { ok: false, error: 'indexing must be true or false.' }
    patch.indexing = b.indexing
  }
  if ('theme' in b) {
    if (!isTheme(b.theme)) return { ok: false, error: 'theme must be "page", "studio", "flat", "lilac", "field" or "service".' }
    patch.theme = b.theme
  }
  if (!Object.keys(patch).length) return { ok: false, error: 'Nothing to change.' }
  return { ok: true, patch }
}

type Reader = () => Promise<unknown>

let cache: { at: number; value: Settings } | null = null
let reader: Reader | null = null

/** the connection string Vercel adds when the store is connected, under either name */
export function connectionString(e: Env = env()): string | null {
  return e.GLOBAL_CONFIG || e.EDGE_CONFIG || null
}

function defaultReader(e: Env = env()): Reader {
  return async () => {
    const conn = connectionString(e)
    if (!conn) return null
    const client = createClient(conn)
    return client.getAll([...SETTINGS_KEYS])
  }
}

/** tests swap the reader; the site uses Edge Config */
export function useSettingsReader(r: Reader | null): void {
  reader = r
  cache = null
}

export function clearSettingsCache(): void {
  cache = null
}

export async function readSettings(now: number = Date.now(), ttlMs: number = SETTINGS_TTL_MS): Promise<Settings> {
  if (cache && now - cache.at < ttlMs) return cache.value
  const read = reader || defaultReader()
  let value: Settings
  try {
    const raw = await read()
    value = raw ? normaliseSettings(raw) : { ...DEFAULTS }
  } catch {
    value = cache ? cache.value : { ...DEFAULTS }
  }
  cache = { at: now, value }
  return value
}

/* The store's id: GLOBAL_CONFIG_ID or EDGE_CONFIG_ID when set, otherwise the first path segment of
   the connection string (https://global-config.vercel.com/<id>?token=…) */
export function storeId(e: Env = env()): string | null {
  const given = e.GLOBAL_CONFIG_ID || e.EDGE_CONFIG_ID
  if (given) return given.trim()
  const conn = connectionString(e)
  if (!conn) return null
  try {
    const m = new URL(conn).pathname.match(/^\/([A-Za-z0-9_-]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/** whether the store can be written: its id and the API token */
export function storeWritable(e: Env = env()): boolean {
  return !!(storeId(e) && e.VERCEL_API_TOKEN)
}

/* Upsert items in the store through the Vercel REST API */
export async function upsertItems(items: Record<string, unknown>, e: Env = env()): Promise<void> {
  const id = storeId(e)
  const token = e.VERCEL_API_TOKEN
  if (!id || !token) throw new Error('Settings writes are not configured: connect the Global Config store (GLOBAL_CONFIG) and set VERCEL_API_TOKEN.')
  const u = new URL(`https://api.vercel.com/v1/global-config/${encodeURIComponent(id)}/items`)
  if (e.VERCEL_TEAM_ID) u.searchParams.set('teamId', e.VERCEL_TEAM_ID)
  const res = await fetch(u, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ items: Object.entries(items).map(([key, value]) => ({ operation: 'upsert', key, value })) }),
  })
  if (!res.ok) throw new Error(`Vercel returned ${res.status} writing the settings.`)
}

/* One item, read fresh from the store (no cache), or undefined when there is no store */
export async function readItem(key: string, e: Env = env()): Promise<unknown> {
  const conn = connectionString(e)
  if (!conn) return undefined
  return createClient(conn).get(key)
}

/* Upsert the changed keys in the Edge Config store, then return the merged settings */
export async function writeSettings(patch: Partial<Settings>, e: Env = env()): Promise<Settings> {
  const current = await readSettings()
  const next: Settings = { ...current, ...patch }
  await upsertItems(patch, e)
  cache = { at: Date.now(), value: next }
  return next
}
