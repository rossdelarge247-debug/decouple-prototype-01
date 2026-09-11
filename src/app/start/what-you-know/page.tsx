import { Fieldset } from '@/components/Fieldset'
import { InterviewScreen } from '@/components/InterviewScreen'
import { OptionCard } from '@/components/OptionCard'
import { o5 } from '@/copy/start'
import { AWARENESS, EMPTY_ANSWERS } from '@/lib/start/answers'
import { readErrors, type SearchParams } from '@/lib/start/errors'
import { cookieStartStore } from '@/lib/start/store'

export default async function WhatYouKnow({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const answers = (await cookieStartStore().read()) ?? EMPTY_ANSWERS
  const errors = readErrors(await searchParams)
  return (
    <InterviewScreen step="o5" answers={answers} eyebrow={o5.eyebrow} headline={o5.headline} body={o5.body} why={o5.why} unlocks={o5.unlocks} errors={errors}>
      <Fieldset id="awareness" legend={o5.legend} error={errors.byField.awareness} visuallyHideLegend>
        {AWARENESS.map(key => (
          <OptionCard key={key} type="radio" name="awareness" value={key} title={o5.options[key].title} body={o5.options[key].body || undefined} defaultChecked={answers.awareness === key} />
        ))}
      </Fieldset>
    </InterviewScreen>
  )
}
