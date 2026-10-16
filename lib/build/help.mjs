/* Help content (spec §5.2): the GOV.UK pages help/help-sources.json lists, fetched from the GOV.UK
   Content API at build time, cleaned to a short list of tags, and written to help/help-content.json
   for the help page (/help) and MVP 08. Reused under the Open Government Licence v3.0.
   Pure apart from the fetch, which is passed in, so the whole step is tested without the network. */

export const GOV = 'https://www.gov.uk'
export const API = 'https://www.gov.uk/api/content'
export const USER_AGENT = 'decouple.uk build (hello@decouple.uk)'
export const LIVE_COPY = 'https://decouple.uk/help/help-content.json'

/* Every path the sources name, with the topic that names it and whether it is still to be confirmed */
export function collectPaths(sources) {
  const out = new Map()
  const add = (path, topic, confirm) => {
    if (typeof path !== 'string' || !path.startsWith('/')) return
    const had = out.get(path)
    if (had) had.confirm = had.confirm && !!confirm
    else out.set(path, { path, topic, confirm: !!confirm })
  }
  for (const t of (sources && sources.topics) || []) for (const g of t.gov || []) add(g.path, t.id, g.confirm)
  const d = (sources && sources.disclosure) || {}
  for (const g of d.gov || []) add(g.path, 'disclosure', g.confirm)
  if (d.collection) add(d.collection.path, 'disclosure', d.collection.confirm)
  return [...out.values()]
}

/* ── cleaning ── */

const KEEP = new Set(['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'strong', 'em', 'abbr', 'br'])
/* dropped with everything inside them, not just their tags */
const DROP_WHOLE = new Set(['script', 'style', 'iframe', 'noscript', 'template', 'svg', 'math', 'object', 'embed', 'video', 'audio', 'canvas', 'select', 'textarea', 'button', 'form', 'head', 'title'])
const VOID = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'area', 'base', 'track', 'param'])

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const decodeEntities = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi, (m, e) => {
    const k = e.toLowerCase()
    if (k === 'amp') return '&'
    if (k === 'lt') return '<'
    if (k === 'gt') return '>'
    if (k === 'quot') return '"'
    if (k === 'apos' || k === '#39') return "'"
    const n = k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10)
    return Number.isFinite(n) ? String.fromCodePoint(n) : m
  })

/* An href made absolute to GOV.UK; null for anything that is not a web, mail or phone link */
export function cleanHref(raw) {
  const v = decodeEntities(String(raw || '').trim())
  if (!v) return null
  if (v.startsWith('#')) return null
  try {
    const u = new URL(v, GOV + '/')
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(u.protocol) ? u.href : null
  } catch {
    return null
  }
}

const hrefOf = (attrs) => {
  const m = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i)
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : ''
}

/* GOV.UK body HTML → only the tags spec §5.2 allows, no attributes but a link's href. Text between
   tags is kept as the source escaped it. The page cleans it again with the browser's own parser. */
