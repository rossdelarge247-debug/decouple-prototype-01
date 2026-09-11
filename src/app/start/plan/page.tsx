import Link from 'next/link'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { InterviewHeader } from '@/components/InterviewHeader'
import { NextStep } from '@/components/NextStep'
import { Page } from '@/components/Page'
import { PlanView } from '@/components/PlanView'
import { plan as copy } from '@/copy/start'
import { EMPTY_ANSWERS, answersHash, isComplete, progress, stepNumber, stepRoute } from '@/lib/start/answers'
import { computePlan } from '@/lib/start/plan'
import { cookieStartStore } from '@/lib/start/store'

// O7. Facts computed here, prose fetched by PlanView; the phrase "Your plan" appears
// once, as the heading, because the golden path counts it.
export default async function Plan() {
  const answers = (await cookieStartStore().read()) ?? EMPTY_ANSWERS
  const plan = computePlan(answers)
  return (
    <Page header={<InterviewHeader step={stepNumber('o7')} progress={progress(answers)} />} width="xl">
      <div className="flex flex-col gap-6">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Headline text={copy.headline} />
        <p className="max-w-2xl text-body-lg text-ink-muted">{copy.intro}</p>
      </div>
      {isComplete(answers) ? (
        <div className="mt-8 grid gap-8 md:grid-cols-[3fr_2fr] md:items-start">
          <PlanView plan={plan} hash={answersHash(answers)} />
          <div className="no-print flex flex-col gap-4 md:sticky md:top-6">
            <NextStep href="/sign-up" cta={copy.nextStepCta} />
            <Link href={stepRoute('o8')} className="font-medium">
              {copy.seeOptionsCta}
            </Link>
            <Card>
              <h2 className="text-display-sm">{copy.noPressure.title}</h2>
              <p className="mt-2 text-ink-muted">{copy.noPressure.body}</p>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="mt-8 flex flex-col items-start gap-4">
          <p className="text-body-lg">{copy.unanswered}</p>
          <Button href={stepRoute('o1')} arrow>
            {copy.unansweredCta}
          </Button>
        </Card>
      )}
    </Page>
  )
}
