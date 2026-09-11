// Debt signal rules (Form E 2.14)

import type { SignalRule } from './types'

const creditCardDetected: SignalRule = {
  id: 'debt.credit-card',
  name: 'Credit card',
  section: 'debts',
  tier: 'must_nail',
  formEField: '2.14',
  description: 'Payments to credit card provider. Statement needed for balance + rate.',
  detect: (input) => {
    const cards = input.payments.filter(p => p.likely_category === 'credit_card')
    if (cards.length === 0) return null

    return {
      id: 'debt.credit-card',
      ruleId: 'debt.credit-card',
      name: `Credit card${cards.length > 1 ? 's' : ''} detected`,
      section: 'debts',
      formEField: '2.14',
      confidence: 0.9,
      determination: cards.map(c => `${c.payee}: £${c.amount}/month`).join(', '),
      reasoning: cards.map(c => `Payment to ${c.payee}: £${c.amount}/month (${c.frequency})`),
      evidence: cards.map(c => ({ label: `${c.payee}: £${c.amount}/month` })),
      crossSectionImpacts: ['Credit card statement needed for outstanding balance + rate'],
    }
  },
}

const loanDetected: SignalRule = {
  id: 'debt.loan',
  name: 'Loan repayment',
  section: 'debts',
  tier: 'must_nail',
  formEField: '2.14',
  description: 'Fixed payments to finance company. Need to confirm type (personal/car/student).',
  detect: (input) => {
    const loans = input.payments.filter(p => p.likely_category === 'loan_repayment')
    if (loans.length === 0) return null

    return {
      id: 'debt.loan',
      ruleId: 'debt.loan',
      name: `Loan repayment${loans.length > 1 ? 's' : ''} detected`,
      section: 'debts',
      formEField: '2.14',
      confidence: 0.85,
      determination: loans.map(l => `${l.payee}: £${l.amount}/month`).join(', '),
      reasoning: [
        ...loans.map(l => `Payment to ${l.payee}: £${l.amount}/month (${l.frequency})`),
        'User will confirm: personal loan, car finance, or student loan',
      ],
      evidence: loans.map(l => ({ label: `${l.payee}: £${l.amount}/month` })),
      crossSectionImpacts: ['Loan agreement needed for total outstanding + rate'],
    }
  },
}

const gamblingFlag: SignalRule = {
  id: 'flag.gambling',
  name: 'Gambling pattern',
  section: 'flags',
  tier: 'must_nail',
  formEField: 'flag',
  description: 'Payments to gambling providers. Red flag for disclosure context (spec 22 §10).',
  detect: (input) => {
    const gambling = input.payments.filter(p => p.likely_category === 'gambling')
    if (gambling.length === 0) return null

    const totalMonthly = gambling.reduce((sum, g) => sum + g.amount, 0)
    const txCount = input.transactions.filter(t =>
      t.amount < 0 && gambling.some(g =>
        t.description.toLowerCase().includes(g.payee.toLowerCase().slice(0, 8))
      )
    ).length

    return {
      id: 'flag.gambling',
      ruleId: 'flag.gambling',
      name: 'Gambling activity detected',
      section: 'flags',
      formEField: 'flag',
      confidence: 0.95,
      determination: `Gambling: ${gambling.length} provider${gambling.length > 1 ? 's' : ''}, ~£${totalMonthly}/month total`,
      reasoning: [
        ...gambling.map(g => `${g.payee}: £${g.amount}/month`),
        `${txCount} individual gambling transactions found`,
        'Red flag: pattern noted for disclosure context',
        'Not surfaced to user — internal flag only',
      ],
      evidence: gambling.map(g => ({ label: `${g.payee}: £${g.amount}/month` })),
      crossSectionImpacts: ['Noted for disclosure context — may be relevant to spending patterns'],
    }
  },
}

const bnplDetected: SignalRule = {
  id: 'debt.bnpl',
  name: 'Buy Now Pay Later',
  section: 'debts',
  tier: 'must_nail',
  formEField: '2.14',
  description: 'Klarna, Clearpay, Laybuy instalment payments. BNPL balances are disclosable debts.',
  detect: (input) => {
    // Detect BNPL from payment descriptions (Klarna*, Clearpay*, Laybuy*)
    const bnplPrefixes = ['klarna', 'clearpay', 'laybuy', 'zilch', 'openpay']
    const bnplPayments = input.payments.filter(p =>
      bnplPrefixes.some(prefix => p.payee.toLowerCase().includes(prefix))
    )
    // Also check raw transactions for BNPL patterns not caught by classification grouping
    const bnplTransactions = input.transactions.filter(t =>
      t.amount < 0 && bnplPrefixes.some(prefix => t.description.toLowerCase().includes(prefix))
    )
    if (bnplPayments.length === 0 && bnplTransactions.length === 0) return null

    // Group by merchant (strip BNPL prefix to find actual vendor)
    const merchants = new Map<string, { count: number; total: number; amounts: number[] }>()
    for (const t of bnplTransactions) {
      const desc = t.description.toLowerCase()
      // Extract merchant: "klarna*halfords" → "halfords"
      const match = desc.match(/(?:klarna|clearpay|laybuy|zilch|openpay)[*\s]+(.+)/i)
      const merchant = match?.[1]?.trim() ?? desc
      const existing = merchants.get(merchant) ?? { count: 0, total: 0, amounts: [] }
      existing.count++
      existing.total += Math.abs(t.amount)
      existing.amounts.push(Math.abs(t.amount))
      merchants.set(merchant, existing)
    }

    const totalMonthly = bnplPayments.reduce((sum, p) => sum + p.amount, 0)
    const totalFromTxns = Array.from(merchants.values()).reduce((sum, m) => sum + m.total, 0)

    const reasoning: string[] = []
    for (const [merchant, data] of merchants) {
      const isSameAmount = data.amounts.every(a => a === data.amounts[0])
      reasoning.push(
        `${merchant}: ${data.count} payment${data.count > 1 ? 's' : ''}, £${data.total.toLocaleString()} total` +
        (isSameAmount && data.count > 1 ? ` (${data.count}x £${data.amounts[0]} — instalment plan)` : '')
      )
    }
    reasoning.push('BNPL balances are disclosable debts under Form E 2.14')
    reasoning.push('User should confirm: any outstanding balance?')

    return {
      id: 'debt.bnpl',
      ruleId: 'debt.bnpl',
      name: `BNPL payment${merchants.size > 1 ? 's' : ''} detected`,
      section: 'debts',
      formEField: '2.14',
      confidence: 0.9,
      determination: `BNPL: ${merchants.size} merchant${merchants.size > 1 ? 's' : ''}, £${(totalMonthly || totalFromTxns).toLocaleString()} total`,
      reasoning,
      evidence: Array.from(merchants.entries()).map(([merchant, data]) => ({
        label: `${merchant}: £${data.total.toLocaleString()} (${data.count} payments)`,
        metrics: [
          { name: 'Payments', value: String(data.count) },
          { name: 'Total', value: `£${data.total.toLocaleString()}` },
        ],
      })),
      crossSectionImpacts: [
        'Outstanding BNPL balance is a debt — check provider app for current balance',
      ],
    }
  },
}

export const DEBT_RULES: SignalRule[] = [
  creditCardDetected,
  loanDetected,
  bnplDetected,
  gamblingFlag,
]
