#!/usr/bin/env node
/* Local emulation of how Vercel serves the site: middleware.ts in front, then dist/ or api/.
   npm run build && npm run dev   →  http://localhost:3000
   Reads .env.local if present. With MOCK=1 (the default when APPS_SCRIPT_URL is not set) the
   Google script, Global Config, the Vercel API, Resend and Turnstile are mocked in this process,
   so the spec §11 checks that do not need Vercel itself can be run here. State: GET /__mock. */
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { gzipSync } from 'node:zlib'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { hashPassword } from './hash-password.mjs'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild')
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, '.dev')

/* ── env ── */
const envFile = join(ROOT, '.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}
const PORT = Number(process.env.PORT || 3000)
const MOCK = process.env.MOCK === '1' || (process.env.MOCK !== '0' && !process.env.APPS_SCRIPT_URL)
process.env.SITE_ORIGIN ||= `http://localhost:${PORT}`
process.env.SESSION_SECRET ||= 'local-development-secret-not-for-production'
process.env.OWNER_PASSWORD_HASH ||= hashPassword(process.env.DEV_PASSWORD || 'decouple-dev')

/* ── mocks: in-memory stand-ins for every service the site talks to ── */
const mock = {
  settings: { mode: 'holding', requireCode: true, testMode: false, landing: 'a' },
  codes: [
    { code: 'FERN-LARK-27', label: 'P01', active: true, test: false, expires: '', created: new Date().toISOString(), uses: 0, last_used: '' },
    { code: 'MINT-OWL-12', label: 'Me · phone', active: true, test: true, expires: '', created: new Date().toISOString(), uses: 0, last_used: '' },
  ],
  tabs: {},
  signups: [],
  questions: [],
  emails: [],
  seen: new Set(),
  deploys: 0,
}
const jsonRes = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
function mockScript(url, init) {
  const u = new URL(url)
  if (init?.method === 'POST') {
    const b = JSON.parse(String(init.body))
    if (b.secret !== 'mock') return jsonRes({ ok: false, error: 'Forbidden' })
    if (b.kind === 'answers') {
      if (mock.seen.has(b.batchKey)) return jsonRes({ ok: true, duplicate: true })
      mock.seen.add(b.batchKey)
      const tab = (mock.tabs[b.test] ||= [])
      const now = new Date().toISOString()
      for (const r of b.rows) tab.push({ received_at: now, batch_key: b.batchKey, sid: b.sid, pid: b.pid, test: b.test, step: b.step, price: b.price, landing: b.landing, qid: r.qid, qv: r.qv, question: r.q, type: r.type, answer: r.a, device: b.device })
      return jsonRes({ ok: true, rows: b.rows.length })
    }
    if (b.kind === 'signup') {
      mock.signups.push({ received_at: new Date().toISOString(), email: b.email, stage: b.stage, source: b.source, sid: b.sid })
      return jsonRes({ ok: true })
    }
    if (b.kind === 'codes') {
      if (b.op === 'create') for (const c of b.codes) {
        if (mock.codes.some((x) => x.code === c.code)) return jsonRes({ ok: false, error: c.code + ' already exists' })
        mock.codes.unshift({ code: c.code, label: c.label, active: true, test: !!c.test, expires: c.expires || '', created: new Date().toISOString(), uses: 0, last_used: '' })
      }
      if (b.op === 'update') mock.codes = mock.codes.map((x) => (x.code === b.code ? { ...x, ...Object.fromEntries(Object.entries(b).filter(([k]) => ['active', 'test', 'label', 'expires'].includes(k))) } : x))
      if (b.op === 'delete') mock.codes = mock.codes.filter((x) => x.code !== b.code)
      return jsonRes({ ok: true, codes: mock.codes })
    }
    if (b.kind === 'code_used') {
      mock.codes = mock.codes.map((x) => (x.code === b.code ? { ...x, uses: (x.uses || 0) + 1, last_used: new Date().toISOString() } : x))
      return jsonRes({ ok: true, codes: mock.codes })
    }
    return jsonRes({ ok: false, error: 'Unknown kind' })
  }
  if (u.searchParams.get('secret') !== 'mock') return jsonRes({ ok: false, error: 'Forbidden' })
  const action = u.searchParams.get('action')
  if (action === 'codes') return jsonRes({ ok: true, codes: mock.codes })
  if (action === 'questions') return jsonRes({ ok: true, questions: mock.questions })
  if (action === 'results') {
    const test = u.searchParams.get('test')
    const rows = (test ? mock.tabs[test] || [] : Object.values(mock.tabs).flat()).map((r) => ({ sid: r.sid, pid: r.pid, test: r.test, step: r.step, price: r.price, landing: r.landing, qid: r.qid, qv: r.qv, q: r.question, type: r.type, a: r.answer, at: r.received_at, device: r.device }))
    const byStage = {}
    const byDay = Array(28).fill(0)
    const today = Date.now()
    for (const s of mock.signups) {
      for (const st of String(s.stage || '').split(';').filter(Boolean)) byStage[st] = (byStage[st] || 0) + 1
      const d = Math.floor((today - Date.parse(s.received_at)) / 86400000)
      if (d >= 0 && d < 28) byDay[27 - d] += 1
    }
    return jsonRes({ ok: true, rows, signups: { count: mock.signups.length, byStage, byDay } })
  }
  return jsonRes({ ok: false, error: 'Unknown action' })
}
if (MOCK) {
  Object.assign(process.env, {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/mock/exec',
    APPS_SCRIPT_SECRET: 'mock',
    GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_mock?token=mock',
    VERCEL_API_TOKEN: 'mock',
    RESEND_API_KEY: 'mock',
    TURNSTILE_SECRET_KEY: 'mock',
    TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    DEPLOY_HOOK_URL: 'https://api.vercel.com/v1/integrations/deploy/mock/mock',
  })
  const real = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const host = new URL(url).host
    if (host === 'script.google.com') return mockScript(url, init)
    if (host === 'global-config.vercel.com' || host === 'edge-config.vercel.com') return jsonRes(mock.settings)
    if (host === 'api.vercel.com') {
      if (url.includes('/global-config/') || url.includes('/edge-config/')) {
        for (const it of JSON.parse(String(init?.body || '{}')).items || []) mock.settings[it.key] = it.value
        return jsonRes({ status: 'ok' })
      }
      mock.deploys += 1
      return jsonRes({ job: { id: 'mock', state: 'PENDING' } })
    }
    if (host === 'api.resend.com') {
      mock.emails.push(JSON.parse(String(init?.body)))
      return jsonRes({ id: 'mock-email-' + mock.emails.length })
    }
    if (host === 'challenges.cloudflare.com') {
      const token = String(init?.body?.get?.('response') || '')
      return jsonRes({ success: token === 'ok' })
    }
    return real(input, init)
  }
}

