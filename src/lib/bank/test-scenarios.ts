// Synthetic test scenarios for the decisioning engine.
// Each scenario = a persona with 12 months of realistic UK bank transactions
// + expected classification outcomes at every level:
//   1. Payment classifications (label → category)
//   2. Pattern detections (frequency, amount, grouping)
//   3. Pipeline outputs (which questions fire, which auto-confirms, which gaps)
//
// Used by the engine workbench and snapshot tests.

import type { DetectedPayment, ExtractedIncome } from '@/lib/ai/extraction-schemas'
import type { ConfirmationSectionKey } from './confirmation-questions'

// ═══ Types ═══

export interface TestTransaction {
  date: string
  description: string           // Realistic bank-format description (messy)
  amount: number                // Negative = debit, positive = credit
  expectedCategory?: string     // Ground truth category for this transaction
}

export interface ExpectedIncome {
  sourceSubstring: string       // Substring to match in detected income source
  expectedType: ExtractedIncome['type']
  minAmount: number
  maxAmount: number
}

export interface ExpectedPayment {
  payeeSubstring: string        // Substring to match in detected payee
  expectedCategory: DetectedPayment['likely_category']
  minAmount: number
  maxAmount: number
}

export interface ExpectedQuestion {
  sectionKey: ConfirmationSectionKey | 'spending' | 'any'
  idSubstring: string           // Substring to match in question ID
  shouldFire: boolean           // true = expect this question, false = expect it NOT to fire
}

export interface ExpectedGap {
  description: string
  shouldDetect: boolean
}

export interface TestScenario {
  id: string
  name: string
  description: string
  // Input data
  transactions: TestTransaction[]
  provider: string
  accountType: 'current' | 'savings' | 'joint_current'
  isJoint: boolean
  // Expected outcomes — label classification
  expectedIncomes: ExpectedIncome[]
  expectedPayments: ExpectedPayment[]
  // Expected outcomes — pattern recognition
  expectedQuestions: ExpectedQuestion[]
  expectedGaps: ExpectedGap[]
  // Expected stats
  expectedClassifiedRate: number  // 0-1, minimum % of payments that should be classified (not 'unknown')
}

// ═══ Helpers ═══

function monthlyDates(startMonth: number, count: number, dayOfMonth: number): string[] {
  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    const month = ((startMonth + i - 1) % 12) + 1
    const year = 2025 + Math.floor((startMonth + i - 1) / 12)
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`)
  }
  return dates
}

function weeklyDates(startDate: string, count: number): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function quarterlyDates(startMonth: number, count: number, dayOfMonth: number): string[] {
  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    const month = ((startMonth + i * 3 - 1) % 12) + 1
    const year = 2025 + Math.floor((startMonth + i * 3 - 1) / 12)
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`)
  }
  return dates
}

function scatterDates(startDate: string, endDate: string, count: number): string[] {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    const t = start + Math.random() * (end - start)
    dates.push(new Date(t).toISOString().slice(0, 10))
  }
  return dates.sort()
}

function varyAmount(base: number, variationPct: number): number {
  const variation = base * variationPct
  return Math.round(base + (Math.random() * 2 - 1) * variation)
}

// ═══ Scenario 1: Sarah — employed homeowner, 2 kids ═══

