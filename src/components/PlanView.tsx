'use client'

import { useEffect, useRef, useState } from 'react'
import { plan as copy } from '@/copy/start'
import type { DeterministicPlan, PlanNote } from '@/lib/start/plan'
import type { PlanProse } from '@/lib/start/plan-prose'
import { Card } from './Card'
import { Icon } from './Icon'

// The deterministic plan renders at once; the prose is swapped in when it arrives and
// silently left out when it does not. sessionStorage remembers it for this visit only.
interface Props {
  plan: DeterministicPlan
  hash: string
}

function mergeNotes(base: PlanNote[], prose: PlanProse | null): PlanNote[] {
  if (!prose) return base
  const merged = base.map(n => {
    const match = prose.notes.find(p => p.anchor === n.anchor)
    return match ? { ...n, body: match.text } : n
  })
  const general = prose.notes.find(p => p.anchor === 'general')
  if (merged.length < 2 && general) merged.push({ anchor: 'general', title: copy.sections.notes, body: general.text })
  return merged.slice(0, 2)
}

export function PlanView({ plan, hash }: Props) {
  const [prose, setProse] = useState<PlanProse | null>(null)
  const [waiting, setWaiting] = useState(plan.complete)
  const started = useRef(false)

  useEffect(() => {
    if (!plan.complete || started.current) return
    started.current = true
    const key = `decouple_plan:${hash}`
    const controller = new AbortController()
    const load = async (): Promise<PlanProse | null> => {
      try {
        const cached = sessionStorage.getItem(key)
        if (cached) return JSON.parse(cached) as PlanProse
      } catch {}
      const response = await fetch('/api/plan', { method: 'POST', signal: controller.signal })
      if (!response.ok) return null
      const data = (await response.json()) as { prose: PlanProse | null }
      if (data.prose) {
        try {
          sessionStorage.setItem(key, JSON.stringify(data.prose))
        } catch {}
      }
      return data.prose
    }
    load()
      .then(result => {
        if (result) setProse(result)
      })
      .catch(() => {})
      .finally(() => setWaiting(false))
    return () => controller.abort()
  }, [plan.complete, hash])

  const notes = mergeNotes(plan.notes, prose)
  const s = copy.sections

  return (
    <div className="flex flex-col gap-8">
      {(plan.safetyMessage || plan.privacyMessage) && (
        <div className="flex flex-col gap-3">
          {plan.safetyMessage && <Notice text={plan.safetyMessage} />}
          {plan.privacyMessage && <Notice text={plan.privacyMessage} />}
        </div>
      )}

      <Card>
        <h2 className="text-display-sm">{s.situation}</h2>
        <p className="mt-2 text-body-lg">{plan.situation}</p>
        {prose && <p className="mt-2 text-ink-muted">{prose.situation_summary}</p>}
        {waiting && !prose && (
          <p className="mt-2 text-body-sm text-ink-muted" aria-live="polite">
            {copy.notesWriting}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="text-display-sm">{s.journey}</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {plan.steps.map((step, i) => (
            <li key={step.key} className="rounded-control border border-border p-4">
              <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-accent">0{i + 1}</p>
              <h3 className="mt-1 text-body-lg font-semibold">{step.title}</h3>
              <p className="text-body text-ink-muted">{step.fact}</p>
              <p className="mt-2 text-body">{prose?.steps[i]?.position ?? step.position}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <h2 className="text-display-sm">{s.needs}</h2>
        <ul className="mt-3 grid gap-2">
          {plan.needs.map(n => (
            <li key={n} className="flex gap-3">
              <Icon name="check" className="mt-1 size-4 shrink-0 text-success" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-display-sm">{s.conventional}</h2>
        <ul className="mt-3 grid gap-2 text-ink-muted">
          {plan.conventional.map(c => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <h3 className="mt-5 text-body font-semibold">{copy.termsTitle}</h3>
        <div className="mt-2 grid gap-2">
          {copy.terms.map(t => (
            <details key={t.term} className="rounded-control border border-border px-3 py-2">
              <summary className="cursor-pointer font-medium">{t.term}</summary>
              <p className="mt-1 text-body text-ink-muted">{t.explain}</p>
            </details>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-display-sm">{s.helps}</h2>
        <ul className="mt-3 grid gap-2">
          {plan.helps.map(h => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        {prose && <p className="mt-3 border-t border-border pt-3 text-ink-muted">{prose.key_difference}</p>}
      </Card>

      {notes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map(n => (
            <Card key={n.anchor} tone="tint">
              <h2 className="text-display-sm">{n.title}</h2>
              <p className="mt-2">{n.body}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h2 className="text-display-sm">{s.links}</h2>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {plan.links.map(l => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
      </Card>

      <div className="no-print flex flex-col items-start gap-2">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-6 py-3 font-medium text-ink hover:border-ink">
          {copy.downloadCta}
        </button>
        <p className="text-body-sm text-ink-muted">{copy.printHint}</p>
      </div>
    </div>
  )
}

function Notice({ text }: { text: string }) {
  return (
    <p className="flex gap-3 rounded-card border border-attention bg-attention-tint p-4 text-ink">
      <Icon name="shield" className="mt-0.5 size-5 shrink-0 text-attention" />
      <span>{text}</span>
    </p>
  )
}
