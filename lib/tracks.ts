/* Tester tracks (spec §3, §4.4). Each tester code has a track: which prototype pages its tester may
   open. Tokens: p01…p10 → Proto 01…10, m00…m08 → MVP 00…08, "full" = all ten Protos, "mvp" = all
   nine MVPs, or a list like "p03,m05". An empty track means the guide only.
   A tester with a track may also open /take-part and everything under the folders the pages share. */
import { FILES, MVPS, PROTOS, slugOf } from './aliases.js'

/** what /api/admin/codes accepts (spec §7) */
export const TRACK_RE = /^(|full|mvp|[pm]\d{2}(,[pm]\d{2})*)$/

export type TrackMode = '' | 'un' | 'mod'

/** the folders the participant hub and the prototypes load from */
export const TRACK_DIRS: readonly string[] = ['proto/', 'mvp/', 'shared/', 'take-part/']

/* As typed or as read from the sheet: lower case, no spaces, "03" → "p03", unknown tokens dropped */
export function normaliseTrack(raw: unknown): string {
  const tokens = String(raw ?? '')
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => (/^\d{2}$/.test(t) ? 'p' + t : t))
    .filter((t) => t === 'full' || t === 'mvp' || /^[pm]\d{2}$/.test(t))
  return [...new Set(tokens)].join(',')
}

export function normaliseMode(raw: unknown): TrackMode {
  const m = String(raw ?? '').trim().toLowerCase()
  return m === 'un' || m === 'mod' ? m : ''
}

/** the page files a track opens */
export function trackFiles(track: string | undefined): Set<string> {
  const out = new Set<string>()
  for (const t of normaliseTrack(track).split(',')) {
    if (t === 'full') PROTOS.forEach((f) => out.add(f))
    else if (t === 'mvp') MVPS.forEach((f) => out.add(f))
    else if (/^p\d{2}$/.test(t)) {
      const f = PROTOS[Number(t.slice(1)) - 1]
      if (f) out.add(f)
    } else if (/^m\d{2}$/.test(t)) {
      const f = MVPS[Number(t.slice(1))]
      if (f) out.add(f)
    }
  }
  return out
}

/* May a tester with this track open this file? `file` is the decoded path without the leading slash.
   The pages in the track, the participant hub, the folders they share, and the inline scripts the
   build split out of those pages (inline/<slug>-<n>.js). The hubs are never in a track. */
export function trackAllows(track: string | undefined, file: string): boolean {
  const pages = trackFiles(track)
  if (!pages.size) return false
  /* "proto%2F..%2FDecouple · Results.html" decodes to a path that starts with proto/ but isn't in it */
  if (file.includes('\\') || file.split('/').some((seg) => seg === '..' || seg === '.' || seg === '')) return false
  if (pages.has(file) || file === FILES.takePart) return true
  if (TRACK_DIRS.some((d) => file.startsWith(d))) return true
  const m = file.match(/^inline\/(.+)-\d+\.js$/)
  if (m) {
    const slug = m[1]
    if (slug === slugOf(FILES.takePart)) return true
    for (const p of pages) if (slugOf(p) === slug) return true
  }
  return false
}