function createSarahScenario(): TestScenario {
  const txs: TestTransaction[] = []

  // Salary — consistent monthly credit, realistic BACS format
  for (const date of monthlyDates(4, 12, 28)) {
    txs.push({ date, description: 'BGC ACME CORPORATION LTD SALARY', amount: 3218, expectedCategory: 'employment' })
  }

  // Child benefit — HMRC, 4-weekly (not monthly)
  for (const date of weeklyDates('2025-04-07', 13)) {
    txs.push({ date, description: 'FPI HMRC CHILD BENEFIT', amount: 96.25, expectedCategory: 'benefits' })
  }

  // Mortgage — Halifax DD
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'DD HALIFAX MORTGAGE 87234561', amount: -1150, expectedCategory: 'mortgage' })
  }

  // Council tax — messy format, council name not "council tax"
  for (const date of monthlyDates(4, 10, 15)) { // 10 months (April-Jan, Feb/Mar free)
    txs.push({ date, description: 'DD EXETER CITY COUNCIL TAX', amount: -185, expectedCategory: 'council_tax' })
  }

  // Energy — British Gas DD
  for (const date of monthlyDates(4, 12, 10)) {
    txs.push({ date, description: 'DD BRITISH GAS SERVICES', amount: -varyAmount(120, 0.1), expectedCategory: 'utilities' })
  }

  // Water — messy description
  for (const date of monthlyDates(4, 12, 12)) {
    txs.push({ date, description: 'DD SW WATER', amount: -48, expectedCategory: 'utilities' })
  }

  // Pension — Aviva, needs disambiguation
  for (const date of monthlyDates(4, 12, 5)) {
    txs.push({ date, description: 'DD AVIVA PENSION CONTRIB', amount: -200, expectedCategory: 'pension_contribution' })
  }

  // Car insurance — Admiral, monthly DD
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'DD ADMIRAL INSURANCE', amount: -42, expectedCategory: 'insurance' })
  }

  // Broadband — Sky
  for (const date of monthlyDates(4, 12, 18)) {
    txs.push({ date, description: 'DD SKY UK LIMITED', amount: -45, expectedCategory: 'subscription' })
  }

  // Mobile — Vodafone
  for (const date of monthlyDates(4, 12, 22)) {
    txs.push({ date, description: 'DD VODAFONE LTD', amount: -35, expectedCategory: 'subscription' })
  }

  // Childcare — nursery, standing order
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'STO BRIGHT SPARKS NURSERY', amount: -600, expectedCategory: 'childcare' })
  }

  // Subscriptions
  for (const date of monthlyDates(4, 12, 5)) {
    txs.push({ date, description: 'NETFLIX.COM', amount: -15.99, expectedCategory: 'subscription' })
  }
  for (const date of monthlyDates(4, 12, 8)) {
    txs.push({ date, description: 'SPOTIFY P1A2B3C4', amount: -10.99, expectedCategory: 'subscription' })
  }

  // Groceries — scattered, various amounts
  for (const date of scatterDates('2025-04-01', '2026-03-31', 48)) {
    const shops = ['TESCO STORES 2341 EXETER GBR', 'SAINSBURYS S/MKTS EXETER', 'ALDI STORES LTD EXETER', 'CO-OP GROUP 4521 EXETER']
    txs.push({ date, description: shops[Math.floor(Math.random() * shops.length)], amount: -varyAmount(45, 0.5), expectedCategory: 'groceries' })
  }

  // Dining out — scattered
  for (const date of scatterDates('2025-04-01', '2026-03-31', 18)) {
    const places = ['GREGGS 1234 EXETER', 'COSTA COFFEE EXETER', 'NANDOS EXETER', 'DELIVEROO.COM']
    txs.push({ date, description: places[Math.floor(Math.random() * places.length)], amount: -varyAmount(15, 0.6), expectedCategory: 'dining' })
  }

  // Fuel — scattered
  for (const date of scatterDates('2025-04-01', '2026-03-31', 24)) {
    txs.push({ date, description: 'SHELL EXETER GBR', amount: -varyAmount(55, 0.3), expectedCategory: 'fuel' })
  }

  // HL savings transfer — unknown payee, should trigger accounts question
  for (const date of monthlyDates(4, 12, 3)) {
    txs.push({ date, description: 'FPO HL SAVINGS', amount: -300, expectedCategory: 'investment' })
  }

  return {
    id: 'sarah-employed-homeowner',
    name: 'Sarah — Employed homeowner, 2 children',
    description: 'Classic employed homeowner scenario. Mortgage, pension, childcare, child benefit. Tests: salary detection, mortgage classification, pension/insurance disambiguation, gap detection for payslips.',
    transactions: txs.sort((a, b) => a.date.localeCompare(b.date)),
    provider: 'Barclays',
    accountType: 'current',
    isJoint: false,
    expectedIncomes: [
      { sourceSubstring: 'acme', expectedType: 'employment', minAmount: 3000, maxAmount: 3500 },
      { sourceSubstring: 'hmrc', expectedType: 'benefits', minAmount: 80, maxAmount: 120 },
    ],
    expectedPayments: [
      { payeeSubstring: 'halifax', expectedCategory: 'mortgage', minAmount: 1100, maxAmount: 1200 },
      { payeeSubstring: 'council tax', expectedCategory: 'council_tax', minAmount: 170, maxAmount: 200 },
      { payeeSubstring: 'british gas', expectedCategory: 'utilities', minAmount: 100, maxAmount: 140 },
      { payeeSubstring: 'sw water', expectedCategory: 'utilities', minAmount: 40, maxAmount: 55 },
      { payeeSubstring: 'aviva', expectedCategory: 'pension_contribution', minAmount: 190, maxAmount: 210 },
      { payeeSubstring: 'admiral', expectedCategory: 'insurance', minAmount: 38, maxAmount: 46 },
      { payeeSubstring: 'nursery', expectedCategory: 'childcare', minAmount: 580, maxAmount: 620 },
      { payeeSubstring: 'vodafone', expectedCategory: 'subscription', minAmount: 30, maxAmount: 40 },
      { payeeSubstring: 'hl savings', expectedCategory: 'investment', minAmount: 280, maxAmount: 320 },
    ],
    expectedQuestions: [
      { sectionKey: 'income', idSubstring: 'income-salary', shouldFire: true },
      { sectionKey: 'property', idSubstring: 'property-mortgage', shouldFire: true },
      { sectionKey: 'property', idSubstring: 'property-no-signal', shouldFire: false },
      { sectionKey: 'pensions', idSubstring: 'pensions-detected', shouldFire: true },
      { sectionKey: 'pensions', idSubstring: 'pensions-no-signal', shouldFire: false },
    ],
    expectedGaps: [
      { description: 'No pension gap question (pension IS visible)', shouldDetect: false },
    ],
    expectedClassifiedRate: 0.85,
  }
}

