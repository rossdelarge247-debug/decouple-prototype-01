#!/usr/bin/env node
/* The build (spec §5): site/ → dist/, fast and unchanged in behaviour.
   1. copy  2. compile every Babel script with esbuild, one IIFE each  3. production React from vendor/
   4. self-hosted fonts  5. cache-busting  6. the public allow-list  7. questions.json from the sheet
   8. fail on anything left over or unresolved. Also copies the login and 404 pages from pages-src/. */
import { createRequire } from 'node:module'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  FONT_PACKAGES,
  bustCss,
  bustHtml,
  cssRefs,
  fontFace,
  fontsHrefs,
  hashOf,
  iife,
  leftovers,
  localRefs,
  parseFontsHref,
  resolveRef,
  scriptRefs,
  scripts,
  slugOf,
  stripBabelStandalone,
  swapFonts,
  swapReact,
} from '../lib/build/transform.mjs'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

/* A package's folder, whether or not its exports map lists package.json */
const pkgDir = (name) => {
  try {
    return dirname(require.resolve(`${name}/package.json`))
  } catch {
    return join(ROOT, 'node_modules', name)
  }
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = join(ROOT, 'site')
const PAGES = join(ROOT, 'pages-src')
const DIST = join(ROOT, 'dist')
const GENERATED = join(ROOT, 'lib', 'generated')

const PUBLIC_PAGES = ['Marketing 02 · Divorce Guide.html', 'Marketing 01 · Holding Page.html', 'privacy.html']
const OWN_PAGES = ['studio.html', '404.html']
const OWN_FILES = ['favicon.ico']

const log = (...a) => console.log('[build]', ...a)
const fail = (msg) => {
  console.error('[build] FAILED: ' + msg)
  process.exit(1)
}

const walk = (dir, base = dir) => {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p, base))
    else out.push(relative(base, p).split('\\').join('/'))
  }
  return out
}

const read = (rel) => readFileSync(join(DIST, rel), 'utf8')
const write = (rel, content) => {
  mkdirSync(dirname(join(DIST, rel)), { recursive: true })
  writeFileSync(join(DIST, rel), content)
}
const inDist = (rel) => existsSync(join(DIST, rel)) && statSync(join(DIST, rel)).isFile()

async function compile(code, from) {
  try {
    const r = await esbuild.transform(code, { loader: 'jsx', target: 'es2019', minify: true, format: 'iife', jsx: 'transform', legalComments: 'none' })
    return iife(r.code)
  } catch (e) {
    fail(`could not compile ${from}: ${e.message}`)
  }
}

