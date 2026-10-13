import { beforeEach, describe, expect, it } from 'vitest'
import middleware, { cacheFor } from '../middleware.ts'
import { cookieFor, req, setup } from './helpers.ts'

const GUIDE = '/Marketing%2002%20%C2%B7%20Divorce%20Guide.html'
const HOLDING = '/Marketing%2001%20%C2%B7%20Holding%20Page.html'
const rewriteOf = (r: Response) => new URL(r.headers.get('x-middleware-rewrite') as string).pathname
const isNext = (r: Response) => r.headers.get('x-middleware-next') === '1'

beforeEach(() => setup())

describe('middleware: straight through', () => {
  it('lets /api, the login path, the public pages and the allow-list through with the security headers', async () => {
    const api = await middleware(req('/api/session'))
    expect(isNext(api)).toBe(true)
    expect(api.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(api.headers.get('x-frame-options')).toBe('DENY')
    expect(rewriteOf(await middleware(req('/studio')))).toBe('/studio.html')
    expect(rewriteOf(await middleware(req('/privacy')))).toBe('/privacy.html')
    expect(rewriteOf(await middleware(req('/holding')))).toBe(HOLDING)
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

  it('lets testers open the protos only when TESTERS_CAN_OPEN_PROTOS is true', async () => {
    const tester = await cookieFor('tester', { l: 'P01', c: 'FERN-LARK-27' })
    expect((await middleware(req('/Proto%2001%20%C2%B7%20Discover.html', { cookie: tester }))).status).toBe(404)
    process.env.TESTERS_CAN_OPEN_PROTOS = 'true'
    expect(isNext(await middleware(req('/Proto%2001%20%C2%B7%20Discover.html', { cookie: tester })))).toBe(true)
    expect(isNext(await middleware(req('/proto/discover/parts.js', { cookie: tester })))).toBe(true)
    expect((await middleware(req('/p/03', { cookie: tester }))).status).toBe(302)
    expect((await middleware(req('/hub', { cookie: tester }))).status).toBe(404)
    expect((await middleware(req('/results/r-app.js', { cookie: tester }))).status).toBe(404)
  })

  it('treats everything as private when SESSION_SECRET is missing', async () => {
    const owner = await cookieFor('owner')
    delete process.env.SESSION_SECRET
    expect((await middleware(req('/hub', { cookie: owner }))).status).toBe(404)
    expect((await middleware(req('/?code=FERN-LARK-27'))).headers.get('location')).toBe('/?code_error=1')
  })
})