// ═══ Scenario 2: Marcus — self-employed renter, crypto, HMRC SA ═══

function createMarcusScenario(): TestScenario {
  const txs: TestTransaction[] = []

  // Variable income — invoices from clients
  for (const date of monthlyDates(4, 12, 15)) {
    txs.push({ date, description: 'FPI STRIPE PAYMENTS UK', amount: varyAmount(3200, 0.3), expectedCategory: 'self_employment' })
  }
  for (const date of monthlyDates(4, 8, 22)) {
    txs.push({ date, description: 'FPI DESIGN AGENCY LTD INV', amount: varyAmount(1800, 0.4), expectedCategory: 'self_employment' })
  }

  // Rent — standing order to letting agent
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'STO FOXTONS LETTINGS LTD', amount: -1650, expectedCategory: 'rent' })
  }

  // Council tax
  for (const date of monthlyDates(4, 10, 15)) {
    txs.push({ date, description: 'DD LB CAMDEN COUNCIL TAX', amount: -210, expectedCategory: 'council_tax' })
  }

  // HMRC Self Assessment — quarterly, large amounts
  for (const date of quarterlyDates(7, 4, 31)) {
    txs.push({ date, description: 'FPO HMRC NDDS', amount: -varyAmount(2200, 0.2), expectedCategory: 'hmrc_sa' })
  }

  // Accountant — quarterly
  for (const date of quarterlyDates(6, 4, 15)) {
    txs.push({ date, description: 'FPO SMITH & CO ACCOUNTANTS', amount: -350, expectedCategory: 'accountant' })
  }

  // Coinbase — monthly crypto purchases
  for (const date of monthlyDates(4, 12, 10)) {
    txs.push({ date, description: 'CARD PAYMENT COINBASE UK', amount: -200, expectedCategory: 'crypto' })
  }

  // Energy
  for (const date of monthlyDates(4, 12, 8)) {
    txs.push({ date, description: 'DD EDF ENERGY', amount: -varyAmount(95, 0.15), expectedCategory: 'utilities' })
  }

  // Mobile
  for (const date of monthlyDates(4, 12, 20)) {
    txs.push({ date, description: 'DD THREE', amount: -28, expectedCategory: 'subscription' })
  }

  // Groceries
  for (const date of scatterDates('2025-04-01', '2026-03-31', 36)) {
    const shops = ['TESCO EXPRESS CAMDEN', 'WAITROSE 421 NW1', 'LIDL GB CAMDEN GBR']
    txs.push({ date, description: shops[Math.floor(Math.random() * shops.length)], amount: -varyAmount(35, 0.5), expectedCategory: 'groceries' })
  }

  // Dining/entertainment — higher than average
  for (const date of scatterDates('2025-04-01', '2026-03-31', 42)) {
    const places = ['UBER EATS LONDON', 'DELIVEROO.COM', 'PRET A MANGER CAMDEN', 'THE COLONEL CAMDEN NW1']
    txs.push({ date, description: places[Math.floor(Math.random() * places.length)], amount: -varyAmount(22, 0.5), expectedCategory: 'dining' })
  }

  return {
    id: 'marcus-self-employed-renter',
    name: 'Marcus — Self-employed renter, crypto investor',
    description: 'Self-employed (Stripe + client invoices), rents in Camden, crypto on Coinbase, quarterly HMRC SA. Tests: variable income detection, rent classification, HMRC/business signal, crypto flag.',
    transactions: txs.sort((a, b) => a.date.localeCompare(b.date)),
    provider: 'Monzo',
    accountType: 'current',
    isJoint: false,
    expectedIncomes: [
      { sourceSubstring: 'stripe', expectedType: 'self_employment', minAmount: 2500, maxAmount: 4000 },
    ],
    expectedPayments: [
      { payeeSubstring: 'foxtons', expectedCategory: 'rent', minAmount: 1600, maxAmount: 1700 },
      { payeeSubstring: 'council tax', expectedCategory: 'council_tax', minAmount: 200, maxAmount: 220 },
      { payeeSubstring: 'edf', expectedCategory: 'utilities', minAmount: 80, maxAmount: 110 },
      { payeeSubstring: 'coinbase', expectedCategory: 'investment', minAmount: 180, maxAmount: 220 },
      { payeeSubstring: 'hmrc ndds', expectedCategory: 'unknown', minAmount: 1800, maxAmount: 2800 },
    ],
    expectedQuestions: [
      { sectionKey: 'income', idSubstring: 'income-none', shouldFire: false }, // income IS visible, just not employment
      { sectionKey: 'property', idSubstring: 'property-no-signal', shouldFire: false }, // rent IS visible
      { sectionKey: 'business', idSubstring: 'business-detected', shouldFire: true }, // HMRC SA signal
    ],
    expectedGaps: [
      { description: 'Pension gap should fire (no pension contributions)', shouldDetect: true },
    ],
    expectedClassifiedRate: 0.75,
  }
}

