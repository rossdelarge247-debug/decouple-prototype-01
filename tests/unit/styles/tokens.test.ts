import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { TOKEN_NAMES, tokens } from '@/styles/tokens'

const globalsPath = resolve(process.cwd(), 'src/app/globals.css')
const css = readFileSync(globalsPath, 'utf-8')
const cssNames = (css.match(/--ds-[a-z0-9-]+(?=\s*:)/g) ?? []) as string[]
const cssNameSet = new Set(cssNames)
const tokenNameSet = new Set<string>(TOKEN_NAMES)

const cssValue = (name: string): string | undefined =>
  css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim()

describe('Design system tokens — globals.css ↔ tokens.ts parity (S-F1)', () => {
  it('every --ds-* name in globals.css has a TOKEN_NAMES entry', () => {
    const missing = cssNames.filter((n) => !tokenNameSet.has(n))
    expect(missing).toEqual([])
  })

  it('every TOKEN_NAMES entry exists in globals.css', () => {
    const missing = TOKEN_NAMES.filter((n) => !cssNameSet.has(n))
    expect(missing).toEqual([])
  })

  it('TOKEN_NAMES has 100 entries', () => {
    expect(TOKEN_NAMES.length).toBe(100)
  })

  it('phase colour quartet matches spec 68g C-V1', () => {
    expect(TOKEN_NAMES).toContain('--ds-color-phase-build')
    expect(TOKEN_NAMES).toContain('--ds-color-phase-reconcile')
    expect(TOKEN_NAMES).toContain('--ds-color-phase-settle')
    expect(TOKEN_NAMES).toContain('--ds-color-phase-finalise')
    // Start phase implicit per spec 42 5-phase model + user direction
    expect(TOKEN_NAMES).not.toContain('--ds-color-phase-start')
  })

  it('trust LOCKED visuals present', () => {
    expect(TOKEN_NAMES).toContain('--ds-color-trust-self-declared')
    expect(TOKEN_NAMES).toContain('--ds-color-trust-self-declared-soft')
    expect(TOKEN_NAMES).toContain('--ds-color-trust-bank-evidenced')
    expect(TOKEN_NAMES).toContain('--ds-color-trust-bank-evidenced-soft')
  })

  it('serif family names the face next/font registers, in CSS and TS alike', () => {
    // layout.tsx loads Source_Serif_4; any other family name silently falls
    // through to Georgia. Kept as a plain family list because inline `font:`
    // shorthands built from this token cannot carry var() in jsdom.
    expect(tokens.font.serif).toContain("'Source Serif 4'")
    expect(cssValue('--ds-font-serif')).toBe(tokens.font.serif)
  })

  it('brand accent, AI family and text-safe danger carry one value in CSS and TS', () => {
    const pairs: Array<[string, string]> = [
      ['--ds-color-accent-brand', tokens.color.accent.brand],
      ['--ds-color-ai', tokens.color.ai.accent],
      ['--ds-color-ai-text', tokens.color.ai.text],
      ['--ds-color-ai-soft', tokens.color.ai.soft],
      ['--ds-color-ai-border', tokens.color.ai.border],
      ['--ds-color-danger-text', tokens.color.dangerText],
    ]
    for (const [name, value] of pairs) {
      expect(cssValue(name), name).toBe(value)
    }
  })
})
