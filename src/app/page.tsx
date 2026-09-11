import Link from 'next/link'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Icon } from '@/components/Icon'
import { Page } from '@/components/Page'
import { PublicHeader } from '@/components/PublicHeader'
import { fill } from '@/copy/rules'
import { landing } from '@/copy/start'
import { stepRoute } from '@/lib/start/answers'
import { conventionalCostPerPerson, formatGBP } from '@/lib/start/facts'

// One screen: the name, the promise, the honest cost, one button.
export default function Home() {
  return (
    <Page header={<PublicHeader />} width="xl">
      <div className="grid gap-10 md:grid-cols-[3fr_2fr] md:items-start">
        <div className="flex flex-col gap-6">
          <Eyebrow>{landing.eyebrow}</Eyebrow>
          <Headline text={landing.headline} accent={landing.headlineAccent} size="xl" />
          <p className="font-display text-display-sm italic text-ink-muted">{landing.promise}</p>
          <p className="max-w-xl text-body-lg text-ink-muted">{landing.body}</p>
          <div className="flex flex-col items-start gap-2">
            <Button href={stepRoute('o1')} arrow>
              {landing.cta}
            </Button>
            <p className="text-body text-ink-muted">{landing.meta}</p>
          </div>
          <ul className="flex flex-col gap-2 text-body text-ink-muted md:flex-row md:flex-wrap md:gap-x-6">
            {landing.trust.map(line => (
              <li key={line} className="flex items-center gap-2">
                <Icon name="check" className="size-4 text-success" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <Card tone="ink" className="flex flex-col gap-3">
          <p className="text-body-lg">{fill(landing.costConventional, { conventional: formatGBP(conventionalCostPerPerson.value) })}</p>
          <p className="font-display text-display-sm">{landing.costDecouple}</p>
          <Link href="/pricing" className="text-cream underline-offset-4">
            {landing.pricingLink}
          </Link>
        </Card>
      </div>
      <ul className="mt-14 grid gap-4 md:grid-cols-3">
        {landing.pillars.map(p => (
          <li key={p.title}>
            <Card className="h-full">
              <h2 className="text-display-sm">{p.title}</h2>
              <p className="mt-2 text-ink-muted">{p.body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </Page>
  )
}
