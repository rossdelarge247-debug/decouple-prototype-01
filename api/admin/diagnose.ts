/* Owner only: does every connection work? Names of variables and outcomes, never values.
   Open /api/admin/diagnose while signed in, or paste the JSON to whoever is helping. */
import { createClient } from '@vercel/global-config'
import { unauthorised, who } from '../../lib/api.js'
import { PRICES, monthOf, readSpend } from '../../lib/claude.js'
import { guideEmail, sendEmail } from '../../lib/email.js'
import { env, siteOrigin } from '../../lib/env.js'
import { securityHeaders } from '../../lib/http.js'
import { scriptConfigured, scriptGet } from '../../lib/script.js'
import { SETTINGS_KEYS, connectionString, normaliseSettings, storeId } from '../../lib/settings.js'

const VARIABLES = [
  'SITE_ORIGIN',
  'LOGIN_PATH',
  'OWNER_PASSWORD_HASH',
  'SESSION_SECRET',
  'TESTER_CODES',
  'APPS_SCRIPT_URL',
  'APPS_SCRIPT_SECRET',
  'RESEND_API_KEY',
  'MAIL_FROM',
  'TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'GLOBAL_CONFIG',
  'GLOBAL_CONFIG_ID',
  'EDGE_CONFIG',
  'EDGE_CONFIG_ID',
  'VERCEL_API_TOKEN',
  'VERCEL_TEAM_ID',
  'DEPLOY_HOOK_URL',
  'CRON_SECRET',
  'ANTHROPIC_API_KEY',
  'CLAUDE_MODEL',
  'CLAUDE_MONTHLY_CAP_USD',
]

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e))

async function timed<T>(ms: number, p: Promise<T>): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`no answer within ${ms} ms`)), ms))])
}

