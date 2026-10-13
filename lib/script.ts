/* The Google Apps Script web app (spec §6): one GET and one POST, both carrying the shared secret. */
import { env, type Env } from './env.js'

export class ScriptError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.status = status
  }
}

export function scriptConfigured(e: Env = env()): boolean {
  return !!(e.APPS_SCRIPT_URL && e.APPS_SCRIPT_SECRET)
}

const TIMEOUT_MS = 12_000

async function call(url: string, init: RequestInit): Promise<unknown> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, { ...init, signal: ctl.signal, redirect: 'follow' })
  } catch (e) {
    throw new ScriptError(`The script did not answer: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
  const text = await res.text()
  if (!res.ok) throw new ScriptError(`The script returned ${res.status}.`)
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ScriptError('The script did not return JSON. Check its deployment and the secret.')
  }
  if (data && typeof data === 'object' && (data as { ok?: unknown }).ok === false) {
    throw new ScriptError(String((data as { error?: unknown }).error || 'The script refused the request.'))
  }
  return data
}

export async function scriptGet(action: string, params: Record<string, string> = {}, e: Env = env()): Promise<unknown> {
  if (!scriptConfigured(e)) throw new ScriptError('The script is not configured.', 503)
  const u = new URL(e.APPS_SCRIPT_URL as string)
  u.searchParams.set('action', action)
  u.searchParams.set('secret', e.APPS_SCRIPT_SECRET as string)
  for (const [k, v] of Object.entries(params)) if (v !== '') u.searchParams.set(k, v)
  return call(u.toString(), { method: 'GET' })
}

export async function scriptPost(kind: string, body: object, e: Env = env()): Promise<unknown> {
  if (!scriptConfigured(e)) throw new ScriptError('The script is not configured.', 503)
  /* text/plain: Apps Script reads e.postData.contents either way, and it keeps the request simple */
  return call(e.APPS_SCRIPT_URL as string, {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ kind, secret: e.APPS_SCRIPT_SECRET, ...body }),
  })
}
