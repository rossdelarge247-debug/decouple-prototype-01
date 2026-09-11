import type { ReactNode } from 'react'

export function Eyebrow({ children, tone = 'accent' }: { children: ReactNode; tone?: 'accent' | 'success' | 'muted' }) {
  const colour = tone === 'success' ? 'text-success' : tone === 'muted' ? 'text-ink-muted' : 'text-accent'
  return <p className={`text-eyebrow font-semibold uppercase tracking-[0.14em] ${colour}`}>{children}</p>
}