async function main() {
  const t0 = Date.now()
  if (!existsSync(SITE)) fail('site/ is missing')
  rmSync(DIST, { recursive: true, force: true })
  cpSync(SITE, DIST, { recursive: true })
  for (const own of [...OWN_PAGES, ...OWN_FILES]) {
    const src = join(PAGES, own)
    if (!existsSync(src)) fail(`pages-src/${own} is missing`)
    cpSync(src, join(DIST, own))
  }
  log('copied site/ and pages-src/')

  /* 3. React production builds */
  mkdirSync(join(DIST, 'vendor'), { recursive: true })
  for (const [pkg, file] of [['react', 'react.production.min.js'], ['react-dom', 'react-dom.production.min.js']]) {
    const src = join(pkgDir(pkg), 'umd', file)
    if (!existsSync(src)) fail(`${pkg} ${file} is not installed (React 18 is needed for the UMD build)`)
    cpSync(src, join(DIST, 'vendor', file))
  }

  const pages = walk(DIST).filter((f) => f.endsWith('.html'))
  const fontWants = {}
  const compiledJsx = new Set()

  /* 2, 3, 4 per page */
  for (const page of pages) {
    let html = read(page)
    for (const href of fontsHrefs(html)) {
      const fams = parseFontsHref(href)
      for (const [fam, list] of Object.entries(fams)) {
        const cur = fontWants[fam] || (fontWants[fam] = [])
        for (const x of list) if (!cur.some((y) => y.w === x.w && y.i === x.i)) cur.push(x)
      }
    }
    const slug = slugOf(page.split('/').pop())
    let n = 0
    for (const s of scripts(html)) {
      if (!s.babel) continue
      let out
      if (s.src) {
        const from = resolveRef(page, s.src.split('?')[0])
        if (!inDist(from)) fail(`${page} loads ${s.src}, which does not exist`)
        const js = from.replace(/\.jsx$/i, '.js')
        if (!compiledJsx.has(from)) {
          write(js, await compile(read(from), from))
          compiledJsx.add(from)
        }
        out = `<script src="${s.src.split('?')[0].replace(/\.jsx$/i, '.js')}"></script>`
      } else {
        n += 1
        const file = `inline/${slug}-${n}.js`
        write(file, await compile(s.body, `${page} inline script ${n}`))
        out = `<script src="${file}"></script>`
      }
      html = html.replace(s.tag, out)
    }
    html = stripBabelStandalone(html)
    html = swapReact(html)
    html = swapFonts(html, page.includes('/') ? '/fonts.css' : OWN_PAGES.includes(page) ? '/fonts.css' : 'fonts.css')
    write(page, html)
  }
  for (const jsx of compiledJsx) rmSync(join(DIST, jsx))
  for (const left of walk(DIST).filter((f) => f.endsWith('.jsx'))) {
    write(left.replace(/\.jsx$/i, '.js'), await compile(read(left), left))
    rmSync(join(DIST, left))
  }
  log(`compiled ${compiledJsx.size} JSX files and the inline scripts of ${pages.length} pages`)

  /* 4. fonts.css and the files it needs */
  mkdirSync(join(DIST, 'fonts'), { recursive: true })
  const faces = []
  for (const [fam, list] of Object.entries(fontWants)) {
    const def = FONT_PACKAGES[fam]
    if (!def) fail(`no self-hosted source for the font family "${fam}": add it to FONT_PACKAGES`)
    const dir = pkgDir(def.pkg)
    for (const { w, i } of list.sort((a, b) => a.w - b.w || (a.i ? 1 : -1))) {
      const name = `${def.prefix}-latin-${w}-${i ? 'italic' : 'normal'}.woff2`
      const src = join(dir, 'files', name)
      if (!existsSync(src)) fail(`${fam} ${w}${i ? ' italic' : ''} is not in ${def.pkg}`)
      cpSync(src, join(DIST, 'fonts', name))
      faces.push(fontFace(fam, w, i, `/fonts/${name}`))
    }
  }
  write('fonts.css', faces.join('\n') + '\n')
  log(`fonts.css: ${faces.length} faces from ${Object.keys(fontWants).length} families`)

  /* 7. questions from the sheet. With nothing to write, an empty array goes out instead of no file:
     the page treats both the same (its built-in questions), and the empty file spares it a 404. */
  let questions = []
  if (process.env.APPS_SCRIPT_URL && process.env.APPS_SCRIPT_SECRET) {
    try {
      const u = new URL(process.env.APPS_SCRIPT_URL)
      u.searchParams.set('action', 'questions')
      u.searchParams.set('secret', process.env.APPS_SCRIPT_SECRET)
      const res = await fetch(u, { signal: AbortSignal.timeout(15000), redirect: 'follow' })
      const data = res.ok ? await res.json() : null
      const rows = Array.isArray(data) ? data : data && Array.isArray(data.questions) ? data.questions : null
      if (rows && rows.length) {
        questions = rows
        log(`questions.json: ${rows.length} rows from the sheet`)
      } else log('questions.json: the tab is empty or did not answer; the page uses its built-in questions')
    } catch (e) {
      log(`questions.json: skipped (${e.message}); the page uses its built-in questions`)
    }
  } else log('questions.json: APPS_SCRIPT_URL not set; the page uses its built-in questions')
  write('m02/guide/questions.json', JSON.stringify(questions))

  /* 5. cache-busting: hashes of the final JS and CSS, references rewritten in HTML and CSS */
  const hashes = new Map()
  const hashFor = (rel) => {
    if (!inDist(rel)) return null
    if (!hashes.has(rel)) hashes.set(rel, hashOf(readFileSync(join(DIST, rel))))
    return hashes.get(rel)
  }
  for (const css of walk(DIST).filter((f) => f.endsWith('.css'))) {
    write(css, bustCss(read(css), (p) => hashFor(resolveRef(css, p))))
  }
  for (const page of pages) {
    write(page, bustHtml(read(page), (p) => hashFor(resolveRef(page, p))))
  }

  /* 8. nothing left over, everything resolves */
  const problems = []
  for (const page of pages) {
    const html = read(page)
    for (const s of leftovers(html)) problems.push(`${page} still contains ${s}`)
    for (const r of localRefs(html)) {
      const target = resolveRef(page, r.path)
      if (r.attr === 'href' && /\.html$/i.test(target) === false && !/\.(css|js|json|csv|png|jpe?g|svg|webp|ico|woff2?)$/i.test(target)) continue
      if (!inDist(target)) problems.push(`${page}: ${r.attr}="${r.value}" does not resolve`)
    }
  }
  for (const css of walk(DIST).filter((f) => f.endsWith('.css'))) {
    for (const r of cssRefs(read(css))) {
      const target = resolveRef(css, r.path)
      if (!inDist(target)) problems.push(`${css}: url(${r.value}) does not resolve`)
    }
  }
  if (problems.length) fail('\n  ' + problems.join('\n  '))

  /* 6. the public allow-list: what the three public pages need, after rewriting */
  const pub = new Set()
  const add = (rel) => {
    if (inDist(rel)) pub.add('/' + rel)
  }
  const seenCss = new Set()
  const visitCss = (rel) => {
    if (seenCss.has(rel) || !inDist(rel)) return
    seenCss.add(rel)
    add(rel)
    for (const r of cssRefs(read(rel))) {
      const t = resolveRef(rel, r.path)
      add(t)
      if (t.endsWith('.css')) visitCss(t)
    }
  }
  const visitJs = (rel) => {
    if (!inDist(rel)) return
    add(rel)
    for (const p of scriptRefs(read(rel))) {
      const t = resolveRef('', p)
      if (inDist(t)) {
        add(t)
        if (t.endsWith('.css')) visitCss(t)
      }
    }
  }
  for (const page of PUBLIC_PAGES) {
    if (!inDist(page)) fail(`public page ${page} is missing from the export`)
    add(page)
    for (const r of localRefs(read(page))) {
      const t = resolveRef(page, r.path)
      if (t.endsWith('.css')) visitCss(t)
      else if (t.endsWith('.js')) visitJs(t)
      else if (!t.endsWith('.html')) add(t)
    }
  }
  visitCss('fonts.css')
  add('m02/guide/questions.json')
  add('favicon.ico')
  const list = [...pub].sort()
  write('_public.json', JSON.stringify(list, null, 1) + '\n')
  mkdirSync(GENERATED, { recursive: true })
  writeFileSync(
    join(GENERATED, 'public.ts'),
    `/* Generated by scripts/build.mjs. Do not edit: run the build and commit the result. */\nexport const PUBLIC_PATHS: readonly string[] = ${JSON.stringify(list, null, 2)}\n`,
  )
  writeFileSync(
    join(GENERATED, 'not-found.ts'),
    `/* Generated by scripts/build.mjs from pages-src/404.html. Do not edit: run the build and commit the result. */\nexport const NOT_FOUND_HTML = ${JSON.stringify(read('404.html'))}\n`,
  )
  log(`public allow-list: ${list.length} paths`)
  log(`done in ${Date.now() - t0} ms`)
}

main().catch((e) => fail(e.stack || String(e)))