// ═══ Scenario 3: Jean — retired, multiple pensions, owns outright ═══

function createJeanScenario(): TestScenario {
  const txs: TestTransaction[] = []

  // State pension
  for (const date of weeklyDates('2025-04-09', 13)) {
    txs.push({ date, description: 'FPI DWP STATE PENSION', amount: 221.20, expectedCategory: 'benefits' })
  }

  // Teachers pension
  for (const date of monthlyDates(4, 12, 3)) {
    txs.push({ date, description: 'FPI TEACHERS PENSIONS', amount: 1450, expectedCategory: 'pension_income' })
  }

  // Aviva private pension
  for (const date of monthlyDates(4, 12, 15)) {
    txs.push({ date, description: 'FPI AVIVA ANNUITY PAYMENT', amount: 380, expectedCategory: 'pension_income' })
  }

  // Council tax
  for (const date of monthlyDates(4, 10, 12)) {
    txs.push({ date, description: 'DD DEVON CC CTAX', amount: -210, expectedCategory: 'council_tax' })
  }

  // Water
  for (const date of monthlyDates(4, 12, 8)) {
    txs.push({ date, description: 'DD SOUTH WEST WATER', amount: -52, expectedCategory: 'utilities' })
  }

  // Energy
  for (const date of monthlyDates(4, 12, 6)) {
    txs.push({ date, description: 'DD BRITISH GAS', amount: -varyAmount(135, 0.15), expectedCategory: 'utilities' })
  }

  // BT broadband
  for (const date of monthlyDates(4, 12, 20)) {
    txs.push({ date, description: 'DD BT GROUP PLC', amount: -42, expectedCategory: 'subscription' })
  }

  // ISA savings
  for (const date of monthlyDates(4, 12, 5)) {
    txs.push({ date, description: 'STO HL ISA ACCOUNT', amount: -500, expectedCategory: 'investment' })
  }

  // Life insurance
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'DD LEGAL AND GENERAL LIFE', amount: -65, expectedCategory: 'insurance' })
  }

  // Groceries
  for (const date of scatterDates('2025-04-01', '2026-03-31', 36)) {
    const shops = ['MARKS SPENCER EXETER', 'WAITROSE 812 EXETER', 'TESCO STORES EXETER GBR']
    txs.push({ date, description: shops[Math.floor(Math.random() * shops.length)], amount: -varyAmount(40, 0.4), expectedCategory: 'groceries' })
  }

  // Healthcare — GP, pharmacy, dentist
  for (const date of scatterDates('2025-04-01', '2026-03-31', 6)) {
    txs.push({ date, description: 'CARD PAYMENT BOOTS PHARMACY EXETER', amount: -varyAmount(12, 0.5), expectedCategory: 'healthcare' })
  }
  for (const date of scatterDates('2025-06-01', '2026-02-28', 3)) {
    txs.push({ date, description: 'CARD PAYMENT MYDENTIST EXETER', amount: -65, expectedCategory: 'dental' })
  }

  return {
    id: 'jean-retired-outright',
    name: 'Jean — Retired, owns outright, multiple pensions',
    description: 'Retired on state + teachers + private pension. Owns outright (no mortgage). HL ISA. Life insurance. Tests: pension income detection (not contribution), no-mortgage property path, ISA/investment detection, life insurance classification.',
    transactions: txs.sort((a, b) => a.date.localeCompare(b.date)),
    provider: 'Nationwide',
    accountType: 'current',
    isJoint: false,
    expectedIncomes: [
      { sourceSubstring: 'dwp', expectedType: 'benefits', minAmount: 200, maxAmount: 250 },
      { sourceSubstring: 'teachers', expectedType: 'pension_income', minAmount: 1400, maxAmount: 1500 },
      { sourceSubstring: 'aviva', expectedType: 'pension_income', minAmount: 360, maxAmount: 400 },
    ],
    expectedPayments: [
      { payeeSubstring: 'devon', expectedCategory: 'council_tax', minAmount: 200, maxAmount: 220 },
      { payeeSubstring: 'south west water', expectedCategory: 'utilities', minAmount: 48, maxAmount: 56 },
      { payeeSubstring: 'british gas', expectedCategory: 'utilities', minAmount: 110, maxAmount: 160 },
      { payeeSubstring: 'legal and general', expectedCategory: 'insurance', minAmount: 60, maxAmount: 70 },
      { payeeSubstring: 'hl isa', expectedCategory: 'investment', minAmount: 480, maxAmount: 520 },
      { payeeSubstring: 'bt group', expectedCategory: 'subscription', minAmount: 38, maxAmount: 46 },
    ],
    expectedQuestions: [
      { sectionKey: 'income', idSubstring: 'income-none', shouldFire: false }, // pension income IS visible
      { sectionKey: 'property', idSubstring: 'property-no-signal', shouldFire: true }, // no mortgage = this path fires
      { sectionKey: 'property', idSubstring: 'property-mortgage', shouldFire: false },
    ],
    expectedGaps: [],
    expectedClassifiedRate: 0.80,
  }
}

