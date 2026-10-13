/* Site settings (spec §4): mode, requireCode and testMode, read from the Global Config store
   (Vercel renamed Edge Config in 2026; the old names still work) and cached for 60 seconds per
   instance. Written through the Vercel REST API (spec §7, /api/admin/site). */
import { createClient } from '@vercel/global-config'
import { env, type Env } from './env.js'

export interface Settings {
  mode: 'guide' | 'holding'
  requireCode: boolean
  testMode: boolean
}

export const DEFAULTS: Readonly<Settings> = { mode: 'holding', requireCode: true, testMode: false }
export const SETTINGS_TTL_MS = 60_000

export function normaliseSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    mode: r.mode === 'guide' ? 'guide' : 'holding',
    requireCode: typeof r.requireCode === 'boolean' ? r.requireCode : DEFAULTS.requireCode,
    testMode: typeof r.testMode === 'boolean' ? r.testMode : DEFAULTS.testMode,
  }
}

/* A patch from the owner: only the three keys, only the right types */
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
    return client.getAll(['mode', 'requireCode', 'testMode'])
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

/* Upsert the changed keys in the Edge Config store, then return the merged settings */
export async function writeSettings(patch: Partial<Settings>, e: Env = env()): Promise<Settings> {
  const id = storeId(e)
  const token = e.VERCEL_API_TOKEN
  if (!id || !token) throw new Error('Settings writes are not configured: connect the Global Config store (GLOBAL_CONFIG) and set VERCEL_API_TOKEN.')
  const current = await readSettings()
  const next: Settings = { ...current, ...patch }
  const u = new URL(`https://api.vercel.com/v1/global-config/${encodeURIComponent(id)}/items`)
  if (e.VERCEL_TEAM_ID) u.searchParams.set('teamId', e.VERCEL_TEAM_ID)
  const res = await fetch(u, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ items: Object.entries(patch).map(([key, value]) => ({ operation: 'upsert', key, value })) }),
  })
  if (!res.ok) throw new Error(`Vercel returned ${res.status} writing the settings.`)
  cache = { at: Date.now(), value: next }
  return next
}
