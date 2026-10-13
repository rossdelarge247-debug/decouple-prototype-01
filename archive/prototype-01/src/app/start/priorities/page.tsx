import { Fieldset } from '@/components/Fieldset'
import { InterviewScreen } from '@/components/InterviewScreen'
import { OptionCard } from '@/components/OptionCard'
import { interview, o6 } from '@/copy/start'
import { EMPTY_ANSWERS, PRIORITIES, WORRIES } from '@/lib/start/answers'
import { readErrors, type SearchParams } from '@/lib/start/errors'
import { cookieStartStore } from '@/lib/start/store'

export default async function Priorities({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const answers = (await cookieStartStore().read()) ?? EMPTY_ANSWERS
  const errors = readErrors(await searchParams)
  return (
    <InterviewScreen step="o6" answers={answers} eyebrow={o6.eyebrow} headline={o6.headline} body={o6.body} why={o6.why} unlocks={o6.unlocks} errors={errors} cta={o6.cta}>
      <Fieldset id="priorities" legend={o6.priorities.legend} hint={interview.chooseUpToThree} error={errors.byField.priorities}>
        {PRIORITIES.map(key => (
          <OptionCard key={key} type="checkbox" name="priorities" value={key} title={o6.priorities.options[key]} defaultChecked={answers.priorities.includes(key)} compact />
        ))}
      </Fieldset>
      <Fieldset id="worries" legend={o6.worries.legend} hint={interview.chooseUpToThree} error={errors.byField.worries}>
        {WORRIES.map(key => (
          <OptionCard key={key} type="checkbox" name="worries" value={key} title={o6.worries.options[key]} defaultChecked={answers.worries.includes(key)} compact />
        ))}
      </Fieldset>
    </InterviewScreen>
  )
}
