/**
 * Decouple design system tokens — typed TypeScript mirror (S-F1).
 *
 * Every token here has a 1:1 counterpart in src/app/globals.css under the
 * `--ds-*` namespace. Values are literal strings/numbers matching the CSS
 * values verbatim — this file is for *reference + lookup*, not as a styling
 * engine. Components style via CSS classes that reference the custom
 * properties (`var(--ds-color-phase-build)` etc), not via inline `style={{}}`
 * everywhere.
 *
 * Parity between this file and globals.css is enforced by the test in
 * tests/unit/tokens.test.ts (AC-5).
 *
 * Locks 68g C-V1 + C-V13. See docs/slices/S-F1-design-tokens/acceptance.md.
 */

export const tokens = {
  color: {
    ink: '#1A1A1A',
    text: {
      sub: '#57534E',
      muted: '#78716C',
    },
    border: '#E5E3DC',
    surface: {
      page: '#F5F5F4',
      panel: '#FFFFFF',
      canvas: '#FAFAF7',
      gradient: {
        expressive:   'linear-gradient(180deg, #F3EEFE 0%, #FCE7F3 55%, #F5F5F4 100%)',
        canvasChrome: 'linear-gradient(180deg, #EFE7F8 0%, #F5F1F8 60%, #EFEEE9 100%)',
        o7Surface:    'linear-gradient(180deg, #F3EEFE 0%, #FAF6F0 60%, #F5F5F4 100%)',
        standalone:   '#faf9f5',
      },
    },
    phase: {
      build:     { accent: '#4338CA', soft: '#EEF2FF' },
      reconcile: { accent: '#9D174D', soft: '#FCE7F3' },
      settle:    { accent: '#0369A1', soft: '#E0F2FE' },
      finalise:  { accent: '#166534', soft: '#DCFCE7' },
    },
    danger: '#FF3B30',
    dangerText: '#AF2F28',
    accent: {
      violet:  '#7C3AED',
      magenta: '#BE185D',
      indigo:  '#4F46E5',
      brand:   '#2F6D5F',
    },
    ai: {
      accent: '#6D5BD0',
      text:   '#4C3FB8',
      soft:   '#F5F3FF',
      border: '#E4DEFD',
    },
    status: {
      confirmed: { accent: '#22C55E', soft: '#D1FAE5', text: '#047857' },
      estimated: { accent: '#D97706', soft: '#FEF3C7', text: '#92400E' },
      info:      { accent: '#0369A1', soft: '#F0F9FF', border: '#BAE6FD' },
    },
    action: {
      primary: '#DC2626',
      upload:  '#F97316',
      share:   '#9A3412',
      banner:  '#14532D',
    },
  },
  font: {
    sans:  "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    serif: "'Source Serif 4', Georgia, serif",
    mono:  "'JetBrains Mono', ui-monospace, Menlo, monospace",
  },
  type: {
    '10':   '10px',
    '11':   '11px',
    '12':   '12px',
    '13':   '13px',
    '14-5': '14.5px',
    '15-5': '15.5px',
    '16':   '16px',
    '17':   '17px',
    '20':   '20px',
    '21':   '21px',
    '26':   '26px',
    '28':   '28px',
    '40':   '40px',
    '62':   '62px',
    '72':   '72px',
  },
  weight: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },
  letterSpacing: {
    wide: '0.12em',
  },
  radius: {
    sm:   '4px',
    md:   '6px',
    lg:   '8px',
    xl:   '10px',
    pill: '999px',
  },
  shadow: {
    sm: '0 2px 6px rgba(0, 0, 0, 0.1)',
    md: '0 2px 20px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 40px rgba(0, 0, 0, 0.12)',
    phase: {
      build:     '0 4px 30px rgba(67, 56, 202, 0.06)',
      reconcile: '0 4px 30px rgba(157, 23, 77, 0.06)',
      settle:    '0 4px 30px rgba(3, 105, 161, 0.06)',
      finalise:  '0 6px 32px rgba(22, 101, 52, 0.08)',
    },
  },
  space: {
    '1':  '1px',
    '2':  '2px',
    '3':  '3px',
    '4':  '4px',
    '5':  '5px',
    '6':  '6px',
    '7':  '7px',
    '8':  '8px',
    '10': '10px',
    '12': '12px',
    '14': '14px',
    '20': '20px',
    '30': '30px',
    '32': '32px',
    '40': '40px',
    '56': '56px',
    '60': '60px',
  },
  layout: {
    maxNarrow: '760px',
    maxWide:   '960px',
  },
} as const;

