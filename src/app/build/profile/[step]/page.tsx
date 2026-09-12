import { notFound, redirect } from 'next/navigation'
import { BuildScreen, SelectField } from '@/components/BuildScreen'
import { Field } from '@/components/Field'
import { Fieldset } from '@/components/Fieldset'
import { OptionCard } from '@/components/OptionCard'
import { Term } from '@/components/Term'
import { profile as copy } from '@/copy/build'
import { fill } from '@/copy/rules'
import { readBuildErrors } from '@/lib/build/errors'
import { CHANNELS, EMPTY_PROFILE, isProfileStep, nextProfileRoute, OTHER_ASSETS, PAY_METHODS, PENSION_KINDS, PENSIONS, previousProfileRoute, STRUCTURES, stepApplies, stepPosition, VEHICLES, type ProfileAnswers } from '@/lib/build/profile'
import { cookieBuildStore } from '@/lib/build/store'
import { requireSession } from '@/lib/session'
import type { StartAnswers } from '@/lib/start/answers'
import type { SearchParams } from '@/lib/start/errors'
import { answerProfile } from '../../actions'

interface Props {
  params: Promise<{ step: string }>
  searchParams: Promise<SearchParams>
}

// The seven profile screens, P1 to P7, one topic each, gated by the interview.
export default async function ProfileStep({ params, searchParams }: Props) {
  const { step } = await params
  if (!isProfileStep(step)) notFound()
  const session = await requireSession()
  if (!stepApplies(step, session.start)) redirect(nextProfileRoute(step, session.start))
  const answers = (await cookieBuildStore().readProfile()) ?? EMPTY_PROFILE
  const errors = readBuildErrors(await searchParams)
  const shell = {
    name: session.name,
    position: stepPosition(step, session.start),
    errors,
    action: answerProfile.bind(null, step),
    backHref: previousProfileRoute(step, session.start),
  }
  const start = session.start

  switch (step) {
    case 'home':
      return start?.home === 'mortgage' ? (
        <BuildScreen {...shell} headline={copy.home.headline} body={copy.home.mortgage.body} why={copy.home.mortgage.why} unlocks={copy.home.mortgage.unlocks}>
          <SelectField id="lender" name="lender" label={copy.home.mortgage.legend} hint={copy.home.mortgage.hint} error={errors.byField.lender} options={[...copy.home.lenders, copy.home.otherLender]} placeholder={copy.home.mortgage.legend} />
        </BuildScreen>
      ) : (
        <BuildScreen {...shell} headline={copy.home.headline} body={copy.home.rent.body} why={copy.home.rent.why} unlocks={copy.home.rent.unlocks}>
          <Fieldset id="rentTo" legend={copy.home.rent.legend} error={errors.byField.rentTo}>
            {(['landlord', 'agent'] as const).map(v => (
              <OptionCard key={v} type="radio" name="rentTo" value={v} title={copy.home.rent.options[v]} defaultChecked={answers.rentTo === v} compact />
            ))}
          </Fieldset>
          <Field id="rentAmount" name="rentAmount" label={copy.home.rent.amount} type="number" inputMode="numeric" prefix="£" min={1} error={errors.byField.rentAmount} defaultValue={answers.rentAmount?.toString()} />
          <Field id="rentDay" name="rentDay" label={copy.home.rent.day} type="number" inputMode="numeric" min={1} max={31} error={errors.byField.rentDay} defaultValue={answers.rentDay?.toString()} />
        </BuildScreen>
      )

    case 'work':
      return (
        <BuildScreen {...shell} headline={copy.work.headline} body={copy.work.body} why={copy.work.why} unlocks={copy.work.unlocks}>
          <Field id="businessName" name="businessName" label={copy.work.name} defaultValue={answers.businessName ?? undefined} />
          <Fieldset id="businessStructure" legend={copy.work.structure.legend} error={errors.byField.businessStructure}>
            {STRUCTURES.map(v => (
              <OptionCard key={v} type="radio" name="businessStructure" value={v} title={copy.work.structure.options[v]} defaultChecked={answers.businessStructure === v} compact />
            ))}
          </Fieldset>
          <Fieldset id="payMethod" legend={copy.work.pay.legend} error={errors.byField.payMethod}>
            {PAY_METHODS.map(v => (
              <OptionCard key={v} type="radio" name="payMethod" value={v} title={copy.work.pay.options[v]} defaultChecked={answers.payMethod === v} compact />
            ))}
          </Fieldset>
          <Fieldset id="incomeChannels" legend={copy.work.channels.legend} hint={copy.work.channels.hint}>
            {CHANNELS.map(v => (
              <OptionCard key={v} type="checkbox" name="incomeChannels" value={v} title={copy.work.channels.options[v]} defaultChecked={answers.incomeChannels.includes(v)} compact />
            ))}
          </Fieldset>
        </BuildScreen>
      )

    case 'vehicles':
      return (
        <BuildScreen {...shell} headline={copy.vehicles.headline} body={copy.vehicles.body} why={copy.vehicles.why} unlocks={copy.vehicles.unlocks}>
          <Fieldset id="vehicles" legend={copy.vehicles.count.legend} error={errors.byField.vehicles}>
            {VEHICLES.map(v => (
              <OptionCard key={v} type="radio" name="vehicles" value={v} title={copy.vehicles.count.options[v]} defaultChecked={answers.vehicles === v} compact />
            ))}
          </Fieldset>
          <div className="disclose disclose-vehicle">
            <Fieldset id="vehicleFinance" legend={copy.vehicles.finance.legend} error={errors.byField.vehicleFinance}>
              <OptionCard type="radio" name="vehicleFinance" value="yes" title={copy.vehicles.finance.options.yes} defaultChecked={answers.vehicleFinance === true} compact />
              <OptionCard type="radio" name="vehicleFinance" value="no" title={copy.vehicles.finance.options.no} defaultChecked={answers.vehicleFinance === false} compact />
            </Fieldset>
          </div>
          <div className="disclose disclose-finance">
            <SelectField id="financeProvider" name="financeProvider" label={copy.vehicles.provider.legend} options={[...copy.vehicles.providers, copy.vehicles.otherProvider]} placeholder={copy.vehicles.provider.legend} />
          </div>
        </BuildScreen>
      )

    case 'pensions':
      return (
        <BuildScreen {...shell} headline={copy.pensions.headline} body={copy.pensions.body} why={copy.pensions.why} unlocks={copy.pensions.unlocks}>
          <Fieldset id="pensions" legend={copy.pensions.have.legend} error={errors.byField.pensions}>
            {PENSIONS.map(v => (
              <OptionCard key={v} type="radio" name="pensions" value={v} title={copy.pensions.have.options[v]} defaultChecked={answers.pensions === v} compact />
            ))}
          </Fieldset>
          <div className="disclose disclose-pension flex flex-col gap-8">
            <Field id="pensionProvider" name="pensionProvider" label={copy.pensions.provider.label} hint={copy.pensions.provider.hint} defaultValue={answers.pensionProvider ?? undefined} />
            <Fieldset id="pensionKind" legend={copy.pensions.kind.legend} error={errors.byField.pensionKind}>
              {PENSION_KINDS.map(v => (
                <OptionCard key={v} type="radio" name="pensionKind" value={v} title={copy.pensions.kind.options[v].title} body={copy.pensions.kind.options[v].body || undefined} defaultChecked={answers.pensionKind === v} compact />
              ))}
            </Fieldset>
            <CetvNudge />
          </div>
        </BuildScreen>
      )

    case 'children':
      return <ChildrenStep shell={shell} answers={answers} start={start} />

    case 'other-assets':
      return (
        <BuildScreen {...shell} headline={copy.otherAssets.headline} body={copy.otherAssets.body} why={copy.otherAssets.why} unlocks={copy.otherAssets.unlocks}>
          <Fieldset id="otherAssets" legend={copy.otherAssets.legend} error={errors.byField.otherAssets}>
            {OTHER_ASSETS.map(v => (
              <OptionCard key={v} type="checkbox" name="otherAssets" value={v} title={copy.otherAssets.options[v]} defaultChecked={answers.otherAssets.includes(v)} compact />
            ))}
          </Fieldset>
        </BuildScreen>
      )

    case 'accounts':
      return (
        <BuildScreen {...shell} headline={copy.accounts.headline} body={copy.accounts.body} why={copy.accounts.why} unlocks={copy.accounts.unlocks} cta={copy.accounts.cta}>
          <ul className="divide-y divide-border rounded-card border border-border bg-surface">
            {copy.accounts.items.map(item => (
              <li key={item.title} className="px-card py-3">
                <span className="block font-medium text-ink">{item.title}</span>
                <span className="block text-body text-ink-muted">{item.body}</span>
              </li>
            ))}
          </ul>
        </BuildScreen>
      )
  }
}

