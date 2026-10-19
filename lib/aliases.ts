/* Addresses (spec §2). Files in site/ keep their names; these are the aliases in front of them.
   A single-segment alias is rewritten, so the address stays. An alias with a path segment is
   redirected to the file, because every page loads its assets by relative path and routes with
   location.hash, so neither a rewrite nor a <base> tag would keep it working. */
export const FILES = {
  guide: 'Marketing 02 · Divorce Guide.html',
  holding: 'Marketing 01 · Holding Page.html',
  privacy: 'privacy.html',
  about: 'about.html',
  help: 'Marketing 03 · Help & Support.html',
  hub: 'Decouple · Prototype Hub.html',
  marketing: 'Decouple · Marketing Hub.html',
  results: 'Decouple · Results.html',
  settings: 'Decouple · Site Settings.html',
  takePart: 'Decouple · Take Part.html',
  freeTool: 'Marketing 02 · Free Tool.html',
  login: 'studio.html',
  codePage: 'take-part-code.html',
  notFound: '404.html',
} as const

/** The public pages' own file addresses and the short address each is sent to. The pages link to each
    other by file name, which the design tool needs; on the site the address bar shows the short one. */
export const SHORT: Readonly<Record<string, string>> = {
  [FILES.guide]: '/guide',
  [FILES.holding]: '/holding',
  [FILES.help]: '/help',
  [FILES.privacy]: '/privacy',
  [FILES.about]: '/about',
}

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

/** MVP 00 to MVP 08. MVP 00 · Public Site is a prototype, not a public page. */
export const MVPS: readonly string[] = [
  'MVP 00 · Public Site.html',
  'MVP 01 · Toolkit.html',
  'MVP 02 · Right for Us.html',
  'MVP 03 · To-do & Journal.html',
  'MVP 04 · Parenting Plan.html',
  'MVP 05 · Financial Statement.html',
  'MVP 06 · Split Planner.html',
  'MVP 07 · Ask.html',
  'MVP 08 · Help & Support.html',
]

/** files an export renamed: the old address redirects to the new one, behind the same rules */
export const RENAMED: Readonly<Record<string, string>> = {
  'MVP 01 · Shared Statement.html': 'MVP 05 · Financial Statement.html',
}

export type Alias = { file: string; level: 'public' | 'owner'; via: 'rewrite' | 'redirect' }

const two = (n: number): string => String(n).padStart(2, '0')

/** Each private page's short address. One segment, so a rewrite keeps the address and the page's
    relative paths still resolve from the root. The file's own address, and the older two-segment
    aliases, are redirected here once the session check has passed. */
export const PRIVATE_SHORT: Readonly<Record<string, string>> = {
  [FILES.hub]: '/hub',
  [FILES.marketing]: '/marketing',
  [FILES.results]: '/results',
  [FILES.settings]: '/settings',
  [FILES.takePart]: '/take-part',
  [FILES.freeTool]: '/free-tool',
  ...Object.fromEntries(PROTOS.map((file, i) => [file, `/p${two(i + 1)}`])),
  ...Object.fromEntries(MVPS.map((file, i) => [file, `/mvp${two(i)}`])),
}

export const ALIASES: Readonly<Record<string, Alias>> = {
  '/guide': { file: FILES.guide, level: 'public', via: 'rewrite' },
  '/holding': { file: FILES.holding, level: 'public', via: 'rewrite' },
  '/privacy': { file: FILES.privacy, level: 'public', via: 'rewrite' },
  '/about': { file: FILES.about, level: 'public', via: 'rewrite' },
  '/help': { file: FILES.help, level: 'public', via: 'rewrite' },
  '/hub': { file: FILES.hub, level: 'owner', via: 'rewrite' },
  '/hub/marketing': { file: FILES.marketing, level: 'owner', via: 'redirect' },
  '/hub/results': { file: FILES.results, level: 'owner', via: 'redirect' },
  '/hub/site': { file: FILES.settings, level: 'owner', via: 'redirect' },
  ...Object.fromEntries(PROTOS.map((file, i) => [`/p/${two(i + 1)}`, { file, level: 'owner', via: 'redirect' }])),
  ...Object.fromEntries(MVPS.map((file, i) => [`/p/mvp${two(i)}`, { file, level: 'owner', via: 'redirect' }])),
  /* the short addresses; /take-part has its own rules in the middleware */
  ...Object.fromEntries(
    Object.entries(PRIVATE_SHORT)
      .filter(([, short]) => short !== '/hub' && short !== '/take-part')
      .map(([file, short]) => [short, { file, level: 'owner' as const, via: 'rewrite' as const }]),
  ),
}

/* "/Decouple · Results.html" → "/Decouple%20%C2%B7%20Results.html". encodeURIComponent also turns
   the & in "MVP 03 · To-do & Journal.html" into %26. */
export function encodePath(file: string): string {
  return '/' + file.split('/').map(encodeURIComponent).join('/')
}

/* Decoded path → the file name of a page, if the path is one of the pages */
export function decodePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

/* The name the build gives a page's inline scripts: inline/<slug>-<n>.js. Must match slugOf in
   lib/build/transform.mjs (a test checks they agree). */
export function slugOf(fileName: string): string {
  return fileName
    .replace(/\.html$/i, '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}
