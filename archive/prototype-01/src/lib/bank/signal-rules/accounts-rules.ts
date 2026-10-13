// Accounts signal rules (Form E 2.3-2.4)
// Detects investment platforms, ISAs, and savings transfers.

import type { SignalRule } from './types'

const investmentPlatformDetected: SignalRule = {
  id: 'accounts.investment-platform',
  name: 'Investment platform',
  section: 'accounts',
  tier: 'good_enough',
  formEField: '2.3',
  description: 'Payments to investment platforms (HL, Vanguard, Trading 212, AJ Bell, etc.). Disclosable assets.',
  detect: (input) => {
    const investments = input.payments.filter(p => p.likely_category === 'investment')
    if (investments.length === 0) return null

    const totalMonthly = investments.reduce((sum, p) => sum + p.amount, 0)

    // Check for crypto platforms specifically (subset of investment)
    const cryptoKeywords = ['coinbase', 'binance', 'kraken', 'crypto', 'bitcoin', 'blockchain']
    const cryptoPlatforms = investments.filter(p =>
      cryptoKeywords.some(k => p.payee.toLowerCase().includes(k))
    )
    const hasCrypto = cryptoPlatforms.length > 0

    return {
      id: 'accounts.investment-platform',
      ruleId: 'accounts.investment-platform',
      name: `Investment${hasCrypto ? ' & crypto' : ''} platform${investments.length > 1 ? 's' : ''} detected`,
      section: 'accounts',
      formEField: '2.3',
      confidence: 0.85,
      determination: investments.length === 1
        ? `Investment: £${investments[0].amount}/month to ${investments[0].payee}`
        : `${investments.length} investment platforms: £${totalMonthly}/month total`,
      reasoning: [
        ...investments.map(p => `Payment to ${p.payee}: £${p.amount}/month (${p.frequency})`),
        'Payments to investment/trading platform detected',
        hasCrypto ? 'Includes cryptocurrency platform — crypto assets are disclosable' : '',
        'User will confirm: account type (ISA/GIA/SIPP), current value',
        'These are disclosable assets under Form E 2.3 (investments)',
      ].filter(Boolean),
      evidence: investments.map(p => ({
        label: `${p.payee}: £${p.amount}/month`,
        metrics: [{ name: 'Confidence', value: `${Math.round(p.confidence * 100)}%` }],
      })),
      crossSectionImpacts: [
        'Investment statement needed (current value, account type)',
        ...(hasCrypto ? ['Crypto wallet/exchange statement needed'] : []),
        'May need valuations as of specific date for Form E',
      ],
    }
  },
}

export const ACCOUNTS_RULES: SignalRule[] = [
  investmentPlatformDetected,
]
