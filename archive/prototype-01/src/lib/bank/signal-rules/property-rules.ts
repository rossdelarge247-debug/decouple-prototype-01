// Property signal rules (Form E 2.1-2.2, 3.1)

import type { SignalRule, DetectedSignal } from './types'

const mortgageDetected: SignalRule = {
  id: 'property.mortgage-detected',
  name: 'Mortgage payment',
  section: 'property',
  tier: 'must_nail',
  formEField: '2.1 + 3.1',
  description: 'Payment to known mortgage lender, £200-5000/month, recurring ≥3 months.',
  detect: (input) => {
    const mortgage = input.payments.find(p => p.likely_category === 'mortgage')
    if (!mortgage) return null

    return {
      id: `property.mortgage.${mortgage.payee.slice(0, 15).replace(/\s/g, '-').toLowerCase()}`,
      ruleId: 'property.mortgage-detected',
      name: 'Mortgage payment detected',
      section: 'property',
      formEField: '2.1 + 3.1',
      confidence: mortgage.confidence,
      determination: `Mortgage: £${mortgage.amount}/month to ${mortgage.payee}`,
      reasoning: [
        `Payment to ${mortgage.payee}: £${mortgage.amount}/month`,
        `Frequency: ${mortgage.frequency}`,
        `Confidence: ${Math.round(mortgage.confidence * 100)}%`,
        'User will confirm: sole/joint ownership, estimated property value',
      ],
      evidence: [{
        label: `${mortgage.payee}: £${mortgage.amount}/month (${mortgage.frequency})`,
        metrics: [{ name: 'Confidence', value: `${Math.round(mortgage.confidence * 100)}%` }],
      }],
      crossSectionImpacts: [
        'Mortgage statement needed (balance, rate, terms)',
        'Property valuation needed (3 agents or RICS)',
      ],
    }
  },
}

const councilTaxDetected: SignalRule = {
  id: 'property.council-tax',
  name: 'Council tax',
  section: 'property',
  tier: 'must_nail',
  formEField: '3.1',
  description: 'Payment to local authority for council tax. Infers property location.',
  detect: (input) => {
    const ct = input.payments.find(p => p.likely_category === 'council_tax')
    if (!ct) return null

    return {
      id: `property.council-tax.${ct.payee.slice(0, 15).replace(/\s/g, '-').toLowerCase()}`,
      ruleId: 'property.council-tax',
      name: 'Council tax detected',
      section: 'property',
      formEField: '3.1',
      confidence: ct.confidence,
      determination: `Council tax: £${ct.amount}/month to ${ct.payee}`,
      reasoning: [
        `Payment to ${ct.payee}: £${ct.amount}/month`,
        'Auto-confirmed — bank data is sufficient',
        'Infers approximate property location from council name',
      ],
      evidence: [{
        label: `${ct.payee}: £${ct.amount}/month`,
      }],
      crossSectionImpacts: ['Property location inferred from council name'],
    }
  },
}

