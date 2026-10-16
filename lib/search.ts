/* Search engines (spec §4.5 and §5.1). The indexing setting decides: off, nothing may be listed; on,
   only /, /privacy and /help, and robots.txt lets crawlers fetch the files those pages need.
   robots.txt is public, so it never names a private path: only the public allow-list goes in it. */
import { encodePath } from './aliases.js'

/** the only addresses that may ever be indexed */
export const INDEXABLE: readonly string[] = ['/', '/privacy', '/help']

/* Does this response go out without the noindex header? Only the indexable addresses, only when
   indexing is on. /guide keeps it, because it serves the same page as /. */
export function indexable(pathname: string, indexing: boolean): boolean {
  return indexing && INDEXABLE.includes(pathname)
}

export function robotsTxt(indexing: boolean, publicPaths: Iterable<string>, origin: string): string {
  if (!indexing) return 'User-agent: *\nDisallow: /\n'
  const allow = new Set<string>()
  for (const p of publicPaths) if (p.startsWith('/')) allow.add(encodePath(p.replace(/^\/+/, '')))
  const lines = ['User-agent: *', ...INDEXABLE.map((p) => `Allow: ${p}$`), ...[...allow].sort().map((p) => `Allow: ${p}`), 'Disallow: /', `Sitemap: ${origin}/sitemap.xml`]
  return lines.join('\n') + '\n'
}

/* lastmod as the sitemap protocol takes it: a date, or a full time with its zone; anything else is left out */
const W3C_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/

/** the sitemap when indexing is on; null means 404. lastmod per address, when known. */
export function sitemapXml(indexing: boolean, origin: string, lastmod: Readonly<Record<string, string | null | undefined>> = {}): string | null {
  if (!indexing) return null
  const urls = INDEXABLE.map((p) => {
    const m = lastmod[p]
    return `  <url><loc>${origin}${p}</loc>${m && W3C_DATE.test(m) ? `<lastmod>${m}</lastmod>` : ''}</url>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/* The two dates the sitemap carries: the deployment's build (for / and /privacy) and the help
   content's last GOV.UK fetch (for /help). Both are public files of the deployment itself. */
export interface BuildDates {
  built: string | null
  help: string | null
}

export function lastmodFor(dates: BuildDates): Record<string, string | null> {
  return { '/': dates.built, '/privacy': dates.built, '/help': dates.help }
}
