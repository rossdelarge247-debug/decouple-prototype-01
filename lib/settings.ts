/* Site settings (spec §4): mode, requireCode, testMode, landing, indexing and theme, read from the Global
   Config store (Vercel renamed Edge Config in 2026; the old names still work) and cached for 60 seconds per
   instance. Written through the Vercel REST API (spec §7, /api/admin/site). */
import { waitUntil } from '@vercel/functions'
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
/** the middleware reads a fresh copy in the background once its copy is this old, so it rarely waits for
    the store and never uses a copy older than the spec's 60 s */
export const SETTINGS_REFRESH_MS = 30_000

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

/* Every read asks the store itself. Without this, inside Vercel functions the client reads a copy at
   /opt/edge-config/<id>.json and keeps its first parse for the life of the instance, so the landing,
   the look and the AI spend stayed at what they were when the deployment started. */
export const FRESH = { consistentRead: true } as const

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
    return client.getAll([...SETTINGS_KEYS], FRESH)
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

/* staleMs: a copy older than ttlMs but younger than this is returned at once, and a fresh one is read
   in the background (kept alive after the reply with waitUntil), so the caller doesn't wait for the store */
export async function readSettings(now: number = Date.now(), ttlMs: number = SETTINGS_TTL_MS, staleMs = 0): Promise<Settings> {
  if (cache && now - cache.at < ttlMs) return cache.value
  if (cache && now - cache.at < staleMs) {
    if (!refreshing) {
      refreshing = fetchSettings(now).finally(() => {
        refreshing = null
      })
      waitUntil(refreshing)
    }
    return cache.value
  }
  return fetchSettings(now)
}

let refreshing: Promise<Settings> | null = null

async function fetchSettings(now: number): Promise<Settings> {
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

/* The id of the store a connection string names: its first path segment
   (https://global-config.vercel.com/<id>?token=…). This is the store the site reads. */
export function connectionStoreId(e: Env = env()): string | null {
  const conn = connectionString(e)
  if (!conn) return null
  try {
    const m = new URL(conn).pathname.match(/^\/([A-Za-z0-9_-]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/** GLOBAL_CONFIG_ID or EDGE_CONFIG_ID, if one was set by hand */
export function configuredStoreId(e: Env = env()): string | null {
  return (e.GLOBAL_CONFIG_ID || e.EDGE_CONFIG_ID || '').trim() || null
}

/* The store the switches write to: always the one the site reads, so a change is read back. An id set
   by hand is used only when the connection string names none; one that names another store is ignored
   (the diagnostics page shows the difference). */
export function storeId(e: Env = env()): string | null {
  return connectionStoreId(e) || configuredStoreId(e)
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
  return createClient(conn).get(key, FRESH)
}

/* Upsert the changed keys in the Edge Config store, then return the merged settings */
export async function writeSettings(patch: Partial<Settings>, e: Env = env(), waits: readonly number[] = [300, 700, 1500]): Promise<Settings> {
  const current = await readSettings()
  const next: Settings = { ...current, ...patch }
  await upsertItems(patch, e)
  /* read it back from the store, so a change that didn't land says so instead of looking saved */
  const read = reader || defaultReader(e)
  let stored: Settings | null = null
  for (let i = 0; i <= waits.length; i++) {
    try {
      const raw = await read()
      stored = raw ? normaliseSettings(raw) : null
    } catch {
      stored = null
    }
    if (stored && (Object.keys(patch) as (keyof Settings)[]).every((k) => stored![k] === patch[k])) break
    if (i < waits.length) await new Promise((r) => setTimeout(r, waits[i]))
    else {
      const k = (Object.keys(patch) as (keyof Settings)[]).find((key) => !stored || stored[key] !== patch[key]) as keyof Settings
      throw new Error(`Vercel accepted the change, but store ${storeId(e)} still reads ${k} = ${JSON.stringify(stored ? stored[k] : null)}. See /api/admin/diagnose › store.`)
    }
  }
  cache = { at: Date.now(), value: next }
  return next
}
