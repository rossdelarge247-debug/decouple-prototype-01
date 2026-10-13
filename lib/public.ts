/* The public allow-list (spec §5.6). The build writes every path the guide, the holding page and
   the privacy page need; the middleware lets exactly those through. */
export function normalisePath(pathname: string): string {
  let p = pathname
  try {
    p = decodeURIComponent(p)
  } catch {
    /* keep as is */
  }
  p = p.replace(/\/{2,}/g, '/')
  if (!p.startsWith('/')) p = '/' + p
  return p
}

export function loadPublicList(raw: unknown): Set<string> {
  const out = new Set<string>()
  if (Array.isArray(raw)) for (const x of raw) if (typeof x === 'string' && x) out.add(normalisePath(x))
  return out
}

export function isPublicPath(pathname: string, list: Set<string>): boolean {
  return list.has(normalisePath(pathname))
}