const rentDetected: SignalRule = {
  id: 'property.rent-detected',
  name: 'Rent payment',
  section: 'property',
  tier: 'good_enough',
  formEField: '2.1',
  description: 'Rent via keyword match OR pattern: unknown payment, monthly, consistent amount £400-4000. Catches rent to landlords/agents without keyword match.',
  detect: (input) => {
    // Path 1: Already classified as rent by keyword engine
    const rentPayments = input.payments.filter(p => p.likely_category === 'rent')
    if (rentPayments.length > 0) {
      const r = rentPayments[0]
      return {
        id: `property.rent.${r.payee.slice(0, 15).replace(/\s/g, '-').toLowerCase()}`,
        ruleId: 'property.rent-detected',
        name: 'Rent payment detected',
        section: 'property',
        formEField: '2.1',
        confidence: r.confidence,
        determination: `Rent: £${r.amount}/month to ${r.payee}`,
        reasoning: [
          `Payment to ${r.payee}: £${r.amount}/month`,
          `Frequency: ${r.frequency}`,
          'Matched known letting agent/landlord keyword',
          'User will confirm: is this your rent?',
        ],
        evidence: [{
          label: `${r.payee}: £${r.amount}/month (${r.frequency})`,
          metrics: [{ name: 'Confidence', value: `${Math.round(r.confidence * 100)}%` }],
        }],
        crossSectionImpacts: [
          'Tenancy agreement needed (rent, deposit, term)',
          'Confirms renting — no property equity section needed',
        ],
      }
    }

    // Path 2: Pattern-based detection — unknown payments with rent-like pattern
    // Standing order + consistent amount + £400-4000 range + monthly
    const hasMortgage = input.payments.some(p => p.likely_category === 'mortgage')
    if (hasMortgage) return null // Already paying a mortgage — unlikely to also be renting

    const candidates = input.payments.filter(p =>
      p.likely_category === 'unknown' &&
      p.amount >= 400 && p.amount <= 4000 &&
      p.frequency === 'monthly'
    )
    if (candidates.length === 0) return null

    // Find the most likely rent candidate: highest amount in the range (rent is usually the biggest regular outgoing after mortgage)
    const best = candidates.reduce((a, b) => a.amount > b.amount ? a : b)

    // Check for amount consistency in raw transactions
    const matchingTxns = input.transactions.filter(t =>
      t.amount < 0 &&
      Math.abs(Math.abs(t.amount) - best.amount) < 1 // Exact match (rent doesn't vary)
    )
    const isConsistent = matchingTxns.length >= 3 &&
      matchingTxns.every(t => Math.abs(Math.abs(t.amount) - best.amount) < 1)

    // Confidence: consistent amount + right range + monthly = likely rent
    const confidence = (isConsistent ? 0.35 : 0.15) +
      (matchingTxns.length >= 6 ? 0.2 : matchingTxns.length >= 3 ? 0.1 : 0) +
      (best.amount >= 600 && best.amount <= 3000 ? 0.15 : 0.05) // Most UK rents are £600-3000
      + 0.15 // Base: monthly + right range is meaningful

    return {
      id: `property.rent-pattern.${best.payee.slice(0, 15).replace(/\s/g, '-').toLowerCase()}`,
      ruleId: 'property.rent-detected',
      name: 'Probable rent payment detected',
      section: 'property',
      formEField: '2.1',
      confidence: Math.min(0.85, confidence), // Cap — pattern-only can't be "high confidence"
      determination: `Possible rent: £${best.amount}/month to ${best.payee}`,
      reasoning: [
        `Payment to ${best.payee}: £${best.amount}/month`,
        'Payee not matched to a known letting agent — detected by pattern',
        `Amount in typical rent range (£400-4000)`,
        `${matchingTxns.length} transactions at exactly £${best.amount}${isConsistent ? ' (zero variation — standing order pattern)' : ''}`,
        'No mortgage detected — rent is likely housing cost',
        'User will confirm: is this your rent?',
      ],
      evidence: [{
        label: `${best.payee}: £${best.amount}/month (pattern match)`,
        transactions: matchingTxns.slice(0, 6),
        metrics: [
          { name: 'Exact matches', value: String(matchingTxns.length) },
          { name: 'Variation', value: isConsistent ? '0%' : 'some' },
        ],
      }],
      crossSectionImpacts: [
        'Tenancy agreement needed if confirmed as rent',
        'Confirms renting — no property equity section needed',
      ],
    }
  },
}

const noHousingCosts: SignalRule = {
  id: 'property.no-housing',
  name: 'No housing costs',
  section: 'property',
  tier: 'must_nail',
  formEField: '2.1',
  description: 'No mortgage, rent, or council tax detected. Asks user about housing situation.',
  detect: (input) => {
    const hasMortgage = input.payments.some(p => p.likely_category === 'mortgage')
    const hasRent = input.payments.some(p => p.likely_category === 'rent')
    const hasCouncilTax = input.payments.some(p => p.likely_category === 'council_tax')
    if (hasMortgage || hasRent || hasCouncilTax) return null

    return {
      id: 'property.no-housing',
      ruleId: 'property.no-housing',
      name: 'No housing costs detected',
      section: 'property',
      formEField: '2.1',
      confidence: 0.85,
      determination: 'No mortgage, rent, or council tax found',
      reasoning: [
        'No payments classified as mortgage, rent, or council tax',
        'Possible causes: owns outright, living with family, partner pays, different account',
        'Will ask user about housing situation',
      ],
      evidence: [{
        label: 'No housing-related payments found',
      }],
      crossSectionImpacts: [],
    }
  },
}

export const PROPERTY_RULES: SignalRule[] = [
  mortgageDetected,
  rentDetected,
  councilTaxDetected,
  noHousingCosts,
]
