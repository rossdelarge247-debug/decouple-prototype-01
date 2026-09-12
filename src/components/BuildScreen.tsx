import type { ReactNode } from 'react'
import { profile as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import type { ScreenErrors } from '@/lib/start/errors'
import { AppHeader } from './AppHeader'
import { Button } from './Button'
import { ErrorSummary } from './ErrorSummary'
import { Eyebrow } from './Eyebrow'
import { Headline } from './Headline'
import { Page } from './Page'
import { PhaseNav } from './PhaseNav'
import { SpaceIndicator } from './SpaceIndicator'

interface Props {
  name: string
  position: { n: number; total: number }
  headline: string
  body: string
  why: string
  unlocks: string
  errors: ScreenErrors
  action: (formData: FormData) => Promise<void>
  backHref: string
  cta?: string
  children: ReactNode
}

// One topic per profile screen. Every screen says why it asks and what it unlocks,
// keeps the phase nav and the private-space indicator, and works without JavaScript.
export function BuildScreen({ name, position, headline, body, why, unlocks, errors, action, backHref, cta = copy.continueCta, children }: Props) {
  return (
    <Page header={<AppHeader name={name} />} width="xl">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <PhaseNav current="build" />
        <div className="flex max-w-2xl flex-col gap-6">
          <SpaceIndicator />
          <Eyebrow>{fill(copy.eyebrow, position)}</Eyebrow>
          <Headline text={headline} />
          <p className="text-body-lg text-ink-muted">{body}</p>
          <ErrorSummary messages={errors.messages} reference={errors.reference} />
          <form action={action} className="disclose-wrap flex flex-col gap-8">
            {children}
            <div className="flex flex-wrap items-center gap-4">
              <Button href={backHref} variant="quiet" back>
                {copy.backCta}
              </Button>
              <Button arrow>{cta}</Button>
            </div>
          </form>
          <dl className="grid gap-2 rounded-card border border-border bg-surface/60 p-4 text-body md:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink">{copy.whyLabel}</dt>
              <dd className="text-ink-muted">{why}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{copy.unlocksLabel}</dt>
              <dd className="text-ink-muted">{unlocks}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Page>
  )
}

export function SelectField({ id, name, label, hint, error, options, placeholder }: { id: string; name: string; label: string; hint?: string; error?: string; options: readonly string[]; placeholder: string }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={`flex flex-col gap-1 ${error ? 'border-l-4 border-danger pl-3' : ''}`}>
      <label htmlFor={id} className="font-medium text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-body text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="font-medium text-danger">
          {error}
        </p>
      )}
      <select id={id} name={name} defaultValue="" aria-describedby={describedBy} aria-invalid={error ? true : undefined} className="w-full rounded-control border border-border bg-surface px-4 py-3 text-ink">
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
