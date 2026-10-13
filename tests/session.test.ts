import { describe, expect, it } from 'vitest'
import { COOKIE, DAYS_30, clearCookie, fromBase64Url, humanCookie, ownerCookie, parseCookies, readSessions, serializeCookie, sessionKey, sign, testerCookie, toBase64Url, verify } from '../lib/session.ts'

const SECRET = 'a-test-secret-of-sufficient-length'

describe('session cookies', () => {
  it('round-trips base64url', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255])
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes)
    expect(toBase64Url(bytes)).not.toMatch(/[+/=]/)
  })

  it('signs and verifies a session', async () => {
    const token = await sign({ r: 'tester', l: 'P01', c: 'FERN-LARK-27', t: 1, exp: Date.now() + 1000 }, SECRET)
    expect(token.split('.')).toHaveLength(2)
    const s = await verify(token, SECRET)
    expect(s).toEqual({ r: 'tester', l: 'P01', c: 'FERN-LARK-27', t: 1, exp: expect.any(Number) })
  })

  it('rejects a tampered payload, a wrong secret and an expired session', async () => {
    const token = await sign({ r: 'owner', exp: Date.now() + 1000 }, SECRET)
    const [payload, sig] = token.split('.')
    const forged = toBase64Url(new TextEncoder().encode(JSON.stringify({ r: 'owner', exp: Date.now() + 1e9 })))
    expect(await verify(`${forged}.${sig}`, SECRET)).toBeNull()
    expect(await verify(token, 'another-secret-of-sufficient-length')).toBeNull()
    expect(await verify(await sign({ r: 'owner', exp: Date.now() - 1 }, SECRET), SECRET)).toBeNull()
    expect(await verify(payload, SECRET)).toBeNull()
    expect(await verify('', SECRET)).toBeNull()
    expect(await verify('not.base64!', SECRET)).toBeNull()
  })

  it('drops unknown roles and bad shapes even when signed', async () => {
    const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ r: 'admin', exp: Date.now() + 1000 })))
    const good = await sign({ r: 'owner', exp: Date.now() + 1000 }, SECRET)
    expect(await verify(`${payload}.${good.split('.')[1]}`, SECRET)).toBeNull()
  })

  it('parses and serialises cookies with the right flags', () => {
    expect(parseCookies('a=1; dc_owner=x.y; b=2=3')).toEqual({ a: '1', dc_owner: 'x.y', b: '2=3' })
    expect(parseCookies(null)).toEqual({})
    const c = serializeCookie('dc_owner', 'v', { maxAge: DAYS_30 })
    expect(c).toBe('dc_owner=v; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure')
    expect(clearCookie('dc_tester')).toContain('Max-Age=0')
  })

  it('reads the three sessions and ignores a cookie in the wrong slot', async () => {
    const owner = await sign({ r: 'owner', exp: Date.now() + 1000 }, SECRET)
    const tester = await sign({ r: 'tester', l: 'P02', c: 'X', exp: Date.now() + 1000 }, SECRET)
    const s = await readSessions(`${COOKIE.owner}=${owner}; ${COOKIE.tester}=${tester}`, SECRET)
    expect(s.owner?.r).toBe('owner')
    expect(s.tester?.l).toBe('P02')
    expect(s.human).toBeNull()
    const swapped = await readSessions(`${COOKIE.owner}=${tester}`, SECRET)
    expect(swapped.owner).toBeNull()
    expect((await readSessions(`${COOKIE.owner}=${owner}`, null)).owner).toBeNull()
  })

  it('builds the owner, tester and human cookies', async () => {
    expect(await ownerCookie(SECRET)).toMatch(/^dc_owner=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure$/)
    const t = await testerCookie(SECRET, 'P01', 'FERN-LARK-27', true)
    const s = await verify(t.split(';')[0].slice('dc_tester='.length), SECRET)
    expect(s).toMatchObject({ r: 'tester', l: 'P01', c: 'FERN-LARK-27', t: 1 })
    expect(await humanCookie(SECRET)).toContain('Max-Age=86400')
  })

  it('derives a stable rate-limit key', async () => {
    const owner = await sign({ r: 'owner', exp: Date.now() + 1000 }, SECRET)
    const a = await sessionKey(`dc_owner=${owner}`, '1.2.3.4')
    expect(a).toBe(await sessionKey(`dc_owner=${owner}`, '9.9.9.9'))
    expect(a).toMatch(/^c:/)
    expect(await sessionKey('', '1.2.3.4')).toBe('ip:1.2.3.4')
  })
})
