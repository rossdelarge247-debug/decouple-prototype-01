'use server'

import { redirect } from 'next/navigation'
import { errorRef } from '@/lib/errors'
import { EMPTY_ANSWERS, nextRoute, parseStep, stepRoute, type StepKey } from '@/lib/start/answers'
import { cookieStartStore } from '@/lib/start/store'

// One server action for every interview screen, bound to its step. Validation
// failures go back to the screen as a query string so the page stays a server
// component and works without JavaScript. redirect() is called outside any try.
export async function answerStep(step: StepKey, formData: FormData): Promise<void> {
  const store = cookieStartStore()
  const current = (await store.read()) ?? EMPTY_ANSWERS
  const result = parseStep(step, formData)
  if (!result.ok) {
    const params = new URLSearchParams()
    for (const [field, code] of Object.entries(result.errors)) params.append('e', `${field}:${code}`)
    params.set('ref', errorRef())
    redirect(`${stepRoute(step)}?${params.toString()}#error-summary`)
  }
  const next = { ...current, ...result.patch }
  await store.write(next)
  redirect(nextRoute(step, next))
}
