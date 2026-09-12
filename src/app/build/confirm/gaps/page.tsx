import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/Button'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { PhaseNav } from '@/components/PhaseNav'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { confirm as copy } from '@/copy/build'
import { REQUESTED } from '@/lib/build/confirm'
import { answerGaps } from '../../actions'
import { loadBuild } from '../../state'

// Tier 4: the documents the bank cannot replace, ordered by lead time. Always skippable.
export default async function Gaps() {
  const { session, bank, plan, confirmations } = await loadBuild()
  if (!bank || !plan) redirect('/build/connect')

  return (
    <Page header={<AppHeader name={session.name} />} width="xl">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <PhaseNav current="build" />
        <div className="flex max-w-3xl flex-col gap-6">
          <SpaceIndicator />
          <Eyebrow>{copy.gaps.eyebrow}</Eyebrow>
          <Headline text={copy.gaps.headline} />
          <p className="text-body-lg text-ink-muted">{copy.gaps.body}</p>
          <form action={answerGaps} className="flex flex-col gap-6">
            {plan.gaps.length === 0 ? (
              <p className="text-ink">{copy.gaps.none}</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {plan.gaps.map((g, i) => (
                  <li key={g.id} className="rounded-card border border-border bg-surface p-card">
                    <p className="font-display text-display-sm">
                      <span className="text-accent">{i + 1}. </span>
                      {g.what}
                    </p>
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-body sm:grid-cols-[auto_1fr]">
                      <dt className="font-semibold text-ink">{copy.gaps.fromLabel}</dt>
                      <dd className="text-ink">{g.from}</dd>
                      <dt className="font-semibold text-ink">{copy.gaps.whyLabel}</dt>
                      <dd className="text-ink-muted">{g.why}</dd>
                      <dt className="font-semibold text-ink">{copy.gaps.howLongLabel}</dt>
                      <dd className="text-ink-muted">{g.howLong}</dd>
                      <dt className="font-semibold text-ink">{copy.gaps.helpLabel}</dt>
                      <dd className="text-ink-muted">
                        {g.help}
                        {g.note ? ` ${g.note}` : ''}
                      </dd>
                    </dl>
                    <label className="mt-3 flex cursor-pointer items-center gap-3 text-body text-ink">
                      <input type="checkbox" name="requested" value={g.id} defaultChecked={confirmations[g.id]?.value === REQUESTED} className="size-5 accent-accent" />
                      {copy.gaps.requested}
                    </label>
                  </li>
                ))}
              </ol>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <Button arrow>{copy.gaps.skipCta}</Button>
              <p className="text-body text-ink-muted">{copy.gaps.picture}</p>
            </div>
          </form>
        </div>
      </div>
    </Page>
  )
}
