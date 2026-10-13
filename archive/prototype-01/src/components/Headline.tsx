// A serif headline with one phrase set in italic purple, as the reference screens do.
export function Headline({ text, accent, size = 'lg' }: { text: string; accent?: string; size?: 'xl' | 'lg' | 'md' }) {
  const cls = size === 'xl' ? 'text-display-lg md:text-display-xl' : size === 'lg' ? 'text-display-md md:text-display-lg' : 'text-display-sm md:text-display-md'
  if (!accent || !text.includes(accent)) return <h1 className={cls}>{text}</h1>
  const [before, after] = text.split(accent)
  return (
    <h1 className={cls}>
      {before}
      <span className="accent-italic">{accent}</span>
      {after}
    </h1>
  )
}
