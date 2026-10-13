import { Button } from '@/components/Button'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { PublicHeader } from '@/components/PublicHeader'
import { pricing } from '@/copy/start'

// A stub, because the plan links here. Nothing implies a fixed price; no fee is hardcoded.
export default function Pricing() {
  return (
    <Page header={<PublicHeader />}>
      <div className="flex flex-col gap-6">
        <Eyebrow>{pricing.eyebrow}</Eyebrow>
        <Headline text={pricing.headline} />
        <p className="text-body-lg text-ink-muted">{pricing.body}</p>
        <div>
          <Button href="/" variant="secondary" back>
            {pricing.backCta}
          </Button>
        </div>
      </div>
    </Page>
  )
}
