// Pension signal rules (Form E 2.13)
// Tier: "good enough" — pension contributions need confirming (workplace vs personal, provider details).

import type { SignalRule } from './types'

const pensionContributionDetected: SignalRule = {
  id: 'pension.contribution-detected',
  name: 'Pension contribution',
  section: 'pensions',
  tier: 'good_enough',
  formEField: '2.13',
  description: 'Payments to pension provider (NEST, Scottish Widows, Aviva, etc.). User confirms type and provider details.',
  detect: (input) => {
    const pensions = input.payments.filter(p => p.likely_category === 'pension_contribution')
    if (pensions.length === 0) return null

    const totalMonthly = pensions.reduce((sum, p) => sum + p.amount, 0)

    return {
      id: 'pension.contribution-detected',
      ruleId: 'pension.contribution-detected',
      name: `Pension contribution${pensions.length > 1 ? 's' : ''} detected`,
      section: 'pensions',
      formEField: '2.13',
      confidence: 0.85,
      determination: pensions.length === 1
        ? `Pension: £${pensions[0].amount}/month to ${pensions[0].payee}`
        : `${pensions.length} pension contributions: £${totalMonthly}/month total`,
      reasoning: [
        ...pensions.map(p => `Payment to ${p.payee}: £${p.amount}/month (${p.frequency})`),
        'Classified as pension contribution by keyword match',
        'User will confirm: workplace or personal pension, provider name, fund value',
        'Note: workplace pensions deducted at source won\'t appear in bank data',
      ],
      evidence: pensions.map(p => ({
        label: `${p.payee}: £${p.amount}/month`,
        metrics: [{ name: 'Confidence', value: `${Math.round(p.confidence * 100)}%` }],
      })),
      crossSectionImpacts: [
        'Pension statement needed (fund value, contributions, employer match)',
        'CETV (Cash Equivalent Transfer Value) may be needed for Form E',
      ],
    }
  },
}

const noPensionVisible: SignalRule = {
  id: 'pension.no-contribution',
  name: 'No pension visible',
  section: 'pensions',
  tier: 'good_enough',
  formEField: '2.13',
  description: 'No pension payments detected. Common — most workplace pensions are deducted at source before bank.',
  detect: (input) => {
    const hasPension = input.payments.some(p => p.likely_category === 'pension_contribution')
    if (hasPension) return null

    return {
      id: 'pension.no-contribution',
      ruleId: 'pension.no-contribution',
      name: 'No pension contributions visible',
      section: 'pensions',
      formEField: '2.13',
      confidence: 0.7,
      determination: 'No pension contributions found in bank data',
      reasoning: [
        'No payments classified as pension contribution',
        'This is normal — workplace pensions are usually deducted from salary before it reaches your bank',
        'Will ask user: do you have a workplace or personal pension?',
      ],
      evidence: [{
        label: 'No pension-related payments found',
      }],
      crossSectionImpacts: [
        'User may still have pensions — check payslips for workplace deductions',
      ],
    }
  },
}

export const PENSION_RULES: SignalRule[] = [
  pensionContributionDetected,
  noPensionVisible,
]
