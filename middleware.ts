/* Routing middleware (spec §4). Runs in front of every request: the public allow-list goes
   straight through, / and /guide pick the guide or the holding page, the aliases in §2 map to
   files, and everything else needs the owner's session or returns a plain 404.
   Web APIs only (fetch, crypto.subtle), so it runs on the Node runtime or the edge alike. */
import { next, rewrite } from '@vercel/functions/middleware'
import { ALIASES, FILES, decodePath, encodePath, isProtoPath } from './lib/aliases.js'
import { noteCodeUsed, redeemable, whoami } from './lib/auth.js'
import { loginPath, sessionSecret, siteOrigin, testersCanOpenProtos } from './lib/env.js'
import { NOT_FOUND_HTML } from './lib/generated/not-found.js'
import { PUBLIC_PATHS } from './lib/generated/public.js'
import { clientIp, securityHeaders } from './lib/http.js'
import { isPublicPath, loadPublicList } from './lib/public.js'
import { testerCookie } from './lib/session.js'

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

function serve(file: string, url: URL, headers: Record<string, string>): Response {
  return rewrite(new URL(encodePath(file), url), { headers })
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
  if (path === '/privacy') return serve(FILES.privacy, url, { ...open, 'cache-control': HTML })
  if (isPublicPath(path, PUBLIC)) return next({ headers: { ...open, 'cache-control': cacheFor(decoded) } })

  /* 2. the front door */
  if (path === '/' || path === '/guide') {
    const code = url.searchParams.get('code')
    if (code !== null) {
      const back = new URL('/', url)
      url.searchParams.forEach((v, k) => {
        if (k !== 'code' && k !== 'code_error') back.searchParams.append(k, v)
      })
      const secret = sessionSecret()
      const row = secret ? await redeemable(code) : null
      if (row && secret) {
        await noteCodeUsed(row.code)
        return redirect(back.pathname + back.search, { 'set-cookie': await testerCookie(secret, row.label, row.code, row.test) })
      }
      back.searchParams.set('code_error', '1')
      return redirect(back.pathname + back.search)
    }
    const who = await whoami(request, clientIp(request))
    let file: string = FILES.guide
    if (path === '/') {
      const view = url.searchParams.get('view')
      if (who.owner && (view === 'guide' || view === 'holding')) file = view === 'guide' ? FILES.guide : FILES.holding
      else file = who.settings.mode === 'guide' || who.tester || who.owner ? FILES.guide : FILES.holding
    }
    /* varies by cookie and by the switches, so never shared */
    return serve(file, url, { ...open, 'cache-control': 'private, no-cache' })
  }

  /* 3 and 4. aliases and every other file: the owner, or a tester opening a proto when allowed */
  const who = await whoami(request, clientIp(request))
  const alias = ALIASES[path]
  const target = alias ? alias.file : decoded.replace(/^\/+/, '')
  const testerMayOpen = who.tester && testersCanOpenProtos() && isProtoPath('/' + target)
  if (!who.owner && !testerMayOpen) return notFound()
  if (alias) {
    if (alias.via === 'redirect') return redirect(encodePath(alias.file) + url.search)
    return serve(alias.file, url, closed)
  }
  return next({ headers: closed })
}
