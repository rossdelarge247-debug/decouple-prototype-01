import { Button } from '@/components/Button'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { PublicHeader } from '@/components/PublicHeader'
import { ResourceList } from '@/components/Resources'
import { notForYou } from '@/copy/start'
import { stepRoute } from '@/lib/start/answers'
import { cohabitingResources } from '@/lib/start/facts'

// The honest exit for cohabiting couples: not a dead end.
export default function NotForYou() {
  return (
    <Page header={<PublicHeader />} width="lg">
      <div className="flex flex-col gap-6">
        <Eyebrow>{notForYou.eyebrow}</Eyebrow>
        <Headline text={notForYou.headline} />
        <p className="max-w-2xl text-body-lg text-ink-muted">{notForYou.body}</p>
        <ul className="grid gap-2">
          {notForYou.applies.map(a => (
            <li key={a} className="rounded-control border border-border bg-surface px-4 py-3">
              {a}
            </li>
          ))}
        </ul>
        <h2 className="text-display-sm">{notForYou.resourcesTitle}</h2>
        <ResourceList items={cohabitingResources} />
        <div>
          <Button href={stepRoute('o2')} variant="secondary" back>
            {notForYou.changeCta}
          </Button>
        </div>
      </div>
    </Page>
  )
}
