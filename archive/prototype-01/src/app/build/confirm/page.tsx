import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/Button'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Icon } from '@/components/Icon'
import { Page } from '@/components/Page'
import { PhaseNav } from '@/components/PhaseNav'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { confirm as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import { nextConfirmRoute, questionRoute } from '@/lib/build/confirm'
import { confirmBatch } from '../actions'
import { loadBuild } from '../state'

// Tier 1: shown as a batch, taken as read, with "Not right?" on every line.
export default async function ConfirmBatch() {
  const { session, bank, plan, confirmations } = await loadBuild()
  if (!bank || !plan) redirect('/build/connect')
  if (plan.tier1.length === 0) redirect(nextConfirmRoute(plan, confirmations))
  const remaining = plan.questions.length
  const remainingText = remaining === 0 ? copy.tier1.remainingNone : remaining === 1 ? copy.tier1.remainingOne : fill(copy.tier1.remaining, { n: remaining })

  return (
    <Page header={<AppHeader name={session.name} />} width="xl">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <PhaseNav current="build" />
        <div className="flex max-w-3xl flex-col gap-6">
          <SpaceIndicator />
          <Eyebrow>{copy.tier1.eyebrow}</Eyebrow>
          <Headline text={copy.tier1.headline} />
          <p className="text-body-lg text-ink-muted">{copy.tier1.body}</p>
          <ul className="divide-y divide-border rounded-card border border-border bg-surface">
            {plan.tier1.map(f => {
              const source = f.source.last4 ? `${f.source.provider} ${f.source.last4}` : f.source.provider
              const answered = confirmations[f.id]
              return (
                <li key={f.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 px-card py-4">
                  <div className="flex items-start gap-3">
                    <Icon name="check" className="mt-1 size-4 shrink-0 text-success" />
                    <div>
                      <p className="font-medium text-ink">{f.line}</p>
                      <p className="text-body text-ink-muted">
                        {f.evidence}. {fill(copy.tier1.source, { source })}
                        {f.note ? `. ${f.note}` : ''}
                        {answered && answered.value !== 'confirmed' ? `. ${copy.values.notRight}` : ''}
                      </p>
                    </div>
                  </div>
                  <Link href={questionRoute(f.id)} className="rounded-pill border border-border px-3 py-1 text-body font-medium text-ink no-underline hover:border-ink">
                    {copy.tier1.notRight}
                  </Link>
                </li>
              )
            })}
          </ul>
          <form action={confirmBatch} className="flex flex-wrap items-center gap-4">
            <Button arrow>{copy.tier1.continueCta}</Button>
            <p className="text-body text-ink-muted">{remainingText}</p>
          </form>
        </div>
      </div>
    </Page>
  )
}
