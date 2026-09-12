import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sarah } from './start-answers.test'

// An in-memory jar stands in for next/headers so the stub is tested without a server.
const jar = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => { jar.set(name, value) },
    delete: (name: string) => { jar.delete(name) },
  }),
}))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => { throw new Error(`REDIRECT ${to}`) },
}))

describe('the session stub', () => {
  beforeEach(() => {
    jar.clear()
    vi.unstubAllEnvs()
  })

  it('creates, reads and ends a session through one interface', async () => {
    const { createSession, getSession, endSession } = await import('@/lib/session')
    expect(await getSession()).toBeNull()
    const created = await createSession({ name: 'Sarah Jones', email: 'sarah@example.com', start: sarah, flags: { safety: false, devicePrivate: true, complexity: false } })
    expect(created.name).toBe('Sarah Jones')
    const read = await getSession()
    expect(read).toEqual(created)
    expect(jar.get('decouple_session')).toMatch(/^[A-Za-z0-9_-]+$/)
    await endSession()
    expect(await getSession()).toBeNull()
  })

  it('requireSession redirects to sign-in when nobody is signed in', async () => {
    const { requireSession } = await import('@/lib/session')
    await expect(requireSession()).rejects.toThrow('REDIRECT /sign-in')
  })

  it('never runs in production without a real provider', async () => {
    const { stubAllowed, createSession, AuthUnavailable } = await import('@/lib/session')
    expect(stubAllowed({ VERCEL_ENV: 'preview' })).toBe(true)
    expect(stubAllowed({})).toBe(true)
    expect(stubAllowed({ VERCEL_ENV: 'production' })).toBe(false)
    expect(stubAllowed({ VERCEL_ENV: 'production', AUTH_PROVIDER: 'real' })).toBe(true)
    vi.stubEnv('VERCEL_ENV', 'production')
    await expect(createSession({ name: 'x', email: 'x@example.com', start: null, flags: { safety: false, devicePrivate: true, complexity: false } })).rejects.toBeInstanceOf(AuthUnavailable)
  })

  it('ignores a corrupt session cookie', async () => {
    jar.set('decouple_session', 'garbage')
    const { getSession } = await import('@/lib/session')
    expect(await getSession()).toBeNull()
  })
})

describe('the exit endpoint', () => {
  it('clears both cookies, redirects a form post and answers a beacon with 204', async () => {
    const { POST } = await import('@/app/api/session/exit/route')
    const page = await POST(new Request('http://localhost/api/session/exit', { method: 'POST', headers: { accept: 'text/html' } }))
    expect(page.status).toBe(303)
    expect(page.headers.get('location')).toBe('https://www.bbc.co.uk/news')
    const cookies = page.headers.getSetCookie()
    expect(cookies.some(c => c.startsWith('decouple_session=') && /max-age=0/i.test(c))).toBe(true)
    expect(cookies.some(c => c.startsWith('decouple_start=') && /max-age=0/i.test(c))).toBe(true)
    const beacon = await POST(new Request('http://localhost/api/session/exit', { method: 'POST' }))
    expect(beacon.status).toBe(204)
    expect(beacon.headers.getSetCookie()).toHaveLength(2)
  })

  it('runs in production only when dev mode is switched on by name', async () => {
    const { stubAllowed } = await import('@/lib/session')
    expect(stubAllowed({ VERCEL_ENV: 'production' })).toBe(false)
    expect(stubAllowed({ VERCEL_ENV: 'production', DECOUPLE_DEV_MODE: '1' })).toBe(true)
    expect(stubAllowed({ VERCEL_ENV: 'production', DECOUPLE_DEV_MODE: 'true' })).toBe(false)
    expect(stubAllowed({ VERCEL_ENV: 'preview' })).toBe(true)
  })
})
