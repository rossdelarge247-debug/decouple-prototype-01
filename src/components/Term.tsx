import type { ReactNode } from 'react'

// A legal term explained beside itself, with "tell me more" that never leaves the screen.
export function Term({ term, children }: { term: string; children: ReactNode }) {
  return (
    <details className="inline">
      <summary className="inline cursor-pointer list-none underline decoration-dotted underline-offset-4 marker:hidden">{term}</summary>
      <span className="mt-1 block rounded-control bg-accent-tint px-3 py-2 text-body text-ink">{children}</span>
    </details>
  )
}
