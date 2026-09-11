import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ExitThisPage } from '@/components/ExitThisPage'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { HelplineList } from '@/components/Resources'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { nextStep, safety as copy } from '@/copy/start'
import { requireSession } from '@/lib/session'
import { helplines } from '@/lib/start/facts'

// Signposting, before anything else, for flagged users. Three choices, none hidden.
export default async function Safety() {
  const session = await requireSession()
  return (
    <Page header={<AppHeader name={session.name} />} width="lg">
      <div className="flex flex-col gap-6">
        <SpaceIndicator />
        <Eyebrow tone="success">{copy.eyebrow}</Eyebrow>
        <Headline text={copy.headline} />
        <p className="max-w-2xl text-body-lg text-ink-muted">{copy.body}</p>
        <p className="rounded-card border border-danger bg-danger-tint p-4 font-medium text-ink">{copy.emergency}</p>
        <HelplineList items={helplines} />
        <Card tone="tint" className="flex flex-col gap-4">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-accent">{nextStep.label}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/welcome" arrow>
              {copy.choices.continueCta}
            </Button>
            <ExitThisPage label={copy.choices.exit} variant="primary" />
            <Button href="/start/support" variant="secondary">
              {copy.choices.more}
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  )
}
