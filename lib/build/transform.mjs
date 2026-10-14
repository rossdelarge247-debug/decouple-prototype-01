/* The build's transform (spec §5), as pure functions over strings so they can be tested on a fixture page.
   scripts/build.mjs does the reading, compiling and writing. */
import { createHash } from 'node:crypto'

export const LEFTOVERS = ['text/babel', 'unpkg.com', 'fonts.googleapis.com']

/* References that must keep their exact name. Empty since export 2026-10-14a: the pages now find
   the shared client with a src*= selector, so it can carry a cache-busting query like the rest. */
export const NO_BUST = new Set([])

export const FONT_PACKAGES = {
  Inter: { pkg: '@fontsource/inter', prefix: 'inter' },
  'Source Serif Pro': { pkg: '@fontsource/source-serif-pro', prefix: 'source-serif-pro' },
  'JetBrains Mono': { pkg: '@fontsource/jetbrains-mono', prefix: 'jetbrains-mono' },
  Caveat: { pkg: '@fontsource/caveat', prefix: 'caveat' },
  'Mrs Saint Delafield': { pkg: '@fontsource/mrs-saint-delafield', prefix: 'mrs-saint-delafield' },
  'Homemade Apple': { pkg: '@fontsource/homemade-apple', prefix: 'homemade-apple' },
}

export const LATIN_RANGE = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'

export const hashOf = (content) => createHash('sha256').update(content).digest('hex').slice(0, 10)

