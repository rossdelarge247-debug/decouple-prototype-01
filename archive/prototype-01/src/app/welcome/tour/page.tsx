import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { NextStep } from '@/components/NextStep'
import { Page } from '@/components/Page'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { fill } from '@/copy/rules'
import { tour as copy } from '@/copy/start'
import { requireSession } from '@/lib/session'

// Four panels, one rendered at a time by ?panel=n, so nothing hidden is focusable
// and the tour works without JavaScript. The last panel's Next is the next step.
const TONES = ['text-phase-build border-phase-build', 'text-phase-reconcile border-phase-reconcile', 'text-phase-settle border-phase-settle', 'text-phase-finalise border-phase-finalise']

export default async function Tour({ searchParams }: { searchParams: Promise<{ panel?: string }> }) {
  const session = await requireSession()
  const requested = Number((await searchParams).panel ?? '1')
  const n = Number.isInteger(requested) && requested >= 1 && requested <= copy.panels.length ? requested : 1
  const panel = copy.panels[n - 1]!
  const last = n === copy.panels.length
  return (
    <Page header={<AppHeader name={session.name} />} width="lg">
      <div className="flex flex-col gap-6">
        <SpaceIndicator />
        <Eyebrow>{fill(copy.eyebrow, { n })}</Eyebrow>
        <div className="grid gap-8 md:grid-cols-[3fr_2fr] md:items-center">
          <div className="flex flex-col gap-4">
            <p className={`font-display text-display-sm italic ${TONES[n - 1]!.split(' ')[0]}`}>0{n}</p>
            <Headline text={panel.headline} />
            <p className="text-body-lg text-ink-muted">{panel.body}</p>
          </div>
          <Card className={`border-t-4 ${TONES[n - 1]!.split(' ')[1]}`}>
            <p className={`text-eyebrow font-semibold uppercase tracking-[0.14em] ${TONES[n - 1]!.split(' ')[0]}`}>{panel.phase}</p>
            <ol className="mt-3 grid gap-2 text-body text-ink-muted">
              {copy.panels.map((p, i) => (
                <li key={p.phase} aria-current={i === n - 1 ? 'step' : undefined} className={i === n - 1 ? 'font-semibold text-ink' : ''}>
                  {i + 1}. {p.headline}
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button href={n === 1 ? '/welcome' : `/welcome/tour?panel=${n - 1}`} variant="quiet" back>
            {copy.backCta}
          </Button>
          {!last && (
            <Button href={`/welcome/tour?panel=${n + 1}`} arrow>
              {copy.nextCta}
            </Button>
          )}
          {!last && (
            <Link href="/build" className="text-ink-muted">
              {copy.skipCta}
            </Link>
          )}
        </div>
        <NextStep href="/build" cta={copy.nextStepCta} />
      </div>
    </Page>
  )
}
