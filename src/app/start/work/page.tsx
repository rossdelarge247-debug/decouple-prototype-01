import { Fieldset } from '@/components/Fieldset'
import { InterviewScreen } from '@/components/InterviewScreen'
import { OptionCard } from '@/components/OptionCard'
import { o4 } from '@/copy/start'
import { EMPTY_ANSWERS, SELF_EMPLOYED } from '@/lib/start/answers'
import { readErrors, type SearchParams } from '@/lib/start/errors'
import { cookieStartStore } from '@/lib/start/store'

export default async function Work({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const answers = (await cookieStartStore().read()) ?? EMPTY_ANSWERS
  const errors = readErrors(await searchParams)
  return (
    <InterviewScreen step="o4" answers={answers} eyebrow={o4.eyebrow} headline={o4.headline} body={o4.body} why={o4.why} unlocks={o4.unlocks} errors={errors}>
      <Fieldset id="selfEmployed" legend={o4.legend} error={errors.byField.selfEmployed} visuallyHideLegend>
        {SELF_EMPLOYED.map(key => (
          <OptionCard key={key} type="radio" name="selfEmployed" value={key} title={o4.options[key].title} body={o4.options[key].body || undefined} defaultChecked={answers.selfEmployed === key} />
        ))}
      </Fieldset>
    </InterviewScreen>
  )
}
