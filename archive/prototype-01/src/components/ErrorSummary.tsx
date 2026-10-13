import { fill } from '@/copy/rules'
import { errors as copy, interview } from '@/copy/start'

// GOV.UK's pattern: one summary at the top with a reference id, focused on arrival.
export function ErrorSummary({ messages, reference }: { messages: string[]; reference: string }) {
  if (messages.length === 0) return null
  return (
    <div role="alert" tabIndex={-1} className="mb-6 rounded-card border-2 border-danger bg-surface p-card" id="error-summary">
      <h2 className="text-display-sm">{interview.summaryTitle}</h2>
      <ul className="mt-2 list-disc pl-5 text-ink">
        {messages.map(m => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <p className="mt-2 text-body-sm text-ink-muted">{fill(copy.refLabel, { ref: reference })}</p>
    </div>
  )
}
