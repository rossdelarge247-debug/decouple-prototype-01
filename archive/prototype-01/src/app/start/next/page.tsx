import Link from 'next/link'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Icon } from '@/components/Icon'
import { InterviewHeader } from '@/components/InterviewHeader'
import { Page } from '@/components/Page'
import { o8 } from '@/copy/start'
import { EMPTY_ANSWERS, progress, stepNumber, stepRoute } from '@/lib/start/answers'
import { cookieStartStore } from '@/lib/start/store'

// O8: four exits. None closes the others.
const EXITS = [
  { key: 'account', href: '/sign-up' },
  { key: 'download', href: `${stepRoute('o7')}` },
  { key: 'conventional', href: '/start/conventional-route' },
  { key: 'talk', href: '/start/support' },
] as const

export default async function WhatsNext() {
  const answers = (await cookieStartStore().read()) ?? EMPTY_ANSWERS
  return (
    <Page header={<InterviewHeader step={stepNumber('o8')} progress={progress(answers)} />} width="lg">
      <div className="flex flex-col gap-6">
        <Eyebrow>{o8.eyebrow}</Eyebrow>
        <Headline text={o8.headline} />
        <p className="text-body-lg text-ink-muted">{o8.body}</p>
        <ul className="grid gap-4 md:grid-cols-2">
          {EXITS.map(e => (
            <li key={e.key}>
              <Link href={e.href} className="flex h-full items-center justify-between gap-4 rounded-card border border-border bg-surface p-card no-underline shadow-card motion-swap transition-colors hover:border-accent">
                <span>
                  <span className="block text-display-sm font-semibold">{o8.exits[e.key].title}</span>
                  <span className="block text-body text-ink-muted">{o8.exits[e.key].body}</span>
                </span>
                <Icon name="arrow" className="size-5 shrink-0 text-accent" />
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/pricing" className="font-medium">
          {o8.pricingLink}
        </Link>
      </div>
    </Page>
  )
}
