/* The guide PDF (spec §7). Our own guide page, /guide?print=pdf with the link's #g= part, opened in a
   headless Chromium and printed as A4. The page lays itself out (cover, contents, chapters, page
   numbers) and leaves the safety answers out; this only opens it, waits for window.__printReady and
   prints. Every request outside SITE_ORIGIN is blocked, the page keeps no cache, and the browser is
   started for each PDF and closed after it, taking its profile with it. */
import chromium from '@sparticuz/chromium'
import puppeteer, { type Browser } from 'puppeteer-core'
import { env, siteOrigin, type Env } from './env.js'

export const MAX_PDF_BYTES = 5 * 1024 * 1024
/** how long the page may take to say it is ready */
export const READY_MS = 20_000
/** the whole PDF, counted from the request, so the email still has its 12 s inside the spec's 40 */
export const PDF_BUDGET_MS = 25_000

export type PdfResult = { ok: true; pdf: Uint8Array } | { ok: false; reason: string }

/* The guide's own links never carry these (GS.link drops them), so a link that does was made by hand.
   The print page shows the names as text, so they'd be a way to send any words from our address. */
const NEVER = ['safe', 'safe2', 'name_me', 'name_them']

/** The page to print. Always /guide, which serves the guide in either site mode, so the browser
    can't be sent to any other page; the #g= answers as the guide encodes them, less the safety
    answers and the names. null when the link carries no guide. */
export function printUrl(link: string, origin: string = siteOrigin()): string | null {
  const at = link.indexOf('#')
  const hash = at < 0 ? '' : link.slice(at)
  if (!/^#g=[A-Za-z0-9_-]+$/.test(hash)) return null
  let a: unknown
  try {
    a = JSON.parse(Buffer.from(hash.slice(3), 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null
  const kept = Object.fromEntries(Object.entries(a).filter(([k]) => !NEVER.includes(k)))
  return `${origin}/guide?print=pdf#g=${Buffer.from(JSON.stringify(kept), 'utf8').toString('base64url')}`
}

/** our own origin only, plus data: and blob: addresses, which never leave the browser */
export function allowRequest(url: string, origin: string = siteOrigin()): boolean {
  if (url.startsWith('data:') || url.startsWith('blob:')) return true
  try {
    return new URL(url).origin === origin
  } catch {
    return false
  }
}

/* On Vercel, the Chromium that @sparticuz/chromium unpacks into /tmp, once per instance. Locally,
   CHROMIUM_PATH names any Chrome or Chromium 131 or later. */
const UNSAFE = new Set(['--disable-web-security', '--allow-running-insecure-content'])
const A4 = { width: 794, height: 1123 }
let unpacked: Promise<string> | null = null

async function launch(e: Env = env()): Promise<Browser> {
  const local = (e.CHROMIUM_PATH || '').trim()
  if (local) return puppeteer.launch({ executablePath: local, headless: 'shell', args: ['--no-sandbox'], defaultViewport: A4 })
  chromium.setGraphicsMode = false
  unpacked ??= chromium.executablePath().catch((err: unknown) => {
    unpacked = null
    throw err
  })
  const args = (await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' })).filter((a) => !UNSAFE.has(a))
  return puppeteer.launch({ executablePath: await unpacked, headless: 'shell', args, defaultViewport: A4 })
}

/** what went wrong, for the log and the diagnose page: an error's addresses would carry the answers, so they go */
export function failure(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err)
  return ('failed: ' + text.replace(/\b(?:https?|wss?|data|blob):\S*/g, '<address>').replace(/\s+/g, ' ')).slice(0, 200).trim()
}

export interface PdfDeps {
  origin?: string
  launch?: () => Promise<Browser>
}

export async function makePdf(link: string, started: number = Date.now(), deps: PdfDeps = {}): Promise<PdfResult> {
  const origin = deps.origin ?? siteOrigin()
  const target = printUrl(link, origin)
  if (!target) return { ok: false, reason: 'no-guide' }
  const left = () => Math.max(1, started + PDF_BUDGET_MS - Date.now())
  const held: { browser?: Browser; over?: boolean } = {}

  const work = async (): Promise<PdfResult> => {
    const browser = await (deps.launch ?? launch)()
    held.browser = browser
    if (held.over) {
      await browser.close()
      return { ok: false, reason: 'timeout' }
    }
    /* its first tab: a new browser for each PDF, with a profile that goes when it closes. (Vercel's
       Chromium runs in one process, which can't open a private window.) */
    const page = (await browser.pages())[0] ?? (await browser.newPage())
    await page.setCacheEnabled(false)
    await page.setRequestInterception(true)
    page.on('request', (r) => {
      const done = allowRequest(r.url(), origin) ? r.continue() : r.abort('blockedbyclient')
      done.catch(() => undefined)
    })
    const res = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: left() })
    if (!res || !res.ok()) return { ok: false, reason: 'page ' + (res ? res.status() : 'none') }
    try {
      await page.waitForFunction('window.__printReady === true', { timeout: Math.min(READY_MS, left()) })
    } catch {
      return { ok: false, reason: 'not-ready' }
    }
    const state = (await page.evaluate(`({ error: String(window.__printError || ''), chapters: document.querySelectorAll('.gp-ch').length })`)) as { error: string; chapters: number }
    if (state.error) return { ok: false, reason: 'no-guide' }
    if (!state.chapters) return { ok: false, reason: 'no-chapters' }
    /* the PDF's own title, which viewers show, is as discreet as its name and the email's subject */
    await page.evaluate(`document.title = 'Your guide'`)
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, timeout: left() })
    if (pdf.byteLength >= MAX_PDF_BYTES) return { ok: false, reason: 'too-big' }
    return { ok: true, pdf }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<PdfResult>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, reason: 'timeout' }), left())
  })
  try {
    return await Promise.race([work().catch((err: unknown): PdfResult => ({ ok: false, reason: failure(err) })), timeout])
  } finally {
    clearTimeout(timer)
    held.over = true
    await held.browser?.close().catch(() => undefined)
  }
}

/* tests swap in their own maker */
type Maker = (link: string, started: number) => Promise<PdfResult>
let maker: Maker = makePdf
export function usePdfMaker(fn: Maker = makePdf): void {
  maker = fn
}
export const guidePdf = (link: string, started: number): Promise<PdfResult> => maker(link, started)
