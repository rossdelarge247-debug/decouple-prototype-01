import { Fieldset } from '@/components/Fieldset'
import { Icon } from '@/components/Icon'
import { InterviewScreen } from '@/components/InterviewScreen'
import { OptionCard } from '@/components/OptionCard'
import { o3 } from '@/copy/start'
import { EMPTY_ANSWERS, QUALITIES } from '@/lib/start/answers'
import { readErrors, type SearchParams } from '@/lib/start/errors'
import { cookieStartStore } from '@/lib/start/store'

export default async function BetweenYou({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const answers = (await cookieStartStore().read()) ?? EMPTY_ANSWERS
  const errors = readErrors(await searchParams)
  return (
    <InterviewScreen step="o3" answers={answers} eyebrow={o3.eyebrow} headline={o3.headline} body={o3.body} why={o3.why} unlocks={o3.unlocks} errors={errors}>
      <Fieldset id="quality" legend={o3.legend} error={errors.byField.quality} visuallyHideLegend>
        {QUALITIES.map(key => (
          <OptionCard key={key} type="radio" name="quality" value={key} title={o3.options[key].title} body={o3.options[key].body || undefined} defaultChecked={answers.quality === key} />
        ))}
      </Fieldset>
      <Fieldset id="device" legend={o3.device.legend} hint={o3.device.hint} error={errors.byField.device}>
        <OptionCard type="radio" name="device" value="yes" title={o3.device.options.yes} defaultChecked={answers.devicePrivate === true} compact />
        <OptionCard type="radio" name="device" value="notSure" title={o3.device.options.notSure} defaultChecked={answers.devicePrivate === false} compact />
      </Fieldset>
      <div className="flex gap-3 rounded-card border border-border bg-success-tint p-4 text-body text-ink">
        <Icon name="shield" className="mt-0.5 size-5 shrink-0 text-success" />
        <p>
          <strong>{o3.notAlone.title}</strong> {o3.notAlone.body}
        </p>
      </div>
    </InterviewScreen>
  )
}