export function cleanBody(html) {
  const src = String(html || '').replace(/<!--[\s\S]*?-->/g, '')
  const out = []
  const open = []
  let skip = null
  let skipDepth = 0
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g
  let last = 0
  let m
  while ((m = tagRe.exec(src))) {
    const text = src.slice(last, m.index)
    if (!skip && text) out.push(text.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    last = tagRe.lastIndex
    const closing = m[1] === '/'
    const name = m[2].toLowerCase()
    const selfClosing = /\/\s*$/.test(m[3])
    if (skip) {
      if (name === skip) {
        if (closing) skipDepth -= 1
        else if (!selfClosing) skipDepth += 1
        if (skipDepth === 0) skip = null
      }
      continue
    }
    if (DROP_WHOLE.has(name)) {
      if (!closing && !selfClosing) {
        skip = name
        skipDepth = 1
      }
      continue
    }
    if (!KEEP.has(name)) continue
    if (name === 'br') {
      if (!closing) out.push('<br>')
      continue
    }
    if (closing) {
      const at = open.lastIndexOf(name)
      if (at < 0) continue
      while (open.length > at) out.push(`</${open.pop()}>`)
      continue
    }
    if (name === 'a') {
      const href = cleanHref(hrefOf(m[3]))
      out.push(href ? `<a href="${escAttr(href)}">` : '<a>')
    } else out.push(`<${name}>`)
    if (!VOID.has(name) && !selfClosing) open.push(name)
  }
  if (!skip) out.push(src.slice(last).replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  while (open.length) out.push(`</${open.pop()}>`)
  return out
    .join('')
    .replace(/<(p|li|h2|h3|h4|strong|em)>\s*<\/\1>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/* A Content API body: an HTML string, or a list of {content_type, content} with one of them HTML */
export function htmlOf(v) {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) {
    const h = v.find((x) => x && x.content_type === 'text/html')
    return h && typeof h.content === 'string' ? h.content : ''
  }
  return ''
}

const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* The part a path names inside a guide ("/guide/part-slug"), or null for the whole guide */
export function partSlug(path, basePath) {
  if (basePath && path !== basePath && path.startsWith(basePath + '/')) return path.slice(basePath.length + 1).split('/')[0] || null
  return null
}

/* One Content API item → what the page keeps (spec §5.2 step 3). Null when a part the path names is not in the guide. */
export function pageFrom(item, path) {
  const d = (item && item.details) || {}
  let body = ''
  if (Array.isArray(d.parts) && d.parts.length) {
    const slug = partSlug(path, item.base_path)
    const parts = slug ? d.parts.filter((p) => p && p.slug === slug) : d.parts
    if (slug && !parts.length) return null
    body = slug && parts.length === 1 ? htmlOf(parts[0].body) : parts.map((p) => `<h2>${escText(p.title || '')}</h2>\n${htmlOf(p.body)}`).join('\n')
  } else if (d.body) {
    body = htmlOf(d.body)
  } else if (d.introductory_paragraph || d.more_information) {
    /* a transaction (a page with a start button) has no body: its introduction is its text */
    body = [htmlOf(d.introductory_paragraph), htmlOf(d.more_information)].filter(Boolean).join('\n')
  }
  return {
    title: String(item.title || ''),
    description: String(item.description || ''),
    updated: String(item.public_updated_at || item.updated_at || ''),
    url: GOV + path,
    body: cleanBody(body),
  }
}

export const FORM_RE = /(?:^|:\s*)Form (D81|A|E1|E2|E)\b/

/* The forms the hub links (spec §5.2 step 4), from the collection's documents. GOV.UK titles put the
   form last ("…for a consent order: Form D81"), so the match takes the code at the start or after a colon. */
export function formsFrom(collection) {
  const docs = (collection && collection.links && collection.links.documents) || []
  const out = []
  for (const doc of docs) {
    const title = String((doc && doc.title) || '')
    const m = title.match(FORM_RE)
    if (!m || out.some((f) => f.code === m[1])) continue
    const url = doc.web_url || (doc.base_path ? GOV + doc.base_path : null)
    if (url) out.push({ code: m[1], title, url })
  }
  const order = ['D81', 'A', 'E', 'E1', 'E2']
  return out.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
}

/* ── fetching ── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* One path: {status:'ok', item} | {status:'missing', code} | {status:'down', why}. Retries twice on a
   network error, a 5xx or a 429, as spec §5.2 step 2 says. */
export async function fetchItem(fetchJson, path, { retries = 2, backoffMs = [500, 1500] } = {}) {
  let why = ''
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt) await sleep(backoffMs[attempt - 1] ?? 1500)
    let res
    try {
      res = await fetchJson(API + path)
    } catch (e) {
      why = e && e.cause && e.cause.code ? e.cause.code : (e && e.message) || String(e)
      continue
    }
    if (res.status === 404 || res.status === 410) return { status: 'missing', code: res.status }
    if (res.status >= 200 && res.status < 300 && res.json) return { status: 'ok', item: res.json }
    why = `HTTP ${res.status}`
    if (!(res.status >= 500 || res.status === 429)) break
  }
  return { status: 'down', why }
}

/* The whole step. deps: fetchJson(url) → {status, json}, now(), log(msg), warn(msg), pauseMs.
   Returns {content, problems: [message], warnings: [message]}; problems fail the build. */
export async function buildHelpContent(sources, deps) {
  const { fetchJson, now = () => new Date(), log = () => {}, warn = () => {}, pauseMs = 150, retryOpts } = deps
  const paths = collectPaths(sources)
  const pages = {}
  const problems = []
  const warnings = []
  const down = []
  let collection = null
  let downInARow = 0
  let gaveUp = false
  for (const [i, p] of paths.entries()) {
    if (gaveUp) {
      down.push(p)
      continue
    }
    if (i) await sleep(pauseMs)
    let r = await fetchItem(fetchJson, p.path, retryOpts)
    let page = r.status === 'ok' ? pageFrom(r.item, p.path) : null
    /* a guide part ("/guide/part"): when GOV.UK doesn't answer for the part's own path, find it in its guide */
    if ((r.status === 'missing' || (r.status === 'ok' && !page)) && p.path.split('/').length > 2) {
      const parent = p.path.slice(0, p.path.lastIndexOf('/'))
      const pr = await fetchItem(fetchJson, parent, retryOpts)
      /* only a guide with that part counts: a publication's parent page is not the page asked for */
      if (pr.status === 'ok' && Array.isArray(pr.item && pr.item.details && pr.item.details.parts)) {
        const pp = pageFrom({ ...pr.item, base_path: pr.item.base_path || parent }, p.path)
        if (pp) {
          r = pr
          page = pp
        }
      }
    }
    if (r.status === 'ok' && page) {
      downInARow = 0
      pages[p.path] = page
      if (sources.disclosure && sources.disclosure.collection && p.path === sources.disclosure.collection.path) collection = r.item
      continue
    }
    if (r.status === 'down') {
      down.push(p)
      downInARow += 1
      /* three in a row: GOV.UK is down, or the build has no network. Stop asking. */
      if (downInARow >= 3 && !Object.keys(pages).length) gaveUp = true
      continue
    }
    downInARow = 0
    const msg = `${p.path} (topic "${p.topic}") is not on GOV.UK${r.status === 'missing' ? ` (${r.code})` : ': the guide has no such part'}`
    if (p.confirm) warnings.push(`${msg}; marked confirm, so left out`)
    else problems.push(msg)
  }
  let forms = collection ? formsFrom(collection) : []
  let built = Object.keys(pages).length ? now().toISOString() : null

  /* what GOV.UK did not answer comes from the copy already live, so the page never loses text */
  if (down.length) {
    const live = await fetchJson(LIVE_COPY).catch(() => null)
    const old = live && live.status === 200 && live.json && typeof live.json === 'object' ? live.json : null
    let reused = 0
    for (const p of down) {
      const page = old && old.pages && old.pages[p.path]
      if (page) {
        pages[p.path] = page
        reused += 1
      }
    }
    if (!collection && old && Array.isArray(old.forms)) forms = old.forms
    if (!built && old && old.built && reused) built = old.built
    const why = down.length === paths.length ? 'GOV.UK could not be reached' : `${down.length} of ${paths.length} paths got no answer from GOV.UK`
    warnings.push(`${why}; ${reused ? `reused ${reused} from the live copy` : old ? 'the live copy did not have them' : 'the live copy could not be read either'}${down.length - reused ? `, so ${down.length - reused} show as links only` : ''}`)
  }
  log(`help-content.json: ${Object.keys(pages).length} of ${paths.length} GOV.UK pages, ${forms.length} forms`)
  const bare = Object.entries(pages).filter(([, pg]) => !(pg && pg.body)).map(([path]) => path)
  if (bare.length) log(`help-content.json: no body text on GOV.UK, so title, summary and link only: ${bare.join(', ')}`)
  if (forms.length) log(`help-content.json: forms ${forms.map((f) => f.code).join(', ')}`)
  for (const w of warnings) warn(w)
  return { content: { built, pages, forms }, problems, warnings }
}