function CetvNudge() {
  return (
    <div className="rounded-card border border-border bg-accent-tint p-card">
      <p className="font-display text-display-sm">{copy.pensions.cetv.title}</p>
      <p className="mt-2 text-ink">
        {copy.pensions.cetv.body.split(copy.pensions.cetv.term)[0]}
        <Term term={copy.pensions.cetv.term}>{copy.pensions.cetv.termBody}</Term>
        {copy.pensions.cetv.body.split(copy.pensions.cetv.term)[1]}
      </p>
    </div>
  )
}

function ChildrenStep({ shell, answers, start }: { shell: Omit<Parameters<typeof BuildScreen>[0], 'headline' | 'body' | 'why' | 'unlocks' | 'children'>; answers: ProfileAnswers; start: StartAnswers | null }) {
  const n = start?.children === 4 ? '4 or more' : String(start?.children ?? '')
  const errors = shell.errors
  return (
    <BuildScreen {...shell} headline={copy.children.headline} body={copy.children.body} why={copy.children.why} unlocks={copy.children.unlocks}>
      <Fieldset id="children" legend={fill(copy.children.legend, { n })} error={errors.byField.children}>
        <OptionCard type="radio" name="children" value="yes" title={fill(copy.children.options.yes, { n })} defaultChecked={answers.children !== null && answers.children === start?.children} compact />
        <OptionCard type="radio" name="children" value="no" title={copy.children.options.no} defaultChecked={answers.children !== null && answers.children !== start?.children} compact />
      </Fieldset>
      <div className="disclose disclose-children">
        <Fieldset id="childrenCount" legend={copy.children.count.legend} error={errors.byField.childrenCount}>
          {(['1', '2', '3', '4+'] as const).map(v => (
            <OptionCard key={v} type="radio" name="childrenCount" value={v} title={copy.children.count.options[v]} compact />
          ))}
        </Fieldset>
      </div>
    </BuildScreen>
  )
}
