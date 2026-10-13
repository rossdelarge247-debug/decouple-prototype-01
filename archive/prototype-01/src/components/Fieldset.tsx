import type { ReactNode } from 'react'

interface Props {
  legend: string
  hint?: string
  error?: string
  children: ReactNode
  id: string
  visuallyHideLegend?: boolean
}

export function Fieldset({ legend, hint, error, children, id, visuallyHideLegend }: Props) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <fieldset id={id} aria-describedby={describedBy} className="min-w-0 border-0 p-0">
      <legend className={visuallyHideLegend ? 'sr-only' : 'mb-3 font-medium text-ink'}>{legend}</legend>
      {hint && <p id={`${id}-hint`} className="mb-3 text-body text-ink-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mb-3 flex items-center gap-2 font-medium text-danger">
          <span aria-hidden="true">·</span>
          {error}
        </p>
      )}
      <div className="grid gap-3">{children}</div>
    </fieldset>
  )
}
