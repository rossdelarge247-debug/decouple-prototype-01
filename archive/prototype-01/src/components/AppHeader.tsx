import { Wordmark } from './Wordmark'

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('')
}

// Initials as plain text, never a button: nothing here matches a name locator.
export function AppHeader({ name }: { name: string }) {
  return (
    <header className="no-print border-b border-border bg-surface px-gutter py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Wordmark />
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-pill bg-accent-tint font-semibold text-accent">
          {initials(name)}
        </span>
      </div>
    </header>
  )
}
