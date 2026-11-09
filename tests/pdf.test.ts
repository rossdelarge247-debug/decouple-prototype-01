import { describe, expect, it, vi } from 'vitest'
import type { Browser } from 'puppeteer-core'
import { PDF_BUDGET_MS, allowRequest, failure, makePdf, printUrl } from '../lib/pdf.js'

const O = 'https://decouple.uk'
const enc = (a: unknown) => Buffer.from(JSON.stringify(a), 'utf8').toString('base64url')
const dec = (url: string) => JSON.parse(Buffer.from(url.split('#g=')[1], 'base64url').toString('utf8'))
const ANSWERS = { stage: 'decided', kids: 'with', goals: ['home', 'kids'], note: 'Zoë’s' }
const LINK = `${O}/guide#g=${enc(ANSWERS)}`

describe('printUrl', () => {
  it('prints /guide with ?print=pdf and the same answers, whatever the link’s own path', () => {
    const url = printUrl(LINK, O) as string
    expect(url.startsWith(`${O}/guide?print=pdf#g=`)).toBe(true)
    expect(dec(url)).toEqual(ANSWERS)
    expect(printUrl(`${O}/?v=A#g=${enc(ANSWERS)}`, O)?.startsWith(`${O}/guide?print=pdf#g=`)).toBe(true)
  })

  it('leaves out the safety answers and the names, which the guide’s own links never carry', () => {
    const url = printUrl(`${O}/guide#g=${enc({ ...ANSWERS, safe: 'unsafe', safe2: 'x', name_me: 'Visit evil.example', name_them: 'M' })}`, O) as string
    expect(dec(url)).toEqual(ANSWERS)
  })

  it('is null for a link with no guide in it', () => {
    expect(printUrl(`${O}/guide`, O)).toBeNull()
    expect(printUrl(`${O}/guide#x=1`, O)).toBeNull()
    expect(printUrl(`${O}/guide#g=`, O)).toBeNull()
    expect(printUrl(`${O}/guide#g=not+base64`, O)).toBeNull()
    expect(printUrl(`${O}/guide#g=${Buffer.from('nope').toString('base64url')}`, O)).toBeNull()
    expect(printUrl(`${O}/guide#g=${enc(['a'])}`, O)).toBeNull()
    expect(printUrl(`${O}/guide#g=${enc('a')}`, O)).toBeNull()
  })
})

describe('allowRequest', () => {
  it('allows the site’s own origin, data: and blob: only', () => {
    expect(allowRequest(`${O}/m02/guide/g-print.js?v=1`, O)).toBe(true)
    expect(allowRequest('data:font/woff2;base64,AAAA', O)).toBe(true)
    expect(allowRequest('blob:https://decouple.uk/1234', O)).toBe(true)
    for (const u of ['https://www.decouple.uk/', 'http://decouple.uk/', 'https://decouple.uk.evil.example/', 'https://challenges.cloudflare.com/turnstile/v0/api.js', 'https://fonts.googleapis.com/css', 'not a url'])
      expect(allowRequest(u, O), u).toBe(false)
  })
})

