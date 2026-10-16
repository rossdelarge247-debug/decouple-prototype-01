/* The deploy hook (spec §7): a rebuild of production, which re-reads the questions and refreshes
   the help content from GOV.UK. Called by Publish in Site settings and by the weekly cron. */
import { env, type Env } from './env.js'

export type HookResult = { ok: true } | { ok: false; status: number; error: string }

export function hookConfigured(e: Env = env()): boolean {
  return /^https:\/\/api\.vercel\.com\//.test(e.DEPLOY_HOOK_URL || '')
}

export async function callDeployHook(e: Env = env()): Promise<HookResult> {
  const hook = e.DEPLOY_HOOK_URL
  if (!hook || !hookConfigured(e)) return { ok: false, status: 503, error: 'Publishing is not configured.' }
  try {
    const res = await fetch(hook, { method: 'POST' })
    if (!res.ok) return { ok: false, status: 502, error: `Vercel returned ${res.status}.` }
  } catch {
    return { ok: false, status: 502, error: 'Vercel did not answer.' }
  }
  return { ok: true }
}

/* Vercel Cron sends Authorization: Bearer <CRON_SECRET>. No secret set means no cron call is accepted. */
export function cronAllowed(request: Request, e: Env = env()): boolean {
  const secret = (e.CRON_SECRET || '').trim()
  if (secret.length < 16) return false
  const got = request.headers.get('authorization') || ''
  const want = `Bearer ${secret}`
  if (got.length !== want.length) return false
  let diff = 0
  for (let i = 0; i < want.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i)
  return diff === 0
}
