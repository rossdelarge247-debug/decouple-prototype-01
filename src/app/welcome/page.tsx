import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { Card } from '@/components/Card'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { NextStep } from '@/components/NextStep'
import { Page } from '@/components/Page'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { fill } from '@/copy/rules'
import { acknowledgement as copy } from '@/copy/start'
import { requireSession } from '@/lib/session'
import type { StartAnswers } from '@/lib/start/answers'

// Moment 1: what they told us, played back, and never asked again.
function rows(a: StartAnswers): Array<[string, string]> {
  const v = copy.values
  const children = a.children === null ? null : a.children === 0 ? v.childrenNone : a.children === 1 ? v.childrenOne : fill(v.childrenMany, { n: a.children === 4 ? '4 or more' : a.children })
  const relationship = a.relationship === 'civil' ? v.relationship.civil : a.relationship === 'married' ? v.relationship.married : a.relationship ? v.relationship.other : null
  const out: Array<[string, string | null]> = [
    [copy.rows.stage, a.stage ? v.stage[a.stage] : null],
    [copy.rows.relationship, relationship],
    [copy.rows.living, a.living ? v.living[a.living] : null],
    [copy.rows.children, children],
    [copy.rows.home, a.home ? v.home[a.home] : null],
    [copy.rows.work, a.selfEmployed ? v.work[a.selfEmployed] : null],
    [copy.rows.knowledge, a.awareness ? v.knowledge[a.awareness] : null],
  ]
  return out.filter((r): r is [string, string] => r[1] !== null)
}

export default async function Welcome() {
  const session = await requireSession()
  const facts = session.start ? rows(session.start) : []
  return (
    <Page header={<AppHeader name={session.name} />} width="lg">
      <div className="flex flex-col gap-6">
        <SpaceIndicator />
        <Eyebrow>{fill(copy.eyebrow, { name: session.name.split(' ')[0] ?? session.name })}</Eyebrow>
        <Headline text={copy.headline} />
        <p className="max-w-2xl text-body-lg text-ink-muted">{copy.body}</p>
        {facts.length > 0 && (
          <Card>
            <p className="font-display text-display-sm">{copy.lead}</p>
            <dl className="mt-2 divide-y divide-border">
              {facts.map(([label, value]) => (
                <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-body text-ink-muted">{copy.affordance}</p>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
          <NextStep href="/build" cta={copy.nextStepCta} />
          <Card className="flex flex-col justify-center gap-1">
            <Link href="/welcome/tour" className="text-display-sm font-semibold no-underline hover:underline">
              {copy.tourCta}
            </Link>
            <p className="text-body text-ink-muted">{copy.tourMeta}</p>
          </Card>
        </div>
      </div>
    </Page>
  )
}
