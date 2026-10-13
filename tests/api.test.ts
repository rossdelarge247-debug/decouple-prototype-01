import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as answers } from '../api/answers.js'
import { POST as email } from '../api/email.js'
import { POST as login } from '../api/login.js'
import { POST as logout } from '../api/logout.js'
import { GET as results } from '../api/results.js'
import { GET as session } from '../api/session.js'
import { POST as signup } from '../api/signup.js'
import { POST as tester } from '../api/tester.js'
import { GET as codesGet, POST as codesPost } from '../api/admin/codes.js'
import { POST as publish } from '../api/admin/publish.js'
import { GET as siteGet, POST as sitePost } from '../api/admin/site.js'
import { hashPassword } from '../lib/password.js'
import { cookieFor, post, req, setup } from './helpers.js'

const SCRIPT = { APPS_SCRIPT_URL: 'https://script.google.com/macros/s/x/exec', APPS_SCRIPT_SECRET: 'shh' }

function mockFetch(handler: (url: string, init?: RequestInit) => unknown) {
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const out = handler(url, init)
    return out instanceof Response ? out : new Response(JSON.stringify(out), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => setup())
afterEach(() => vi.unstubAllGlobals())

const batch = (over: Record<string, unknown> = {}) => ({
  batchKey: 'k1',
  sid: 'm02-1',
  test: 'M02 Guide',
  step: 'about',
  price: 'A',
  landing: 'a',
  device: '390×844',
  hp: '',
  rows: [{ qid: 'm02.stage', qv: 1, q: 'q', type: 'cards', a: 'decided' }],
  ...over,
})

describe('/api/session', () => {
  it('reports who is asking, the mode and the switches', async () => {
    const anon = await (await session(req('/api/session'))).json()
    expect(anon).toEqual({ owner: false, tester: false, human: false, testing: false, mode: 'holding', requireCode: true, turnstileSiteKey: '' })
    const t = await (await session(req('/api/session', { cookie: await cookieFor('tester', { l: 'Me · phone', c: 'MINT-OWL-12', t: 1 }) }))).json()
    expect(t).toMatchObject({ tester: true, testing: true, label: 'Me · phone' })
    setup({ testMode: true })
    const o = await (await session(req('/api/session', { cookie: await cookieFor('owner') }))).json()
    expect(o).toMatchObject({ owner: true, testing: true })
    const off = await (await session(req('/api/session', { cookie: await cookieFor('tester', { l: 'Old', c: 'CLAY-RIVER-81' }) }))).json()
    expect(off.tester).toBe(false)
  })
})

describe('/api/login and /api/logout', () => {
  it('needs configuration, rejects a wrong password slowly, and sets the owner cookie', async () => {
    expect((await login(post('/api/login', { password: 'x' }))).status).toBe(503)
    process.env.OWNER_PASSWORD_HASH = hashPassword('correct horse battery staple')
    const t0 = Date.now()
    const wrong = await login(post('/api/login', { password: 'wrong password' }))
    expect(wrong.status).toBe(401)
    expect(Date.now() - t0).toBeGreaterThanOrEqual(750)
    const ok = await login(post('/api/login', { password: 'correct horse battery staple' }))
    expect(ok.status).toBe(200)
    expect(ok.headers.get('set-cookie')).toMatch(/^dc_owner=.*HttpOnly.*Secure/)
    expect((await login(post('/api/login', { nope: 1 }))).status).toBe(400)
    const out = await logout()
    expect(out.headers.getSetCookie().map((c) => c.split(';')[0])).toEqual(['dc_owner=', 'dc_tester='])
  }, 10_000)

  it('rejects bodies over 64 KB', async () => {
    process.env.OWNER_PASSWORD_HASH = hashPassword('correct horse battery staple')
    expect((await login(post('/api/login', { password: 'x'.repeat(70_000) }))).status).toBe(413)
  })
})

describe('/api/tester', () => {
  it('redeems a live code and refuses the rest', async () => {
    const fetch = mockFetch(() => ({ ok: true, codes: [] }))
    Object.assign(process.env, SCRIPT)
    const r = await tester(post('/api/tester', { code: ' fern-lark-27 ' }))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, label: 'P01' })
    expect(r.headers.get('set-cookie')).toMatch(/^dc_tester=/)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(String(fetch.mock.calls[0][1]?.body)).toContain('"kind":"code_used"')
    expect((await tester(post('/api/tester', { code: 'CLAY-RIVER-81' }))).status).toBe(404)
    expect((await tester(post('/api/tester', { code: '' }))).status).toBe(400)
  })
})

