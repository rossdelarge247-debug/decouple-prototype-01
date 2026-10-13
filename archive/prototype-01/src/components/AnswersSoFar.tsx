import { fill } from '@/copy/rules'
import { interview, o1, o2, o3, o4, o5, o6 } from '@/copy/start'
import { isAnswered, type StartAnswers, type StepKey } from '@/lib/start/answers'
import { Icon } from './Icon'

// The "so far" rail from the reference screens: what has been answered, filling in
// as you go. O3's answer is shown only as answered, never by value, because this
// rail may be glanced at on a device that is not private.
function rows(a: StartAnswers): Array<{ label: string; value: string | null }> {
  const children = a.children === null ? null : a.children === 0 ? o2.children.options.no : a.children === 4 ? o2.childrenCount.options['4+'] : String(a.children)
  return [
    { label: o1.eyebrow, value: a.stage ? o1.options[a.stage].title : null },
    { label: o2.relationship.legend, value: a.relationship ? o2.relationship.options[a.relationship] : null },
    { label: o2.children.legend, value: children },
    { label: o2.home.legend, value: a.home ? o2.home.options[a.home] : null },
    { label: o4.eyebrow, value: a.selfEmployed ? o4.options[a.selfEmployed].title : null },
    { label: o5.eyebrow, value: a.awareness ? o5.options[a.awareness].title : null },
    { label: o6.eyebrow, value: a.priorities.length || a.worries.length ? fill(interview.chosen, { n: a.priorities.length + a.worries.length }) : null },
  ]
}

export function AnswersSoFar({ answers, step }: { answers: StartAnswers; step: StepKey }) {
  const answeredO3 = isAnswered('o3', answers) && step !== 'o3'
  return (
    <aside className="hidden md:block" aria-label={interview.soFarTitle}>
      <div className="rounded-card border border-border bg-surface p-card shadow-card">
        <h2 className="text-display-sm">{interview.soFarTitle}</h2>
        <dl className="mt-4 divide-y divide-border">
          {rows(answers).map(r => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 py-2 text-body">
              <dt className="flex items-center gap-2 text-ink-muted">
                <Icon name={r.value ? 'check' : 'lock'} className={`size-3.5 ${r.value ? 'text-success' : 'text-border'}`} />
                {r.label}
              </dt>
              <dd className="text-right font-medium text-ink">{r.value ?? '·'}</dd>
            </div>
          ))}
          {answeredO3 && (
            <div className="flex items-baseline justify-between gap-4 py-2 text-body">
              <dt className="flex items-center gap-2 text-ink-muted">
                <Icon name="check" className="size-3.5 text-success" />
                {o3.legend}
              </dt>
              <dd className="font-medium text-ink">{interview.answered}</dd>
            </div>
          )}
        </dl>
      </div>
      <p className="mt-3 flex items-center gap-2 text-body text-ink-muted">
        <Icon name="lock" className="size-3.5" />
        {interview.privateNote}
      </p>
    </aside>
  )
}
