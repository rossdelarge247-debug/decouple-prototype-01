// The versioned facts module. Every number, date, address and resource the plan and
// the landing page show comes from here, each with its source. The model never
// invents one; it only receives what this file says.
export const FACTS_VERSION = '2026-09-11'

export interface Fact<T> {
  value: T
  source: string
}

const BRIEF = 'docs/BRIEF.md, verified process facts, 11 September 2026'

export const conventionalCostPerPerson: Fact<number> = { value: 14561, source: BRIEF }
export const conditionalOrderWeeks: Fact<number> = { value: 20, source: BRIEF }
export const finalOrderWait: Fact<string> = { value: '6 weeks and 1 day', source: BRIEF }
export const minimumWeeks: Fact<number> = { value: 26, source: `${BRIEF} (20 weeks plus 6 weeks and 1 day)` }
export const courtAddress: Fact<string> = {
  value: 'HMCTS Financial Remedy Service, PO Box 12746, Harlow, CM20 9QZ',
  source: BRIEF,
}
export const consentOrderFee: Fact<{ amount: number; from: string }> = {
  value: { amount: 62, from: '13 July 2026' },
  source: `${BRIEF}; EX50 is read live at pack time`,
}
export const cetvLeadTime: Fact<string> = { value: '6 to 12 weeks', source: 'docs/JOURNEY.md §Gap engine' }

export const JOURNEY_STEP_KEYS = ['filing', 'building', 'reconciling', 'settling', 'court', 'implementation'] as const
export type JourneyStepKey = (typeof JOURNEY_STEP_KEYS)[number]

export interface Resource {
  name: string
  href: string
  note: string
}

export interface Helpline extends Resource {
  number: string | null
  hours: string
}

// Numbers checked against the organisations' own sites on 11 September 2026.
export const helplines: readonly Helpline[] = [
  { name: "Women's Aid", href: 'https://www.womensaid.org.uk/information-support/', number: null, note: 'Live chat, the Survivor’s Handbook and local services.', hours: 'Live chat, every day' },
  { name: 'National Domestic Abuse Helpline', href: 'https://www.nationaldahelpline.org.uk/', number: '0808 2000 247', note: 'Free and confidential, run by Refuge.', hours: '24 hours a day' },
  { name: "Men's Advice Line", href: 'https://mensadviceline.org.uk/', number: '0808 801 0327', note: 'For men experiencing domestic abuse, run by Respect.', hours: 'Weekdays' },
  { name: 'Refuge', href: 'https://refuge.org.uk/i-need-help-now/', number: '0808 2000 247', note: 'Refuges, outreach and the National Domestic Abuse Helpline.', hours: '24 hours a day' },
  { name: 'Surviving Economic Abuse', href: 'https://survivingeconomicabuse.org/i-need-help/', number: '0808 196 8845', note: 'The Financial Support Line, with Money Advice Plus, for money and coerced debt.', hours: 'Monday to Friday, 9am to 4pm' },
  { name: 'Samaritans', href: 'https://www.samaritans.org/', number: '116 123', note: 'Whatever you are going through, someone to listen.', hours: '24 hours a day' },
]

export const EMERGENCY_NUMBER = '999'

export const conventionalResources: readonly Resource[] = [
  { name: 'GOV.UK: apply for a divorce', href: 'https://www.gov.uk/divorce', note: 'The application itself, online, no-fault.' },
  { name: 'GOV.UK: money and property when a relationship ends', href: 'https://www.gov.uk/money-property-when-relationship-ends', note: 'Consent orders, financial orders and what the court can do.' },
  { name: 'Family Mediation Council', href: 'https://www.familymediationcouncil.org.uk/', note: 'Find an accredited mediator; the MIAM (a first mediation meeting) starts here.' },
  { name: 'Resolution', href: 'https://resolution.org.uk/', note: 'Family law professionals who commit to a constructive approach.' },
  { name: 'Citizens Advice: ending a relationship', href: 'https://www.citizensadvice.org.uk/family/', note: 'Free, plain-English guidance on every step.' },
]

export const cohabitingResources: readonly Resource[] = [
  { name: 'Citizens Advice: living together and marriage, the legal differences', href: 'https://www.citizensadvice.org.uk/family/living-together-marriage-and-civil-partnership/living-together-and-marriage-legal-differences/', note: 'What changes when you were never married.' },
  { name: 'Advicenow: living together', href: 'https://www.advicenow.org.uk/', note: 'Guides on property, children and money for cohabiting couples.' },
  { name: 'GOV.UK: looking after children if you separate', href: 'https://www.gov.uk/looking-after-children-divorce', note: 'Child arrangements work the same way whether or not you were married.' },
]

export const supportResources: readonly Resource[] = [
  { name: 'Citizens Advice', href: 'https://www.citizensadvice.org.uk/family/', note: 'Free guidance on separation, money and housing.' },
  { name: 'Relate', href: 'https://www.relate.org.uk/', note: 'Counselling for couples, families and people on their own.' },
  { name: 'Gingerbread', href: 'https://www.gingerbread.org.uk/', note: 'Support for single-parent families.' },
]

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}
