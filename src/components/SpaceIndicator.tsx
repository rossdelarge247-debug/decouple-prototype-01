import { space } from '@/copy/start'
import { Icon } from './Icon'

// Named on every post-sign-up screen so a user can say, without looking, which
// space they are in. Only the private space exists this session.
export function SpaceIndicator() {
  return (
    <p className="inline-flex items-center gap-2 rounded-pill bg-accent px-3 py-1 text-eyebrow font-semibold uppercase tracking-[0.12em] text-surface">
      <Icon name="lock" className="size-3.5" />
      {space.private}
    </p>
  )
}
