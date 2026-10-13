import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { EvidenceTag, TrustBadge } from '@/components/Badges'
import { Card } from '@/components/Card'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Icon } from '@/components/Icon'
import { NextStep } from '@/components/NextStep'
import { Page } from '@/components/Page'
import { PhaseNav } from '@/components/PhaseNav'
import { SpaceIndicator } from '@/components/SpaceIndicator'
import { picture as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import { questionRoute } from '@/lib/build/confirm'
import { pounds } from '@/lib/build/money'
import { buildPicture, shortDate, type Line, type Section } from '@/lib/build/picture'
import { loadBuild } from '../state'

// LOCKED shape: a document, not a dashboard. Left, the chapters with completion; middle,
// §-numbered sections in legal-prose style with structured data inline; right, the
// contextual rail. No summary section, no version chip, no split anywhere.
export default async function YourPicture() {
  const { session, profile, bank, plan, confirmations } = await loadBuild()
  const now = new Date()
  const picture = buildPicture({ bank, plan, confirmations, profile, start: session.start, now })
  const { snapshot } = picture

  return (
    <Page header={<AppHeader name={session.name} />} width="xl">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-6">
          <PhaseNav current="build" />
          <nav aria-label={copy.chaptersLabel}>
            <ol className="flex flex-col gap-1 text-body">
              {picture.sections.map(s => (
                <li key={s.key}>
                  <a href={`#s-${s.key}`} className="flex items-center justify-between gap-2 rounded-control px-3 py-1.5 text-ink no-underline hover:bg-surface">
                    <span>
                      <span className="text-ink-muted">§{s.number} </span>
                      {copy.chapters[s.key]}
                    </span>
                    <StateIcon state={s.state} />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <article className="flex min-w-0 flex-col gap-8 rounded-card border border-border bg-surface p-card shadow-card md:p-8">
          <div className="flex flex-col gap-4">
            <SpaceIndicator />
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <Headline text={copy.headline} />
            <p className="max-w-2xl text-body-lg text-ink-muted">{copy.lede}</p>
            <p className="text-body text-ink-muted">
              {picture.updatedAt ? fill(copy.updated, { when: shortDate(new Date(picture.updatedAt), now) }) : ''}
              {picture.updatedAt ? ' · ' : ''}
              {copy.fidelity[picture.fidelity]} · {picture.readiness}
            </p>
          </div>

          {picture.sections.map(s => (
            <SectionView key={s.key} section={s} now={now} />
          ))}

          <p className="border-t border-border pt-4 text-body text-ink-muted">{copy.private}</p>
        </article>

        <aside className="flex flex-col gap-4">
          <NextStep cta={picture.nextStep} />
          <Card>
            <h2 className="text-display-sm">{copy.snapshot.title}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <Metric label={copy.snapshot.netWorth} body={copy.snapshot.netWorthBody} value={snapshot.netWorth} />
              <Metric label={copy.snapshot.assets} value={snapshot.assets} small />
              <Metric label={copy.snapshot.debts} value={snapshot.debts === null ? null : -snapshot.debts} small />
              <Metric label={copy.snapshot.monthlyGap} body={copy.snapshot.monthlyGapBody} value={snapshot.monthlyGap} suffix={copy.perMonth} />
              <Metric label={copy.snapshot.income} value={snapshot.income} small />
              <Metric label={copy.snapshot.outgoings} value={-snapshot.outgoings} small />
            </dl>
            {snapshot.withoutValue > 0 && <p className="mt-3 text-body-sm text-ink-muted">{fill(copy.snapshot.withoutValue, { n: snapshot.withoutValue })}</p>}
          </Card>
          <Card>
            <h2 className="text-display-sm">{copy.sources.title}</h2>
            <ul className="mt-3 flex flex-col gap-2 text-body">
              {picture.sources.map(src => (
                <li key={src.label} className="flex items-start gap-2">
                  <Icon name={src.label === copy.sources.profile ? 'pen' : 'bank'} className="mt-1 size-4 shrink-0 text-accent" />
                  <span>
                    <span className="block text-ink">{src.label}</span>
                    {src.detail && <span className="block text-ink-muted">{src.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="text-display-sm">{copy.attention.title}</h2>
            {picture.attention.length === 0 ? (
              <p className="mt-2 text-body text-ink-muted">{copy.attention.none}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3 text-body">
                {picture.attention.map(a => (
                  <li key={a.id} className="flex items-start gap-2">
                    <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-pill ${a.kind === 'gap' ? 'bg-attention' : 'bg-accent'}`} />
                    <span>
                      <span className="block text-ink">{a.label}</span>
                      <span className="block text-ink-muted">{a.kind === 'gap' ? `${copy.attention.gap}: ${a.detail}` : a.detail}</span>
                      {a.kind === 'unconfirmed' && (
                        <Link href={questionRoute(a.id)} className="text-ink">
                          {copy.attention.review}
                        </Link>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </Page>
  )
}

function StateIcon({ state }: { state: Section['state'] }) {
  if (state === 'complete' || state === 'none') return <Icon name="check" className="size-4 text-success" label={copy.status[state]} />
  if (state === 'attention') return <span className="rounded-pill bg-attention-tint px-2 text-body-sm text-attention">{copy.status.attention}</span>
  return <span className="text-body-sm text-ink-muted">{copy.status.empty}</span>
}

function Metric({ label, body, value, small, suffix }: { label: string; body?: string; value: number | null; small?: boolean; suffix?: string }) {
  const negative = value !== null && value < 0
  return (
    <div className={small ? '' : 'col-span-2'}>
      <dt className={small ? 'text-body text-ink-muted' : 'font-medium text-ink'}>{label}</dt>
      <dd className={`${small ? 'text-body-lg' : 'font-display text-display-md'} tabular-nums ${negative ? 'text-danger' : 'text-ink'}`}>
        {value === null ? copy.unknown : pounds(value)}
        {value !== null && suffix ? <span className="text-body text-ink-muted"> {suffix}</span> : null}
      </dd>
      {body && <dd className="text-body-sm text-ink-muted">{body}</dd>}
    </div>
  )
}

function SectionView({ section, now }: { section: Section; now: Date }) {
  return (
    <section id={`s-${section.key}`} aria-labelledby={`h-${section.key}`} className="flex flex-col gap-3 border-t border-border pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={`h-${section.key}`} className="text-display-sm">
          <span className="text-accent">§{section.number}</span> {section.title}
        </h2>
        <span className="text-body-sm text-ink-muted">{fill(copy.formE, { field: section.formE })}</span>
      </div>
      {section.lines.length === 0 ? (
        <p className="text-ink-muted">{section.noneText ?? copy.status.empty}</p>
      ) : (
        <dl className="divide-y divide-border">
          {section.lines.map(l => (
            <LineView key={l.id} line={l} />
          ))}
        </dl>
      )}
      {section.toConfirm > 0 && <p className="text-body text-attention">{fill(copy.toConfirm, { n: section.toConfirm })}</p>}
      <details className="text-body">
        <summary className="cursor-pointer text-ink-muted">{copy.history.title}</summary>
        {section.history.length === 0 ? (
          <p className="mt-2 text-ink-muted">{copy.history.empty}</p>
        ) : (
          <ol className="mt-2 flex flex-col gap-1">
            {section.history.map((h, i) => (
              <li key={`${h.at}-${i}`} className="flex flex-wrap gap-x-3 text-ink-muted">
                <time dateTime={h.at} className="shrink-0 tabular-nums">
                  {shortDate(new Date(h.at), now)}
                </time>
                <span className="text-ink">{h.text}</span>
              </li>
            ))}
          </ol>
        )}
      </details>
    </section>
  )
}

function LineView({ line }: { line: Line }) {
  const valueText = line.value !== null ? pounds(line.value) : line.text ?? (line.evidence === 'gap' ? copy.unknown : copy.notEntered)
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-3">
      <dt className="text-ink">{line.label}</dt>
      <dd className={`text-right font-medium tabular-nums ${line.value !== null && line.value < 0 ? 'text-danger' : line.value === null && line.text === null ? 'text-ink-muted' : 'text-ink'}`}>
        {valueText}
        {line.value !== null && line.period === 'month' ? <span className="font-normal text-ink-muted"> {copy.perMonth}</span> : null}
      </dd>
      <dd className="col-span-2 flex flex-wrap items-center gap-2 text-body-sm text-ink-muted">
        <EvidenceTag state={line.evidence} />
        {line.trust && <TrustBadge level={line.trust} source={line.source} />}
        {line.status === 'skipped' && <span className="rounded-pill bg-attention-tint px-2 py-0.5 text-attention">{copy.attention.unconfirmed}</span>}
        {line.note && <span>{line.note}</span>}
        {line.findingId && (
          <Link href={questionRoute(line.findingId)} className="text-ink">
            {copy.history.change}
          </Link>
        )}
      </dd>
    </div>
  )
}
