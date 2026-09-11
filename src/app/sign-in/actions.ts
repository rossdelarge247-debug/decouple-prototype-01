'use server'

import { redirect } from 'next/navigation'
import { signIn as copy } from '@/copy/start'
import { errorRef } from '@/lib/errors'
import { AuthUnavailable, createSession } from '@/lib/session'
import type { FormState } from '@/app/sign-up/form-state'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// The stub has no user store, so sign-in starts a session for the email given.
// Real verification arrives with the real provider; the fields are the LOCKED ones.
export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const errors: Record<string, string> = {}
  if (!EMAIL.test(email)) errors.email = copy.errors.email
  if (!password) errors.password = copy.errors.password
  if (Object.keys(errors).length) return { errors, reference: errorRef() }

  const name = email.split('@')[0]!.replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  let unavailable = false
  try {
    await createSession({ name, email, start: null, flags: { safety: false, devicePrivate: true, complexity: false } })
  } catch (e) {
    if (e instanceof AuthUnavailable) unavailable = true
    else throw e
  }
  if (unavailable) return { errors: { form: copy.errors.unavailable }, reference: errorRef() }
  redirect('/build')
}
