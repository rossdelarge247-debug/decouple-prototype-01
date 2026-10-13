'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { buildTinkLinkUrl } from '@/lib/bank/tink-client'
import { getTestScenarioById } from '@/lib/bank/test-scenarios'
import { resolveBank } from '@/lib/build/bank'
import { answer, CONFIRM_ROUTE, confirmTier1, isAnswerValid, nextConfirmRoute, NOTED, planConfirmation, REQUESTED, SKIPPED } from '@/lib/build/confirm'
import { EMPTY_PROFILE, nextProfileRoute, parseProfileStep, profileRoute, type ProfileStep } from '@/lib/build/profile'
import { cookieBuildStore } from '@/lib/build/store'
import { tinkAvailable } from '@/lib/build/tink'
import { errorRef } from '@/lib/errors'
import { requireSession } from '@/lib/session'

// One action per screen. Validation failures go back as a query string so every
// screen stays a server component and works without JavaScript. redirect() is
// never called inside a try.

export async function answerProfile(step: ProfileStep, formData: FormData): Promise<void> {
  const session = await requireSession()
  const store = cookieBuildStore()
  const current = (await store.readProfile()) ?? EMPTY_PROFILE
  const result = parseProfileStep(step, formData, session.start)
  if (!result.ok) {
    const params = new URLSearchParams()
    for (const [field, code] of Object.entries(result.errors)) params.append('e', `${field}:${code}`)
    params.set('ref', errorRef())
    redirect(`${profileRoute(step)}?${params.toString()}#error-summary`)
  }
  await store.writeProfile({ ...current, ...result.patch })
  redirect(nextProfileRoute(step, session.start))
}

export async function chooseScenario(formData: FormData): Promise<void> {
  await requireSession()
  const id = String(formData.get('scenario') ?? '')
  if (!getTestScenarioById(id)) redirect('/build/connect')
  const store = cookieBuildStore()
  await store.clearBank()
  await store.writeBank({ kind: 'scenario', id, connectedAt: new Date().toISOString() })
  redirect('/build/reveal')
}

export async function startBankConnection(): Promise<void> {
  await requireSession()
  if (!tinkAvailable()) redirect(`/build/connect?state=unavailable&ref=${errorRef()}`)
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  redirect(buildTinkLinkUrl(null, `${proto}://${host}/api/bank/callback`))
}

export async function disconnectBank(): Promise<void> {
  await requireSession()
  await cookieBuildStore().clearBank()
  redirect('/build/connect')
}

async function loadPlan() {
  const session = await requireSession()
  const store = cookieBuildStore()
  const [profile, source, confirmations] = await Promise.all([store.readProfile(), store.readBank(), store.readConfirmations()])
  const bank = resolveBank(source)
  if (!bank) redirect('/build/connect')
  return { store, confirmations, plan: planConfirmation(bank, profile, session.start) }
}

export async function confirmBatch(): Promise<void> {
  const { store, confirmations, plan } = await loadPlan()
  const next = confirmTier1(plan, confirmations, new Date().toISOString())
  await store.writeConfirmations(next)
  redirect(nextConfirmRoute(plan, next))
}

export async function answerQuestion(id: string, formData: FormData): Promise<void> {
  const { store, confirmations, plan } = await loadPlan()
  const finding = plan.findings.find(f => f.id === id)
  if (!finding) redirect(CONFIRM_ROUTE)
  const value = formData.get('skip') ? SKIPPED : String(formData.get('answer') ?? '')
  if (!isAnswerValid(finding, value)) redirect(`${CONFIRM_ROUTE}/${id}?e=answer:chooseOne&ref=${errorRef()}#error-summary`)
  const next = answer(confirmations, id, value, new Date().toISOString())
  await store.writeConfirmations(next)
  redirect(nextConfirmRoute(plan, next))
}

export async function answerGaps(formData: FormData): Promise<void> {
  const { store, confirmations, plan } = await loadPlan()
  const requested = new Set(formData.getAll('requested').filter((v): v is string => typeof v === 'string'))
  const at = new Date().toISOString()
  let next = confirmations
  for (const gap of plan.gaps) {
    if (requested.has(gap.id)) next = answer(next, gap.id, REQUESTED, at)
    else if (!next[gap.id]) next = answer(next, gap.id, NOTED, at)
  }
  await store.writeConfirmations(next)
  redirect(nextConfirmRoute(plan, next))
}
