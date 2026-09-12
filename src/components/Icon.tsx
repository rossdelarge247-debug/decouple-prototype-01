// Inline glyphs in currentColor. Decorative by default; pass a label to expose one.
const PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  check: 'M5 13l4 4L19 7',
  shield: 'M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z',
  back: 'M19 12H5M11 18l-6-6 6-6',
  cross: 'M6 6l12 12M18 6L6 18',
  pen: 'M4 20h4l10-10-4-4L4 16v4zM13 7l4 4',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  bank: 'M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M12 3l9 5H3z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, label, className = 'size-4' }: { name: IconName; label?: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
