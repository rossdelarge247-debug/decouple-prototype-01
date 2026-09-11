// Income signal rules (Form E 2.15-2.20)
// Tier: "must nail" for PAYE salary and benefits.
// Tier: "ask for help" for self-employment and dividends.

import type { SignalRule, SignalInput, DetectedSignal } from './types'

// ═══ Helpers ═══

function variationPct(amounts: number[]): number {
  if (amounts.length < 2) return 0
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
  if (avg === 0) return 0
  return (Math.max(...amounts) - Math.min(...amounts)) / avg
}

function isRoundAmount(amount: number): boolean {
  return amount >= 500 && (amount % 500 === 0 || amount % 1000 === 0)
}

// ═══ Rules ═══

const regularSalary: SignalRule = {
  id: 'income.regular-salary',
  name: 'Regular salary',
  section: 'income',
  tier: 'must_nail',
  formEField: '2.15',
  description: 'Same source, consistent amount (±5%), monthly, ≥3 months. Contains SALARY/BGC keyword.',
  detect: (input: SignalInput): DetectedSignal | null => {
    const employment = input.incomes.filter(i => i.type === 'employment')
    if (employment.length === 0) return null

    const primary = employment[0]
    const source = primary.source.toLowerCase()
    const hasSalaryKeyword = source.includes('salary') || source.includes('bgc') || source.includes('wages')

    // Find matching raw transactions for evidence
    const matchingTxns = input.transactions.filter(t =>
      t.amount > 0 && t.description.toLowerCase().includes(
        primary.source.toLowerCase().split(' ').slice(0, 2).join(' ').substring(0, 8)
      )
    )
    const amounts = matchingTxns.map(t => t.amount)
    const variation = variationPct(amounts)
    const isConsistent = variation < 0.05

    if (!isConsistent && !hasSalaryKeyword) return null
    if (matchingTxns.length < 3) return null

    const confidence = (isConsistent ? 0.4 : 0.2) +
      (hasSalaryKeyword ? 0.3 : 0) +
      (matchingTxns.length >= 6 ? 0.2 : 0.1) +
      (variation < 0.02 ? 0.1 : 0)

    return {
      id: `income.regular-salary.${primary.source.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`,
      ruleId: 'income.regular-salary',
      name: 'Regular salary detected',
      section: 'income',
      formEField: '2.15',
      confidence: Math.min(1, confidence),
      determination: `Salary: £${primary.amount.toLocaleString()}/month from ${primary.source}`,
      reasoning: [
        `${matchingTxns.length} credits from ${primary.source}`,
        `Amount variation: ${Math.round(variation * 100)}%${isConsistent ? ' (consistent)' : ''}`,
        hasSalaryKeyword ? 'Contains SALARY/BGC keyword' : 'No salary keyword found',
        `Average: £${primary.amount.toLocaleString()}/month`,
      ],
      evidence: [{
        label: `${matchingTxns.length} credits, avg £${primary.amount.toLocaleString()}`,
        transactions: matchingTxns.slice(0, 6),
        metrics: [
          { name: 'Variation', value: `${Math.round(variation * 100)}%` },
          { name: 'Occurrences', value: String(matchingTxns.length) },
        ],
      }],
      crossSectionImpacts: ['Payslips needed for gross/tax/NI breakdown'],
    }
  },
}

const benefitsHMRC: SignalRule = {
  id: 'income.benefits-hmrc',
  name: 'HMRC benefits',
  section: 'income',
  tier: 'must_nail',
  formEField: '2.20',
  description: 'Credits from HMRC matching known benefit patterns (Child Benefit rates).',
  detect: (input: SignalInput): DetectedSignal | null => {
    const hmrc = input.incomes.filter(i =>
      i.type === 'benefits' && (
        i.source.toLowerCase().includes('hmrc') ||
        i.source.toLowerCase().includes('child benefit')
      )
    )
    if (hmrc.length === 0) return null

    const b = hmrc[0]
    // Child Benefit: £25.60/week first child + £16.95/week each additional (2025/26)
    // Monthly: ~£110.87 for 1 child, ~£184.22 for 2, ~£257.56 for 3
    const monthlyRates = [110.87, 184.22, 257.56, 330.91, 404.25]
    const inferredChildren = monthlyRates.findIndex(r => Math.abs(b.amount - r) < 15) + 1

    return {
      id: 'income.benefits-hmrc.child-benefit',
      ruleId: 'income.benefits-hmrc',
      name: 'HMRC Child Benefit detected',
      section: 'income',
      formEField: '2.20',
      confidence: 0.95,
      determination: `Child Benefit: £${b.amount}/month from HMRC${inferredChildren > 0 ? ` (${inferredChildren} child${inferredChildren > 1 ? 'ren' : ''} inferred)` : ''}`,
      reasoning: [
        `Credits from ${b.source}`,
        `Amount: £${b.amount}/month`,
        inferredChildren > 0
          ? `Amount matches Child Benefit rate for ${inferredChildren} child${inferredChildren > 1 ? 'ren' : ''}`
          : 'Amount does not match standard Child Benefit rates',
      ],
      evidence: [{
        label: `${b.source}: £${b.amount}/month`,
        metrics: inferredChildren > 0
          ? [{ name: 'Inferred children', value: String(inferredChildren) }]
          : [],
      }],
      crossSectionImpacts: inferredChildren > 0
        ? [`${inferredChildren} child${inferredChildren > 1 ? 'ren' : ''} inferred — pre-populates children section`]
        : [],
    }
  },
}

