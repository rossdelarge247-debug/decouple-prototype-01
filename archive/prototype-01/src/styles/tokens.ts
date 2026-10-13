// The design system, created once from the product owner's Start reference screens.
// globals.css mirrors every value inside its @theme block; tests/unit/tokens-parity.test.ts
// fails if the two drift. Nothing outside these two files names a colour or a font.
export const tokens = {
  color: {
    ink: '#1a1523',
    'ink-muted': '#5c5566',
    accent: '#5b21b6',
    'accent-strong': '#4c1d95',
    'accent-tint': '#efe8fb',
    lavender: '#e6dafa',
    cream: '#f7f3ee',
    surface: '#ffffff',
    border: '#e4deea',
    'phase-build': '#5b21b6',
    'phase-reconcile': '#a3164f',
    'phase-settle': '#1f5fa8',
    'phase-finalise': '#166e3f',
    success: '#166e3f',
    'success-tint': '#ddf3e6',
    attention: '#8a5200',
    'attention-tint': '#fff1d6',
    danger: '#b42318',
    'danger-tint': '#fde8e6',
    focus: '#5b21b6',
  },
  font: {
    display: "'Source Serif 4 Variable', Georgia, 'Times New Roman', serif",
    body: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  text: {
    'display-xl': '3.5rem',
    'display-lg': '2.5rem',
    'display-md': '2rem',
    'display-sm': '1.5rem',
    'body-lg': '1.0625rem',
    body: '0.9375rem',
    'body-sm': '0.8125rem',
    eyebrow: '0.75rem',
  },
  spacing: {
    gutter: '1.25rem',
    card: '1.5rem',
    section: '3rem',
  },
  radius: {
    card: '1.25rem',
    control: '0.75rem',
    pill: '9999px',
  },
  shadow: {
    soft: '0 8px 30px rgba(38, 24, 72, 0.08)',
    card: '0 1px 2px rgba(26, 21, 35, 0.06), 0 12px 32px rgba(38, 24, 72, 0.08)',
  },
  ease: {
    soft: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  },
  // JOURNEY's timing budget: micro 100–150ms, content swap 200ms, structural 300ms.
  motion: {
    micro: '120ms',
    swap: '200ms',
    structural: '300ms',
  },
} as const

export type Tokens = typeof tokens

/** Every token as a CSS custom property, exactly as globals.css must declare it. */
export function cssVariables(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [group, values] of Object.entries(tokens)) {
    for (const [name, value] of Object.entries(values)) {
      out[`--${group}-${name}`] = value
    }
  }
  return out
}
