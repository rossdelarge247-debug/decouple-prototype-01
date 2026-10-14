import { describe, expect, it } from 'vitest'
import { addCanonical, bustCss, compiledNameFor, bustHtml, cssRefs, fontsHrefs, iife, leftovers, localRefs, parseFontsHref, resolveRef, rewriteInline, scriptRefs, scripts, slugOf, stripBabelStandalone, swapFonts, swapReact, unescapeAttr, withoutInlineScripts } from '../lib/build/transform.mjs'

const FIXTURE = `<!doctype html>
<html><head>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+Pro:ital,wght@0,400;0,600;1,400&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet">
<link rel="stylesheet" href="proto/discover/discover.css">
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-abc" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-def" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-ghi" crossorigin="anonymous"></script>
<script src="shared/dc-site.js"></script>
<script src="proto/journey-store.js"></script>
</head><body>
<a href="#top">Top</a><a href="https://www.gov.uk/">Gov</a><a href="privacy.html">Privacy</a><img src="atlas/hub/p01.png">
<script type="text/babel" src="proto/discover/parts.jsx"></script>
<script type="text/babel">
const { useState } = React;
window.X = () => <b>hi</b>;
</script>
</body></html>`

describe('the build transform on a fixture page', () => {
  it('finds every script in order and knows which are Babel', () => {
    const s = scripts(FIXTURE)
    expect(s.map((x) => x.babel)).toEqual([false, false, false, false, false, true, true])
    expect(s[5].src).toBe('proto/discover/parts.jsx')
    expect(s[6].body).toContain('useState')
  })

  it('swaps the React development builds for local production builds, integrity hashes and all', () => {
    const out = swapReact(FIXTURE)
    expect(out).toContain('<script src="vendor/react.production.min.js"></script>')
    expect(out).toContain('<script src="vendor/react-dom.production.min.js"></script>')
    expect(out).not.toContain('integrity="sha384-abc"')
    expect(out).not.toContain('react.development.js')
  })

  it('removes the Babel standalone tag and the Google Fonts links', () => {
    const out = swapFonts(stripBabelStandalone(FIXTURE))
    expect(out).not.toContain('@babel/standalone')
    expect(out).not.toContain('fonts.gstatic.com')
    expect(out).not.toContain('fonts.googleapis.com')
    expect(out).toContain('<link rel="stylesheet" href="fonts.css">')
    expect(leftovers(out)).toEqual(['text/babel', 'unpkg.com'])
    expect(leftovers(swapReact(out))).toEqual(['text/babel'])
  })

  it('reads the families and weights a page asks Google for', () => {
    const [href] = fontsHrefs(FIXTURE)
    expect(parseFontsHref(href)).toEqual({
      Inter: [{ w: 400, i: false }, { w: 500, i: false }, { w: 600, i: false }, { w: 700, i: false }],
      'Source Serif Pro': [{ w: 400, i: false }, { w: 600, i: false }, { w: 400, i: true }],
      'Mrs Saint Delafield': [{ w: 400, i: false }],
    })
  })

  it('lists local references only', () => {
    const refs = localRefs(FIXTURE).map((r) => r.path)
    expect(refs).toEqual(['proto/discover/discover.css', 'shared/dc-site.js', 'proto/journey-store.js', 'privacy.html', 'atlas/hub/p01.png', 'proto/discover/parts.jsx'])
  })

  it('adds a content hash to every JS and CSS reference', () => {
    const page = swapFonts(swapReact(stripBabelStandalone(FIXTURE)))
    const out = bustHtml(page, (p: string) => 'h' + p.length)
    expect(out).toContain('href="fonts.css?v=h9"')
    expect(out).toContain('src="proto/journey-store.js?v=h22"')
    expect(out).toContain('src="shared/dc-site.js?v=h17"')
    expect(out).toContain('href="#top"')
    expect(out).toContain('href="privacy.html"')
    expect(out).toContain('src="atlas/hub/p01.png"')
    expect(bustHtml('<script src="a.js"></script>', () => null)).toBe('<script src="a.js"></script>')
  })

  it('handles CSS url() references', () => {
    const css = `@font-face{src:url(/fonts/inter-latin-400-normal.woff2) format('woff2')} .x{background:url("img/a.png")} .y{background:url(data:image/png;base64,AAA)}`
    expect(cssRefs(css).map((r) => r.path)).toEqual(['/fonts/inter-latin-400-normal.woff2', 'img/a.png'])
    expect(bustCss(css, () => 'abc')).toContain('url(/fonts/inter-latin-400-normal.woff2?v=abc)')
    expect(bustCss(css, () => 'abc')).toContain('url("img/a.png")')
  })

  it('resolves references against the file that holds them', () => {
    expect(resolveRef('Proto 01 · Discover.html', 'proto/discover/parts.jsx')).toBe('proto/discover/parts.jsx')
    expect(resolveRef('m02/guide/g.css', '../../fonts/x.woff2')).toBe('fonts/x.woff2')
    expect(resolveRef('m02/guide/g.css', '/fonts/x.woff2')).toBe('fonts/x.woff2')
    expect(resolveRef('a/b.css', './c.png')).toBe('a/c.png')
  })

  it('finds file-like strings in scripts, wraps code in an IIFE once, and slugs page names', () => {
    expect(scriptRefs(`fetch("m02/guide/questions.json"); x = 'shared/dc-site.js'; y = "not a file"`)).toEqual(['m02/guide/questions.json', 'shared/dc-site.js'])
    expect(iife('var a=1;')).toBe('(()=>{var a=1;\n})();')
    expect(iife('(function(){})();')).toBe('(function(){})();')
    expect(iife('(() => { })();')).toBe('(() => { })();')
    expect(slugOf('Proto 01 · Discover.html')).toBe('proto-01-discover')
    expect(slugOf('Marketing 02 · Divorce Guide.html')).toBe('marketing-02-divorce-guide')
  })

  it('reads links as the browser does, so a file name with & resolves (export 2026-10-14d)', () => {
    expect(unescapeAttr('MVP 03 · To-do &amp; Journal.html')).toBe('MVP 03 · To-do & Journal.html')
    expect(localRefs('<a href="MVP 03 · To-do &amp; Journal.html">x</a>')[0].path).toBe('MVP 03 · To-do & Journal.html')
    expect(bustHtml('<script src="a&amp;b.js"></script>', (p: string) => (p === 'a&b.js' ? 'h1' : null))).toBe('<script src="a&amp;b.js?v=h1"></script>')
  })

  it('builds the public list from tags, not from what an inline script might load off the site', () => {
    const html = '<script src="shared/dc-site.js"></script><script>if(!onSite){var s=document.createElement("script");s.src="proto/ut/ut-questions.js"}</script>'
    expect(localRefs(withoutInlineScripts(html)).map((r) => r.path)).toEqual(['shared/dc-site.js'])
  })

  it('adds one canonical link to the head', () => {
    const once = addCanonical('<html><head><title>x</title></head><body></body></html>', 'https://decouple.uk/')
    expect(once).toContain('<link rel="canonical" href="https://decouple.uk/">\n</head>')
    const twice = addCanonical(once, 'https://decouple.uk/privacy')
    expect(twice.match(/canonical/g)).toHaveLength(1)
    expect(twice).toContain('href="https://decouple.uk/privacy"')
  })

  it('rewrites inline scripts and styles, leaves JSON and src scripts alone, and drops HTML comments', () => {
    const html = '<!-- about the prototype --><style>a { color: red }</style><script>/* how it works */ var a = 1</script><script type="application/json">{"k": 1}</script><script src="x.js"></script><p>keep <!-- note --> this</p>'
    const out = rewriteInline(html, (js: string) => `JS(${js.trim()})`, (css: string) => `CSS(${css.trim()})`)
    expect(out).toBe('<style>CSS(a { color: red })</style><script>JS(/* how it works */ var a = 1)</script><script type="application/json">{"k": 1}</script><script src="x.js"></script><p>keep  this</p>')
  })

  it('never compiles a JSX file over a script of the same name', () => {
    expect(compiledNameFor('m02/guide/g-guide.jsx', new Set(['m02/guide/g-guide.jsx']))).toBe('m02/guide/g-guide.js')
    expect(compiledNameFor('mvp/kit/kit.jsx', new Set(['mvp/kit/kit.js', 'mvp/kit/kit.jsx']))).toBe('mvp/kit/kit.jsx.js')
  })
})
