/* Addresses (spec §2). Files in site/ keep their names; these are the aliases in front of them.
   A single-segment alias is rewritten, so the address stays. An alias with a path segment is
   redirected to the file, because every page loads its assets by relative path and routes with
   location.hash, so neither a rewrite nor a <base> tag would keep it working. */
export const FILES = {
  guide: 'Marketing 02 · Divorce Guide.html',
  holding: 'Marketing 01 · Holding Page.html',
  privacy: 'privacy.html',
  hub: 'Decouple · Prototype Hub.html',
  marketing: 'Decouple · Marketing Hub.html',
  results: 'Decouple · Results.html',
  settings: 'Decouple · Site Settings.html',
  login: 'studio.html',
  notFound: '404.html',
} as const

export const PROTOS: readonly string[] = [
  'Proto 01 · Discover.html',
  'Proto 02 · Interview.html',
  'Proto 03 · Playback.html',
  'Proto 04 · Sign-up.html',
  'Proto 05 · Onboard.html',
  'Proto 06 · Prepare.html',
  'Proto 07 · Reconcile.html',
  'Proto 08 · Settle.html',
  'Proto 09 · Finalise.html',
  'Proto 10 · Dashboard.html',
]

export type Alias = { file: string; level: 'public' | 'owner'; via: 'rewrite' | 'redirect' }

export const ALIASES: Readonly<Record<string, Alias>> = {
  '/guide': { file: FILES.guide, level: 'public', via: 'rewrite' },
  '/holding': { file: FILES.holding, level: 'public', via: 'rewrite' },
  '/privacy': { file: FILES.privacy, level: 'public', via: 'rewrite' },
  '/hub': { file: FILES.hub, level: 'owner', via: 'rewrite' },
  '/hub/marketing': { file: FILES.marketing, level: 'owner', via: 'redirect' },
  '/hub/results': { file: FILES.results, level: 'owner', via: 'redirect' },
  '/hub/site': { file: FILES.settings, level: 'owner', via: 'redirect' },
  ...Object.fromEntries(PROTOS.map((file, i) => [`/p/${String(i + 1).padStart(2, '0')}`, { file, level: 'owner', via: 'redirect' }])),
}

/* "/Decouple · Results.html" → "/Decouple%20%C2%B7%20Results.html" */
export function encodePath(file: string): string {
  return '/' + file.split('/').map(encodeURIComponent).join('/')
}

/* Decoded path → is it one of the ten proto pages or their assets? */
export function isProtoPath(decodedPath: string): boolean {
  const p = decodedPath.replace(/^\/+/, '')
  return PROTOS.includes(p) || p.startsWith('proto/')
}

/* Decoded path → the file name of a page, if the path is one of the pages */
export function decodePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}