describe('/api/answers', () => {
  it('needs a session, then sends a cleaned batch to the script', async () => {
    const fetch = mockFetch(() => ({ ok: true }))
    Object.assign(process.env, SCRIPT)
    expect((await answers(post('/api/answers', batch()))).status).toBe(401)
    expect((await answers(post('/api/answers', batch(), await cookieFor('human')))).status).toBe(401)
    const r = await answers(post('/api/answers', batch({ pid: 'typed', rows: [...batch().rows, { qid: 'm02.safe', qv: 1, q: 's', type: 'cards', a: 'safe' }] }), await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' })))
    expect(r.status).toBe(200)
    const sent = JSON.parse(String(fetch.mock.calls[0][1]?.body))
    expect(sent).toMatchObject({ kind: 'answers', secret: 'shh', batchKey: 'k1', pid: 'P01', test: 'M02 Guide' })
    expect(sent.rows.map((x: { qid: string }) => x.qid)).toEqual(['m02.stage'])
  })

  it('lets a person through when codes are not required, and the owner keep the typed participant ID', async () => {
    const fetch = mockFetch(() => ({ ok: true }))
    setup({ requireCode: false })
    Object.assign(process.env, SCRIPT)
    expect((await answers(post('/api/answers', batch(), await cookieFor('human')))).status).toBe(200)
    await answers(post('/api/answers', batch({ pid: 'P07', test: 'Prototype testing' }), await cookieFor('owner')))
    expect(JSON.parse(String(fetch.mock.calls[1][1]?.body)).pid).toBe('P07')
  })

  it('saves nothing in test mode or with a test code, and reports 400, 502 and 429 honestly', async () => {
    const fetch = mockFetch(() => new Response('nope', { status: 500 }))
    Object.assign(process.env, SCRIPT)
    const testCode = await cookieFor('tester', { l: 'Me', c: 'MINT-OWL-12', t: 1 })
    expect(await (await answers(post('/api/answers', batch(), testCode))).json()).toEqual({ ok: true, test: true })
    setup({ testMode: true })
    expect(await (await answers(post('/api/answers', batch(), await cookieFor('owner')))).json()).toEqual({ ok: true, test: true })
    expect(fetch).not.toHaveBeenCalled()
    setup()
    Object.assign(process.env, SCRIPT)
    const tester = await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' })
    expect((await answers(post('/api/answers', batch({ test: 'M09' }), tester))).status).toBe(400)
    expect((await answers(post('/api/answers', batch(), tester))).status).toBe(502)
    expect((await answers(post('/api/answers', batch({ hp: 'bot' }), tester))).status).toBe(200)
    for (let i = 0; i < 120; i++) await answers(post('/api/answers', batch({ hp: 'bot' }), tester))
    expect((await answers(post('/api/answers', batch(), tester))).status).toBe(429)
  })
})

describe('/api/signup and /api/email', () => {
  it('needs a human, cleans the sign-up and respects test mode', async () => {
    const fetch = mockFetch(() => ({ ok: true }))
    Object.assign(process.env, SCRIPT)
    const body = { email: 'you@example.com', stage: 'thinking', source: 'holding:direct', sid: 's1', hp: '' }
    expect((await signup(post('/api/signup', body))).status).toBe(403)
    expect((await signup(post('/api/signup', body, await cookieFor('human')))).status).toBe(200)
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({ kind: 'signup', email: 'you@example.com', source: 'holding:direct' })
    expect((await signup(post('/api/signup', { ...body, source: 'x' }, await cookieFor('human')))).status).toBe(400)
    setup({ testMode: true })
    expect(await (await signup(post('/api/signup', body, await cookieFor('owner')))).json()).toEqual({ ok: true, test: true })
  })

  it('sends the guide email through Resend, with the fixed template and three a day', async () => {
    const fetch = mockFetch(() => ({ id: 'e1' }))
    process.env.RESEND_API_KEY = 're_test'
    const tester = await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' })
    const body = { email: 'you@example.com', link: 'https://decouple.uk/guide#g=abc', sid: 'm02-1' }
    expect((await email(post('/api/email', body))).status).toBe(401)
    expect((await email(post('/api/email', { ...body, link: 'https://evil.example/guide' }, tester))).status).toBe(400)
    expect((await email(post('/api/email', { ...body, email: 'nope' }, tester))).status).toBe(400)
    const r = await email(post('/api/email', body, tester))
    expect(r.status).toBe(200)
    const sent = JSON.parse(String(fetch.mock.calls[0][1]?.body))
    expect(sent.subject).toBe('Your guide')
    expect(sent.to).toEqual(['you@example.com'])
    expect(sent.html).toContain('Open your guide')
    expect(sent.html).toContain('https://decouple.uk/guide#g=abc')
    expect(sent.text).toContain('Decouple is not a law firm. This guide is not legal advice.')
    await email(post('/api/email', body, tester))
    await email(post('/api/email', body, tester))
    expect((await email(post('/api/email', body, tester))).status).toBe(429)
  })
})

describe('owner-only routes', () => {
  it('refuse everyone else', async () => {
    const tester = await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' })
    expect((await results(req('/api/results', { cookie: tester }))).status).toBe(401)
    expect((await siteGet(req('/api/admin/site'))).status).toBe(401)
    expect((await sitePost(post('/api/admin/site', { mode: 'guide' }, tester))).status).toBe(401)
    expect((await codesGet(req('/api/admin/codes'))).status).toBe(401)
    expect((await codesPost(post('/api/admin/codes', { action: 'delete', code: 'X' }, tester))).status).toBe(401)
    expect((await publish(post('/api/admin/publish', {}, tester))).status).toBe(401)
  })

  it('reads results and settings for the owner', async () => {
    mockFetch((url) => (url.includes('action=results') ? { ok: true, rows: [{ sid: 's', qid: 'q' }], signups: { count: 1, byStage: {}, byDay: {} } } : { ok: true }))
    Object.assign(process.env, SCRIPT)
    const owner = await cookieFor('owner')
    const r = await (await results(req('/api/results?test=M02%20Guide&since=2026-10-01', { cookie: owner }))).json()
    expect(r.rows).toHaveLength(1)
    expect(r.signups.count).toBe(1)
    expect((await results(req('/api/results?since=yesterday', { cookie: owner }))).status).toBe(400)
    expect(await (await siteGet(req('/api/admin/site', { cookie: owner }))).json()).toEqual({ mode: 'holding', requireCode: true, testMode: false })
    expect((await sitePost(post('/api/admin/site', { mode: 'open' }, owner))).status).toBe(400)
    expect((await sitePost(post('/api/admin/site', { mode: 'guide' }, owner))).status).toBe(502)
  })

  it('writes settings through the Vercel API when configured', async () => {
    const fetch = mockFetch(() => ({ status: 'ok' }))
    Object.assign(process.env, { GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_1?token=t', VERCEL_API_TOKEN: 'tok', VERCEL_TEAM_ID: 'team_9' })
    const owner = await cookieFor('owner')
    const r = await sitePost(post('/api/admin/site', { mode: 'guide', testMode: true }, owner))
    expect(await r.json()).toEqual({ mode: 'guide', requireCode: true, testMode: true })
    const [url, init] = fetch.mock.calls[0]
    expect(String(url)).toBe('https://api.vercel.com/v1/global-config/ecfg_1/items?teamId=team_9')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(String(init?.body))).toEqual({ items: [{ operation: 'upsert', key: 'mode', value: 'guide' }, { operation: 'upsert', key: 'testMode', value: true }] })
  })

  it('validates code operations before passing them to the script', async () => {
    const fetch = mockFetch(() => ({ ok: true, codes: [{ code: 'FERN-LARK-27', label: 'P01', active: 'TRUE', test: false, expires: '' }] }))
    Object.assign(process.env, SCRIPT)
    const owner = await cookieFor('owner')
    expect((await codesPost(post('/api/admin/codes', { action: 'create', codes: [{ code: 'bad code', label: '' }] }, owner))).status).toBe(400)
    expect((await codesPost(post('/api/admin/codes', { action: 'create', codes: [{ code: 'A-B-01', label: 'x'.repeat(41) }] }, owner))).status).toBe(400)
    expect((await codesPost(post('/api/admin/codes', { action: 'create', codes: Array.from({ length: 21 }, (_, i) => ({ code: `AA-BB-${String(i).padStart(2, '0')}` })) }, owner))).status).toBe(400)
    expect((await codesPost(post('/api/admin/codes', { action: 'create', codes: [{ code: 'A-B-01' }, { code: 'a-b-01' }] }, owner))).status).toBe(400)
    expect((await codesPost(post('/api/admin/codes', { action: 'update', code: 'A-B-01' }, owner))).status).toBe(400)
    expect((await codesPost(post('/api/admin/codes', { action: 'update', code: 'A-B-01', expires: '3 Nov' }, owner))).status).toBe(400)
    const r = await codesPost(post('/api/admin/codes', { action: 'create', codes: [{ code: 'fern-lark-27', label: 'P01', expires: '2026-11-03', test: false }] }, owner))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ codes: [{ code: 'FERN-LARK-27', label: 'P01', active: true, test: false, expires: '' }] })
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({ kind: 'codes', op: 'create', codes: [{ code: 'FERN-LARK-27', label: 'P01', expires: '2026-11-03', test: false }] })
    expect((await codesGet(req('/api/admin/codes', { cookie: owner }))).status).toBe(200)
  })

  it('calls the deploy hook only when it is a Vercel one', async () => {
    const fetch = mockFetch(() => ({ job: {} }))
    const owner = await cookieFor('owner')
    expect((await publish(post('/api/admin/publish', {}, owner))).status).toBe(503)
    process.env.DEPLOY_HOOK_URL = 'https://api.vercel.com/v1/integrations/deploy/prj_x/abc'
    expect((await publish(post('/api/admin/publish', {}, owner))).status).toBe(200)
    expect(fetch.mock.calls[0][1]?.method).toBe('POST')
  })
})
