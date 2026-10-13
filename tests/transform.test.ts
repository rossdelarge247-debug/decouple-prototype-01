import { describe, expect, it } from 'vitest'
import { bustCss, bustHtml, cssRefs, fontsHrefs, iife, leftovers, localRefs, parseFontsHref, resolveRef, scriptRefs, scripts, slugOf, stripBabelStandalone, swapFonts, swapReact } from '../lib/build/transform.mjs'

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

  it('adds a content hash to JS and CSS references, except the one found by name', () => {
    const page = swapFonts(swapReact(stripBabelStandalone(FIXTURE)))
    const out = bustHtml(page, (p: string) => (p === 'shared/dc-site.js' ? 'nope' : 'h' + p.length))
    expect(out).toContain('href="fonts.css?v=h9"')
    expect(out).toContain('src="proto/journey-store.js?v=h22"')
    expect(out).toContain('src="shared/dc-site.js"')
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
})
