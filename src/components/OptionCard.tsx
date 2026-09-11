// A radio or checkbox as a whole tappable card. The input sits inside its label, so
// the accessible name is the title plus the body, and the checked state shows as a
// filled ring and a border, never colour alone.
interface Props {
  type: 'radio' | 'checkbox'
  name: string
  value: string
  title: string
  body?: string
  defaultChecked?: boolean
  compact?: boolean
}

export function OptionCard({ type, name, value, title, body, defaultChecked, compact }: Props) {
  return (
    <label className={`group flex cursor-pointer items-center gap-4 rounded-card border border-border bg-surface ${compact ? 'px-4 py-3' : 'p-card'} motion-swap transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-tint has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus`}>
      <span className="flex-1">
        <span className="block font-medium text-ink">{title}</span>
        {body && <span className="block text-body text-ink-muted">{body}</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-5 shrink-0 accent-accent focus-visible:outline-none"
      />
    </label>
  )
}
