import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// After the first screen build, no colour or font is ever inlined. Tokens live in
// src/styles/tokens.ts and src/app/globals.css; the inherited engine is exempt.
const ROOT = path.resolve(__dirname, '../../src')
const EXEMPT = ['styles/tokens.ts', 'app/globals.css', 'lib/bank/', 'lib/ai/', 'types/', 'app/api/bank/']
const PATTERNS: Array<[string, RegExp]> = [
  ['hex colour', /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/],
  ['rgb/hsl colour', /\b(?:rgba?|hsla?)\(/],
  ['font-family', /font-family|fontFamily/],
  ['inline style', /style=\{\{/],
]

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full)
  }
  return out
}

describe('no inline colours or fonts', () => {
  const files = walk(ROOT).filter(f => !EXEMPT.some(e => path.relative(ROOT, f).startsWith(e)))
  it('scans the app', () => {
    expect(files.length).toBeGreaterThan(0)
  })
  for (const file of files) {
    it(path.relative(ROOT, file), () => {
      const text = readFileSync(file, 'utf8')
      for (const [label, re] of PATTERNS) {
        const hit = text.match(re)
        expect(hit, `${label}: ${hit?.[0]}`).toBeNull()
      }
    })
  }
})
