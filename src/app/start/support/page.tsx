import { Button } from '@/components/Button'
import { Eyebrow } from '@/components/Eyebrow'
import { Headline } from '@/components/Headline'
import { Page } from '@/components/Page'
import { PublicHeader } from '@/components/PublicHeader'
import { HelplineList, ResourceList } from '@/components/Resources'
import { support } from '@/copy/start'
import { stepRoute } from '@/lib/start/answers'
import { helplines, supportResources } from '@/lib/start/facts'

export default function Support() {
  return (
    <Page header={<PublicHeader />} width="lg">
      <div className="flex flex-col gap-6">
        <Eyebrow>{support.eyebrow}</Eyebrow>
        <Headline text={support.headline} />
        <p className="max-w-2xl text-body-lg text-ink-muted">{support.body}</p>
        <p className="rounded-card border border-danger bg-danger-tint p-4 font-medium text-ink">{support.emergency}</p>
        <HelplineList items={helplines} />
        <ResourceList items={supportResources} />
        <div>
          <Button href={stepRoute('o8')} variant="secondary" back>
            {support.backCta}
          </Button>
        </div>
      </div>
    </Page>
  )
}
