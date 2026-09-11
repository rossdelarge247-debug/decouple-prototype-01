import { Fieldset } from '@/components/Fieldset'
import { InterviewScreen } from '@/components/InterviewScreen'
import { OptionCard } from '@/components/OptionCard'
import { o1 } from '@/copy/start'
import { EMPTY_ANSWERS, STAGES } from '@/lib/start/answers'
import { readErrors, type SearchParams } from '@/lib/start/errors'
import { cookieStartStore } from '@/lib/start/store'

export default async function WhereYouAre({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const answers = (await cookieStartStore().read()) ?? EMPTY_ANSWERS
  const errors = readErrors(await searchParams)
  return (
    <InterviewScreen step="o1" answers={answers} eyebrow={o1.eyebrow} headline={o1.headline} body={o1.body} why={o1.why} unlocks={o1.unlocks} errors={errors}>
      <Fieldset id="stage" legend={o1.legend} error={errors.byField.stage} visuallyHideLegend>
        {STAGES.map(key => (
          <OptionCard key={key} type="radio" name="stage" value={key} title={o1.options[key].title} body={o1.options[key].body} defaultChecked={answers.stage === key} />
        ))}
      </Fieldset>
    </InterviewScreen>
  )
}
