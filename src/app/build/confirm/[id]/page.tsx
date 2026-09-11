import { notFound, redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/Button'
import { ErrorSummary } from '@/components/ErrorSummary'
import { Eyebrow } from '@/components/Eyebrow'
import { Fieldset } from '@/components/Fieldset'
import { Headline } from '@/components/Headline'
import { OptionCard } from '@/components/OptionCard'
import { Page } from '@/components/Page'
import { PhaseNav } from '@/components/PhaseNav'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { confirm as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import { NOT_MINE, questionPosition } from '@/lib/build/confirm'
import { readBuildErrors } from '@/lib/build/errors'
import type { SearchParams } from '@/lib/start/errors'
import { answerQuestion } from '../../actions'
import { loadBuild } from '../../state'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}

// Tiers 2 and 3, and any tier 1 line marked "Not right?": one question, says why it
// asks, never destructive, always skippable, and the user can come back to it.
export default async function Question({ params, searchParams }: Props) {
  const { id } = await params
  const { session, bank, plan, confirmations } = await loadBuild()
  if (!bank || !plan) redirect('/build/connect')
  const finding = plan.findings.find(f => f.id === id)
  if (!finding) notFound()
  const errors = readBuildErrors(await searchParams)
  const position = questionPosition(plan, id)
  const eyebrow = finding.tier === 3 ? copy.tier3.eyebrow : copy.tier2.eyebrow
  const previous = confirmations[id]?.value
  const source = finding.source.last4 ? `${finding.source.provider} ${finding.source.last4}` : finding.source.provider

  return (
    <Page header={<AppHeader name={session.name} />} width="xl">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <PhaseNav current="build" />
        <div className="flex max-w-2xl flex-col gap-6">
          <SpaceIndicator />
          <Eyebrow>{position.n > 0 ? `${eyebrow} · ${fill(copy.question.progress, position)}` : eyebrow}</Eyebrow>
          <Headline text={finding.question} size="md" />
          {finding.hint && <p className="text-body-lg text-ink-muted">{finding.hint}</p>}
          <ErrorSummary messages={errors.messages} reference={errors.reference} />
          <form action={answerQuestion.bind(null, id)} className="flex flex-col gap-8">
            <Fieldset id="answer" legend={finding.question} visuallyHideLegend hint={copy.question.chooseOne} error={errors.byField.answer}>
              {finding.options.map(o => (
                <OptionCard key={o.value} type="radio" name="answer" value={o.value} title={o.label} defaultChecked={previous === o.value} compact />
              ))}
              {finding.line && <OptionCard type="radio" name="answer" value={NOT_MINE} title={copy.question.notMine} body={copy.question.notMineBody} defaultChecked={previous === NOT_MINE} compact />}
            </Fieldset>
            <div className="flex flex-wrap items-center gap-4">
              <Button arrow>{copy.question.continueCta}</Button>
              <Button variant="quiet" name="skip" value="1">
                {copy.question.skipCta}
              </Button>
            </div>
          </form>
          <dl className="grid gap-2 rounded-card border border-border bg-surface/60 p-4 text-body md:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink">{copy.question.whyLabel}</dt>
              <dd className="text-ink-muted">{finding.why}</dd>
            </div>
            {finding.line && (
              <div>
                <dt className="font-semibold text-ink">{copy.question.evidenceLabel}</dt>
                <dd className="text-ink-muted">
                  {finding.evidence}. {fill(copy.tier1.source, { source })}
                </dd>
              </div>
            )}
          </dl>
          <p className="text-body text-ink-muted">{copy.question.escape}</p>
        </div>
      </div>
    </Page>
  )
}
