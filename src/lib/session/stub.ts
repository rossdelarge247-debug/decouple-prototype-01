import { cookies } from 'next/headers'
import { decode, encode } from '@/lib/codec'
import { cookieOptions } from '@/lib/cookies'
import { isStartAnswers } from '@/lib/start/answers'
import type { NewSession, Session, SessionProvider } from './types'

// The stub: an unsigned httpOnly cookie, on purpose, so the accessibility floor can
// seed a session with the same codec. It never runs in production (see provider.ts).
// The password is validated by the form and never stored or logged.
export const SESSION_COOKIE = 'decouple_session'

export function isSession(x: unknown): x is Session {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  const flags = s.flags as Record<string, unknown> | undefined
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.email === 'string' &&
    typeof s.createdAt === 'string' &&
    (s.start === null || isStartAnswers(s.start)) &&
    !!flags && typeof flags.safety === 'boolean' && typeof flags.devicePrivate === 'boolean' && typeof flags.complexity === 'boolean'
  )
}

export function stubSessionProvider(now: () => Date = () => new Date()): SessionProvider {
  return {
    async get() {
      const jar = await cookies()
      return decode(jar.get(SESSION_COOKIE)?.value, isSession)
    },
    async create(input: NewSession) {
      const session: Session = {
        id: Math.random().toString(36).slice(2, 12),
        name: input.name,
        email: input.email,
        createdAt: now().toISOString(),
        start: input.start,
        flags: input.flags,
      }
      const jar = await cookies()
      jar.set(SESSION_COOKIE, encode(session), cookieOptions)
      return session
    },
    async end() {
      const jar = await cookies()
      jar.delete(SESSION_COOKIE)
    },
  }
}
