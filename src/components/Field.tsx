// A labelled input, GOV.UK style: the hint and the error sit outside the label text
// and are attached with aria-describedby, so locators match the label alone.
interface Props {
  id: string
  name: string
  label: string
  type?: 'text' | 'email' | 'password'
  hint?: string
  error?: string
  autoComplete?: string
  minLength?: number
}

export function Field({ id, name, label, type = 'text', hint, error, autoComplete, minLength }: Props) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={`flex flex-col gap-1 ${error ? 'border-l-4 border-danger pl-3' : ''}`}>
      <label htmlFor={id} className="font-medium text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-body text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="font-medium text-danger">
          {error}
        </p>
      )}
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className="w-full rounded-control border border-border bg-surface px-4 py-3 text-ink"
      />
    </div>
  )
}
