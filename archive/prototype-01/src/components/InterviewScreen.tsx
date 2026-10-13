import type { ReactNode } from 'react'
import { Button } from './Button'
import { ErrorSummary } from './ErrorSummary'
import { Eyebrow } from './Eyebrow'
import { Headline } from './Headline'
import { InterviewHeader } from './InterviewHeader'
import { Page } from './Page'
import { AnswersSoFar } from './AnswersSoFar'
import { interview } from '@/copy/start'
import { previousRoute, progress, stepNumber, type StartAnswers, type StepKey } from '@/lib/start/answers'
import type { ScreenErrors } from '@/lib/start/errors'
import { answerStep } from '@/app/start/actions'

interface Props {
  step: StepKey
  answers: StartAnswers
  eyebrow: string
  headline: string
  body: string
  why: string
  unlocks: string
  errors: ScreenErrors
  cta?: string
  children: ReactNode
}

// One topic per screen. Every screen says why it asks and what it unlocks.
export function InterviewScreen({ step, answers, eyebrow, headline, body, why, unlocks, errors, cta = interview.continueCta, children }: Props) {
  return (
    <Page header={<InterviewHeader step={stepNumber(step)} progress={progress(answers)} />} width="xl">
      <div className="grid gap-10 md:grid-cols-[3fr_2fr]">
        <div className="flex max-w-2xl flex-col gap-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Headline text={headline} />
          <p className="text-body-lg text-ink-muted">{body}</p>
          <ErrorSummary messages={errors.messages} reference={errors.reference} />
          <form action={answerStep.bind(null, step)} className="flex flex-col gap-8">
            {children}
            <div className="flex flex-wrap items-center gap-4">
              <Button href={previousRoute(step)} variant="quiet" back>
                {interview.backCta}
              </Button>
              <Button arrow>{cta}</Button>
            </div>
          </form>
          <dl className="grid gap-2 rounded-card border border-border bg-surface/60 p-4 text-body md:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink">{interview.whyLabel}</dt>
              <dd className="text-ink-muted">{why}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{interview.unlocksLabel}</dt>
              <dd className="text-ink-muted">{unlocks}</dd>
            </div>
          </dl>
        </div>
        <AnswersSoFar answers={answers} step={step} />
      </div>
    </Page>
  )
}
