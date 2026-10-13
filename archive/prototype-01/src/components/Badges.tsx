import { picture as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import type { EvidenceState, TrustLevel } from '@/lib/build/picture'
import { Icon, type IconName } from './Icon'

// Colour encodes the level and the label names the source, so colour is never the
// only indicator. Amber is estimated or self-declared; green is verified.

const TRUST_TONE: Record<TrustLevel, string> = {
  'self-declared': 'bg-attention-tint text-attention',
  'bank-evidenced': 'bg-success-tint text-success',
  'credit-verified': 'bg-success-tint text-success',
  'document-evidenced': 'bg-success-tint text-success',
  'both-party-agreed': 'bg-accent-tint text-accent',
  'court-sealed': 'bg-ink text-cream',
}

const TRUST_ICON: Record<TrustLevel, IconName> = {
  'self-declared': 'pen',
  'bank-evidenced': 'shield',
  'credit-verified': 'shield',
  'document-evidenced': 'doc',
  'both-party-agreed': 'check',
  'court-sealed': 'check',
}

export function TrustBadge({ level, source }: { level: TrustLevel; source: string | null }) {
  const label = level === 'bank-evidenced' && source ? fill(copy.trust[level], { source }) : level === 'bank-evidenced' ? copy.trust[level].replace(' {source}', '') : copy.trust[level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-body-sm font-medium ${TRUST_TONE[level]}`}>
      <Icon name={TRUST_ICON[level]} className="size-3.5" />
      {label}
    </span>
  )
}

const EVIDENCE_TONE: Record<EvidenceState, string> = {
  proved: 'border-success text-success',
  inferred: 'border-accent text-accent',
  gap: 'border-attention text-attention',
  invisible: 'border-ink-muted text-ink-muted',
}

export function EvidenceTag({ state }: { state: EvidenceState }) {
  return (
    <span className={`inline-flex items-center rounded-pill border px-2 py-0.5 text-body-sm font-medium ${EVIDENCE_TONE[state]}`} title={copy.evidenceBody[state]}>
      {copy.evidence[state]}
    </span>
  )
}
