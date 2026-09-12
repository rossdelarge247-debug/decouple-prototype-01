import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/Button'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { PhaseNav } from '@/components/PhaseNav'
import { Reveal } from '@/components/Reveal'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { reveal as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import { revealItems } from '@/lib/build/reveal'
import { loadBuild } from '../state'

// The reveal: what the bank shows, item by item. No auto-advance; Continue is always live.
export default async function RevealPage() {
  const { session, bank, plan } = await loadBuild()
  if (!bank || !plan) redirect('/build/connect')
  const items = revealItems(bank, plan)

  return (
    <Page header={<AppHeader name={session.name} />} width="xl">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <PhaseNav current="build" />
        <div className="flex max-w-3xl flex-col gap-6">
          <SpaceIndicator />
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <Headline text={copy.headline} />
          <p className="text-body-lg text-ink-muted">{fill(copy.body, { provider: bank.label })}</p>
          <ul className="flex flex-wrap gap-2 text-body text-ink-muted">
            {bank.accounts.map(a => (
              <li key={`${a.extraction.provider}-${a.extraction.account_number_last4}`} className="rounded-pill border border-border bg-surface px-3 py-1">
                {fill(copy.accountLabel, { provider: a.extraction.provider, last4: a.extraction.account_number_last4 ?? '' })}
              </li>
            ))}
          </ul>
          <Reveal items={items} progressLabel={copy.progressLabel} />
          <div>
            <Button href="/build/confirm" arrow>
              {copy.continueCta}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  )
}