export type Tokens = typeof tokens;

/**
 * The CSS custom-property names this token set ships in globals.css.
 * Use as a discriminated union for parity tests + tooling that needs to
 * reference tokens by their CSS-variable name string.
 */
export type TokenName =
  // Colours · Neutrals
  | '--ds-color-ink'
  | '--ds-color-text-sub'
  | '--ds-color-text-muted'
  | '--ds-color-border'
  | '--ds-color-surface-page'
  | '--ds-color-surface-panel'
  | '--ds-color-surface-canvas'
  // Colours · Surface gradients
  | '--ds-color-surface-gradient-expressive'
  | '--ds-color-surface-gradient-canvas-chrome'
  | '--ds-color-surface-gradient-o7-surface'
  | '--ds-color-surface-gradient-standalone'
  // Colours · Phase
  | '--ds-color-phase-build'
  | '--ds-color-phase-build-soft'
  | '--ds-color-phase-reconcile'
  | '--ds-color-phase-reconcile-soft'
  | '--ds-color-phase-settle'
  | '--ds-color-phase-settle-soft'
  | '--ds-color-phase-finalise'
  | '--ds-color-phase-finalise-soft'
  // Colours · Trust levels
  | '--ds-color-trust-self-declared'
  | '--ds-color-trust-self-declared-soft'
  | '--ds-color-trust-bank-evidenced'
  | '--ds-color-trust-bank-evidenced-soft'
  // Colours · State
  | '--ds-color-danger'
  | '--ds-color-danger-text'
  // Colours · Accents
  | '--ds-color-accent-violet'
  | '--ds-color-accent-magenta'
  | '--ds-color-accent-indigo'
  | '--ds-color-accent-brand'
  // Colours · AI
  | '--ds-color-ai'
  | '--ds-color-ai-text'
  | '--ds-color-ai-soft'
  | '--ds-color-ai-border'
  // Colours · Status
  | '--ds-color-status-confirmed'
  | '--ds-color-status-confirmed-soft'
  | '--ds-color-status-confirmed-text'
  | '--ds-color-status-estimated'
  | '--ds-color-status-estimated-soft'
  | '--ds-color-status-estimated-text'
  | '--ds-color-status-info'
  | '--ds-color-status-info-soft'
  | '--ds-color-status-info-border'
  // Colours · Action
  | '--ds-color-action-primary'
  | '--ds-color-action-upload'
  | '--ds-color-action-share'
  | '--ds-color-action-banner'
  // Fonts
  | '--ds-font-sans'
  | '--ds-font-serif'
  | '--ds-font-mono'
  // Type scale
  | '--ds-type-10'
  | '--ds-type-11'
  | '--ds-type-12'
  | '--ds-type-13'
  | '--ds-type-14-5'
  | '--ds-type-15-5'
  | '--ds-type-16'
  | '--ds-type-17'
  | '--ds-type-20'
  | '--ds-type-21'
  | '--ds-type-26'
  | '--ds-type-28'
  | '--ds-type-40'
  | '--ds-type-62'
  | '--ds-type-72'
  // Weights
  | '--ds-weight-regular'
  | '--ds-weight-medium'
  | '--ds-weight-semibold'
  | '--ds-weight-bold'
  // Letter-spacing
  | '--ds-letter-spacing-wide'
  // Radii
  | '--ds-radius-sm'
  | '--ds-radius-md'
  | '--ds-radius-lg'
  | '--ds-radius-xl'
  | '--ds-radius-pill'
  // Shadows · Neutral
  | '--ds-shadow-sm'
  | '--ds-shadow-md'
  | '--ds-shadow-lg'
  // Shadows · Phase
  | '--ds-shadow-phase-build'
  | '--ds-shadow-phase-reconcile'
  | '--ds-shadow-phase-settle'
  | '--ds-shadow-phase-finalise'
  // Spacing
  | '--ds-space-1'
  | '--ds-space-2'
  | '--ds-space-3'
  | '--ds-space-4'
  | '--ds-space-5'
  | '--ds-space-6'
  | '--ds-space-7'
  | '--ds-space-8'
  | '--ds-space-10'
  | '--ds-space-12'
  | '--ds-space-14'
  | '--ds-space-20'
  | '--ds-space-30'
  | '--ds-space-32'
  | '--ds-space-40'
  | '--ds-space-56'
  | '--ds-space-60'
  // Layout containers
  | '--ds-layout-max-narrow'
  | '--ds-layout-max-wide';

