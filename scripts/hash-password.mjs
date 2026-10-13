#!/usr/bin/env node
/* npm run hash-password: prints the OWNER_PASSWORD_HASH value for Vercel (spec §3).
   Same format as lib/password.ts: scrypt$N$r$p$<salt base64>$<hash base64>. */
import { randomBytes, scryptSync } from 'node:crypto'
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'

const N = 16384
const R = 8
const P = 1
const KEYLEN = 64

export function hashPassword(password, salt = randomBytes(16)) {
  if (typeof password !== 'string' || password.length < 8) throw new Error('Use a password of at least 8 characters.')
  const hash = scryptSync(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P })
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$')
}

async function ask() {
  const muted = new Writable({ write: (_c, _e, cb) => cb() })
  const rl = createInterface({ input: process.stdin, output: muted, terminal: true })
  process.stderr.write('Password (not shown): ')
  return new Promise((resolve) => rl.question('', (a) => { rl.close(); process.stderr.write('\n'); resolve(a) }))
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const pw = process.argv[2] ?? (await ask())
  try {
    process.stdout.write(hashPassword(pw) + '\n')
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
