import { footer } from '@/copy/start'
import { ExitThisPage } from './ExitThisPage'

export function Footer() {
  return (
    <footer className="no-print mt-auto border-t border-border bg-surface/70 px-gutter py-6 text-body text-ink-muted">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <p>{footer.helpline}</p>
          <p>{footer.notAService}</p>
        </div>
        <div className="shrink-0">
          <ExitThisPage />
          <p className="mt-2 text-body-sm">{footer.exitHint}</p>
        </div>
      </div>
    </footer>
  )
}
