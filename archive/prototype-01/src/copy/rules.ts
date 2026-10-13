// The copy rules from JOURNEY §Copy (LOCKED), as code so every string is tested and
// model output is screened at runtime. This module is a leaf: it imports nothing.

export const BANNED_WORDS = /\b(disclos\w*|positions?)\b/i

// Avoided in navigation and calls to action; allowed in body text where unavoidable.
export const NAV_AVOID = /\b(challenge|dispute|contest|exchange|negotiate)\w*\b/i

export const BANNED_PHRASES = [
  /\boops\b/i,
  /\berror\b/i,
  /something went wrong/i,
  /\byou need to\b/i,
  /action required/i,
  /congratulations/i,
  /save thousands/i,
]

const EMOJI = /\p{Extended_Pictographic}/u

export interface Violation {
  rule: string
  match: string
}

export interface CheckOptions {
  /** The string is a nav label or call to action: the avoided words apply too. */
  nav?: boolean
  /** The string announces success: one exclamation mark is allowed. */
  success?: boolean
}

export function checkCopy(text: string, options: CheckOptions = {}): Violation[] {
  const out: Violation[] = []
  const banned = text.match(BANNED_WORDS)
  if (banned) out.push({ rule: 'banned word', match: banned[0] })
  if (options.nav) {
    const avoid = text.match(NAV_AVOID)
    if (avoid) out.push({ rule: 'avoided in navigation', match: avoid[0] })
  }
  for (const re of BANNED_PHRASES) {
    const hit = text.match(re)
    if (hit) out.push({ rule: 'banned phrase', match: hit[0] })
  }
  const emoji = text.match(EMOJI)
  if (emoji) out.push({ rule: 'emoji', match: emoji[0] })
  const bangs = (text.match(/!/g) ?? []).length
  if (bangs > (options.success ? 1 : 0)) out.push({ rule: 'exclamation mark', match: '!' })
  return out
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Fill `{name}` placeholders in a template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}