export const slugOf = (fileName) =>
  fileName
    .replace(/\.html$/i, '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const isExternal = (v) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|data:)/i.test(v.trim()) || v.trim() === ''

/* The local part of a reference: path without query or hash, URL-decoded */
export const refPath = (v) => {
  const raw = v.trim().split('#')[0].split('?')[0]
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

const attrRe = /\b(src|href)\s*=\s*(["'])([^"']*)\2/gi

/* An attribute value as the browser reads it: "To-do &amp; Journal.html" → "To-do & Journal.html" */
export const unescapeAttr = (v) =>
  v.replace(/&(amp|lt|gt|quot|apos|#39|#x27);/gi, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", '#x27': "'" })[e.toLowerCase()] ?? m)

/* Every local src and href in an HTML string: [{ attr, value, path }] */
export function localRefs(html) {
  const out = []
  for (const m of html.matchAll(attrRe)) {
    const value = m[3]
    if (isExternal(value)) continue
    const path = refPath(unescapeAttr(value))
    if (path) out.push({ attr: m[1].toLowerCase(), value, path })
  }
  return out
}

/* The page with the bodies of its inline scripts emptied: what the tags themselves reference.
   The public allow-list is built from this, so a file that an inline script loads only off the site
   (the guide's Google Form fallback, export 2026-10-14b) stays private. */
export const withoutInlineScripts = (html) => html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs) => `<script${attrs}></script>`)

const urlRe = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi

/* Every local url() in a CSS string */
export function cssRefs(css) {
  const out = []
  for (const m of css.matchAll(urlRe)) {
    const value = m[2]
    if (isExternal(value)) continue
    const path = refPath(value)
    if (path) out.push({ value, path })
  }
  return out
}

/* Strings in a script that look like local files it might fetch or load */
export function scriptRefs(js) {
  const out = new Set()
  for (const m of js.matchAll(/["'`]([A-Za-z0-9_][A-Za-z0-9_\-./ ·]{0,120}\.(?:js|css|json|csv|png|jpe?g|svg|webp|woff2?))["'`]/g)) out.add(m[1])
  return [...out]
}

const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi

const attrsOf = (s) => {
  const o = {}
  for (const m of s.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) o[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  return o
}

/* Every <script> in order: { tag, attrs, body, babel, src } */
export function scripts(html) {
  const out = []
  for (const m of html.matchAll(scriptRe)) {
    const attrs = attrsOf(m[1])
    out.push({ tag: m[0], attrs, body: m[2], babel: (attrs.type || '').trim().toLowerCase() === 'text/babel', src: attrs.src })
  }
  return out
}

/* Remove the Babel standalone tag */
export function stripBabelStandalone(html) {
  return html.replace(/[ \t]*<script\b[^>]*src=["'][^"']*@babel\/standalone[^"']*["'][^>]*>\s*<\/script>[ \t]*\r?\n?/gi, '')
}

/* unpkg development builds → the production builds the build copied into vendor/.
   The whole tag is replaced, because the export pins the CDN files with integrity hashes. */
export function swapReact(html, { react = 'vendor/react.production.min.js', reactDom = 'vendor/react-dom.production.min.js' } = {}) {
  return html
    .replace(/<script\b[^>]*src=["']https:\/\/unpkg\.com\/react@[\d.]+\/umd\/react\.development\.js["'][^>]*>\s*<\/script>/gi, `<script src="${react}"></script>`)
    .replace(/<script\b[^>]*src=["']https:\/\/unpkg\.com\/react-dom@[\d.]+\/umd\/react-dom\.development\.js["'][^>]*>\s*<\/script>/gi, `<script src="${reactDom}"></script>`)
}

/* Google Fonts links → one local stylesheet; preconnects to Google go */
export function swapFonts(html, fontsHref = 'fonts.css') {
  let out = html.replace(/[ \t]*<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["'][^>]*>[ \t]*\r?\n?/gi, (tag) =>
    /rel=["']?preconnect/i.test(tag) || /dns-prefetch/i.test(tag) ? '' : `<link rel="stylesheet" href="${fontsHref}">\n`,
  )
  return out
}

/* Families and weights a page asks Google for: { 'Inter': [{ w: 400, i: false }, ...] } */
export function parseFontsHref(href) {
  const fams = {}
  const q = href.split('?')[1] || ''
  for (const part of q.split('&')) {
    if (!part.startsWith('family=')) continue
    const spec = decodeURIComponent(part.slice(7).replace(/\+/g, ' '))
    const [name, axes] = spec.split(':')
    const list = []
    if (!axes) list.push({ w: 400, i: false })
    else {
      const [keys, values] = axes.split('@')
      const ks = keys.split(',')
      for (const tuple of values.split(';')) {
        const vs = tuple.split(',')
        const get = (k, d) => {
          const idx = ks.indexOf(k)
          return idx < 0 ? d : vs[idx]
        }
        list.push({ w: Number(get('wght', '400')), i: get('ital', '0') === '1' })
      }
    }
    const cur = fams[name] || (fams[name] = [])
    for (const x of list) if (!cur.some((y) => y.w === x.w && y.i === x.i)) cur.push(x)
  }
  return fams
}

/* All Google Fonts hrefs in a page */
export function fontsHrefs(html) {
  return [...html.matchAll(/href=["'](https:\/\/fonts\.googleapis\.com\/css2?\?[^"']+)["']/gi)].map((m) => m[1].replace(/&amp;/g, '&'))
}

export function fontFace(family, w, italic, file) {
  return `@font-face{font-family:'${family}';font-style:${italic ? 'italic' : 'normal'};font-weight:${w};font-display:swap;src:url(${file}) format('woff2');unicode-range:${LATIN_RANGE}}`
}

const bustable = (path) => /\.(js|css|woff2)$/i.test(path) && !NO_BUST.has(path.replace(/^\//, ''))

/* Append ?v=<hash> to local JS and CSS references. resolve(path) → the hash, or null to leave it alone */
export function bustHtml(html, resolve) {
  return html.replace(attrRe, (m, attr, quote, value) => {
    if (isExternal(value)) return m
    const path = refPath(unescapeAttr(value))
    if (!bustable(path)) return m
    const h = resolve(path)
    if (!h) return m
    const base = value.split('#')[0].split('?')[0]
    return `${attr}=${quote}${base}?v=${h}${quote}`
  })
}

export function bustCss(css, resolve) {
  return css.replace(urlRe, (m, quote, value) => {
    if (isExternal(value)) return m
    const path = refPath(value)
    if (!bustable(path)) return m
    const h = resolve(path)
    if (!h) return m
    const base = value.split('#')[0].split('?')[0]
    return `url(${quote}${base}?v=${h}${quote})`
  })
}

/* Which of the forbidden strings an HTML page still contains */
export function leftovers(html) {
  return LEFTOVERS.filter((s) => html.includes(s))
}

/* Resolve a reference against the file that holds it. Leading slash = from the site root. */
export function resolveRef(fromFile, path) {
  if (path.startsWith('/')) return path.replace(/^\/+/, '')
  const dir = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/') + 1) : ''
  const parts = (dir + path).split('/')
  const out = []
  for (const p of parts) {
    if (p === '' || p === '.') continue
    if (p === '..') out.pop()
    else out.push(p)
  }
  return out.join('/')
}

/* Where x.jsx compiles to: x.js, or x.jsx.js when the export ships its own x.js beside it */
export function compiledNameFor(jsx, existing) {
  const js = jsx.replace(/\.jsx$/i, '.js')
  return existing.has(js) ? jsx + '.js' : js
}

/* An IIFE around compiled code, if the compiler did not add one */
export const iife = (code) => (/^\s*\(\s*(?:function|\(\s*\)\s*=>)/.test(code) ? code : `(()=>{${code}\n})();`)

/* <link rel="canonical"> before </head>, replacing one the page already has (spec §5.9) */
export function addCanonical(html, href) {
  const tag = `<link rel="canonical" href="${href}">`
  const without = html.replace(/[ \t]*<link\b[^>]*rel=["']?canonical["']?[^>]*>[ \t]*\r?\n?/gi, '')
  return /<\/head>/i.test(without) ? without.replace(/<\/head>/i, `${tag}\n</head>`) : tag + '\n' + without
}

const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module'])

/* Rewrite the bodies of inline scripts (classic or module JavaScript only) and inline styles, and drop
   HTML comments outside them (spec §5.8: the comments describe the prototypes and how things work).
   onScript and onStyle get the body and return the new one. */
export function rewriteInline(html, onScript, onStyle) {
  const out = []
  let last = 0
  for (const m of html.matchAll(/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    out.push(html.slice(last, m.index).replace(/<!--(?!\[if)[\s\S]*?-->/g, ''))
    const [whole, tag, attrs, body] = m
    const a = attrsOf(attrs)
    let next = body
    if (tag.toLowerCase() === 'style' && body.trim()) next = onStyle(body)
    else if (tag.toLowerCase() === 'script' && !('src' in a) && JS_TYPES.has((a.type || '').trim().toLowerCase()) && body.trim()) next = onScript(body, (a.type || '').trim().toLowerCase() === 'module')
    out.push(next === body ? whole : `<${tag}${attrs}>${next}</${tag}>`)
    last = m.index + whole.length
  }
  out.push(html.slice(last).replace(/<!--(?!\[if)[\s\S]*?-->/g, ''))
  return out.join('')
}
