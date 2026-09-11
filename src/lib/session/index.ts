import { redirect } from 'next/navigation'
import { stubSessionProvider } from './stub'
import { AuthUnavailable, type NewSession, type Session, type SessionProvider } from './types'

export type { Session, NewSession } from './types'
export { AuthUnavailable } from './types'

// Every screen and route reads the user through this seam. The stub sits behind it
// until Reconcile needs two real parties; a real provider replaces resolveProvider.

/** The stub may run anywhere except production without a real provider configured. */
export function stubAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL_ENV !== 'production' || !!env.AUTH_PROVIDER
}

function resolveProvider(): SessionProvider {
  return stubSessionProvider()
}

export async function getSession(): Promise<Session | null> {
  return resolveProvider().get()
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return session
}

export async function createSession(input: NewSession): Promise<Session> {
  if (!stubAllowed()) throw new AuthUnavailable()
  return resolveProvider().create(input)
}

export async function endSession(): Promise<void> {
  return resolveProvider().end()
}
