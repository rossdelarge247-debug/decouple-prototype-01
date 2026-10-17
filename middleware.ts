/* Routing middleware (spec §4). Runs in front of every request: the public allow-list and the public
   pages go straight through, / and /guide pick the guide or the holding page, /take-part opens the
   participant hub or its code page, the aliases in §2 map to files, and everything else needs the
   owner's session, or a tester whose track includes it, or returns a plain 404.
   Web APIs only (fetch, crypto.subtle), so it runs on the Node runtime or the edge alike. */
import { next, rewrite } from '@vercel/functions/middleware'
import { ALIASES, FILES, RENAMED, decodePath, encodePath } from './lib/aliases.js'
import { noteCodeUsed, redeemable, whoami } from './lib/auth.js'
import { loginPath, sessionSecret, siteOrigin } from './lib/env.js'
import { NOT_FOUND_HTML } from './lib/generated/not-found.js'
import { PUBLIC_PATHS } from './lib/generated/public.js'
import { clientIp, securityHeaders } from './lib/http.js'
import { LOOK_PATH } from './lib/look.js'
import { isPublicPath, loadPublicList, normalisePath } from './lib/public.js'
import { indexable, lastmodFor, robotsTxt, sitemapXml, type BuildDates } from './lib/search.js'
import { testerCookie } from './lib/session.js'
import { readSettings } from './lib/settings.js'
import { trackAllows } from './lib/tracks.js'

export const config = { runtime: 'nodejs' }

const PUBLIC = loadPublicList(PUBLIC_PATHS)
const IMMUTABLE = 'public, max-age=31536000, immutable'
const HTML = 'no-cache'

/* Cache rule for a public file: hashed assets for a year, pages and data revalidated every time */
export function cacheFor(decodedPath: string): string {
  if (/\.(js|css|woff2|woff|png|jpg|jpeg|svg|webp|ico)$/i.test(decodedPath)) return IMMUTABLE
  return HTML
}

function notFound(): Response {
  return new Response(NOT_FOUND_HTML, {
    status: 404,
    headers: { ...securityHeaders(true), 'content-type': 'text/html; charset=utf-8' },
  })
}

function redirect(location: string, extra: Record<string, string> = {}, status = 302): Response {
  return new Response(null, { status, headers: { ...securityHeaders(true), location, ...extra } })
}

/* The sitemap's lastmod dates (spec §5.1): the deployment's build and the help content's last GOV.UK
   fetch, read from the deployment's own public files and kept for an hour */
let dates: { at: number; value: BuildDates } | null = null
async function buildDates(url: URL): Promise<BuildDates> {
  if (dates && Date.now() - dates.at < (dates.value.built ? 3_600_000 : 300_000)) return dates.value
  const get = async (path: string): Promise<string | null> => {
    try {
      const res = await fetch(new URL(path, url), { signal: AbortSignal.timeout(2000) })
      if (!res.ok) return null
      const j = (await res.json()) as { built?: unknown }
      return typeof j.built === 'string' ? j.built : null
    } catch {
      return null
    }
  }
  const [built, help] = await Promise.all([get('/_build.json'), get('/help/help-content.json')])
  dates = { at: Date.now(), value: { built, help } }
  return dates.value
}

/** tests start each case with no dates kept */
export function clearBuildDates(): void {
  dates = null
}

function serve(file: string, url: URL, headers: Record<string, string>): Response {
  return rewrite(new URL(encodePath(file), url), { headers })
}

/* The security headers, without the robots header where indexing allows it (spec §4.5) */
function openHeaders(path: string, indexing: boolean): Record<string, string> {
  const h = securityHeaders(false)
  if (indexable(path, indexing)) delete h['x-robots-tag']
  return h
}

