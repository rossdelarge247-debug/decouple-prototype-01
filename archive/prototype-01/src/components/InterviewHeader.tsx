import { fill } from '@/copy/rules'
import { header } from '@/copy/start'
import { Wordmark } from './Wordmark'

export function InterviewHeader({ step, progress }: { step: number; progress: number }) {
  return (
    <header className="no-print px-gutter pt-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <Wordmark />
          <span className="text-body text-ink-muted">{header.freeInterview}</span>
        </div>
        <span className="text-body text-ink-muted">{fill(header.stepOf, { n: step })}</span>
      </div>
      <progress
        className="mt-4 block h-1 w-full appearance-none overflow-hidden rounded-pill bg-border [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent"
        value={Math.round(progress * 100)}
        max={100}
        aria-label={header.progressLabel}
      />
    </header>
  )
}
