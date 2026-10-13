import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Icon } from '@/components/Icon'
import { Page } from '@/components/Page'
import { PhaseNav } from '@/components/PhaseNav'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { connect as copy } from '@/copy/build'
import { errors as startErrors } from '@/copy/start'
import { fill } from '@/copy/rules'
import { scenarioChoices } from '@/lib/build/bank'
import { tinkAvailable } from '@/lib/build/tink'
import type { SearchParams } from '@/lib/start/errors'
import { chooseScenario, disconnectBank, startBankConnection } from '../actions'
import { loadBuild } from '../state'

const STATES: Record<string, string> = { unavailable: copy.unavailable, failed: copy.failed, cancelled: copy.cancelled }

// Profile → connect → confirm by exception. The trust band sits above the picker; the
// five test scenarios stand in for the Tink demo bank wherever Tink cannot run.
export default async function Connect({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { session, bank } = await loadBuild()
  const params = await searchParams
  const state = typeof params.state === 'string' ? STATES[params.state] : undefined
  const ref = typeof params.ref === 'string' ? params.ref : ''
  const scenarios = scenarioChoices()
  const available = tinkAvailable()

  return (
    <Page header={<AppHeader name={session.name} />} width="xl">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <PhaseNav current="build" />
        <div className="flex max-w-3xl flex-col gap-6">
          <SpaceIndicator />
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <Headline text={copy.headline} />
          <p className="text-body-lg text-ink-muted">{copy.body}</p>

          {state && (
            <div role="alert" className="rounded-card border-2 border-attention bg-surface p-card">
              <p className="text-ink">{state}</p>
              {ref && <p className="mt-1 text-body-sm text-ink-muted">{fill(startErrors.refLabel, { ref })}</p>}
            </div>
          )}

          {bank && (
            <Card tone="tint" className="flex flex-col gap-3">
              <p className="font-display text-display-sm">{copy.connectedTitle}</p>
              <p className="text-ink">
                {fill(copy.connectedBody, {
                  accounts: bank.accounts.length === 1 ? copy.oneAccount : fill(copy.manyAccounts, { n: bank.accounts.length }),
                  provider: bank.label,
                  months: bank.months,
                })}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button href="/build/reveal" arrow>
                  {copy.continueCta}
                </Button>
                <form action={disconnectBank}>
                  <Button variant="quiet">{copy.disconnectCta}</Button>
                </form>
              </div>
              <p className="text-body text-ink-muted">{copy.multiple}</p>
            </Card>
          )}

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-border bg-surface px-card py-3 text-body text-ink" aria-label={copy.trustLabel}>
            {copy.trust.map(t => (
              <li key={t} className="flex items-center gap-2">
                <Icon name="shield" className="size-4 text-success" />
                {t}
              </li>
            ))}
          </ul>

          <form action={startBankConnection} className="flex flex-col gap-4">
            <fieldset className="min-w-0 border-0 p-0">
              <legend className="mb-3 font-medium text-ink">{copy.banksLegend}</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {copy.banks.map(b => (
                  <button key={b.id} type="submit" name="bank" value={b.id} aria-disabled={!available} className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface px-3 py-4 font-medium text-ink motion-swap transition-colors hover:border-ink">
                    <Icon name="bank" className="size-4 text-accent" />
                    {b.name}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary" name="bank" value="search">
                {copy.searchCta}
              </Button>
              <p className="text-body text-ink-muted">{copy.searchBody}</p>
            </div>
            {!available && <p className="text-body text-ink-muted">{copy.unavailable}</p>}
          </form>

          <Card>
            <p className="font-medium text-ink">{copy.notHereTitle}</p>
            <p className="mt-1 text-body text-ink-muted">{copy.notHereBody}</p>
          </Card>

          <Card tone="tint">
            <h2 className="text-display-sm">{copy.scenarioTitle}</h2>
            <p className="mt-2 text-ink-muted">{copy.scenarioBody}</p>
            <form action={chooseScenario} className="mt-4 flex flex-col gap-3" aria-label={copy.scenarioLegend}>
              {scenarios.map(s => (
                <button key={s.id} type="submit" name="scenario" value={s.id} className="flex flex-col items-start rounded-card border border-border bg-surface px-card py-3 text-left motion-swap transition-colors hover:border-ink">
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="text-body text-ink-muted">{s.description.split('. ')[0]}.</span>
                </button>
              ))}
            </form>
          </Card>
        </div>
      </div>
    </Page>
  )
}