/* a stand-in for the browser: records what the page was asked to do */
function fakeBrowser(over: { status?: number; ready?: boolean | 'hang'; state?: { error: string; chapters: number }; bytes?: number; goto?: 'hang' } = {}) {
  const seen = { goto: '', requests: [] as string[], continued: [] as string[], aborted: [] as string[], closed: 0, pdf: null as null | Record<string, unknown>, title: false }
  let handler: ((r: unknown) => void) | null = null
  const page = {
    setCacheEnabled: vi.fn(async () => undefined),
    setRequestInterception: vi.fn(async () => undefined),
    on: (ev: string, fn: (r: unknown) => void) => {
      if (ev === 'request') handler = fn
    },
    goto: async (url: string) => {
      seen.goto = url
      if (over.goto === 'hang') return new Promise(() => undefined)
      for (const u of [`${O}/m02/guide/g-print.css`, 'https://challenges.cloudflare.com/x.js', 'data:image/png;base64,AA'])
        handler?.({ url: () => u, continue: async () => void seen.continued.push(u), abort: async () => void seen.aborted.push(u) })
      return { ok: () => (over.status ?? 200) < 400, status: () => over.status ?? 200 }
    },
    waitForFunction: async () => {
      if (over.ready === 'hang') return new Promise(() => undefined)
      if (over.ready === false) throw new Error('Waiting failed: 20000ms exceeded')
      return true
    },
    evaluate: async (js: string) => {
      if (js.includes('document.title')) return void (seen.title = true)
      return over.state ?? { error: '', chapters: 8 }
    },
    pdf: async (opts: Record<string, unknown>) => {
      seen.pdf = opts
      return new Uint8Array(over.bytes ?? 1000)
    },
  }
  const browser = {
    pages: async () => [page],
    close: async () => void seen.closed++,
  }
  return { seen, launch: async () => browser as unknown as Browser }
}

describe('makePdf', () => {
  it('opens the print page, blocks every other host, and prints A4 with the page’s own margins', async () => {
    const f = fakeBrowser()
    const r = await makePdf(LINK, Date.now(), { origin: O, launch: f.launch })
    expect(r.ok).toBe(true)
    expect(r.ok && r.pdf.byteLength).toBe(1000)
    expect(f.seen.goto).toBe(printUrl(LINK, O))
    expect(f.seen.continued).toEqual([`${O}/m02/guide/g-print.css`, 'data:image/png;base64,AA'])
    expect(f.seen.aborted).toEqual(['https://challenges.cloudflare.com/x.js'])
    expect(f.seen.pdf).toMatchObject({ format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false })
    expect(f.seen.title).toBe(true)
    expect(f.seen.closed).toBe(1)
  })

  it('gives no PDF, and closes the browser, when the page fails, says there is no guide, has no chapters or is too big', async () => {
    for (const [over, reason] of [
      [{ status: 404 }, 'page 404'],
      [{ ready: false }, 'not-ready'],
      [{ state: { error: 'no-guide', chapters: 0 } }, 'no-guide'],
      [{ state: { error: '', chapters: 0 } }, 'no-chapters'],
      [{ bytes: 5 * 1024 * 1024 }, 'too-big'],
    ] as const) {
      const f = fakeBrowser(over)
      expect(await makePdf(LINK, Date.now(), { origin: O, launch: f.launch })).toEqual({ ok: false, reason })
      expect(f.seen.closed, reason).toBe(1)
    }
  })

  it('gives up when the budget runs out, and closes the browser', async () => {
    for (const over of [{ goto: 'hang' }, { ready: 'hang' }] as const) {
      const f = fakeBrowser(over)
      const t = Date.now()
      expect(await makePdf(LINK, t - PDF_BUDGET_MS + 60, { origin: O, launch: f.launch })).toEqual({ ok: false, reason: 'timeout' })
      expect(Date.now() - t).toBeLessThan(1000)
      expect(f.seen.closed).toBe(1)
    }
  })

  it('never starts a browser for a link with no guide, and says so when one won’t start', async () => {
    const launch = vi.fn(async () => {
      throw new Error('no chromium')
    })
    expect(await makePdf(`${O}/guide`, Date.now(), { origin: O, launch })).toEqual({ ok: false, reason: 'no-guide' })
    expect(launch).not.toHaveBeenCalled()
    expect(await makePdf(LINK, Date.now(), { origin: O, launch })).toEqual({ ok: false, reason: 'failed: no chromium' })
  })

  it('says what failed without the address, which would carry the answers', () => {
    expect(failure(new Error(`net::ERR_CONNECTION_REFUSED at ${O}/guide?print=pdf#g=${enc(ANSWERS)}`))).toBe('failed: net::ERR_CONNECTION_REFUSED at <address>')
    expect(failure('x'.repeat(500)).length).toBe(200)
  })
})
