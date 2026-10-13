import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../lib/password.js'

describe('owner password', () => {
  it('hashes with scrypt and verifies', () => {
    const h = hashPassword('correct horse battery staple')
    expect(h).toMatch(/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/)
    expect(verifyPassword('correct horse battery staple', h)).toBe(true)
    expect(verifyPassword('correct horse battery stapl', h)).toBe(false)
    expect(hashPassword('correct horse battery staple')).not.toBe(h)
  })

  it('refuses short passwords and malformed hashes', () => {
    expect(() => hashPassword('short')).toThrow()
    expect(verifyPassword('anything', '')).toBe(false)
    expect(verifyPassword('anything', 'plain')).toBe(false)
    expect(verifyPassword('anything', 'scrypt$x$8$1$abc$def')).toBe(false)
    expect(verifyPassword('anything', null)).toBe(false)
  })

  it('accepts what npm run hash-password prints', () => {
    const out = execFileSync('node', ['scripts/hash-password.mjs', 'correct horse battery staple'], { encoding: 'utf8' }).trim()
    expect(verifyPassword('correct horse battery staple', out)).toBe(true)
  })
})
