import type { Helpline, Resource } from '@/lib/start/facts'

export function ResourceList({ items }: { items: readonly Resource[] }) {
  return (
    <ul className="grid gap-3">
      {items.map(r => (
        <li key={r.href} className="rounded-card border border-border bg-surface p-4">
          <a href={r.href} className="font-medium text-ink" rel="noopener">
            {r.name}
          </a>
          <p className="text-body text-ink-muted">{r.note}</p>
        </li>
      ))}
    </ul>
  )
}

export function HelplineList({ items }: { items: readonly Helpline[] }) {
  return (
    <ul className="grid gap-3">
      {items.map(h => (
        <li key={h.name} className="rounded-card border border-border bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <a href={h.href} className="font-medium text-ink" rel="noopener">
              {h.name}
            </a>
            {h.number && (
              <a href={`tel:${h.number.replace(/\s/g, '')}`} className="font-display text-display-sm text-ink no-underline">
                {h.number}
              </a>
            )}
          </div>
          <p className="text-body text-ink-muted">{h.note}</p>
          <p className="text-body-sm text-ink-muted">{h.hours}</p>
        </li>
      ))}
    </ul>
  )
}