export async function GET(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner) return unauthorised()
  const e = env()
  const present = VARIABLES.filter((k) => !!e[k])
  const missing = VARIABLES.filter((k) => !e[k])

  /* the store, read fresh */
  const conn = connectionString(e)
  const id = storeId(e)
  let store: Record<string, unknown> = { connected: !!conn, id, read: 'skipped: no connection string' }
  if (conn) {
    try {
      const raw = await timed(8000, createClient(conn).getAll([...SETTINGS_KEYS]))
      store = { connected: true, id, read: 'ok', raw, settings: normaliseSettings(raw) }
    } catch (err) {
      store = { connected: true, id, read: 'failed', error: message(err) }
    }
  }

  /* the Vercel API, with the token the switches write with */
  let vercelApi: Record<string, unknown> = { token: !!e.VERCEL_API_TOKEN, teamId: e.VERCEL_TEAM_ID || null, check: 'skipped' }
  if (e.VERCEL_API_TOKEN && id) {
    const u = new URL(`https://api.vercel.com/v1/global-config/${encodeURIComponent(id)}`)
    if (e.VERCEL_TEAM_ID) u.searchParams.set('teamId', e.VERCEL_TEAM_ID)
    try {
      const res = await timed(8000, fetch(u, { headers: { authorization: `Bearer ${e.VERCEL_API_TOKEN}` } }))
      const body = await res.text()
      vercelApi = {
        token: true,
        teamId: e.VERCEL_TEAM_ID || null,
        check: res.ok ? 'ok: the token can read the store, so it can write it' : `failed: Vercel returned ${res.status}`,
        detail: res.ok ? undefined : body.slice(0, 300),
      }
    } catch (err) {
      vercelApi = { token: true, teamId: e.VERCEL_TEAM_ID || null, check: 'failed', error: message(err) }
    }
  } else if (e.VERCEL_API_TOKEN && !id) vercelApi.check = 'skipped: no store id (connect the store first)'

  /* the Google script */
  let script: Record<string, unknown> = { configured: scriptConfigured(e), check: 'skipped' }
  if (scriptConfigured(e)) {
    try {
      const data = (await timed(12000, scriptGet('codes', {}, e))) as { codes?: unknown[] }
      script = { configured: true, check: 'ok', codes: Array.isArray(data.codes) ? data.codes.length : 'unexpected shape' }
    } catch (err) {
      script = { configured: true, check: 'failed', error: message(err) }
    }
  }

  /* the AI proxy: set up or not, and this month's estimated spend from the store */
  let aiSpend: unknown = 'skipped: no store'
  if (conn) {
    try {
      const raw = readSpend(await timed(8000, createClient(conn).get('aiSpend')))
      aiSpend = raw && raw.month === monthOf(Date.now()) ? raw : { month: monthOf(Date.now()), usd: 0 }
    } catch (err) {
      aiSpend = { read: 'failed', error: message(err) }
    }
  }
  const capUsd = Number(e.CLAUDE_MONTHLY_CAP_USD)
  const ai = {
    configured: !!(e.ANTHROPIC_API_KEY && e.CLAUDE_MODEL && capUsd > 0),
    key: !!e.ANTHROPIC_API_KEY,
    model: e.CLAUDE_MODEL || null,
    modelPriced: e.CLAUDE_MODEL ? e.CLAUDE_MODEL in PRICES : null,
    monthlyCapUsd: capUsd > 0 ? capUsd : null,
    spendThisMonth: aiSpend,
    note: 'until the key, the model and the cap are all set, /api/claude answers 503 and the AI features say they are unavailable',
  }

  /* the help content this deployment serves: how much of GOV.UK the last build fetched (spec §5.2) */
  let help: Record<string, unknown> = { read: 'skipped' }
  try {
    const res = await timed(5000, fetch(new URL('/help/help-content.json', request.url)))
    const c = res.ok ? ((await res.json()) as { built?: unknown; pages?: Record<string, unknown>; forms?: unknown[] }) : null
    help = c
      ? { read: 'ok', built: c.built ?? null, pages: c.pages ? Object.keys(c.pages).length : 0, forms: Array.isArray(c.forms) ? c.forms.length : 0, note: 'built null or 0 pages: the last build could not reach GOV.UK, and the page shows links instead' }
      : { read: `failed: ${res.status}` }
  } catch (err) {
    help = { read: 'failed', error: message(err) }
  }

  /* ?email=1 sends the guide email, with a dummy link, to the from address, and reports what Resend said */
  const url = new URL(request.url)
  let emailTest: Record<string, unknown> | undefined
  if (url.searchParams.get('email') === '1') {
    const from = e.MAIL_FROM || 'Decouple <hello@decouple.uk>'
    const m = from.match(/<([^>]+)>/)
    const to = (m ? m[1] : from).trim()
    const sent = await sendEmail(to, guideEmail(`${siteOrigin(e)}/guide#g=test`), e)
    emailTest = { to, ...sent }
  }

  const report = {
    at: new Date().toISOString(),
    deployment: {
      environment: e.VERCEL_ENV || null,
      region: e.VERCEL_REGION || null,
      url: e.VERCEL_URL || null,
      commit: e.VERCEL_GIT_COMMIT_SHA ? e.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : null,
      branch: e.VERCEL_GIT_COMMIT_REF || null,
      node: typeof process !== 'undefined' && process.version ? process.version : null,
    },
    session: { owner: w.owner, testing: w.testing, settingsAsTheFunctionsSeeThem: w.settings },
    origin: { siteOrigin: siteOrigin(e), requestHost: url.host, note: 'guide links must start with siteOrigin, so open the guide on that host' },
    variables: { present, missing },
    store,
    vercelApi,
    script,
    email: { configured: !!e.RESEND_API_KEY, from: e.MAIL_FROM || 'Decouple <hello@decouple.uk> (default)', test: emailTest ?? 'add ?email=1 to send the guide email to the from address and see what Resend says' },
    turnstile: { siteKey: !!e.TURNSTILE_SITE_KEY, secret: !!e.TURNSTILE_SECRET_KEY },
    ai,
    deployHook: { configured: !!e.DEPLOY_HOOK_URL, looksRight: /^https:\/\/api\.vercel\.com\//.test(e.DEPLOY_HOOK_URL || '') },
    weeklyRebuild: { cronSecret: (e.CRON_SECRET || '').trim().length >= 16, schedule: 'Mondays 05:00 UTC (vercel.json)', note: 'refreshes the help content from GOV.UK; needs CRON_SECRET (16+ characters) and the deploy hook' },
    help,
    whatTheSwitchesNeed: ['GLOBAL_CONFIG (added by connecting the store)', 'VERCEL_API_TOKEN', 'then a redeploy'],
  }
  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', ...securityHeaders(true) },
  })
}