// ═══ Scenario 4: Aisha — part-time NHS, joint account, benefits, BNPL ═══

function createAishaScenario(): TestScenario {
  const txs: TestTransaction[] = []

  // NHS salary — part-time
  for (const date of monthlyDates(4, 12, 25)) {
    txs.push({ date, description: 'BGC NHS BUSINESS SERVIC SALARY', amount: 1450, expectedCategory: 'employment' })
  }

  // Universal Credit
  for (const date of monthlyDates(4, 12, 7)) {
    txs.push({ date, description: 'FPI DWP UC', amount: 680, expectedCategory: 'benefits' })
  }

  // Child benefit — 3 children
  for (const date of weeklyDates('2025-04-14', 13)) {
    txs.push({ date, description: 'FPI HMRC CHP', amount: 170, expectedCategory: 'benefits' })
  }

  // Mortgage — shared ownership L&Q
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'DD L&Q HOUSING TRUST', amount: -820, expectedCategory: 'mortgage' })
  }

  // Council tax
  for (const date of monthlyDates(4, 10, 15)) {
    txs.push({ date, description: 'DD NEWHAM LBC CTAX', amount: -145, expectedCategory: 'council_tax' })
  }

  // Energy
  for (const date of monthlyDates(4, 12, 10)) {
    txs.push({ date, description: 'DD OCTOPUS ENERGY', amount: -varyAmount(110, 0.1), expectedCategory: 'utilities' })
  }

  // Water
  for (const date of monthlyDates(4, 12, 14)) {
    txs.push({ date, description: 'DD THAMES WATER UTILITIES', amount: -38, expectedCategory: 'utilities' })
  }

  // Mobile — EE
  for (const date of monthlyDates(4, 12, 22)) {
    txs.push({ date, description: 'DD EE LIMITED', amount: -32, expectedCategory: 'subscription' })
  }

  // Barclaycard — credit card payment
  for (const date of monthlyDates(4, 12, 18)) {
    txs.push({ date, description: 'DD BARCLAYCARD', amount: -85, expectedCategory: 'credit_card' })
  }

  // Klarna — BNPL
  for (const date of monthlyDates(4, 6, 12)) {
    txs.push({ date, description: 'DD KLARNA', amount: -45, expectedCategory: 'bnpl' })
  }

  // Childcare — childminder
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'STO MRS P JOHNSON CHILDM', amount: -450, expectedCategory: 'childcare' })
  }

  // Groceries — budget, high frequency
  for (const date of scatterDates('2025-04-01', '2026-03-31', 52)) {
    const shops = ['ALDI STORES STRATFORD', 'LIDL GB STRATFORD GBR', 'ASDA STORES STRATFORD', 'ICELAND STRATFORD']
    txs.push({ date, description: shops[Math.floor(Math.random() * shops.length)], amount: -varyAmount(32, 0.4), expectedCategory: 'groceries' })
  }

  return {
    id: 'aisha-part-time-benefits',
    name: 'Aisha — Part-time NHS, joint account, UC, BNPL',
    description: 'Part-time NHS worker on Universal Credit with 3 children. Shared ownership (L&Q), joint account. Barclaycard + Klarna. Tests: joint account detection, benefits classification, BNPL vs loan separation, credit card detection, shared ownership mortgage path.',
    transactions: txs.sort((a, b) => a.date.localeCompare(b.date)),
    provider: 'HSBC',
    accountType: 'joint_current',
    isJoint: true,
    expectedIncomes: [
      { sourceSubstring: 'nhs', expectedType: 'employment', minAmount: 1400, maxAmount: 1500 },
      { sourceSubstring: 'dwp', expectedType: 'benefits', minAmount: 650, maxAmount: 710 },
      { sourceSubstring: 'hmrc', expectedType: 'benefits', minAmount: 150, maxAmount: 190 },
    ],
    expectedPayments: [
      { payeeSubstring: 'l&q', expectedCategory: 'unknown', minAmount: 800, maxAmount: 850 },
      { payeeSubstring: 'newham', expectedCategory: 'council_tax', minAmount: 135, maxAmount: 155 },
      { payeeSubstring: 'octopus', expectedCategory: 'utilities', minAmount: 95, maxAmount: 125 },
      { payeeSubstring: 'thames', expectedCategory: 'utilities', minAmount: 35, maxAmount: 42 },
      { payeeSubstring: 'barclaycard', expectedCategory: 'credit_card', minAmount: 80, maxAmount: 90 },
      { payeeSubstring: 'klarna', expectedCategory: 'loan_repayment', minAmount: 40, maxAmount: 50 },
      { payeeSubstring: 'childm', expectedCategory: 'childcare', minAmount: 430, maxAmount: 470 },
    ],
    expectedQuestions: [
      { sectionKey: 'income', idSubstring: 'income-salary', shouldFire: true },
      { sectionKey: 'income', idSubstring: 'income-dwp-type', shouldFire: true },
      { sectionKey: 'property', idSubstring: 'property-mortgage', shouldFire: true },
      { sectionKey: 'accounts', idSubstring: 'accounts-joint', shouldFire: true },
    ],
    expectedGaps: [
      { description: 'Pension gap should fire (NHS pension deducted at source)', shouldDetect: true },
    ],
    expectedClassifiedRate: 0.80,
  }
}

