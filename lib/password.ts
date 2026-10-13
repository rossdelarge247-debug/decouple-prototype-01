/* The owner's password (spec §3): scrypt, salt stored alongside, constant-time compare.
   Node only: used by /api/login and the hash-password script, never by the middleware. */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const N = 16384
const R = 8
const P = 1
const KEYLEN = 64

/* "scrypt$N$r$p$<salt base64>$<hash base64>" */
export function hashPassword(password: string, salt: Buffer = randomBytes(16)): string {
  if (typeof password !== 'string' || password.length < 8) throw new Error('Use a password of at least 8 characters.')
  const hash = scryptSync(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P })
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$')
}

export function verifyPassword(password: string, stored: string | undefined | null): boolean {
  if (typeof password !== 'string' || !stored) return false
  const parts = stored.trim().split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const n = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  if (![n, r, p].every((x) => Number.isInteger(x) && x > 0)) return false
  let salt: Buffer
  let expected: Buffer
  try {
    salt = Buffer.from(parts[4], 'base64')
    expected = Buffer.from(parts[5], 'base64')
  } catch {
    return false
  }
  if (!salt.length || !expected.length) return false
  let actual: Buffer
  try {
    actual = scryptSync(password.normalize('NFKC'), salt, expected.length, { N: n, r, p, maxmem: 128 * n * r * 2 })
  } catch {
    return false
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
