'use server'

import { redirect } from 'next/navigation'
import { signUp as copy } from '@/copy/start'
import { errorRef } from '@/lib/errors'
import { AuthUnavailable, createSession } from '@/lib/session'
import { EMPTY_ANSWERS, deriveFlags, isFlagged } from '@/lib/start/answers'
import { cookieStartStore } from '@/lib/start/store'

import { MIN_PASSWORD, type FormState } from './form-state'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// The LOCKED sign-up: full name, email, password of at least 12, terms. The password
// is checked here and goes no further. Flagged users see signposting before anything.
export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const terms = formData.get('terms') === 'on'
  const errors: Record<string, string> = {}
  if (!name) errors.name = copy.errors.name
  if (!EMAIL.test(email)) errors.email = copy.errors.email
  if (password.length < MIN_PASSWORD) errors.password = copy.errors.password
  if (!terms) errors.terms = copy.errors.terms
  if (Object.keys(errors).length) return { errors, reference: errorRef() }

  const start = await cookieStartStore().read()
  let unavailable = false
  try {
    await createSession({ name, email, start, flags: deriveFlags(start ?? EMPTY_ANSWERS) })
  } catch (e) {
    if (e instanceof AuthUnavailable) unavailable = true
    else throw e
  }
  if (unavailable) return { errors: { form: copy.errors.unavailable }, reference: errorRef() }
  redirect(start && isFlagged(start) ? '/welcome/safety' : '/welcome')
}