const benefitsDWP: SignalRule = {
  id: 'income.benefits-dwp',
  name: 'DWP benefits',
  section: 'income',
  tier: 'must_nail',
  formEField: '2.20',
  description: 'Credits from DWP — type needs confirming (UC, PIP, ESA, etc.).',
  detect: (input: SignalInput): DetectedSignal | null => {
    const dwp = input.incomes.filter(i =>
      i.type === 'benefits' && i.source.toLowerCase().includes('dwp')
    )
    if (dwp.length === 0) return null
    const b = dwp[0]

    return {
      id: 'income.benefits-dwp',
      ruleId: 'income.benefits-dwp',
      name: 'DWP benefits detected',
      section: 'income',
      formEField: '2.20',
      confidence: 0.8,
      determination: `DWP payment: £${b.amount}/month — type needs confirming`,
      reasoning: [
        `Credits from ${b.source}: £${b.amount}/month`,
        'DWP detected but specific benefit type unknown',
        'Will ask user: UC, PIP, ESA, or other',
      ],
      evidence: [{
        label: `${b.source}: £${b.amount}/month`,
      }],
      crossSectionImpacts: [],
    }
  },
}

const selfEmploymentSignal: SignalRule = {
  id: 'income.self-employment-signal',
  name: 'Self-employment signal',
  section: 'income',
  tier: 'ask_for_help',
  formEField: '2.16',
  description: 'Stripe/PayPal income, HMRC SA payments, or variable credits from a company. Flags for user confirmation.',
  detect: (input: SignalInput): DetectedSignal | null => {
    const selfEmp = input.incomes.filter(i => i.type === 'self_employment')
    const hmrcPayments = input.payments.filter(p =>
      p.payee.toLowerCase().includes('hmrc') && !p.payee.toLowerCase().includes('child')
    )
    if (selfEmp.length === 0 && hmrcPayments.length === 0) return null

    const reasoning: string[] = []
    if (selfEmp.length > 0) {
      reasoning.push(`Income from ${selfEmp.map(s => s.source).join(', ')}`)
    }
    if (hmrcPayments.length > 0) {
      reasoning.push(`HMRC self-assessment payments detected (£${hmrcPayments[0].amount}/quarter)`)
    }
    reasoning.push('User should confirm: sole trader, limited company, or partnership')
    reasoning.push('User should identify business-related transactions via search')

    return {
      id: 'income.self-employment-signal',
      ruleId: 'income.self-employment-signal',
      name: 'Self-employment indicators found',
      section: 'income',
      formEField: '2.16',
      confidence: 0.7,
      determination: `Possible self-employment — ${selfEmp.length > 0 ? selfEmp[0].source : 'HMRC SA payments'}`,
      reasoning,
      evidence: [
        ...selfEmp.map(s => ({
          label: `${s.source}: £${s.amount}/month (variable income)`,
        })),
        ...hmrcPayments.map(p => ({
          label: `HMRC payment: £${p.amount} (${p.frequency})`,
        })),
      ],
      crossSectionImpacts: [
        'Triggers business section (Form E 2.10-2.11)',
        'Tax returns needed (2 years)',
        'Business accounts needed',
      ],
    }
  },
}

const noIncomeVisible: SignalRule = {
  id: 'income.none-visible',
  name: 'No income detected',
  section: 'income',
  tier: 'must_nail',
  formEField: '2.15',
  description: 'No regular credits ≥£500/month detected. Asks user about their situation.',
  detect: (input: SignalInput): DetectedSignal | null => {
    if (input.incomes.length > 0) return null

    return {
      id: 'income.none-visible',
      ruleId: 'income.none-visible',
      name: 'No income detected',
      section: 'income',
      formEField: '2.15',
      confidence: 0.9,
      determination: 'No regular income found in bank data',
      reasoning: [
        'No recurring credits ≥ £500/month detected',
        'Possible causes: paid into another account, cash-in-hand, not working',
        'Will ask user about their employment situation',
      ],
      evidence: [{
        label: 'No qualifying income credits found',
        metrics: [{ name: 'Total credits checked', value: String(input.transactions.filter(t => t.amount > 0).length) }],
      }],
      crossSectionImpacts: [],
    }
  },
}

export const INCOME_RULES: SignalRule[] = [
  regularSalary,
  benefitsHMRC,
  benefitsDWP,
  selfEmploymentSignal,
  noIncomeVisible,
]
