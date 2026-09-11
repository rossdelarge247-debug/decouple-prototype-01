import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { cssVariables } from '@/styles/tokens'

// The @theme block in globals.css must declare exactly the tokens in tokens.ts.
function themeDeclarations(css: string): Record<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: Record<string, string> = {}
  const re = /@theme(?:\s+\w+)*\s*\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(stripped))) {
    let depth = 1
    let i = m.index + m[0].length
    const start = i
    while (i < stripped.length && depth > 0) {
      if (stripped[i] === '{') depth++
      else if (stripped[i] === '}') depth--
      i++
    }
    const block = stripped.slice(start, i - 1)
    for (const d of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      out[d[1]] = normalise(d[2])
    }
  }
  return out
}

function normalise(value: string): string {
  return value.trim().replace(/\s+/g, ' ').replace(/"/g, "'").toLowerCase()
}

describe('design tokens', () => {
  const css = readFileSync(path.resolve(__dirname, '../../src/app/globals.css'), 'utf8')
  const declared = themeDeclarations(css)
  const expected = Object.fromEntries(Object.entries(cssVariables()).map(([k, v]) => [k, normalise(v)]))

  it('globals.css declares every token with the same value', () => {
    expect(declared).toEqual(expected)
  })

  it('every colour token is a lowercase six-digit hex', () => {
    for (const [name, value] of Object.entries(cssVariables())) {
      if (name.startsWith('--color-')) expect(value, name).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
