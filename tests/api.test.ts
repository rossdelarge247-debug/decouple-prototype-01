import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as answers } from '../api/answers.js'
import { POST as email } from '../api/email.js'
import { POST as login } from '../api/login.js'
import { POST as participant } from '../api/participant.js'
import { POST as logout } from '../api/logout.js'
import { GET as results } from '../api/results.js'
import { GET as session } from '../api/session.js'
import { POST as signup } from '../api/signup.js'
import { POST as tester } from '../api/tester.js'
import { GET as codesGet, POST as codesPost } from '../api/admin/codes.js'
import { POST as publish } from '../api/admin/publish.js'
import { GET as rebuild } from '../api/cron/rebuild.js'
import { GET as siteGet, POST as sitePost } from '../api/admin/site.js'
import { hashPassword } from '../lib/password.js'
import { usePdfMaker } from '../lib/pdf.js'
import { useSettingsReader } from '../lib/settings.js'
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
    expect(anon).toEqual({ owner: false, tester: false, human: false, testing: false, mode: 'holding', requireCode: true, landing: 'a', turnstileSiteKey: '' })
    const t = await (await session(req('/api/session', { cookie: await cookieFor('tester', { l: 'Me · phone', c: 'MINT-OWL-12', t: 1 }) }))).json()
    expect(t).toMatchObject({ tester: true, testing: true, label: 'Me · phone' })
    setup({ testMode: true })
    const o = await (await session(req('/api/session', { cookie: await cookieFor('owner') }))).json()
    expect(o).toMatchObject({ owner: true, testing: true })
    const off = await (await session(req('/api/session', { cookie: await cookieFor('tester', { l: 'Old', c: 'CLAY-RIVER-81' }) }))).json()
    expect(off.tester).toBe(false)
    expect(off.track).toBeUndefined()
  })

  it('gives testers their track and session type, and nobody else (spec §7)', async () => {
    const chosen = await (await session(req('/api/session', { cookie: await cookieFor('tester', { l: 'P03', c: 'ASH-FINCH-55' }) }))).json()
    expect(chosen).toMatchObject({ tester: true, label: 'P03', track: 'p03,m05', trackMode: 'mod' })
    const guideOnly = await (await session(req('/api/session', { cookie: await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' }) }))).json()
    expect(guideOnly).toMatchObject({ track: '', trackMode: 'un' })
    const owner = await (await session(req('/api/session', { cookie: await cookieFor('owner') }))).json()
    expect('track' in owner || 'trackMode' in owner).toBe(false)
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
    expect((await signup(post('/api/signup', { ...body, source: 'help' }, await cookieFor('human')))).status).toBe(200)
    expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toMatchObject({ kind: 'signup', source: 'help' })
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
    fetch.mockImplementationOnce(async () => new Response('{"message":"The decouple.uk domain is not verified"}', { status: 403 }))
    const failed = await email(post('/api/email', { ...body, sid: 'm02-2' }, await cookieFor('owner')))
    expect(failed.status).toBe(502)
    expect(await failed.json()).toMatchObject({ ok: false, detail: expect.stringContaining('403') })
    fetch.mockImplementationOnce(async () => new Response('{"message":"The decouple.uk domain is not verified"}', { status: 403 }))
    const failedTester = await email(post('/api/email', { ...body, sid: 'm02-3' }, tester))
    expect(await failedTester.json()).toEqual({ ok: false, error: 'The email could not be sent just now.' })
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

  it('attaches the guide as a PDF only when asked, and sends the link email anyway when it fails (spec §7)', async () => {
    const fetch = mockFetch(() => ({ id: 'e1' }))
    process.env.RESEND_API_KEY = 're_test'
    const tester = await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' })
    const link = 'https://decouple.uk/guide#g=eyJzdGFnZSI6ImRlY2lkZWQifQ'
    const bytes = new Uint8Array([37, 80, 68, 70, 45])
    const maker = vi.fn(async () => ({ ok: true as const, pdf: bytes }))
    usePdfMaker(maker)
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const sentBody = (i: number) => JSON.parse(String(fetch.mock.calls[i][1]?.body))

    const r = await email(post('/api/email', { email: 'you@example.com', link, sid: 'm02-p1', pdf: true }, tester))
    expect(await r.json()).toEqual({ ok: true, pdf: true })
    expect(maker).toHaveBeenCalledWith(link, expect.any(Number))
    expect(sentBody(0).attachments).toEqual([{ filename: 'Your guide.pdf', content: Buffer.from(bytes).toString('base64') }])
    expect(sentBody(0).subject).toBe('Your guide')
    expect(sentBody(0).html).toContain('A PDF copy of your guide is attached.')
    expect(sentBody(0).text).toContain('A PDF copy of your guide is attached.')
    /* logs whether it was attached and how long it took, never the link or the address */
    const line = JSON.parse(String(log.mock.calls.at(-1)?.[0]))
    expect(line).toMatchObject({ route: '/api/email', pdf: true, bytes: 5, ms: expect.any(Number) })
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/eyJ|you@example/)

    maker.mockImplementationOnce(async () => ({ ok: false, reason: 'timeout' }) as never)
    const failed = await email(post('/api/email', { email: 'you@example.com', link, sid: 'm02-p2', pdf: true }, tester))
    expect(await failed.json()).toEqual({ ok: true, pdf: false })
    expect(sentBody(1).attachments).toBeUndefined()
    expect(sentBody(1).html).not.toContain('A PDF copy')
    expect(sentBody(1).text).not.toContain('A PDF copy')
    expect(JSON.parse(String(log.mock.calls.at(-1)?.[0]))).toMatchObject({ pdf: false, reason: 'timeout' })

    for (const pdf of [undefined, false, 'yes']) {
      const plain = await email(post('/api/email', { email: 'you@example.com', link, sid: 'm02-p3-' + String(pdf), pdf }, tester))
      expect(await plain.json()).toEqual({ ok: true })
    }
    expect(maker).toHaveBeenCalledTimes(2)
    expect(sentBody(4).attachments).toBeUndefined()
    log.mockRestore()
  })

  it('makes at most 20 PDFs an hour across all visitors, then sends without one', async () => {
    mockFetch(() => ({ id: 'e1' }))
    process.env.RESEND_API_KEY = 're_test'
    const owner = await cookieFor('owner')
    const maker = vi.fn(async () => ({ ok: true as const, pdf: new Uint8Array(3) }))
    usePdfMaker(maker)
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const link = 'https://decouple.uk/guide#g=eyJzdGFnZSI6ImRlY2lkZWQifQ'
    for (let i = 0; i < 20; i++) expect(await (await email(post('/api/email', { email: 'you@example.com', link, sid: 'm02-l' + i, pdf: true }, owner))).json()).toEqual({ ok: true, pdf: true })
    expect(await (await email(post('/api/email', { email: 'you@example.com', link, sid: 'm02-l20', pdf: true }, owner))).json()).toEqual({ ok: true, pdf: false })
    expect(maker).toHaveBeenCalledTimes(20)
    expect(JSON.parse(String(log.mock.calls.at(-1)?.[0]))).toMatchObject({ pdf: false, reason: 'limit' })
    log.mockRestore()
  })
})

describe('/api/participant', () => {
  const body = { sid: 'S-1', followup: true, voucher: 'Love2shop', email: ' You@Example.com ', hp: '' }

  it('needs a tester or the owner, checks the email, and sends kind participant with the label as pid', async () => {
    const fetch = mockFetch(() => ({ ok: true }))
    Object.assign(process.env, SCRIPT)
    const tester = await cookieFor('tester', { l: 'P02', c: 'OAK-WREN-40' })
    expect((await participant(post('/api/participant', body))).status).toBe(401)
    expect((await participant(post('/api/participant', body, await cookieFor('human')))).status).toBe(401)
    expect((await participant(post('/api/participant', { ...body, email: 'nope' }, tester))).status).toBe(400)
    expect((await participant(post('/api/participant', { ...body, email: '' }, tester))).status).toBe(400)
    expect((await participant(post('/api/participant', { ...body, followup: 'yes' }, tester))).status).toBe(400)
    expect((await participant(post('/api/participant', { ...body, sid: '' }, tester))).status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
    const r = await participant(post('/api/participant', body, tester))
    expect(r.status).toBe(200)
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ kind: 'participant', secret: 'shh', sid: 'S-1', pid: 'P02', followup: true, voucher: 'Love2shop', email: 'you@example.com' })
    expect((await participant(post('/api/participant', { sid: 'S-2', followup: false, voucher: '', email: '', hp: '' }, tester))).status).toBe(200)
    expect((await participant(post('/api/participant', { ...body, hp: 'bot' }, tester))).status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('stores nothing for a test code or in test mode, and allows three per sid', async () => {
    const fetch = mockFetch(() => ({ ok: true }))
    Object.assign(process.env, SCRIPT)
    expect(await (await participant(post('/api/participant', body, await cookieFor('tester', { l: 'Me', c: 'MINT-OWL-12', t: 1 })))).json()).toEqual({ ok: true, test: true })
    setup({ testMode: true })
    Object.assign(process.env, SCRIPT)
    expect(await (await participant(post('/api/participant', body, await cookieFor('owner')))).json()).toEqual({ ok: true, test: true })
    expect(fetch).not.toHaveBeenCalled()
    setup()
    Object.assign(process.env, SCRIPT)
    const tester = await cookieFor('tester', { l: 'P02', c: 'OAK-WREN-40' })
    for (let i = 0; i < 3; i++) expect((await participant(post('/api/participant', body, tester))).status).toBe(200)
    expect((await participant(post('/api/participant', body, tester))).status).toBe(429)
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
    expect(await (await siteGet(req('/api/admin/site', { cookie: owner }))).json()).toEqual({ mode: 'holding', requireCode: true, testMode: false, landing: 'a', indexing: false, theme: 'page' })
    expect((await sitePost(post('/api/admin/site', { mode: 'open' }, owner))).status).toBe(400)
    expect((await sitePost(post('/api/admin/site', { mode: 'guide' }, owner))).status).toBe(502)
  })

  it('writes settings through the Vercel API when configured', async () => {
    /* a store that takes the writes, as Vercel's does */
    const store: Record<string, unknown> = { mode: 'holding', requireCode: true, testMode: false, landing: 'a', indexing: false }
    useSettingsReader(async () => ({ ...store }))
    const fetch = mockFetch((_url, init) => {
      for (const it of (JSON.parse(String(init?.body)) as { items: { key: string; value: unknown }[] }).items) store[it.key] = it.value
      return { status: 'ok' }
    })
    Object.assign(process.env, { GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_1?token=t', VERCEL_API_TOKEN: 'tok', VERCEL_TEAM_ID: 'team_9' })
    const owner = await cookieFor('owner')
    const r = await sitePost(post('/api/admin/site', { mode: 'guide', testMode: true, landing: 'random', indexing: true, theme: 'field' }, owner))
    expect(await r.json()).toEqual({ mode: 'guide', requireCode: true, testMode: true, landing: 'random', indexing: true, theme: 'field' })
    const [url, init] = fetch.mock.calls[0]
    expect(String(url)).toBe('https://api.vercel.com/v1/global-config/ecfg_1/items?teamId=team_9')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(String(init?.body))).toEqual({ items: [{ operation: 'upsert', key: 'mode', value: 'guide' }, { operation: 'upsert', key: 'testMode', value: true }, { operation: 'upsert', key: 'landing', value: 'random' }, { operation: 'upsert', key: 'indexing', value: true }, { operation: 'upsert', key: 'theme', value: 'field' }] })
    expect((await sitePost(post('/api/admin/site', { indexing: 'yes' }, owner))).status).toBe(400)
    expect((await sitePost(post('/api/admin/site', { theme: 'neon' }, owner))).status).toBe(400)
    expect(fetch.mock.calls).toHaveLength(1)
  })

  it('says so when a change Vercel accepted does not read back', async () => {
    useSettingsReader(async () => ({ mode: 'guide', landing: 'd' }))
    mockFetch(() => ({ status: 'ok' }))
    Object.assign(process.env, { GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_1?token=t', VERCEL_API_TOKEN: 'tok' })
    const r = await sitePost(post('/api/admin/site', { landing: 'b' }, await cookieFor('owner')))
    expect(r.status).toBe(502)
    expect((await r.json()).error).toContain('store ecfg_1 still reads landing = "d"')
  }, 10_000)

  it('writes to the store the site reads, whatever an id set by hand says', async () => {
    const fetch = mockFetch(() => ({ status: 'ok' }))
    const store: Record<string, unknown> = {}
    useSettingsReader(async () => ({ ...store, landing: 'b' }))
    Object.assign(process.env, { GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_read?token=t', EDGE_CONFIG_ID: 'ecfg_other', VERCEL_API_TOKEN: 'tok' })
    expect((await sitePost(post('/api/admin/site', { landing: 'b' }, await cookieFor('owner')))).status).toBe(200)
    expect(String(fetch.mock.calls[0][0])).toBe('https://api.vercel.com/v1/global-config/ecfg_read/items')
  })

  it('validates code operations before passing them to the script', async () => {
    const fetch = mockFetch(() => ({ ok: true, codes: [{ code: 'FERN-LARK-27', label: 'P01', active: 'TRUE', test: false, expires: '', track: 'MVP', mode: 'mod' }] }))
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
    expect(await r.json()).toEqual({ codes: [{ code: 'FERN-LARK-27', label: 'P01', active: true, test: false, expires: '', track: 'mvp', mode: 'mod' }] })
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({ kind: 'codes', op: 'create', codes: [{ code: 'FERN-LARK-27', label: 'P01', expires: '2026-11-03', test: false, track: '', mode: '' }] })
    /* tracks and session types (spec §7) */
    for (const track of ['all', 'p3', 'p03,', 'full,p03', 'x03']) expect((await codesPost(post('/api/admin/codes', { action: 'create', codes: [{ code: 'AA-BB-01', track }] }, owner))).status, track).toBe(400)
    expect((await codesPost(post('/api/admin/codes', { action: 'create', codes: [{ code: 'AA-BB-01', track: 'mvp', mode: 'later' }] }, owner))).status).toBe(400)
    await codesPost(post('/api/admin/codes', { action: 'create', codes: [{ code: 'AA-BB-01', track: 'MVP', mode: '' }, { code: 'AA-BB-02', track: 'p03,m05', mode: 'mod' }, { code: 'AA-BB-03', track: '', mode: 'mod' }] }, owner))
    expect(JSON.parse(String(fetch.mock.calls[1][1]?.body)).codes.map((c: { track: string; mode: string }) => [c.track, c.mode])).toEqual([['mvp', 'un'], ['p03,m05', 'mod'], ['', '']])
    await codesPost(post('/api/admin/codes', { action: 'update', code: 'A-B-01', track: 'full', mode: 'mod' }, owner))
    expect(JSON.parse(String(fetch.mock.calls[2][1]?.body))).toMatchObject({ op: 'update', code: 'A-B-01', track: 'full', mode: 'mod' })
    expect((await codesPost(post('/api/admin/codes', { action: 'update', code: 'A-B-01', track: 'everything' }, owner))).status).toBe(400)
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

describe('/api/cron/rebuild', () => {
  const cron = (auth?: string) => req('/api/cron/rebuild', auth ? { headers: { authorization: auth } } : {})
  /* made at run time and low in entropy, so the secret scan never mistakes a test value for a key */
  const SECRET = 'cron'.repeat(5)
  const WRONG = 'nope'.repeat(5)

  it('calls the deploy hook only for Vercel Cron, with the secret', async () => {
    const fetch = mockFetch(() => ({ job: {} }))
    process.env.DEPLOY_HOOK_URL = 'https://api.vercel.com/v1/integrations/deploy/prj_x/abc'
    expect((await rebuild(cron('Bearer anything'))).status).toBe(401)
    process.env.CRON_SECRET = SECRET
    expect((await rebuild(cron())).status).toBe(401)
    expect((await rebuild(cron(`Bearer ${WRONG}`))).status).toBe(401)
    expect((await rebuild(cron(SECRET))).status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ok = await rebuild(cron(`Bearer ${SECRET}`))
    log.mockRestore()
    expect(ok.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(String(fetch.mock.calls[0][0])).toBe('https://api.vercel.com/v1/integrations/deploy/prj_x/abc')
    expect(fetch.mock.calls[0][1]?.method).toBe('POST')
    delete process.env.CRON_SECRET
  })

  it('refuses a short secret, and says when the hook is missing', async () => {
    mockFetch(() => ({ job: {} }))
    process.env.CRON_SECRET = 'short'
    expect((await rebuild(cron('Bearer short'))).status).toBe(401)
    process.env.CRON_SECRET = SECRET
    vi.spyOn(console, 'log').mockImplementation(() => {})
    expect((await rebuild(cron(`Bearer ${SECRET}`))).status).toBe(503)
    vi.restoreAllMocks()
    delete process.env.CRON_SECRET
  })
})

describe('/api/admin/diagnose', () => {
  it('is owner-only and reports names and outcomes, never values', async () => {
    const { GET: diagnose } = await import('../api/admin/diagnose.js')
    expect((await diagnose(req('/api/admin/diagnose'))).status).toBe(401)
    mockFetch((url) => (url.includes('api.vercel.com') ? { id: 'ecfg_1' } : url.includes('global-config.vercel.com') ? { mode: 'guide', requireCode: false, testMode: false } : { ok: true, codes: [{ code: 'A-B-01' }] }))
    Object.assign(process.env, SCRIPT, { GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_1?token=secret-token', VERCEL_API_TOKEN: 'vcp_secret' })
    const r = await diagnose(req('/api/admin/diagnose', { cookie: await cookieFor('owner') }))
    expect(r.status).toBe(200)
    const text = await r.text()
    expect(text).not.toContain('secret-token')
    expect(text).not.toContain('vcp_secret')
    expect(text).not.toContain('shh')
    const d = JSON.parse(text)
    expect(d.origin).toMatchObject({ siteOrigin: 'https://decouple.uk', requestHost: 'decouple.uk' })
    expect(d.email.test).toMatch(/email=1/)
    expect(d.variables.present).toContain('GLOBAL_CONFIG')
    expect(d.variables.missing).toContain('RESEND_API_KEY')
    expect(d.store).toMatchObject({ connected: true, id: 'ecfg_1', read: 'ok', settings: { mode: 'guide', requireCode: false, testMode: false, landing: 'a', indexing: false, theme: 'page' } })
    expect(d.vercelApi.check).toMatch(/^ok/)
    expect(d.script).toMatchObject({ configured: true, check: 'ok', codes: 1 })
    /* how long each service took, and whether this instance had just started */
    expect(d.store.ms).toBeGreaterThanOrEqual(0)
    expect(d.script.ms).toBeGreaterThanOrEqual(0)
    expect(d.deployment.instance).toMatchObject({ firstRequest: expect.any(Boolean), upSeconds: expect.any(Number) })
  })

  it('with ?pdf=1, makes the PDF of a test guide and says how it went; with ?email=1 too, attaches it', async () => {
    const { GET: diagnose } = await import('../api/admin/diagnose.js')
    const fetch = mockFetch(() => ({ id: 'e1' }))
    process.env.RESEND_API_KEY = 're_test'
    const owner = await cookieFor('owner')
    const maker = vi.fn(async (_link: string, _started: number) => ({ ok: true as const, pdf: new Uint8Array(1234) }))
    usePdfMaker(maker)
    const d = await (await diagnose(req('/api/admin/diagnose?pdf=1&email=1', { cookie: owner }))).json()
    expect(d.guidePdf.test).toMatchObject({ ok: true, bytes: 1234, ms: expect.any(Number) })
    const link = maker.mock.calls[0][0]
    expect(link.startsWith('https://decouple.uk/guide#g=')).toBe(true)
    const answers = JSON.parse(Buffer.from(link.split('#g=')[1], 'base64url').toString('utf8'))
    expect(answers.stage).toBe('decided')
    expect(Object.keys(answers)).not.toContain('safe')
    expect(d.email.test).toMatchObject({ ok: true, pdf: true })
    const sent = JSON.parse(String(fetch.mock.calls.find((c) => String(c[0]).includes('resend'))?.[1]?.body))
    expect(sent.attachments).toEqual([{ filename: 'Your guide.pdf', content: expect.any(String) }])
    maker.mockImplementationOnce(async () => ({ ok: false, reason: 'not-ready' }) as never)
    expect((await (await diagnose(req('/api/admin/diagnose?pdf=1', { cookie: owner }))).json()).guidePdf.test).toMatchObject({ ok: false, reason: 'not-ready' })
    expect((await (await diagnose(req('/api/admin/diagnose', { cookie: owner }))).json()).guidePdf.test).toMatch(/pdf=1/)
  })

  it('shows where the site reads and writes, and what each store holds', async () => {
    const { GET: diagnose } = await import('../api/admin/diagnose.js')
    mockFetch((url) => {
      if (url.includes('/global-config/ecfg_1/items')) return [{ key: 'landing', value: 'd' }, { key: 'aiSpend', value: { usd: 3 } }]
      if (url.includes('/global-config/ecfg_other/items')) return [{ key: 'landing', value: 'b' }, { key: 'theme', value: 'field' }]
      if (url.includes('api.vercel.com')) return { id: 'ecfg_1' }
      if (url.includes('global-config.vercel.com')) return { landing: 'd' }
      return { ok: true, codes: [] }
    })
    Object.assign(process.env, { GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_1?token=secret-token', EDGE_CONFIG_ID: 'ecfg_other', VERCEL_API_TOKEN: 'vcp_secret' })
    const d = await (await diagnose(req('/api/admin/diagnose', { cookie: await cookieFor('owner') }))).json()
    expect(d.store).toMatchObject({ readsFrom: 'ecfg_1', readsVia: 'GLOBAL_CONFIG', writesTo: 'ecfg_1', idSetByHand: 'ecfg_other' })
    expect(d.store.warning).toMatch(/ecfg_other, a different store/)
    expect(d.vercelApi.itemsInStoreWrittenTo).toEqual({ store: 'ecfg_1', landing: 'd' })
    expect(d.vercelApi.itemsInStoreSetByHand).toEqual({ store: 'ecfg_other', landing: 'b', theme: 'field' })
  })

  it('with ?write=1, writes a probe, reads it back both ways and removes it', async () => {
    const { GET: diagnose } = await import('../api/admin/diagnose.js')
    const items: Record<string, unknown> = { landing: 'd' }
    const writes: unknown[] = []
    mockFetch((url, init) => {
      if (url.includes('api.vercel.com') && init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body)) as { items: { operation: string; key: string; value?: unknown }[] }
        writes.push(...body.items.map((it) => it.operation + ' ' + it.key))
        for (const it of body.items) if (it.operation === 'delete') delete items[it.key]
        else items[it.key] = it.value
        return { status: 'ok' }
      }
      if (url.includes('/global-config/ecfg_1/items')) return Object.entries(items).map(([key, value]) => ({ key, value }))
      if (url.includes('api.vercel.com')) return { id: 'ecfg_1' }
      if (url.includes('global-config.vercel.com/ecfg_1/item/diagnoseProbe')) return items.diagnoseProbe ?? null
      if (url.includes('global-config.vercel.com')) return { ...items }
      return { ok: true, codes: [] }
    })
    Object.assign(process.env, { GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_1?token=secret-token', VERCEL_API_TOKEN: 'vcp_secret' })
    const text = await (await diagnose(req('/api/admin/diagnose?write=1', { cookie: await cookieFor('owner') }))).text()
    expect(text).not.toContain('vcp_secret')
    const d = JSON.parse(text)
    expect(d.writeTest).toMatchObject({ store: 'ecfg_1', write: { status: 200 }, readByApi: expect.stringMatching(/^ok/), removed: 'ok' })
    expect(writes).toEqual(['upsert diagnoseProbe', 'delete diagnoseProbe'])
    expect(items.diagnoseProbe).toBeUndefined()
  }, 10_000)
})
