'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/Button'
import { ErrorSummary } from '@/components/ErrorSummary'
import { Field } from '@/components/Field'
import { signIn as copy } from '@/copy/start'
import { INITIAL_STATE } from '@/app/sign-up/form-state'
import { signIn } from './actions'

export function SignInForm() {
  const [state, action] = useActionState(signIn, INITIAL_STATE)
  const e = state.errors
  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <ErrorSummary messages={Object.values(e)} reference={state.reference} />
      <Field id="email" name="email" label={copy.email} type="email" error={e.email} autoComplete="email" />
      <Field id="password" name="password" label={copy.password} type="password" error={e.password} autoComplete="current-password" />
      <p className="text-body text-ink-muted">{copy.forgot}</p>
      <div className="flex flex-wrap items-center gap-4">
        <Button arrow>{copy.cta}</Button>
        <p className="text-body text-ink-muted">
          {copy.signUpPrompt} <Link href="/sign-up">{copy.signUpCta}</Link>
        </p>
      </div>
    </form>
  )
}
