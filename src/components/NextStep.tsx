import { nextStep } from '@/copy/start'
import { Button } from './Button'
import { Card } from './Card'

// Singular by design: one next step per screen, the full list one tap behind it later.
export function NextStep({ href, cta, body }: { href?: string; cta: string; body?: string }) {
  return (
    <Card tone="tint" className="flex flex-col gap-3">
      <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-accent">{nextStep.label}</p>
      {body && <p className="text-ink-muted">{body}</p>}
      <div>
        {href ? (
          <Button href={href} arrow>
            {cta}
          </Button>
        ) : (
          <p className="text-display-sm">{cta}</p>
        )}
      </div>
    </Card>
  )
}
