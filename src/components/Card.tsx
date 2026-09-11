import type { ReactNode } from 'react'

export function Card({ children, className = '', tone = 'surface' }: { children: ReactNode; className?: string; tone?: 'surface' | 'tint' | 'ink' }) {
  const bg = tone === 'ink' ? 'bg-ink text-cream' : tone === 'tint' ? 'bg-accent-tint' : 'bg-surface shadow-card'
  return <section className={`rounded-card border border-border p-card ${bg} ${className}`}>{children}</section>
}