/**
 * Source-of-truth set of every shipped CSS custom-property name.
 * Used by the parity test to verify globals.css and tokens.ts agree.
 */
export const TOKEN_NAMES: ReadonlyArray<TokenName> = [
  '--ds-color-ink',
  '--ds-color-text-sub',
  '--ds-color-text-muted',
  '--ds-color-border',
  '--ds-color-surface-page',
  '--ds-color-surface-panel',
  '--ds-color-surface-canvas',
  '--ds-color-surface-gradient-expressive',
  '--ds-color-surface-gradient-canvas-chrome',
  '--ds-color-surface-gradient-o7-surface',
  '--ds-color-surface-gradient-standalone',
  '--ds-color-phase-build',
  '--ds-color-phase-build-soft',
  '--ds-color-phase-reconcile',
  '--ds-color-phase-reconcile-soft',
  '--ds-color-phase-settle',
  '--ds-color-phase-settle-soft',
  '--ds-color-phase-finalise',
  '--ds-color-phase-finalise-soft',
  '--ds-color-trust-self-declared',
  '--ds-color-trust-self-declared-soft',
  '--ds-color-trust-bank-evidenced',
  '--ds-color-trust-bank-evidenced-soft',
  '--ds-color-danger',
  '--ds-color-danger-text',
  '--ds-color-accent-violet',
  '--ds-color-accent-magenta',
  '--ds-color-accent-indigo',
  '--ds-color-accent-brand',
  '--ds-color-ai',
  '--ds-color-ai-text',
  '--ds-color-ai-soft',
  '--ds-color-ai-border',
  '--ds-color-status-confirmed',
  '--ds-color-status-confirmed-soft',
  '--ds-color-status-confirmed-text',
  '--ds-color-status-estimated',
  '--ds-color-status-estimated-soft',
  '--ds-color-status-estimated-text',
  '--ds-color-status-info',
  '--ds-color-status-info-soft',
  '--ds-color-status-info-border',
  '--ds-color-action-primary',
  '--ds-color-action-upload',
  '--ds-color-action-share',
  '--ds-color-action-banner',
  '--ds-font-sans',
  '--ds-font-serif',
  '--ds-font-mono',
  '--ds-type-10',
  '--ds-type-11',
  '--ds-type-12',
  '--ds-type-13',
  '--ds-type-14-5',
  '--ds-type-15-5',
  '--ds-type-16',
  '--ds-type-17',
  '--ds-type-20',
  '--ds-type-21',
  '--ds-type-26',
  '--ds-type-28',
  '--ds-type-40',
  '--ds-type-62',
  '--ds-type-72',
  '--ds-weight-regular',
  '--ds-weight-medium',
  '--ds-weight-semibold',
  '--ds-weight-bold',
  '--ds-letter-spacing-wide',
  '--ds-radius-sm',
  '--ds-radius-md',
  '--ds-radius-lg',
  '--ds-radius-xl',
  '--ds-radius-pill',
  '--ds-shadow-sm',
  '--ds-shadow-md',
  '--ds-shadow-lg',
  '--ds-shadow-phase-build',
  '--ds-shadow-phase-reconcile',
  '--ds-shadow-phase-settle',
  '--ds-shadow-phase-finalise',
  '--ds-space-1',
  '--ds-space-2',
  '--ds-space-3',
  '--ds-space-4',
  '--ds-space-5',
  '--ds-space-6',
  '--ds-space-7',
  '--ds-space-8',
  '--ds-space-10',
  '--ds-space-12',
  '--ds-space-14',
  '--ds-space-20',
  '--ds-space-30',
  '--ds-space-32',
  '--ds-space-40',
  '--ds-space-56',
  '--ds-space-60',
  '--ds-layout-max-narrow',
  '--ds-layout-max-wide',
] as const;
