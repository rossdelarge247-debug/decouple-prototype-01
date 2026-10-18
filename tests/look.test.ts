import { beforeEach, describe, expect, it } from 'vitest'
import { GET as look } from '../api/look.js'
import { lookScript } from '../lib/look.js'
import { clearSettingsCache, useSettingsReader } from '../lib/settings.js'
import middleware from '../middleware.js'
import { req, setup } from './helpers.js'

/* the script exactly as spec §7 gives it, with T in place */
const SPEC = (T: string) =>
  `(function(){var O=["studio","flat","lilac","field","service"],t=null;try{t=new URLSearchParams(location.search).get("theme")}catch(e){}if(O.indexOf(t)<0)t=${T};if(O.indexOf(t)>=0)document.documentElement.setAttribute("data-site-theme",t)})();`

const stored = (raw: Record<string, unknown>) => {
  useSettingsReader(async () => raw)
  clearSettingsCache()
}

beforeEach(() => setup())

describe('/api/look (spec §7)', () => {
  it('sends each look as T, and null for page', async () => {
    for (const t of ['studio', 'flat', 'lilac', 'field', 'service']) {
      stored({ theme: t })
      expect(await (await look()).text(), t).toBe(SPEC(JSON.stringify(t)))
    }
    stored({ theme: 'page' })
    expect(await (await look()).text()).toBe(SPEC('null'))
  })

  it('sends null when the setting is missing, or holds anything else', async () => {
    stored({ mode: 'guide' })
    expect(await (await look()).text()).toBe(SPEC('null'))
    for (const bad of ['neon', 'Field', '', 3, true, null, { theme: 'flat' }, '"field"', 'field;alert(1)']) {
      stored({ theme: bad })
      expect(await (await look()).text(), JSON.stringify(bad)).toBe(SPEC('null'))
    }
    useSettingsReader(async () => null)
    clearSettingsCache()
    expect(await (await look()).text()).toBe(SPEC('null'))
  })

  it('is public JavaScript, cached for a minute by the browser and by Vercel\'s CDN, and sets no cookie', async () => {
    stored({ theme: 'field' })
    const r = await look()
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('text/javascript')
    expect(r.headers.get('cache-control')).toBe('public, max-age=60')
    expect(r.headers.get('vercel-cdn-cache-control')).toBe('max-age=60')
    expect(r.headers.get('set-cookie')).toBeNull()
    expect(r.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('never gives a value the script could run', () => {
    expect(lookScript(undefined)).toBe(SPEC('null'))
    expect(lookScript(null)).toBe(SPEC('null'))
    expect(lookScript('lilac')).toBe(SPEC('"lilac"'))
  })
})

describe('middleware: /shared/dc-look.js', () => {
  it('goes to /api/look, with or without ?v=, logged out, never to the file', async () => {
    for (const p of ['/shared/dc-look.js', '/shared/dc-look.js?v=abc123', '/shared//dc-look.js', '/shared/dc%2Dlook.js']) {
      const r = await middleware(req(p))
      expect(r.headers.get('x-middleware-next'), p).toBeNull()
      expect(new URL(r.headers.get('x-middleware-rewrite') as string).pathname, p).toBe('/api/look')
    }
    const r = await middleware(req('/shared/dc-look.js?v=abc123'))
    expect(new URL(r.headers.get('x-middleware-rewrite') as string).search).toBe('?v=abc123')
  })
})
