import { AppHeader } from '@/components/AppHeader'
import { Card } from '@/components/Card'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { NextStep } from '@/components/NextStep'
import { Page } from '@/components/Page'
import { PhaseNav } from '@/components/PhaseNav'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { build as copy } from '@/copy/start'
import { requireSession } from '@/lib/session'

// Where the tour lands. Build itself is the next session's outcome, so this is the
// honest empty state with the phase nav and the one next step.
export default async function Build() {
  const session = await requireSession()
  return (
    <Page header={<AppHeader name={session.name} />} width="xl">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <PhaseNav current="build" />
        <div className="flex flex-col gap-6">
          <SpaceIndicator />
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <Headline text={copy.headline} />
          <p className="max-w-2xl text-body-lg text-ink-muted">{copy.body}</p>
          <NextStep cta={copy.nextStepTitle} />
          <Card>
            <h2 className="text-display-sm">{copy.emptyTitle}</h2>
            <p className="mt-2 text-ink-muted">{copy.emptyBody}</p>
          </Card>
        </div>
      </div>
    </Page>
  )
}
