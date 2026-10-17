/* Owner only: does every connection work? Names of variables and outcomes, never values.
   Open /api/admin/diagnose while signed in, or paste the JSON to whoever is helping. */
import { createClient } from '@vercel/global-config'
import { unauthorised, who } from '../../lib/api.js'
import { PRICES, monthOf, readSpend } from '../../lib/claude.js'
import { guideEmail, sendEmail } from '../../lib/email.js'
import { helpReady } from '../../lib/help.js'
import { env, siteOrigin } from '../../lib/env.js'
import { securityHeaders } from '../../lib/http.js'
import { scriptConfigured, scriptGet } from '../../lib/script.js'
import { FRESH, SETTINGS_KEYS, configuredStoreId, connectionStoreId, connectionString, normaliseSettings, storeId } from '../../lib/settings.js'

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

  /* the store, read fresh; where the site reads it from and where the switches write */
  const conn = connectionString(e)
  const id = storeId(e)
  const readsFrom = connectionStoreId(e)
  const byHand = configuredStoreId(e)
  const where = {
    readsFrom,
    readsVia: e.GLOBAL_CONFIG ? 'GLOBAL_CONFIG' : e.EDGE_CONFIG ? 'EDGE_CONFIG' : null,
    writesTo: id,
    idSetByHand: byHand,
    ...(byHand && readsFrom && byHand !== readsFrom
      ? { warning: `GLOBAL_CONFIG_ID or EDGE_CONFIG_ID names ${byHand}, a different store from the one the site reads (${readsFrom}). The switches write to ${readsFrom}; delete the ID variable in Vercel.` }
      : {}),
  }
  let store: Record<string, unknown> = { connected: !!conn, id, ...where, read: 'skipped: no connection string' }
  if (conn) {
    try {
      const raw = await timed(8000, createClient(conn).getAll([...SETTINGS_KEYS], FRESH))
      store = { connected: true, id, ...where, read: 'ok', raw, settings: normaliseSettings(raw) }
    } catch (err) {
      store = { connected: true, id, ...where, read: 'failed', error: message(err) }
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
      /* the settings as the API sees them, in the store written to, and in any other store an ID variable names */
      for (const [label, sid] of [['itemsInStoreWrittenTo', id], ['itemsInStoreSetByHand', byHand && byHand !== id ? byHand : null]] as const) {
        if (!sid) continue
        const iu = new URL(`https://api.vercel.com/v1/global-config/${encodeURIComponent(sid)}/items`)
        if (e.VERCEL_TEAM_ID) iu.searchParams.set('teamId', e.VERCEL_TEAM_ID)
        try {
          const ir = await timed(8000, fetch(iu, { headers: { authorization: `Bearer ${e.VERCEL_API_TOKEN}` } }))
          const list = ir.ok ? ((await ir.json()) as unknown) : null
          const items = Array.isArray(list) ? Object.fromEntries((list as { key?: unknown; value?: unknown }[]).filter((it) => typeof it.key === 'string' && (SETTINGS_KEYS as readonly string[]).includes(it.key)).map((it) => [it.key as string, it.value])) : null
          vercelApi[label] = items ? { store: sid, ...items } : { store: sid, read: `failed: Vercel returned ${ir.status}` }
        } catch (err) {
          vercelApi[label] = { store: sid, read: 'failed', error: message(err) }
        }
      }
    } catch (err) {
      vercelApi = { token: true, teamId: e.VERCEL_TEAM_ID || null, check: 'failed', error: message(err) }
    }
  } else if (e.VERCEL_API_TOKEN && !id) vercelApi.check = 'skipped: no store id (connect the store first)'

  /* ?write=1: write a probe item the way the switches write, read it back both ways, then remove it */
  let writeTest: Record<string, unknown> = { run: 'add ?write=1 to write a test item, read it back and remove it' }
  if (new URL(request.url).searchParams.get('write') === '1' && e.VERCEL_API_TOKEN && id && conn) {
    const value = 'probe ' + new Date().toISOString()
    const iu = new URL(`https://api.vercel.com/v1/global-config/${encodeURIComponent(id)}/items`)
    if (e.VERCEL_TEAM_ID) iu.searchParams.set('teamId', e.VERCEL_TEAM_ID)
    const send = (items: unknown[]) => timed(8000, fetch(iu, { method: 'PATCH', headers: { authorization: `Bearer ${e.VERCEL_API_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ items }) }))
    writeTest = { store: id, url: iu.pathname }
    try {
      const w = await send([{ operation: 'upsert', key: 'diagnoseProbe', value }])
      writeTest.write = { status: w.status, body: (await w.text()).slice(0, 300) }
      await new Promise((r) => setTimeout(r, 1500))
      try {
        const viaConnection = await timed(8000, createClient(conn).get('diagnoseProbe', FRESH))
        writeTest.readByConnection = viaConnection === value ? 'ok: the site reads what was written' : `different: ${JSON.stringify(viaConnection ?? null)}`
      } catch (err) {
        writeTest.readByConnection = 'failed: ' + message(err)
      }
      try {
        const r = await timed(8000, fetch(iu, { headers: { authorization: `Bearer ${e.VERCEL_API_TOKEN}` } }))
        const list = r.ok ? ((await r.json()) as unknown) : null
        const found = Array.isArray(list) ? (list as { key?: unknown; value?: unknown }[]).find((it) => it.key === 'diagnoseProbe') : undefined
        writeTest.readByApi = !r.ok ? `failed: Vercel returned ${r.status}` : found ? (found.value === value ? 'ok: the API holds what was written' : `different: ${JSON.stringify(found.value)}`) : 'missing: the API has no such item'
      } catch (err) {
        writeTest.readByApi = 'failed: ' + message(err)
      }
      const d = await send([{ operation: 'delete', key: 'diagnoseProbe' }])
      writeTest.removed = d.ok ? 'ok' : `Vercel returned ${d.status}`
    } catch (err) {
      writeTest.error = message(err)
    }
  }

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
      const raw = readSpend(await timed(8000, createClient(conn).get('aiSpend', FRESH)))
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
    helpAssistant: helpReady() ? 'in this build: anyone on /help who passes the person check may ask it, 15 an hour and 40 a day each' : 'not in this build',
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
    writeTest,
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