// ═══ Scenario 5: David — high earner, investments, gambling ═══

function createDavidScenario(): TestScenario {
  const txs: TestTransaction[] = []

  // High salary
  for (const date of monthlyDates(4, 12, 28)) {
    txs.push({ date, description: 'BGC BARCLAYS CAPITAL SALARY', amount: 6800, expectedCategory: 'employment' })
  }

  // Bonus (annual)
  txs.push({ date: '2025-12-20', description: 'BGC BARCLAYS CAPITAL BONUS', amount: 15000, expectedCategory: 'employment' })

  // Mortgage — Santander
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'DD SANTANDER UK MORTGAGES', amount: -2100, expectedCategory: 'mortgage' })
  }

  // Council tax
  for (const date of monthlyDates(4, 10, 15)) {
    txs.push({ date, description: 'DD RBKC COUNCIL TAX', amount: -380, expectedCategory: 'council_tax' })
  }

  // Energy — Octopus
  for (const date of monthlyDates(4, 12, 8)) {
    txs.push({ date, description: 'DD OCTOPUS ENERGY', amount: -varyAmount(180, 0.15), expectedCategory: 'utilities' })
  }

  // Investment — HL
  for (const date of monthlyDates(4, 12, 3)) {
    txs.push({ date, description: 'FPO HARGREAVES LANSDOWN', amount: -1000, expectedCategory: 'investment' })
  }

  // Trading 212
  for (const date of monthlyDates(4, 6, 10)) {
    txs.push({ date, description: 'CARD PAYMENT TRADING 212', amount: -varyAmount(500, 0.3), expectedCategory: 'investment' })
  }

  // Gym — David Lloyd
  for (const date of monthlyDates(4, 12, 1)) {
    txs.push({ date, description: 'DD DAVID LLOYD LEISURE', amount: -120, expectedCategory: 'leisure' })
  }

  // Gambling — red flag
  for (const date of scatterDates('2025-04-01', '2026-03-31', 15)) {
    txs.push({ date, description: 'CARD PAYMENT BET365.COM', amount: -varyAmount(100, 0.8), expectedCategory: 'gambling' })
  }
  for (const date of scatterDates('2025-04-01', '2026-03-31', 8)) {
    txs.push({ date, description: 'CARD PAYMENT PADDY POWER', amount: -varyAmount(50, 0.6), expectedCategory: 'gambling' })
  }

  // Car finance — BMW Finance
  for (const date of monthlyDates(4, 12, 5)) {
    txs.push({ date, description: 'DD BMW FINANCIAL SERVICES', amount: -485, expectedCategory: 'loan_repayment' })
  }

  // Private school fees — termly
  for (const date of quarterlyDates(9, 3, 1)) {
    txs.push({ date, description: 'FPO ST PAULS SCHOOL', amount: -7500, expectedCategory: 'education' })
  }

  // Groceries
  for (const date of scatterDates('2025-04-01', '2026-03-31', 36)) {
    const shops = ['WAITROSE 421 KENSINGTON', 'MARKS SPENCER KENSINGTON', 'OCADO.COM']
    txs.push({ date, description: shops[Math.floor(Math.random() * shops.length)], amount: -varyAmount(65, 0.4), expectedCategory: 'groceries' })
  }

  // Dining — high frequency/value
  for (const date of scatterDates('2025-04-01', '2026-03-31', 30)) {
    const places = ['THE IVY KENSINGTON', 'DISHOOM KENSINGTON', 'UBER EATS LONDON', 'HAKKASAN MAYFAIR']
    txs.push({ date, description: places[Math.floor(Math.random() * places.length)], amount: -varyAmount(55, 0.5), expectedCategory: 'dining' })
  }

  return {
    id: 'david-high-earner-investments',
    name: 'David — High earner, investments, gambling, school fees',
    description: 'City worker, high salary + bonus. Mortgage with Santander, HL + Trading 212 investments, BMW finance, private school fees. Gambling red flag. Tests: high-value classification, investment platform detection, gambling flag, car finance, school fees, annual bonus handling.',
    transactions: txs.sort((a, b) => a.date.localeCompare(b.date)),
    provider: 'NatWest',
    accountType: 'current',
    isJoint: false,
    expectedIncomes: [
      { sourceSubstring: 'barclays capital', expectedType: 'employment', minAmount: 6000, maxAmount: 7500 },
    ],
    expectedPayments: [
      { payeeSubstring: 'santander', expectedCategory: 'mortgage', minAmount: 2050, maxAmount: 2150 },
      { payeeSubstring: 'rbkc', expectedCategory: 'council_tax', minAmount: 370, maxAmount: 390 },
      { payeeSubstring: 'bmw', expectedCategory: 'loan_repayment', minAmount: 470, maxAmount: 500 },
      { payeeSubstring: 'hargreaves', expectedCategory: 'investment', minAmount: 950, maxAmount: 1050 },
      { payeeSubstring: 'bet365', expectedCategory: 'gambling', minAmount: 30, maxAmount: 200 },
      { payeeSubstring: 'paddy power', expectedCategory: 'gambling', minAmount: 20, maxAmount: 100 },
    ],
    expectedQuestions: [
      { sectionKey: 'income', idSubstring: 'income-salary', shouldFire: true },
      { sectionKey: 'property', idSubstring: 'property-mortgage', shouldFire: true },
    ],
    expectedGaps: [
      { description: 'Pension gap should fire (likely deducted at source)', shouldDetect: true },
    ],
    expectedClassifiedRate: 0.80,
  }
}

// ═══ Export all scenarios ═══

export function getAllTestScenarios(): TestScenario[] {
  return [
    createSarahScenario(),
    createMarcusScenario(),
    createJeanScenario(),
    createAishaScenario(),
    createDavidScenario(),
  ]
}

export function getTestScenarioById(id: string): TestScenario | undefined {
  return getAllTestScenarios().find((s) => s.id === id)
}
