import { AppHeader } from '@/components/AppHeader'
import { Card } from '@/components/Card'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Icon } from '@/components/Icon'
import { NextStep } from '@/components/NextStep'
import { Page } from '@/components/Page'
import { PhaseNav } from '@/components/PhaseNav'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { buildHome as copy } from '@/copy/build'
import { isConfirmDone } from '@/lib/build/confirm'
import { firstUnanswered, profileRoute } from '@/lib/build/profile'
import { loadBuild } from './state'

type StepKey = keyof typeof copy.steps

// Where the tour lands and where Build is picked up again: the four steps, one next step.
export default async function Build() {
  const { session, profile, bank, plan, confirmations } = await loadBuild()
  const unanswered = firstUnanswered(profile, session.start)
  const current: StepKey = unanswered ? 'profile' : !bank ? 'connect' : plan && !isConfirmDone(plan, confirmations) ? 'confirm' : 'picture'
  const order: StepKey[] = ['profile', 'connect', 'confirm', 'picture']
  const next = {
    profile: { href: profileRoute(unanswered ?? 'home'), cta: copy.next.profileCta, body: copy.next.profileBody },
    connect: { href: '/build/connect', cta: copy.next.connectCta, body: copy.next.connectBody },
    confirm: { href: '/build/confirm', cta: copy.next.confirmCta, body: copy.next.confirmBody },
    picture: { href: '/build/picture', cta: copy.next.pictureCta, body: copy.next.pictureBody },
  }[current]

  return (
    <Page header={<AppHeader name={session.name} />} width="xl">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <PhaseNav current="build" />
        <div className="flex flex-col gap-6">
          <SpaceIndicator />
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <Headline text={copy.headline} />
          <p className="max-w-2xl text-body-lg text-ink-muted">{copy.body}</p>
          <NextStep href={next.href} cta={next.cta} body={next.body} />
          <Card>
            <h2 className="text-display-sm">{copy.stepsLabel}</h2>
            <ol className="mt-3 divide-y divide-border">
              {order.map((key, i) => {
                const state = i < order.indexOf(current) ? 'done' : key === current ? 'current' : 'later'
                return (
                  <li key={key} className="flex items-start justify-between gap-4 py-3">
                    <span className="flex items-start gap-3">
                      <span aria-hidden="true" className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-pill text-body-sm ${state === 'done' ? 'bg-success-tint text-success' : state === 'current' ? 'bg-accent text-surface' : 'bg-border text-ink-muted'}`}>
                        {state === 'done' ? <Icon name="check" className="size-3.5" /> : i + 1}
                      </span>
                      <span>
                        <span className={`block font-medium ${state === 'later' ? 'text-ink-muted' : 'text-ink'}`}>{copy.steps[key].title}</span>
                        <span className="block text-body text-ink-muted">{copy.steps[key].body}</span>
                      </span>
                    </span>
                    <span className="shrink-0 rounded-pill border border-border px-2 py-0.5 text-body-sm text-ink-muted">{copy.status[state]}</span>
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>
      </div>
    </Page>
  )
}