/* ── bundle middleware and the functions the way a build would ── */
const walk = (dir) => (existsSync(dir) ? require('node:fs').readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.ts') ? [join(dir, d.name)] : [])) : [])
const apiFiles = walk(join(ROOT, 'api'))
await esbuild.build({
  entryPoints: [join(ROOT, 'middleware.ts'), ...apiFiles],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outdir: OUT,
  outbase: ROOT,
  sourcemap: 'inline',
  logLevel: 'warning',
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
})
const load = (rel) => import(pathToFileURL(join(OUT, rel)).href + '?t=' + Date.now())
const middleware = (await load('middleware.js')).default
const api = new Map()
for (const f of apiFiles) {
  const rel = f.slice(ROOT.length + 1).replace(/\.ts$/, '')
  api.set('/' + rel, await load(rel + '.js'))
}

/* ── serving ── */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' }
function staticFile(pathname) {
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  const file = resolve(DIST, '.' + decoded)
  if (!file.startsWith(DIST + sep) || !existsSync(file) || !statSync(file).isFile()) return null
  return new Response(readFileSync(file), { status: 200, headers: { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' } })
}
const notFound = () => new Response(existsSync(join(DIST, '404.html')) ? readFileSync(join(DIST, '404.html')) : 'Not found', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })

async function handle(request) {
  const url = new URL(request.url)
  if (url.pathname === '/__mock') return jsonRes({ ...mock, seen: [...mock.seen] })
  if (url.pathname === '/__mock/reset') {
    mock.tabs = {}
    mock.signups = []
    mock.emails = []
    mock.seen = new Set()
    mock.settings = { mode: 'holding', requireCode: true, testMode: false, landing: 'a' }
    return jsonRes({ ok: true })
  }
  const mw = await middleware(request)
  const extra = new Headers()
  for (const [k, v] of mw.headers) if (!k.startsWith('x-middleware-')) extra.append(k, v)
  let res
  const rewrite = mw.headers.get('x-middleware-rewrite')
  if (rewrite) res = staticFile(new URL(rewrite, request.url).pathname) || notFound()
  else if (mw.headers.get('x-middleware-next') === '1') {
    if (url.pathname.startsWith('/api/')) {
      const mod = api.get(url.pathname)
      const fn = mod && mod[request.method]
      res = fn ? await fn(request) : jsonRes({ ok: false, error: mod ? 'Method not allowed.' : 'Not found.' }, mod ? 405 : 404)
    } else res = staticFile(url.pathname) || notFound()
  } else return mw
  const out = new Response(res.body, { status: res.status, headers: res.headers })
  for (const [k, v] of extra) if (k === 'set-cookie') out.headers.append(k, v)
  else out.headers.set(k, v)
  return out
}

const server = createServer(async (req, res) => {
  try {
    const chunks = []
    if (req.method !== 'GET' && req.method !== 'HEAD') for await (const c of req) chunks.push(c)
    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
    headers.set('x-real-ip', req.socket.remoteAddress || '127.0.0.1')
    const init = { method: req.method, headers }
    if (chunks.length) init.body = Buffer.concat(chunks)
    const r = await handle(new Request(`http://${req.headers.host || 'localhost:' + PORT}${req.url}`, init))
    const list = []
    for (const [k, v] of r.headers) if (k !== 'set-cookie') list.push([k, v])
    for (const c of r.headers.getSetCookie()) list.push(['set-cookie', c])
    let out = Buffer.from(await r.arrayBuffer())
    /* Vercel compresses text on the way out; do the same so local measurements are fair */
    const type = r.headers.get('content-type') || ''
    if (out.length > 1024 && /text\/|json|javascript|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      out = gzipSync(out)
      list.push(['content-encoding', 'gzip'], ['vary', 'accept-encoding'])
    }
    res.writeHead(r.status, list)
    res.end(out)
  } catch (e) {
    console.error(e)
    res.writeHead(500, { 'content-type': 'text/plain' })
    res.end('dev server error: ' + e.message)
  }
})
server.listen(PORT, () => console.log(`[dev] http://localhost:${PORT}  (${MOCK ? 'mocked services; owner password: ' + (process.env.DEV_PASSWORD || 'decouple-dev') : 'real services from .env.local'})`))
