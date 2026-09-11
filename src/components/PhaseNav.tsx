import { phases } from '@/copy/start'
import { Icon } from './Icon'

type Phase = keyof typeof phases.labels
const ORDER: Phase[] = ['start', 'build', 'reconcile', 'settle', 'finalise']

// The five phases, verbatim. Locked phases stay visible, dimmed, with "Unlocks when …";
// nothing here is a link this session, so no locator can match a phase by accident.
export function PhaseNav({ current }: { current: Phase }) {
  const currentIndex = ORDER.indexOf(current)
  return (
    <nav aria-label={phases.navLabel}>
      <ol className="flex flex-col gap-2">
        {ORDER.map((phase, i) => {
          const done = i < currentIndex
          const isCurrent = i === currentIndex
          const locked = i > currentIndex
          const unlock = phase === 'reconcile' || phase === 'settle' || phase === 'finalise' ? phases.unlocks[phase] : null
          return (
            <li
              key={phase}
              aria-current={isCurrent ? 'page' : undefined}
              className={`flex items-center justify-between gap-3 rounded-control px-3 py-2 ${isCurrent ? 'bg-surface font-semibold text-ink shadow-soft' : locked ? 'text-ink-muted' : 'text-ink'}`}
            >
              <span className="flex items-center gap-2">
                {done && <Icon name="check" className="size-4 text-success" />}
                {locked && <Icon name="lock" className="size-4" />}
                {phases.labels[phase]}
              </span>
              {locked && (
                <span className="text-right text-body-sm">
                  <span className="rounded-pill border border-border px-2 py-0.5">{phases.locked}</span>
                  <span className="sr-only">. </span>
                  <span className="block">{unlock}</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
