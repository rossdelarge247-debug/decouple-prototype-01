import { Fieldset } from '@/components/Fieldset'
import { InterviewScreen } from '@/components/InterviewScreen'
import { OptionCard } from '@/components/OptionCard'
import { o2 } from '@/copy/start'
import { EMPTY_ANSWERS, HOMES, LIVINGS, RELATIONSHIPS } from '@/lib/start/answers'
import { readErrors, type SearchParams } from '@/lib/start/errors'
import { cookieStartStore } from '@/lib/start/store'

const COUNTS = ['1', '2', '3', '4+'] as const

export default async function Situation({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const answers = (await cookieStartStore().read()) ?? EMPTY_ANSWERS
  const errors = readErrors(await searchParams)
  const hasChildren = answers.children !== null && answers.children > 0
  return (
    <InterviewScreen step="o2" answers={answers} eyebrow={o2.eyebrow} headline={o2.headline} body={o2.body} why={o2.why} unlocks={o2.unlocks} errors={errors}>
      <Fieldset id="relationship" legend={o2.relationship.legend} error={errors.byField.relationship}>
        {RELATIONSHIPS.map(key => (
          <OptionCard key={key} type="radio" name="relationship" value={key} title={o2.relationship.options[key]} defaultChecked={answers.relationship === key} compact />
        ))}
      </Fieldset>
      <Fieldset id="living" legend={o2.living.legend} error={errors.byField.living}>
        {LIVINGS.map(key => (
          <OptionCard key={key} type="radio" name="living" value={key} title={o2.living.options[key]} defaultChecked={answers.living === key} compact />
        ))}
      </Fieldset>
      <div className="reveal-wrap flex flex-col gap-8">
        <Fieldset id="children" legend={o2.children.legend} error={errors.byField.children}>
          <OptionCard type="radio" name="children" value="no" title={o2.children.options.no} defaultChecked={answers.children === 0} compact />
          <OptionCard type="radio" name="children" value="yes" title={o2.children.options.yes} defaultChecked={hasChildren} compact />
        </Fieldset>
        <div className="reveal-on-yes">
          <Fieldset id="childrenCount" legend={o2.childrenCount.legend} error={errors.byField.childrenCount}>
            {COUNTS.map(key => (
              <OptionCard key={key} type="radio" name="childrenCount" value={key} title={o2.childrenCount.options[key]} defaultChecked={hasChildren && (key === '4+' ? answers.children === 4 : String(answers.children) === key)} compact />
            ))}
          </Fieldset>
        </div>
      </div>
      <Fieldset id="home" legend={o2.home.legend} error={errors.byField.home}>
        {HOMES.map(key => (
          <OptionCard key={key} type="radio" name="home" value={key} title={o2.home.options[key]} defaultChecked={answers.home === key} compact />
        ))}
      </Fieldset>
    </InterviewScreen>
  )
}
