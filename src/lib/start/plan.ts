import { plan as copy } from '@/copy/start'
import { fill } from '@/copy/rules'
import type { StartAnswers } from './answers'
import { deriveFlags, isComplete, type Flags } from './answers'
import * as facts from './facts'

// Facts are deterministic, prose is generative (JOURNEY, LOCKED). This module is the
// deterministic half and the fallback: everything it produces renders with no model
// at all, and nothing here is advice.
export interface PlanStep {
  key: facts.JourneyStepKey
  title: string
  fact: string
  position: string
}

export interface PlanNote {
  anchor: 'children' | 'home' | 'general'
  title: string
  body: string
}

export interface PlanLink {
  label: string
  href: string
}

export interface DeterministicPlan {
  factsVersion: string
  complete: boolean
  situation: string
  steps: PlanStep[]
  needs: string[]
  conventional: string[]
  helps: string[]
  notes: PlanNote[]
  links: PlanLink[]
  safetyMessage: string | null
  privacyMessage: string | null
  flags: Flags
}

const t = copy.templates

function childrenPhrase(n: number | null): string {
  if (!n) return t.childrenNone
  if (n === 1) return t.childrenOne
  return fill(t.childrenMany, { n: n === 4 ? '4 or more' : n })
}

export function situationSentence(a: StartAnswers): string {
  const stage = a.stage ? t.stage[a.stage] : ''
  const relationship = a.relationship === 'civil' ? t.relationship.civil : t.relationship.married
  const living = a.living ? t.living[a.living] : t.living.complicated
  const home = a.home ? t.home[a.home] : t.home.other
  const facts = fill(t.situation, { relationship, living, children: childrenPhrase(a.children), home })
  return [stage, facts].filter(Boolean).join(' ')
}

export function journeySteps(): PlanStep[] {
  const values = {
    conditionalWeeks: facts.conditionalOrderWeeks.value,
    fee: facts.formatGBP(facts.consentOrderFee.value.amount),
    finalWait: facts.finalOrderWait.value,
  }
  return facts.JOURNEY_STEP_KEYS.map(key => ({
    key,
    title: t.steps[key].title,
    fact: fill(t.stepFacts[key], values),
    position: t.steps[key].position,
  }))
}

export function whatNeedsToHappen(a: StartAnswers): string[] {
  const out = [t.needs.facts, t.needs.picture]
  if (a.children) out.push(t.needs.children)
  if (a.home === 'mortgage') out.push(t.needs.mortgage)
  if (a.home === 'outright') out.push(t.needs.outright)
  if (a.home === 'rent') out.push(t.needs.rent)
  if (a.selfEmployed && a.selfEmployed !== 'no') out.push(t.needs.business)
  out.push(t.needs.pension)
  if (a.awareness === 'hiding') out.push(t.needs.creditCheck)
  return out
}

export function conventionalPath(): string[] {
  return [
    fill(t.conventional.cost, { conventional: facts.formatGBP(facts.conventionalCostPerPerson.value) }),
    fill(t.conventional.timeline, {
      minimumWeeks: facts.minimumWeeks.value,
      conditionalWeeks: facts.conditionalOrderWeeks.value,
      finalWait: facts.finalOrderWait.value,
    }),
    fill(t.conventional.court, {
      courtAddress: facts.courtAddress.value,
      fee: `${facts.formatGBP(facts.consentOrderFee.value.amount)} from ${facts.consentOrderFee.value.from}`,
    }),
  ]
}

/** At most two notes, anchored on the children and the home, only when they apply. */
export function personalNotes(a: StartAnswers): PlanNote[] {
  const out: PlanNote[] = []
  if (a.children) out.push({ anchor: 'children', ...t.notes.children })
  if (a.home === 'mortgage') out.push({ anchor: 'home', ...t.notes.homeMortgage })
  else if (a.home === 'outright') out.push({ anchor: 'home', ...t.notes.homeOutright })
  else if (a.home === 'rent') out.push({ anchor: 'home', ...t.notes.homeRent })
  return out.slice(0, 2)
}

export function computePlan(a: StartAnswers): DeterministicPlan {
  const flags = deriveFlags(a)
  return {
    factsVersion: facts.FACTS_VERSION,
    complete: isComplete(a),
    situation: situationSentence(a),
    steps: journeySteps(),
    needs: whatNeedsToHappen(a),
    conventional: conventionalPath(),
    helps: [...t.helps],
    notes: personalNotes(a),
    links: [
      { label: copy.pricingLink, href: '/pricing' },
      ...facts.conventionalResources.slice(0, 2).map(r => ({ label: r.name, href: r.href })),
    ],
    safetyMessage: flags.safety ? t.safety : null,
    privacyMessage: flags.devicePrivate ? null : t.privacy,
    flags,
  }
}
