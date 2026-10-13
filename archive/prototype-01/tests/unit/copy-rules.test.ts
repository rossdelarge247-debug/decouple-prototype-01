import { describe, expect, it } from 'vitest'
import { checkCopy, fill, wordCount } from '@/copy/rules'

describe('checkCopy', () => {
  it('passes plain copy', () => {
    expect(checkCopy('Your picture, evidenced line by line.')).toEqual([])
  })
  it('flags the banned words', () => {
    expect(checkCopy('Full disclosure is required').map(v => v.rule)).toContain('banned word')
    expect(checkCopy('State your position').map(v => v.rule)).toContain('banned word')
    expect(checkCopy('A positive step')).toEqual([])
  })
  it('allows a literal legal reference only when the caller says so', () => {
    expect(checkCopy('Form E section 2.15 requires disclosure of income').length).toBe(1)
  })
  it('flags navigation words only for nav strings', () => {
    expect(checkCopy('Dispute this', { nav: true }).map(v => v.rule)).toContain('avoided in navigation')
    expect(checkCopy('Dispute this')).toEqual([])
  })
  it('flags emoji, banned phrases and exclamation marks', () => {
    expect(checkCopy('Great 🎉').map(v => v.rule)).toContain('emoji')
    expect(checkCopy('Oops, something went wrong').map(v => v.rule)).toEqual(['banned phrase', 'banned phrase'])
    expect(checkCopy('Done!').map(v => v.rule)).toContain('exclamation mark')
    expect(checkCopy('Done!', { success: true })).toEqual([])
    expect(checkCopy('Done!!', { success: true }).map(v => v.rule)).toContain('exclamation mark')
  })
  it('counts words and fills templates', () => {
    expect(wordCount('  Sort out your separation, together. ')).toBe(5)
    expect(fill('Step {n} of {total}', { n: 2, total: 8 })).toBe('Step 2 of 8')
  })
})
