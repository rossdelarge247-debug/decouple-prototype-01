import type { Flags, StartAnswers } from '@/lib/start/answers'

// The signed-in user as every screen reads it. Safety flags live here and nowhere
// else: never in an email, a notification, analytics or a model request.
export interface Session {
  id: string
  name: string
  email: string
  createdAt: string
  start: StartAnswers | null
  flags: Flags
}

export interface NewSession {
  name: string
  email: string
  start: StartAnswers | null
  flags: Flags
}

export interface SessionProvider {
  get(): Promise<Session | null>
  create(input: NewSession): Promise<Session>
  end(): Promise<void>
}

export class AuthUnavailable extends Error {
  constructor() {
    super('No auth provider is configured for production')
    this.name = 'AuthUnavailable'
  }
}
