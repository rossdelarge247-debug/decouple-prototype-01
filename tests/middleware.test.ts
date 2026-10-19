import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import middleware, { cacheFor, clearBuildDates } from '../middleware.js'
import { cookieFor, req, setup } from './helpers.js'

const GUIDE = '/Marketing%2002%20%C2%B7%20Divorce%20Guide.html'
const HOLDING = '/Marketing%2001%20%C2%B7%20Holding%20Page.html'
const rewriteOf = (r: Response) => new URL(r.headers.get('x-middleware-rewrite') as string).pathname
const isNext = (r: Response) => r.headers.get('x-middleware-next') === '1'

beforeEach(() => {
  setup()
  clearBuildDates()
})
afterEach(() => vi.unstubAllGlobals())

describe('middleware: straight through', () => {
  it('lets /api, the login path, the public pages and the allow-list through with the security headers', async () => {
    const api = await middleware(req('/api/session'))
    expect(isNext(api)).toBe(true)
    expect(api.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(api.headers.get('x-frame-options')).toBe('DENY')
    expect(rewriteOf(await middleware(req('/studio')))).toBe('/studio.html')
    expect(rewriteOf(await middleware(req('/privacy')))).toBe('/privacy.html')
    expect(rewriteOf(await middleware(req('/holding')))).toBe(HOLDING)
    const help = await middleware(req('/help'))
    expect(rewriteOf(help)).toBe('/Marketing%2003%20%C2%B7%20Help%20%26%20Support.html')
    expect(help.headers.get('cache-control')).toBe('no-cache')
    for (const p of ['/help/help.js', '/help/help.css', '/help/help-sources.json', '/help/help-content.json', '/_build.json', '/Marketing%2003%20%C2%B7%20Help%20%26%20Support.html']) expect(isNext(await middleware(req(p))), p).toBe(true)
    expect((await middleware(req('/help/help-content.json'))).headers.get('cache-control')).toBe('no-cache')
    const css = await middleware(req('/fonts.css'))
    expect(isNext(css)).toBe(true)
    expect(css.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    const page = await middleware(req(GUIDE))
    expect(isNext(page)).toBe(true)
    expect(page.headers.get('cache-control')).toBe('no-cache')
  })

  it('moves the login path with LOGIN_PATH', async () => {
    process.env.LOGIN_PATH = '/back-door'
    expect(rewriteOf(await middleware(req('/back-door')))).toBe('/studio.html')
    expect((await middleware(req('/studio'))).status).toBe(404)
  })

  it('picks the cache rule by file type', () => {
    expect(cacheFor('/m02/guide/g.css')).toContain('immutable')
    expect(cacheFor('/m02/guide/questions.json')).toBe('no-cache')
    expect(cacheFor('/privacy.html')).toBe('no-cache')
  })
})

describe('middleware: the host', () => {
  it('sends www to the bare domain, keeping the path and query', async () => {
    const r = await middleware(new Request('https://www.decouple.uk/guide?code=FERN-LARK-27'))
    expect(r.status).toBe(308)
    expect(r.headers.get('location')).toBe('https://decouple.uk/guide?code=FERN-LARK-27')
    expect(r.headers.get('set-cookie')).toBeNull()
    expect(isNext(await middleware(req('/api/session')))).toBe(true)
  })
})

describe('middleware: the front door', () => {
  it('shows the holding page by default and the guide when the mode says so', async () => {
    const r = await middleware(req('/'))
    expect(rewriteOf(r)).toBe(HOLDING)
    expect(r.headers.get('cache-control')).toBe('private, no-cache')
    setup({ mode: 'guide' })
    expect(rewriteOf(await middleware(req('/')))).toBe(GUIDE)
  })

  it('shows the guide to a tester or the owner in holding mode, and /guide always', async () => {
    expect(rewriteOf(await middleware(req('/', { cookie: await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' }) })))).toBe(GUIDE)
    expect(rewriteOf(await middleware(req('/', { cookie: await cookieFor('owner') })))).toBe(GUIDE)
    expect(rewriteOf(await middleware(req('/guide')))).toBe(GUIDE)
  })

  it('lets the owner preview either page', async () => {
    const owner = await cookieFor('owner')
    expect(rewriteOf(await middleware(req('/?view=holding', { cookie: owner })))).toBe(HOLDING)
    expect(rewriteOf(await middleware(req('/?view=guide', { cookie: owner })))).toBe(GUIDE)
    expect(rewriteOf(await middleware(req('/?view=guide')))).toBe(HOLDING)
  })

  it('redeems a code from the link, keeping other parameters, and bounces a bad one', async () => {
    const good = await middleware(req('/?code=fern-lark-27&pid=P07'))
    expect(good.status).toBe(302)
    expect(good.headers.get('location')).toBe('/?pid=P07')
    expect(good.headers.get('set-cookie')).toMatch(/^dc_tester=/)
    const bad = await middleware(req('/?code=NOPE-NOPE-00'))
    expect(bad.status).toBe(302)
    expect(bad.headers.get('location')).toBe('/?code_error=1')
    expect(bad.headers.get('set-cookie')).toBeNull()
    const off = await middleware(req('/guide?code=CLAY-RIVER-81'))
    expect(off.headers.get('location')).toBe('/?code_error=1')
  })

  it('ends a tester session when its code is turned off', async () => {
    const cookie = await cookieFor('tester', { l: 'Old', c: 'CLAY-RIVER-81' })
    expect(rewriteOf(await middleware(req('/', { cookie })))).toBe(HOLDING)
  })
})

describe('middleware: the participant hub', () => {
  const HUB = '/Decouple%20%C2%B7%20Take%20Part.html'
  it('shows the code page without a session, never a 404', async () => {
    const r = await middleware(req('/take-part'))
    expect(r.status).toBe(200)
    expect(rewriteOf(r)).toBe('/take-part-code.html')
    expect(r.headers.get('cache-control')).toBe('private, no-store')
    expect(r.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(rewriteOf(await middleware(req('/take-part', { cookie: await cookieFor('tester', { l: 'Old', c: 'CLAY-RIVER-81' }) })))).toBe('/take-part-code.html')
    expect((await middleware(req('/take-part-code.html'))).status).toBe(404)
  })

  it('redeems a code from the link and comes back to /take-part', async () => {
    const good = await middleware(req('/take-part?code=oak-wren-40&utm=x'))
    expect(good.status).toBe(302)
    expect(good.headers.get('location')).toBe('/take-part?utm=x')
    expect(good.headers.get('set-cookie')).toMatch(/^dc_tester=/)
    const bad = await middleware(req('/take-part?code=NOPE-NOPE-00'))
    expect(bad.headers.get('location')).toBe('/take-part?code_error=1')
    expect(bad.headers.get('set-cookie')).toBeNull()
  })

  it('opens the hub for a tester with a track and the owner, and sends a guide-only tester to the guide', async () => {
    expect(rewriteOf(await middleware(req('/take-part', { cookie: await cookieFor('tester', { l: 'P02', c: 'OAK-WREN-40' }) })))).toBe(HUB)
    expect(rewriteOf(await middleware(req('/take-part?track=mvp', { cookie: await cookieFor('owner') })))).toBe(HUB)
    const guideOnly = await middleware(req('/take-part', { cookie: await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' }) }))
    expect(guideOnly.status).toBe(302)
    expect(guideOnly.headers.get('location')).toBe('/')
  })
})

describe('middleware: search engines (spec §5.1)', () => {
  it('asks for nothing to be listed while indexing is off', async () => {
    const robots = await middleware(req('/robots.txt'))
    expect(robots.status).toBe(200)
    expect(robots.headers.get('content-type')).toMatch(/^text\/plain/)
    expect(await robots.text()).toBe('User-agent: *\nDisallow: /\n')
    expect((await middleware(req('/sitemap.xml'))).status).toBe(404)
    expect((await middleware(req('/'))).headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect((await middleware(req('/privacy'))).headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect((await middleware(req('/help'))).headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })

  it('leaves lastmod out when the dates cannot be read', async () => {
    setup({ indexing: true })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })))
    const xml = await (await middleware(req('/sitemap.xml'))).text()
    expect(xml).toContain('<url><loc>https://decouple.uk/help</loc></url>')
    expect(xml).not.toContain('lastmod')
  })

  it('lets /, /privacy and /help be listed when indexing is on, and names no private path', async () => {
    setup({ indexing: true })
    vi.stubGlobal('fetch', vi.fn(async (u: string | URL) => new Response(JSON.stringify({ built: String(u).includes('help-content') ? '2026-10-12T05:01:00.000Z' : '2026-10-16T09:00:00.000Z' }), { status: 200 })))
    expect((await middleware(req('/'))).headers.get('x-robots-tag')).toBeNull()
    expect((await middleware(req('/privacy'))).headers.get('x-robots-tag')).toBeNull()
    expect((await middleware(req('/help'))).headers.get('x-robots-tag')).toBeNull()
    for (const p of ['/guide', '/holding', '/studio', '/api/session', '/fonts.css', '/privacy.html']) expect((await middleware(req(p))).headers.get('x-robots-tag'), p).toBe('noindex, nofollow')
    const text = await (await middleware(req('/robots.txt'))).text()
    const lines = text.trim().split('\n')
    expect(lines.slice(0, 4)).toEqual(['User-agent: *', 'Allow: /$', 'Allow: /privacy$', 'Allow: /help$'])
    expect(text).toContain('Allow: /help/help-content.json')
    expect(lines.slice(-2)).toEqual(['Disallow: /', 'Sitemap: https://decouple.uk/sitemap.xml'])
    expect(text).toContain('Allow: /fonts.css')
    for (const bad of ['Hub', 'Proto%20', 'MVP', 'studio', 'take-part', 'results/', 'settings/', 'ut-questions']) expect(text, bad).not.toContain(bad)
    const map = await middleware(req('/sitemap.xml'))
    expect(map.status).toBe(200)
    const xml = await map.text()
    expect(xml).toContain('<loc>https://decouple.uk/</loc>')
    expect(xml).toContain('<url><loc>https://decouple.uk/privacy</loc><lastmod>2026-10-16T09:00:00.000Z</lastmod></url>')
    expect(xml).toContain('<url><loc>https://decouple.uk/help</loc><lastmod>2026-10-12T05:01:00.000Z</lastmod></url>')
    expect(xml.match(/<loc>/g)).toHaveLength(3)
  })
})

describe('middleware: private paths', () => {
  it('returns a plain 404 with the 404 page, never a redirect to the login', async () => {
    for (const p of ['/hub', '/hub/results', '/Proto%2001%20%C2%B7%20Discover.html', '/results/r-app.js', '/proto/ut/ut.js', '/_public.json', '/studio.html', '/nothing-here']) {
      const r = await middleware(req(p))
      expect(r.status, p).toBe(404)
      expect(r.headers.get('location')).toBeNull()
      expect(r.headers.get('cache-control')).toBe('private, no-store')
      expect(await r.text()).toContain('This page doesn')
    }
  })

  it('rewrites single-segment aliases and redirects the ones with a path segment for the owner', async () => {
    const owner = await cookieFor('owner')
    const hub = await middleware(req('/hub', { cookie: owner }))
    expect(rewriteOf(hub)).toBe('/Decouple%20%C2%B7%20Prototype%20Hub.html')
    expect(hub.headers.get('cache-control')).toBe('private, no-store')
    const results = await middleware(req('/hub/results', { cookie: owner }))
    expect(results.status).toBe(302)
    expect(results.headers.get('location')).toBe('/Decouple%20%C2%B7%20Results.html')
    expect((await middleware(req('/hub/site', { cookie: owner }))).headers.get('location')).toBe('/Decouple%20%C2%B7%20Site%20Settings.html')
    expect((await middleware(req('/p/10?demo=1', { cookie: owner }))).headers.get('location')).toBe('/Proto%2010%20%C2%B7%20Dashboard.html?demo=1')
    const file = await middleware(req('/proto/ut/ut.js', { cookie: owner }))
    expect(isNext(file)).toBe(true)
    expect(file.headers.get('cache-control')).toBe('private, no-store')
  })

  it('lets a tester open only the pages in their track, and never the hubs (spec §4.4)', async () => {
    const P01 = '/Proto%2001%20%C2%B7%20Discover.html'
    const P03 = '/Proto%2003%20%C2%B7%20Playback.html'
    const M03 = '/MVP%2003%20%C2%B7%20To-do%20%26%20Journal.html'
    const M05 = '/MVP%2005%20%C2%B7%20Financial%20Statement.html'
    const guideOnly = await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' })
    for (const p of [P01, M05, '/proto/ut/ut.js', '/mvp/kit/kit.js', '/take-part/tp.js', '/p/03']) expect((await middleware(req(p, { cookie: guideOnly }))).status, p).toBe(404)

    const mvp = await cookieFor('tester', { l: 'P02', c: 'OAK-WREN-40' })
    for (const p of [M03, M05, '/MVP%2000%20%C2%B7%20Public%20Site.html', '/mvp/kit/kit.js', '/proto/ut/ut.js', '/shared/dc-site.js', '/take-part/tp.js', '/inline/mvp-05-financial-statement-1.js', '/inline/decouple-take-part-1.js', '/Decouple%20%C2%B7%20Take%20Part.html']) expect(isNext(await middleware(req(p, { cookie: mvp }))), p).toBe(true)
    expect((await middleware(req('/p/mvp05', { cookie: mvp }))).headers.get('location')).toBe(M05)
    expect((await middleware(req('/p/mvp08', { cookie: mvp }))).status).toBe(302)
    expect(isNext(await middleware(req('/MVP%2008%20%C2%B7%20Help%20%26%20Support.html', { cookie: mvp })))).toBe(true)
    for (const p of [P01, '/p/01', '/hub', '/hub/results', '/Decouple%20%C2%B7%20Prototype%20Hub.html', '/results/r-app.js', '/hub/hub-switch.js', '/inline/proto-01-discover-1.js', '/inline/decouple-prototype-hub-1.js']) expect((await middleware(req(p, { cookie: mvp }))).status, p).toBe(404)

    const chosen = await cookieFor('tester', { l: 'P03', c: 'ASH-FINCH-55' })
    expect(isNext(await middleware(req(P03, { cookie: chosen })))).toBe(true)
    expect(isNext(await middleware(req(M05, { cookie: chosen })))).toBe(true)
    expect((await middleware(req('/p/03', { cookie: chosen }))).status).toBe(302)
    for (const p of [P01, M03, '/p/mvp00']) expect((await middleware(req(p, { cookie: chosen }))).status, p).toBe(404)

    const full = await cookieFor('tester', { l: 'P04', c: 'ELM-TERN-60' })
    expect(isNext(await middleware(req('/Proto%2010%20%C2%B7%20Dashboard.html', { cookie: full })))).toBe(true)
    expect((await middleware(req(M05, { cookie: full }))).status).toBe(404)

    for (const p of ['/proto%2F..%2FDecouple%20%C2%B7%20Results.html', '/mvp/%2e%2e/Decouple%20%C2%B7%20Site%20Settings.html']) expect((await middleware(req(p, { cookie: mvp }))).status, p).toBe(404)

    /* a code turned off takes its track with it */
    const off = await cookieFor('tester', { l: 'Old', c: 'CLAY-RIVER-81' })
    expect((await middleware(req(M05, { cookie: off }))).status).toBe(404)
  })

  it('redirects the MVP aliases and the old MVP 01 address for the owner', async () => {
    const owner = await cookieFor('owner')
    expect((await middleware(req('/p/mvp00', { cookie: owner }))).headers.get('location')).toBe('/MVP%2000%20%C2%B7%20Public%20Site.html')
    expect((await middleware(req('/p/mvp03', { cookie: owner }))).headers.get('location')).toBe('/MVP%2003%20%C2%B7%20To-do%20%26%20Journal.html')
    expect((await middleware(req('/p/mvp07?test=1', { cookie: owner }))).headers.get('location')).toBe('/MVP%2007%20%C2%B7%20Ask.html?test=1')
    expect((await middleware(req('/p/mvp08', { cookie: owner }))).headers.get('location')).toBe('/MVP%2008%20%C2%B7%20Help%20%26%20Support.html')
    const old = await middleware(req('/MVP%2001%20%C2%B7%20Shared%20Statement.html#doc', { cookie: owner }))
    expect(old.status).toBe(302)
    expect(old.headers.get('location')).toBe('/MVP%2005%20%C2%B7%20Financial%20Statement.html')
    for (const p of ['/p/mvp00', '/MVP%2000%20%C2%B7%20Public%20Site.html', '/MVP%2001%20%C2%B7%20Shared%20Statement.html', '/take-part/tp.js']) expect((await middleware(req(p))).status, p).toBe(404)
  })

  it('treats everything as private when SESSION_SECRET is missing', async () => {
    const owner = await cookieFor('owner')
    delete process.env.SESSION_SECRET
    expect((await middleware(req('/hub', { cookie: owner }))).status).toBe(404)
    expect((await middleware(req('/?code=FERN-LARK-27'))).headers.get('location')).toBe('/?code_error=1')
  })
})

describe('middleware: no page waits for the Google script', () => {
  it('lets the middleware use the last codes list while the functions read it fresh', async () => {
    const { CODES_STALE_MS, codeStore, useCodeStore } = await import('../lib/auth.js')
    const { who } = await import('../lib/api.js')
    const base = codeStore()
    const asked: Array<number | undefined> = []
    useCodeStore({ ...base, check: (code, today, staleMs) => (asked.push(staleMs), base.check(code, today, staleMs)) })
    const tester = await cookieFor('tester', { l: 'P02', c: 'OAK-WREN-40' })
    expect((await middleware(req('/p/mvp05', { cookie: tester }))).status).not.toBe(404)
    await who(req('/api/session', { cookie: tester }))
    expect(asked).toEqual([CODES_STALE_MS, undefined])
  })
})
