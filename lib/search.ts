/* Search engines (spec §4.5 and §5.1). The indexing setting decides: off, nothing may be listed; on,
   only / and /privacy, and robots.txt lets crawlers fetch the files those pages need. robots.txt is
   public, so it never names a private path: only the public allow-list goes in it. */
import { encodePath } from './aliases.js'

/** the only addresses that may ever be indexed */
export const INDEXABLE: readonly string[] = ['/', '/privacy']

/* Does this response go out without the noindex header? Only / and /privacy, only when indexing is on.
   /guide keeps it, because it serves the same page as /. */
export function indexable(pathname: string, indexing: boolean): boolean {
  return indexing && INDEXABLE.includes(pathname)
}

export function robotsTxt(indexing: boolean, publicPaths: Iterable<string>, origin: string): string {
  if (!indexing) return 'User-agent: *\nDisallow: /\n'
  const allow = new Set<string>()
  for (const p of publicPaths) if (p.startsWith('/')) allow.add(encodePath(p.replace(/^\/+/, '')))
  const lines = ['User-agent: *', 'Allow: /$', 'Allow: /privacy$', ...[...allow].sort().map((p) => `Allow: ${p}`), 'Disallow: /', `Sitemap: ${origin}/sitemap.xml`]
  return lines.join('\n') + '\n'
}

/** the sitemap when indexing is on; null means 404 */
export function sitemapXml(indexing: boolean, origin: string): string | null {
  if (!indexing) return null
  const urls = INDEXABLE.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
