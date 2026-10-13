'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/Button'
import { ErrorSummary } from '@/components/ErrorSummary'
import { Field } from '@/components/Field'
import { signUp as copy } from '@/copy/start'
import { signUp } from './actions'
import { INITIAL_STATE, MIN_PASSWORD } from './form-state'

export function SignUpForm() {
  const [state, action] = useActionState(signUp, INITIAL_STATE)
  const e = state.errors
  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <ErrorSummary messages={Object.values(e)} reference={state.reference} />
      <Field id="name" name="name" label={copy.name} error={e.name} autoComplete="name" />
      <Field id="email" name="email" label={copy.email} type="email" error={e.email} autoComplete="email" />
      <Field id="password" name="password" label={copy.password} type="password" hint={copy.passwordHint} error={e.password} autoComplete="new-password" minLength={MIN_PASSWORD} />
      <div className={`flex items-start gap-3 ${e.terms ? 'border-l-4 border-danger pl-3' : ''}`}>
        <input id="terms" name="terms" type="checkbox" className="mt-1 size-5 accent-accent" aria-describedby={e.terms ? 'terms-error' : undefined} aria-invalid={e.terms ? true : undefined} />
        <div>
          <label htmlFor="terms" className="font-medium text-ink">
            {copy.terms}
          </label>
          {e.terms && (
            <p id="terms-error" className="font-medium text-danger">
              {e.terms}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button arrow>{copy.cta}</Button>
        <p className="text-body text-ink-muted">
          {copy.signInPrompt} <Link href="/sign-in">{copy.signInCta}</Link>
        </p>
      </div>
    </form>
  )
}
