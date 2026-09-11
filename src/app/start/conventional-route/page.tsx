import { Button } from '@/components/Button'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { PublicHeader } from '@/components/PublicHeader'
import { ResourceList } from '@/components/Resources'
import { conventional } from '@/copy/start'
import { stepRoute } from '@/lib/start/answers'
import { conventionalResources } from '@/lib/start/facts'

export default function ConventionalRoute() {
  return (
    <Page header={<PublicHeader />} width="lg">
      <div className="flex flex-col gap-6">
        <Eyebrow>{conventional.eyebrow}</Eyebrow>
        <Headline text={conventional.headline} />
        <p className="max-w-2xl text-body-lg text-ink-muted">{conventional.body}</p>
        <ResourceList items={conventionalResources} />
        <div>
          <Button href={stepRoute('o8')} variant="secondary" back>
            {conventional.backCta}
          </Button>
        </div>
      </div>
    </Page>
  )
}
