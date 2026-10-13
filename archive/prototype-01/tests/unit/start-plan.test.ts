import { describe, expect, it } from 'vitest'
import { computePlan } from '@/lib/start/plan'
import { EMPTY_ANSWERS } from '@/lib/start/answers'
import { checkCopy } from '@/copy/rules'
import * as facts from '@/lib/start/facts'
import { sarah } from './start-answers.test'

describe('the deterministic plan', () => {
  const plan = computePlan(sarah)

  it('has the seven elements', () => {
    expect(plan.situation).toContain('You are married, living together, with 2 children under 18, and you own your home with a mortgage.')
    expect(plan.steps.map(s => s.key)).toEqual([...facts.JOURNEY_STEP_KEYS])
    expect(plan.needs.length).toBeGreaterThan(2)
    expect(plan.conventional[0]).toContain('£14,561')
    expect(plan.helps).toHaveLength(3)
    expect(plan.links.some(l => l.href === '/pricing')).toBe(true)
  })

  it('anchors at most two notes on the children and the home', () => {
    expect(plan.notes.map(n => n.anchor)).toEqual(['children', 'home'])
    expect(computePlan({ ...sarah, children: 0, home: 'rent' }).notes.map(n => n.anchor)).toEqual(['home'])
    expect(computePlan({ ...sarah, children: 0, home: 'other' }).notes).toEqual([])
  })

  it('gates what needs to happen on the answers', () => {
    const rent = computePlan({ ...sarah, children: 0, home: 'rent', selfEmployed: 'me', awareness: 'hiding' })
    expect(rent.needs.join('\n')).toMatch(/tenancy/)
    expect(rent.needs.join('\n')).toMatch(/business accounts/)
    expect(rent.needs.join('\n')).toMatch(/credit check/)
    expect(rent.needs.join('\n')).not.toMatch(/arrangements for the children/)
    expect(plan.needs.join('\n')).not.toMatch(/credit check/)
  })

  it('renders safety and privacy messages first, deterministically', () => {
    expect(plan.safetyMessage).toBeNull()
    expect(plan.privacyMessage).toBeNull()
    const flagged = computePlan({ ...sarah, quality: 'safety', devicePrivate: false })
    expect(flagged.safetyMessage).toMatch(/Support comes first/)
    expect(flagged.privacyMessage).toMatch(/may not be private/)
  })

  it('shows no price and never the strict-locator phrases', () => {
    const text = JSON.stringify(plan)
    expect(text).not.toMatch(/£(149|299|99)\b/)
    expect(text).not.toMatch(/your plan|your next step/i)
    for (const s of [plan.situation, ...plan.needs, ...plan.conventional, ...plan.helps, ...plan.steps.flatMap(s => [s.fact, s.position]), ...plan.notes.flatMap(n => [n.title, n.body])]) {
      expect(checkCopy(s), s).toEqual([])
    }
  })

  it('renders for an empty interview too', () => {
    const empty = computePlan(EMPTY_ANSWERS)
    expect(empty.complete).toBe(false)
    expect(empty.steps).toHaveLength(6)
  })
})

describe('facts', () => {
  it('carries a source on every fact and clean copy on every resource', () => {
    for (const f of [facts.conventionalCostPerPerson, facts.conditionalOrderWeeks, facts.finalOrderWait, facts.courtAddress, facts.consentOrderFee]) {
      expect(f.source).toBeTruthy()
    }
    for (const r of [...facts.helplines, ...facts.conventionalResources, ...facts.cohabitingResources, ...facts.supportResources]) {
      expect(checkCopy(r.name), r.name).toEqual([])
      expect(checkCopy(r.note), r.note).toEqual([])
      expect(r.href).toMatch(/^https:\/\//)
    }
    expect(facts.helplines.map(h => h.name)).toEqual(["Women's Aid", 'National Domestic Abuse Helpline', "Men's Advice Line", 'Refuge', 'Surviving Economic Abuse', 'Samaritans'])
    expect(facts.formatGBP(14561)).toBe('£14,561')
  })
})