/* ?code= on / and /take-part (spec §4.2): a valid code sets dc_tester and comes back without it */
async function redeemFromLink(url: URL, back: string): Promise<Response> {
  const to = new URL(back, url)
  url.searchParams.forEach((v, k) => {
    if (k !== 'code' && k !== 'code_error') to.searchParams.append(k, v)
  })
  const secret = sessionSecret()
  const row = secret ? await redeemable(url.searchParams.get('code')) : null
  if (row && secret) {
    await noteCodeUsed(row.code)
    return redirect(to.pathname + to.search, { 'set-cookie': await testerCookie(secret, row.label, row.code, row.test) })
  }
  to.searchParams.set('code_error', '1')
  return redirect(to.pathname + to.search)
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  const decoded = decodePath(path)
  const open = securityHeaders(false)
  const closed = securityHeaders(true)

  /* 0. www goes to the bare domain, whatever the domain settings say: the guide builds its email
     link from the address it is on, and the server accepts links on the site origin only */
  const origin = siteOrigin()
  if (url.host === `www.${new URL(origin).host}`) return redirect(`${origin}${url.pathname}${url.search}`, {}, 308)

  /* 1. straight through */
  if (path.startsWith('/api/')) return next({ headers: open })
  if (path === loginPath()) return serve(FILES.login, url, closed)
  if (path === '/favicon.ico') return next({ headers: open })
  if (path === '/holding') return serve(FILES.holding, url, { ...open, 'cache-control': HTML })
  if (path === '/privacy' || path === '/help') {
    const { indexing } = await readSettings()
    return serve(path === '/help' ? FILES.help : FILES.privacy, url, { ...openHeaders(path, indexing), 'cache-control': HTML })
  }
  if (path === '/robots.txt' || path === '/sitemap.xml') {
    const { indexing } = await readSettings()
    const body = path === '/robots.txt' ? robotsTxt(indexing, PUBLIC, origin) : sitemapXml(indexing, origin, indexing ? lastmodFor(await buildDates(url)) : {})
    if (body === null) return notFound()
    const type = path === '/robots.txt' ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8'
    return new Response(body, { status: 200, headers: { ...open, 'content-type': type, 'cache-control': 'public, max-age=300' } })
  }
  /* the look is the live setting from /api/look, never the design project's preview file (spec §4) */
  if (normalisePath(path) === LOOK_PATH) return rewrite(new URL('/api/look' + url.search, url))
  if (isPublicPath(path, PUBLIC)) return next({ headers: { ...open, 'cache-control': cacheFor(decoded) } })

  /* 2. the front door */
  if (path === '/' || path === '/guide') {
    if (url.searchParams.has('code')) return redeemFromLink(url, '/')
    const who = await whoami(request, clientIp(request))
    let file: string = FILES.guide
    if (path === '/') {
      const view = url.searchParams.get('view')
      if (who.owner && (view === 'guide' || view === 'holding')) file = view === 'guide' ? FILES.guide : FILES.holding
      else file = who.settings.mode === 'guide' || who.tester || who.owner ? FILES.guide : FILES.holding
    }
    /* varies by cookie and by the switches, so never shared */
    return serve(file, url, { ...openHeaders(path, who.settings.indexing), 'cache-control': 'private, no-cache' })
  }

  /* 2b. the participant hub: never a 404, so a participant who lost the cookie can type the code in.
     A tester whose code has no track has nothing here and goes to the guide. */
  if (path === '/take-part') {
    if (url.searchParams.has('code')) return redeemFromLink(url, '/take-part')
    const who = await whoami(request, clientIp(request))
    if (who.owner || (who.tester && who.track)) return serve(FILES.takePart, url, closed)
    if (who.tester) return redirect('/')
    return serve(FILES.codePage, url, closed)
  }

  /* 3 and 4. aliases and every other file: the owner, or a tester whose track includes it */
  const who = await whoami(request, clientIp(request))
  const alias = ALIASES[path]
  let target = alias ? alias.file : decoded.replace(/^\/+/, '')
  const renamed = RENAMED[target]
  if (renamed) target = renamed
  const testerMayOpen = who.tester && trackAllows(who.track, target)
  if (!who.owner && !testerMayOpen) return notFound()
  if (renamed) return redirect(encodePath(renamed) + url.search)
  if (alias) {
    if (alias.via === 'redirect') return redirect(encodePath(alias.file) + url.search)
    return serve(alias.file, url, closed)
  }
  return next({ headers: closed })
}
