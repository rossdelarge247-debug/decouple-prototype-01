// Generates confirmation questions from bank data per spec 22.
// Pure data logic — no React, no JSX.
//
// For each section (income, property, accounts, pensions, debts),
// looks at bank signals and produces the right questions + follow-ups.

import type { BankStatementExtraction } from '@/lib/ai/extraction-schemas'

// ═══ Types ═══

export type ConfirmationSectionKey = 'income' | 'property' | 'accounts' | 'pensions' | 'debts' | 'business' | 'other_assets'

export interface ConfirmationOption {
  label: string
  value: string
}

export interface ConfirmationStep {
  id: string
  sectionKey: ConfirmationSectionKey
  sectionLabel: string
  type: 'question' | 'confirmation_message' | 'input' | 'checklist'
  text: string
  subtext?: string
  options?: ConfirmationOption[]
  // For input type (property value)
  inputPrefix?: string
  inputPlaceholder?: string
  inputQualifiers?: ConfirmationOption[]
  // Show only when a previous answer matches (array = any of these values)
  showWhen?: { questionId: string; value: string | string[] }
}

export interface SectionSummaryFact {
  label: string
  source: 'bank' | 'self'
  gapMessage?: string
}

export interface SectionSummaryData {
  sectionKey: ConfirmationSectionKey | 'spending'
  sectionLabel: string
  heading: string
  facts: SectionSummaryFact[]
  calculatedValues?: { label: string; value: string }[]
  accordionLabel: string // e.g. "Income captured, ready to share"
}

export const CONFIRMATION_SECTIONS: ConfirmationSectionKey[] = [
  'income', 'property', 'accounts', 'pensions', 'debts', 'business', 'other_assets',
]

// ═══ Question generation ═══

export function generateSectionSteps(
  sectionKey: ConfirmationSectionKey,
  extractions: BankStatementExtraction[],
): ConfirmationStep[] {
  switch (sectionKey) {
    case 'income': return generateIncomeSteps(extractions)
    case 'property': return generatePropertySteps(extractions)
    case 'accounts': return generateAccountsSteps(extractions)
    case 'pensions': return generatePensionsSteps(extractions)
    case 'debts': return generateDebtsSteps(extractions)
    case 'business': return generateBusinessSteps(extractions)
    case 'other_assets': return generateOtherAssetsSteps(extractions)
  }
}

// ═══ Income (spec 22 §1) ═══
//
// Ladder:
//   1. For each detected employment source: confirm as salary or classify
//   2. Benefits: auto-confirm HMRC, ask about DWP
//   3. Unclassified regular deposits: ask what they are
//   4. No income path: expanded options (retired, self-employed, carer, etc.)
//
// Cross-section impacts:
//   → Dividends from own company → triggers Business section
//   → Rental income → cross-ref with Property
//   → Child Benefit → infer child count for Children section
//   → Retired → pension section becomes critical

function generateIncomeSteps(extractions: BankStatementExtraction[]): ConfirmationStep[] {
  const allIncome = extractions.flatMap((e) => e.income_deposits)
  const employment = allIncome.filter((i) => i.type === 'employment')
  const benefits = allIncome.filter((i) => i.type === 'benefits')
  const otherIncome = allIncome.filter((i) =>
    i.type !== 'employment' && i.type !== 'benefits',
  )
  const steps: ConfirmationStep[] = []

  // ── Primary employment income ──

  if (employment.length > 0) {
    const primary = employment[0]
    steps.push({
      id: 'income-salary',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'question',
      text: `We found £${primary.amount.toLocaleString()}/month from ${primary.source}. Is this your salary?`,
      options: [
        { label: 'Yes, that\'s my salary', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    })

    steps.push({
      id: 'income-salary-confirmed',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'confirmation_message',
      text: `Your employer is ${primary.source}, £${primary.amount.toLocaleString()} net monthly. We'll need payslips for finalisation.`,
      showWhen: { questionId: 'income-salary', value: 'yes' },
    })

    steps.push({
      id: 'income-not-salary',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'question',
      text: `What are these payments from ${primary.source}?`,
      options: [
        { label: 'Dividends from my own company', value: 'dividends' },
        { label: 'Rental income', value: 'rental' },
        { label: 'Maintenance from ex-partner', value: 'maintenance' },
        { label: 'Money from family or friends', value: 'family' },
        { label: 'Something else', value: 'other' },
      ],
      showWhen: { questionId: 'income-salary', value: 'no' },
    })

    // ── Second employer (if detected) ──
    if (employment.length > 1) {
      const second = employment[1]
      steps.push({
        id: 'income-second-employer',
        sectionKey: 'income',
        sectionLabel: 'Income',
        type: 'question',
        text: `We also found £${second.amount.toLocaleString()}/month from ${second.source}. Is this a second job?`,
        options: [
          { label: 'Yes, second job', value: 'yes' },
          { label: 'No, something else', value: 'no' },
        ],
      })
    }
  } else {
    // ── No employment income detected ──
    steps.push({
      id: 'income-none',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'question',
      text: "We can't see employment income in your bank data. What's your situation?",
      subtext: 'Salary is sometimes paid to a different account.',
      options: [
        { label: 'Employed, but paid into another account', value: 'different_account' },
        { label: 'Self-employed', value: 'self_employed' },
        { label: 'Not currently working', value: 'not_working' },
        { label: 'Retired', value: 'retired' },
        { label: 'Full-time parent or carer', value: 'carer' },
        { label: 'On long-term sick or disability', value: 'sick' },
      ],
    })

    // Follow-up for "paid elsewhere"
    steps.push({
      id: 'income-other-account-amount',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'input',
      text: 'Roughly, what is your monthly take-home pay?',
      subtext: 'We recommend connecting that account too — for now an estimate is fine.',
      inputPrefix: '£',
      inputPlaceholder: 'e.g. 2,800',
      showWhen: { questionId: 'income-none', value: 'different_account' },
    })

    // Follow-up for self-employed
    steps.push({
      id: 'income-self-employed-structure',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'question',
      text: "What's your business structure?",
      options: [
        { label: 'Sole trader', value: 'sole_trader' },
        { label: 'Limited company', value: 'limited' },
        { label: 'Partnership', value: 'partnership' },
      ],
      showWhen: { questionId: 'income-none', value: 'self_employed' },
    })

    // Follow-up for retired
    steps.push({
      id: 'income-retired-pension',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'question',
      text: 'Do you receive a pension?',
      options: [
        { label: 'Yes, private and/or state pension', value: 'yes' },
        { label: 'State pension only', value: 'state_only' },
        { label: 'Not yet drawing a pension', value: 'not_yet' },
      ],
      showWhen: { questionId: 'income-none', value: 'retired' },
    })
  }

  // ── Benefits: auto-confirm HMRC, ask about DWP ──

  const hmrc = benefits.filter((b) =>
    b.source.toLowerCase().includes('hmrc') ||
    b.source.toLowerCase().includes('child benefit'),
  )
  const dwp = benefits.filter((b) =>
    b.source.toLowerCase().includes('dwp'),
  )
  const otherBenefits = benefits.filter((b) =>
    !b.source.toLowerCase().includes('hmrc') &&
    !b.source.toLowerCase().includes('child benefit') &&
    !b.source.toLowerCase().includes('dwp'),
  )

  if (hmrc.length > 0) {
    steps.push({
      id: 'income-hmrc-confirmed',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'confirmation_message',
      text: `${hmrc[0].source}: £${hmrc[0].amount}/month confirmed from your bank data.`,
    })
  }

  if (dwp.length > 0) {
    steps.push({
      id: 'income-dwp-type',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'question',
      text: `£${dwp[0].amount}/month from DWP — what benefit is this?`,
      options: [
        { label: 'Universal Credit', value: 'universal_credit' },
        { label: 'PIP', value: 'pip' },
        { label: 'ESA', value: 'esa' },
        { label: 'Carer\'s Allowance', value: 'carers' },
        { label: 'State Pension', value: 'state_pension' },
        { label: 'Other', value: 'other' },
      ],
    })
  }

  if (otherBenefits.length > 0) {
    const b = otherBenefits[0]
    steps.push({
      id: 'income-other-benefit',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'confirmation_message',
      text: `${b.source}: £${b.amount}/month confirmed from your bank data.`,
    })
  }

  // ── Unclassified income (rental, maintenance, other) ──

  if (otherIncome.length > 0) {
    const oi = otherIncome[0]
    steps.push({
      id: 'income-unclassified',
      sectionKey: 'income',
      sectionLabel: 'Income',
      type: 'question',
      text: `£${oi.amount}/month from ${oi.source} — what is this?`,
      options: [
        { label: 'Rental income', value: 'rental' },
        { label: 'Maintenance from ex-partner', value: 'maintenance' },
        { label: 'Lodger income', value: 'lodger' },
        { label: 'Family support', value: 'family' },
        { label: 'Something else', value: 'other' },
      ],
    })
  }

  return steps
}

// ═══ Property (spec 22 §2) ═══
//
// Ladder:
//   1. Entry: mortgage detected → confirm, OR no signal → housing situation
//   2. Government scheme check (if mortgaged)
//   3. Shared ownership % (if applicable)
//   4. Sole / joint ownership
//   5. Property value
//   6. Mortgage balance (if mortgaged)
//   7. Help to Buy balance (if applicable)
//   8. Who lives there
//   9. Property status
//
// Cross-section impacts:
//   → Spending: expect council tax + buildings insurance if owns
//   → Debts: mortgage noted, don't re-ask
//   → Finalisation: mortgage statement + valuations

function generatePropertySteps(extractions: BankStatementExtraction[]): ConfirmationStep[] {
  const allPayments = extractions.flatMap((e) => e.regular_payments)
  const mortgage = allPayments.find((p) => p.likely_category === 'mortgage')
  const steps: ConfirmationStep[] = []

  // ── Entry question ──

  if (mortgage) {
    steps.push({
      id: 'property-mortgage',
      sectionKey: 'property',
      sectionLabel: 'Property',
      type: 'question',
      text: `£${mortgage.amount.toLocaleString()}/month to ${mortgage.payee}. Is this your mortgage?`,
      options: [
        { label: 'Yes, that\'s my mortgage', value: 'yes' },
        { label: 'No, I rent', value: 'rent' },
        { label: 'Something else', value: 'other' },
      ],
    })
  } else {
    steps.push({
      id: 'property-no-signal',
      sectionKey: 'property',
      sectionLabel: 'Property',
      type: 'question',
      text: "We didn't find mortgage or rent payments. What's your housing situation?",
      options: [
        { label: 'I own with a mortgage (paid elsewhere)', value: 'yes_mortgage' },
        { label: 'I own outright — no mortgage', value: 'yes_outright' },
        { label: 'I rent (paid from another account)', value: 'rent' },
        { label: 'Partner or family pays housing', value: 'partner_pays' },
        { label: 'Living with family or friends', value: 'family' },
      ],
    })
  }

  // ── Values for "owns property" condition ──
  const entryId = mortgage ? 'property-mortgage' : 'property-no-signal'
  const ownsValues = mortgage ? 'yes' : ['yes_mortgage', 'yes_outright']
  const hasMortgageValues = mortgage ? 'yes' : 'yes_mortgage'

  // ── Government scheme check (only if mortgaged) ──

  steps.push({
    id: 'property-scheme',
    sectionKey: 'property',
    sectionLabel: 'Property',
    type: 'question',
    text: 'Is there a government scheme on this property?',
    subtext: 'Help to Buy, shared ownership, and Right to Buy all affect your equity.',
    options: [
      { label: 'No, standard mortgage', value: 'standard' },
      { label: 'Help to Buy equity loan', value: 'help_to_buy' },
      { label: 'Shared ownership', value: 'shared_ownership' },
      { label: 'Right to Buy', value: 'right_to_buy' },
    ],
    showWhen: { questionId: entryId, value: hasMortgageValues },
  })

  // ── Shared ownership: what percentage do you own? ──

  steps.push({
    id: 'property-ownership-pct',
    sectionKey: 'property',
    sectionLabel: 'Property',
    type: 'question',
    text: 'What percentage of the property do you own?',
    subtext: 'This is the share you purchased — the rest is owned by the housing association.',
    options: [
      { label: '25%', value: '25' },
      { label: '40%', value: '40' },
      { label: '50%', value: '50' },
      { label: '75%', value: '75' },
      { label: 'Other', value: 'other' },
    ],
    showWhen: { questionId: 'property-scheme', value: 'shared_ownership' },
  })

  // ── Sole / joint ──

  steps.push({
    id: 'property-joint',
    sectionKey: 'property',
    sectionLabel: 'Property',
    type: 'question',
    text: 'Do you own this property...',
    options: [
      { label: 'In my name only', value: 'sole' },
      { label: 'Jointly with my partner', value: 'joint_partner' },
      { label: 'Jointly with someone else', value: 'joint_other' },
    ],
    showWhen: { questionId: entryId, value: ownsValues },
  })

  // ── Property value ──

  steps.push({
    id: 'property-value',
    sectionKey: 'property',
    sectionLabel: 'Property',
    type: 'input',
    text: 'Roughly, what is the property worth?',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 350,000',
    inputQualifiers: [
      { label: 'This is a rough estimate', value: 'estimate' },
      { label: 'Recently valued by an estate agent', value: 'valued' },
    ],
    showWhen: { questionId: entryId, value: ownsValues },
  })

  // ── Mortgage balance (only if mortgaged) ──

  steps.push({
    id: 'property-mortgage-balance',
    sectionKey: 'property',
    sectionLabel: 'Property',
    type: 'input',
    text: 'What is the outstanding mortgage balance?',
    subtext: 'An estimate is fine — we\'ll get the exact figure from a mortgage statement later.',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 220,000',
    showWhen: { questionId: entryId, value: hasMortgageValues },
  })

  // ── Help to Buy equity loan balance ──

  steps.push({
    id: 'property-htb-balance',
    sectionKey: 'property',
    sectionLabel: 'Property',
    type: 'input',
    text: 'What is the outstanding Help to Buy loan balance?',
    subtext: 'This is the government equity loan, separate from your mortgage.',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 60,000',
    showWhen: { questionId: 'property-scheme', value: 'help_to_buy' },
  })

  // ── Who lives there ──

  steps.push({
    id: 'property-occupation',
    sectionKey: 'property',
    sectionLabel: 'Property',
    type: 'question',
    text: 'Who currently lives in this property?',
    options: [
      { label: 'I do', value: 'me' },
      { label: 'My partner does', value: 'partner' },
      { label: 'We both still live there', value: 'both' },
      { label: 'Neither — it\'s empty or rented out', value: 'neither' },
    ],
    showWhen: { questionId: entryId, value: ownsValues },
  })

  // ── Property status ──

  steps.push({
    id: 'property-status',
    sectionKey: 'property',
    sectionLabel: 'Property',
    type: 'question',
    text: "What's the current situation with the property?",
    options: [
      { label: 'It\'s our family home', value: 'family_home' },
      { label: 'It\'s on the market', value: 'on_market' },
      { label: 'Sale agreed or under offer', value: 'under_offer' },
      { label: 'Being rented out since separation', value: 'rented_out' },
    ],
    showWhen: { questionId: entryId, value: ownsValues },
  })

  return steps
}

// ═══ Accounts (spec 22 §3, spec 25 screen 2h) ═══

// ═══ Accounts (spec 22 §3) ═══
//
// Ladder:
//   1. Connected accounts: auto-confirm, check if joint
//   2. Transfers to unknown accounts: classify (savings/ISA/investment/pension)
//   3. Payments to investment platforms: detect by payee name
//   4. Catch-all: any other accounts, savings, or investments?
//
// Cross-section impacts:
//   → If pension contribution → reclassify to Pensions section
//   → If investment → income from dividends/interest

const INVESTMENT_PLATFORMS = [
  'hargreaves', 'lansdown', 'vanguard', 'aj bell', 'fidelity',
  'interactive investor', 'nutmeg', 'wealthify', 'moneybox',
  'freetrade', 'trading 212', 'etoro', 'hl ',
  // Additional platforms
  'bestinvest', 'charles stanley', 'close brothers', 'rathbone',
  'brewin dolphin', 'quilter', 'st james', 'investec',
  'scottish friendly', 'fundsmith', 'dodl',
]

const CRYPTO_EXCHANGES = [
  'coinbase', 'binance', 'kraken', 'crypto.com', 'gemini',
  'bitstamp', 'bitfinex', 'revolut crypto',
  'luno', 'cex.io', 'blockchain.com', 'swissborg',
]

function matchesPayee(payee: string, patterns: string[]): boolean {
  const lower = payee.toLowerCase()
  return patterns.some((p) => lower.includes(p))
}

function generateAccountsSteps(extractions: BankStatementExtraction[]): ConfirmationStep[] {
  const allPayments = extractions.flatMap((e) => e.regular_payments)
  const steps: ConfirmationStep[] = []

  // ── Joint account check on connected accounts ──
  const jointAccounts = extractions.filter((e) => e.is_joint || e.account_type === 'joint_current' || e.account_type === 'joint_savings')
  if (jointAccounts.length > 0) {
    const ja = jointAccounts[0]
    steps.push({
      id: 'accounts-joint',
      sectionKey: 'accounts',
      sectionLabel: 'Accounts',
      type: 'question',
      text: `Your ${ja.provider} account ending ${ja.account_number_last4 ?? '****'} looks like a joint account. Who is it with?`,
      options: [
        { label: 'My partner', value: 'partner' },
        { label: 'Someone else', value: 'other' },
        { label: 'It\'s actually a sole account', value: 'sole' },
      ],
    })
  }

  // ── Transfers to savings / unknown accounts (top 3) ──
  const transfers = allPayments
    .filter((p) => p.likely_category === 'unknown' && p.confidence < 0.9)
    .slice(0, 3)

  for (let i = 0; i < transfers.length; i++) {
    const transfer = transfers[i]
    const isInvestment = matchesPayee(transfer.payee, INVESTMENT_PLATFORMS)
    const isCrypto = matchesPayee(transfer.payee, CRYPTO_EXCHANGES)

    if (isCrypto) {
      // ── Crypto exchange detected ──
      steps.push({
        id: `accounts-crypto-${i}`,
        sectionKey: 'accounts',
        sectionLabel: 'Accounts',
        type: 'question',
        text: `We see payments to ${transfer.payee}. Do you hold cryptocurrency?`,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No, I\'ve sold it all', value: 'sold' },
        ],
      })
      steps.push({
        id: `accounts-crypto-${i}-value`,
        sectionKey: 'accounts',
        sectionLabel: 'Accounts',
        type: 'input',
        text: 'Roughly, what is your cryptocurrency worth today?',
        inputPrefix: '£',
        inputPlaceholder: 'e.g. 5,000',
        showWhen: { questionId: `accounts-crypto-${i}`, value: 'yes' },
      })
    } else if (isInvestment) {
      // ── Investment platform detected ──
      steps.push({
        id: `accounts-investment-${i}`,
        sectionKey: 'accounts',
        sectionLabel: 'Accounts',
        type: 'question',
        text: `You make payments to ${transfer.payee}. What is this?`,
        options: [
          { label: 'Stocks & shares ISA', value: 'isa' },
          { label: 'General investment account', value: 'investment' },
          { label: 'Pension (SIPP)', value: 'sipp' },
          { label: 'I\'ve closed this', value: 'closed' },
        ],
      })
      steps.push({
        id: `accounts-investment-${i}-value`,
        sectionKey: 'accounts',
        sectionLabel: 'Accounts',
        type: 'input',
        text: 'Roughly, what is the current value?',
        inputPrefix: '£',
        inputPlaceholder: 'e.g. 15,000',
        showWhen: { questionId: `accounts-investment-${i}`, value: ['isa', 'investment', 'sipp'] },
      })
    } else {
      // ── Unknown transfer ──
      steps.push({
        id: `accounts-transfer-${i}`,
        sectionKey: 'accounts',
        sectionLabel: 'Accounts',
        type: 'question',
        text: `£${transfer.amount}/month to ${transfer.payee}. What is this?`,
        options: [
          { label: 'Savings account', value: 'savings' },
          { label: 'ISA', value: 'isa' },
          { label: 'Investment account', value: 'investment' },
          { label: 'Pension contribution', value: 'pension' },
          { label: 'Transfer to my partner', value: 'partner' },
          { label: 'Something else', value: 'other' },
        ],
      })
      steps.push({
        id: `accounts-transfer-${i}-value`,
        sectionKey: 'accounts',
        sectionLabel: 'Accounts',
        type: 'input',
        text: 'Roughly, what is the balance or value?',
        inputPrefix: '£',
        inputPlaceholder: 'e.g. 8,000',
        showWhen: { questionId: `accounts-transfer-${i}`, value: ['savings', 'isa', 'investment'] },
      })
    }
  }

  // ── App-based bank accounts (commonly omitted) ──
  const APP_BANKS = ['monzo', 'revolut', 'starling', 'chase', 'atom']
  const connectedProviders = extractions.map((e) => e.provider.toLowerCase())
  const missingAppBanks = APP_BANKS.filter((b) => !connectedProviders.some((p) => p.includes(b)))

  if (missingAppBanks.length > 0) {
    const bankNames = missingAppBanks.map((b) => b.charAt(0).toUpperCase() + b.slice(1)).join(', ')
    steps.push({
      id: 'accounts-app-banks',
      sectionKey: 'accounts',
      sectionLabel: 'Accounts',
      type: 'question',
      text: `Do you have any accounts with app-based banks like ${bankNames}?`,
      subtext: 'These are easy to forget but must be disclosed.',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    })
    steps.push({
      id: 'accounts-app-banks-detail',
      sectionKey: 'accounts',
      sectionLabel: 'Accounts',
      type: 'input',
      text: 'Roughly, what is the total balance across these accounts?',
      inputPrefix: '£',
      inputPlaceholder: 'e.g. 500',
      showWhen: { questionId: 'accounts-app-banks', value: 'yes' },
    })
  }

  // ── Closed accounts in last 12 months (commonly omitted) ──
  steps.push({
    id: 'accounts-closed',
    sectionKey: 'accounts',
    sectionLabel: 'Accounts',
    type: 'question',
    text: 'Have you closed any bank or savings accounts in the last 12 months?',
    subtext: 'Form E requires disclosure of recently closed accounts.',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  })
  steps.push({
    id: 'accounts-closed-detail',
    sectionKey: 'accounts',
    sectionLabel: 'Accounts',
    type: 'input',
    text: 'Roughly, what was the balance when the account was closed?',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 2,000',
    showWhen: { questionId: 'accounts-closed', value: 'yes' },
  })

  // ── Catch-all: any other accounts not detected? ──
  steps.push({
    id: 'accounts-other',
    sectionKey: 'accounts',
    sectionLabel: 'Accounts',
    type: 'question',
    text: 'Do you have any other savings, ISAs, investments, or premium bonds we haven\'t covered?',
    options: [
      { label: 'No, that\'s everything', value: 'none' },
      { label: 'Yes, savings account(s)', value: 'savings' },
      { label: 'Yes, ISA(s)', value: 'isa' },
      { label: 'Yes, investments', value: 'investments' },
      { label: 'Yes, premium bonds', value: 'premium_bonds' },
    ],
  })

  steps.push({
    id: 'accounts-other-value',
    sectionKey: 'accounts',
    sectionLabel: 'Accounts',
    type: 'input',
    text: 'Roughly, what is the total value?',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 12,000',
    showWhen: { questionId: 'accounts-other', value: ['savings', 'isa', 'investments', 'premium_bonds'] },
  })

  return steps
}

// ═══ Pensions (spec 22 §4) ═══
//
// Ladder:
//   1. Pension contribution detected → confirm, or no signal → ask
//   2. How many pensions?
//   3. DB vs DC (affects valuation significantly)
//   4. CETV status + education
//   5. Already drawing? (changes what documents needed)
//
// Cross-section impacts:
//   → Income: if retired/drawing, pension income captured there
//   → Accounts: SIPP may have been flagged in Accounts section
//   → Finalisation: CETV has 6-8 week lead time — longest gap document

function generatePensionsSteps(extractions: BankStatementExtraction[]): ConfirmationStep[] {
  const allPayments = extractions.flatMap((e) => e.regular_payments)
  const pension = allPayments.find((p) => p.likely_category === 'pension_contribution')
  const steps: ConfirmationStep[] = []

  // ── Entry: detected or not ──

  if (pension) {
    steps.push({
      id: 'pensions-detected',
      sectionKey: 'pensions',
      sectionLabel: 'Pensions',
      type: 'question',
      text: `£${pension.amount}/month to ${pension.payee} — is this a pension contribution?`,
      options: [
        { label: 'Yes, pension', value: 'yes' },
        { label: 'No, it\'s insurance', value: 'insurance' },
        { label: 'Not sure', value: 'unsure' },
      ],
    })
  } else {
    steps.push({
      id: 'pensions-no-signal',
      sectionKey: 'pensions',
      sectionLabel: 'Pensions',
      type: 'question',
      text: "We can't see pension contributions — they're often deducted from your pay before it reaches your bank.",
      subtext: 'Most employees enrolled after 2012 have a workplace pension.',
      options: [
        { label: 'I have a workplace pension', value: 'workplace' },
        { label: 'I have a personal or private pension', value: 'personal' },
        { label: 'I have more than one pension', value: 'multiple' },
        { label: 'I\'m already drawing my pension', value: 'drawing' },
        { label: 'I\'m not sure', value: 'unsure' },
        { label: 'No pensions', value: 'none' },
      ],
    })
  }

  // ── How many pensions? (if detected or has pension) ──
  const hasPensionId = pension ? 'pensions-detected' : 'pensions-no-signal'
  const hasPensionValues = pension ? 'yes' : ['workplace', 'personal']

  steps.push({
    id: 'pensions-count',
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    type: 'question',
    text: 'How many pensions do you have in total?',
    subtext: 'Include workplace, personal, and any old pensions from previous jobs.',
    options: [
      { label: 'Just one', value: '1' },
      { label: 'Two', value: '2' },
      { label: 'Three or more', value: '3+' },
    ],
    showWhen: { questionId: hasPensionId, value: hasPensionValues },
  })

  // ── DB vs DC — affects valuation significantly ──

  steps.push({
    id: 'pensions-type',
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    type: 'question',
    text: 'What type of pension is your main one?',
    subtext: 'If unsure, a defined benefit pension promises a specific income in retirement. Defined contribution is a pot of money you\'ve built up.',
    options: [
      { label: 'Defined benefit (final salary / career average)', value: 'db' },
      { label: 'Defined contribution (money purchase / pot)', value: 'dc' },
      { label: 'I\'m not sure', value: 'unsure' },
    ],
    showWhen: { questionId: hasPensionId, value: hasPensionValues },
  })

  // ── CETV status ──

  steps.push({
    id: 'pensions-cetv',
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    type: 'question',
    text: 'Have you requested a CETV from your pension provider?',
    subtext: 'A CETV (Cash Equivalent Transfer Value) shows the transfer value of your pension. It takes 6-8 weeks, so we\'d recommend starting now.',
    options: [
      { label: 'Yes, already requested', value: 'requested' },
      { label: 'No, not yet', value: 'not_yet' },
      { label: 'What\'s a CETV?', value: 'education' },
    ],
    showWhen: { questionId: hasPensionId, value: hasPensionValues },
  })

  // ── CETV education (if they asked) ──

  steps.push({
    id: 'pensions-cetv-education',
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    type: 'confirmation_message',
    text: 'A CETV is the cash value your pension provider puts on your pension if you were to transfer it. It\'s required for financial disclosure. Contact your provider to request one — it\'s free but takes 6-8 weeks.',
    showWhen: { questionId: 'pensions-cetv', value: 'education' },
  })

  // ── Already drawing pension (from no-signal path) ──

  steps.push({
    id: 'pensions-drawing-other',
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    type: 'question',
    text: 'Do you have any other pensions you\'re not yet drawing from?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No, just the one I\'m drawing', value: 'no' },
    ],
    showWhen: { questionId: 'pensions-no-signal', value: 'drawing' },
  })

  // ── Multiple pensions (from no-signal path) ──

  steps.push({
    id: 'pensions-multiple-count',
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    type: 'question',
    text: 'How many pensions do you have?',
    options: [
      { label: 'Two', value: '2' },
      { label: 'Three', value: '3' },
      { label: 'Four or more', value: '4+' },
    ],
    showWhen: { questionId: 'pensions-no-signal', value: 'multiple' },
  })

  steps.push({
    id: 'pensions-multiple-cetv',
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    type: 'question',
    text: 'Have you requested CETVs for your pensions?',
    subtext: 'You\'ll need a CETV for each pension. They take 6-8 weeks.',
    options: [
      { label: 'Yes, for all of them', value: 'all' },
      { label: 'Yes, for some', value: 'some' },
      { label: 'No, not yet', value: 'not_yet' },
    ],
    showWhen: { questionId: 'pensions-no-signal', value: 'multiple' },
  })

  // ── Not sure path ──

  steps.push({
    id: 'pensions-unsure-help',
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    type: 'confirmation_message',
    text: 'Check your payslip — your workplace pension provider is usually listed there. You can also ask your employer\'s HR team. If you\'ve changed jobs, you may have pensions from previous employers too.',
    showWhen: { questionId: 'pensions-no-signal', value: 'unsure' },
  })

  return steps
}

// ═══ Debts (spec 22 §5, spec 25 screen 2h) ═══

// ═══ Debts (spec 22 §5) ═══
//
// Ladder:
//   1. Detect loan repayments, credit cards, BNPL by payee pattern
//   2. Credit cards: confirm + ask outstanding balance + sole/joint
//   3. Loans: classify type + balance + purpose + sole/joint
//   4. Car finance: PCP vs HP vs lease (affects whether car is an asset)
//   5. Student loans: SLC vs private (SLC often excluded from settlement)
//   6. Overdraft: auto-confirm
//   7. Catch-all: any other debts (including informal, tax, collections)?
//
// Cross-section impacts:
//   → Property: secured loans captured as second charge
//   → Other assets: HP car finance means car IS an asset (Form E 2.8)
//   → Spending: debt repayments are committed spending

const CREDIT_CARD_PROVIDERS = [
  'amex', 'american express', 'barclaycard', 'mbna', 'capital one',
  'hsbc card', 'natwest card', 'lloyds card', 'virgin money',
  'aqua', 'marbles', 'vanquis', 'tesco bank', 'sainsbury',
  // Additional UK credit card providers
  'newday', 'creation', 'zopa card', 'monzo credit', 'tandem',
  'ocean', 'chrome', 'fluid', 'luma', 'bank of ireland',
  'jaja', 'curve', 'cashplus',
]

const BNPL_PROVIDERS = [
  'klarna', 'clearpay', 'afterpay', 'laybuy', 'zilch', 'paypal credit',
  'splitit', 'divido', 'deko',
]

function generateDebtsSteps(extractions: BankStatementExtraction[]): ConfirmationStep[] {
  const allPayments = extractions.flatMap((e) => e.regular_payments)
  const steps: ConfirmationStep[] = []

  // ── Detect different debt types ──
  // Credit cards and BNPL detected by payee name; loans by category minus those already matched
  const creditCards = allPayments.filter((p) =>
    matchesPayee(p.payee, CREDIT_CARD_PROVIDERS),
  )
  const bnpl = allPayments.filter((p) =>
    matchesPayee(p.payee, BNPL_PROVIDERS),
  )
  const loans = allPayments.filter((p) =>
    p.likely_category === 'loan_repayment' &&
    !matchesPayee(p.payee, BNPL_PROVIDERS) &&
    !matchesPayee(p.payee, CREDIT_CARD_PROVIDERS),
  )
  const hasOverdraft = extractions.some((e) => (e.closing_balance ?? 0) < 0)

  // ── Credit cards: confirm + balance + sole/joint ──
  if (creditCards.length > 0) {
    const cc = creditCards[0]
    steps.push({
      id: 'debts-cc-0-confirm',
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'confirmation_message',
      text: `Credit card: £${cc.amount}/month to ${cc.payee}.`,
    })
    steps.push({
      id: 'debts-cc-0-balance',
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'input',
      text: `What's the outstanding balance on your ${cc.payee} card?`,
      inputPrefix: '£',
      inputPlaceholder: 'e.g. 3,200',
    })
    steps.push({
      id: 'debts-cc-0-joint',
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'question',
      text: 'Is this card in your name only, or joint?',
      options: [
        { label: 'My name only', value: 'sole' },
        { label: 'Joint with my partner', value: 'joint' },
      ],
    })

    if (creditCards.length > 1) {
      const cc2 = creditCards[1]
      steps.push({
        id: 'debts-cc-1-balance',
        sectionKey: 'debts',
        sectionLabel: 'Debts',
        type: 'input',
        text: `You also pay £${cc2.amount}/month to ${cc2.payee}. Outstanding balance?`,
        inputPrefix: '£',
        inputPlaceholder: 'e.g. 1,500',
      })
    }
  }

  // ── BNPL: auto-confirm ──
  if (bnpl.length > 0) {
    const b = bnpl[0]
    steps.push({
      id: 'debts-bnpl',
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'confirmation_message',
      text: `Buy now pay later: £${b.amount}/month to ${b.payee}. We've noted this.`,
    })
  }

  // ── Loans: classify + balance + purpose + sole/joint (top 2) ──
  for (let i = 0; i < Math.min(loans.length, 2); i++) {
    const loan = loans[i]
    steps.push({
      id: `debts-loan-${i}`,
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'question',
      text: `£${loan.amount}/month to ${loan.payee}. What is this?`,
      options: [
        { label: 'Personal loan', value: 'personal_loan' },
        { label: 'Car finance', value: 'car_finance' },
        { label: 'Student loan', value: 'student_loan' },
        { label: 'Secured loan on property', value: 'secured' },
        { label: 'Something else', value: 'other' },
      ],
    })

    // Balance (not for student loan — SLC handles that)
    steps.push({
      id: `debts-loan-${i}-balance`,
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'input',
      text: 'Roughly, what is the outstanding balance?',
      inputPrefix: '£',
      inputPlaceholder: 'e.g. 8,000',
      showWhen: { questionId: `debts-loan-${i}`, value: ['personal_loan', 'car_finance', 'secured'] },
    })

    // Purpose (personal loan / secured)
    steps.push({
      id: `debts-loan-${i}-purpose`,
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'question',
      text: 'What was this loan for?',
      options: [
        { label: 'Home improvements', value: 'home' },
        { label: 'Car purchase', value: 'car' },
        { label: 'Debt consolidation', value: 'consolidation' },
        { label: 'Business purposes', value: 'business' },
        { label: 'Something else', value: 'other' },
      ],
      showWhen: { questionId: `debts-loan-${i}`, value: ['personal_loan', 'secured'] },
    })

    // Sole / joint (personal loan / secured)
    steps.push({
      id: `debts-loan-${i}-joint`,
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'question',
      text: 'Is this debt in your name only, or joint?',
      options: [
        { label: 'My name only', value: 'sole' },
        { label: 'Joint with my partner', value: 'joint' },
        { label: 'In my partner\'s name (I pay it)', value: 'partner' },
      ],
      showWhen: { questionId: `debts-loan-${i}`, value: ['personal_loan', 'secured'] },
    })

    // Car finance type (PCP/HP/lease — affects whether car is an asset)
    steps.push({
      id: `debts-loan-${i}-car-type`,
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'question',
      text: 'What type of car finance?',
      subtext: 'This matters because some types mean you own the car and some don\'t.',
      options: [
        { label: 'HP (Hire Purchase) — I\'ll own the car when paid off', value: 'hp' },
        { label: 'PCP (Personal Contract Purchase) — balloon payment at end', value: 'pcp' },
        { label: 'Lease — I never own the car', value: 'lease' },
        { label: 'Not sure', value: 'unsure' },
      ],
      showWhen: { questionId: `debts-loan-${i}`, value: 'car_finance' },
    })

    // Student loan type (SLC vs private)
    steps.push({
      id: `debts-loan-${i}-student-type`,
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'question',
      text: 'Is this a government student loan or private?',
      subtext: 'Government loans (SLC) are repaid through your salary and written off after 25-30 years.',
      options: [
        { label: 'Student Loans Company (government)', value: 'slc' },
        { label: 'Private student loan', value: 'private' },
      ],
      showWhen: { questionId: `debts-loan-${i}`, value: 'student_loan' },
    })
  }

  // ── Overdraft: auto-confirm ──
  if (hasOverdraft) {
    const minBalance = Math.min(...extractions.map((e) => e.closing_balance ?? 0))
    steps.push({
      id: 'debts-overdraft',
      sectionKey: 'debts',
      sectionLabel: 'Debts',
      type: 'confirmation_message',
      text: `Your account has gone into overdraft (up to £${Math.abs(minBalance).toLocaleString()}). We've noted this.`,
    })
  }

  // ── Catch-all ──
  const hasAnyDetected = creditCards.length > 0 || bnpl.length > 0 || loans.length > 0 || hasOverdraft

  steps.push({
    id: 'debts-other',
    sectionKey: 'debts',
    sectionLabel: 'Debts',
    type: 'question',
    text: hasAnyDetected
      ? 'Do you have any other debts we haven\'t covered?'
      : 'We didn\'t find any obvious debt payments. Do you have any debts?',
    options: hasAnyDetected
      ? [
          { label: 'No, that covers it', value: 'none' },
          { label: 'Yes, credit card(s)', value: 'credit_cards' },
          { label: 'Yes, personal loan(s)', value: 'loans' },
          { label: 'Yes, money owed to family or friends', value: 'informal' },
          { label: 'Yes, outstanding tax (HMRC)', value: 'tax' },
          { label: 'Yes, other debts', value: 'other' },
        ]
      : [
          { label: 'No debts', value: 'none' },
          { label: 'Yes, credit card(s)', value: 'credit_cards' },
          { label: 'Yes, personal loan(s)', value: 'loans' },
          { label: 'Yes, car finance', value: 'car_finance' },
          { label: 'Yes, money owed to family or friends', value: 'informal' },
          { label: 'Yes, outstanding tax (HMRC)', value: 'tax' },
          { label: 'Yes, other debts', value: 'other' },
        ],
  })

  steps.push({
    id: 'debts-other-amount',
    sectionKey: 'debts',
    sectionLabel: 'Debts',
    type: 'input',
    text: 'Roughly, what is the total amount owed?',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 5,000',
    showWhen: { questionId: 'debts-other', value: ['credit_cards', 'loans', 'car_finance', 'informal', 'tax', 'other'] },
  })

  return steps
}

// ═══ Mini-summary generation ═══

export function generateSectionSummary(
  sectionKey: ConfirmationSectionKey,
  answers: Record<string, string>,
  extractions: BankStatementExtraction[],
): SectionSummaryData {
  switch (sectionKey) {
    case 'income': return generateIncomeSummary(answers, extractions)
    case 'property': return generatePropertySummary(answers, extractions)
    case 'accounts': return generateAccountsSummary(extractions, answers)
    case 'pensions': return generatePensionsSummary(answers)
    case 'debts': return generateDebtsSummary(answers, extractions)
    case 'business': return generateBusinessSummary(answers)
    case 'other_assets': return generateOtherAssetsSummary(answers)
  }
}

function generateIncomeSummary(
  answers: Record<string, string>,
  extractions: BankStatementExtraction[],
): SectionSummaryData {
  const allIncome = extractions.flatMap((e) => e.income_deposits)
  const employment = allIncome.filter((i) => i.type === 'employment')
  const benefits = allIncome.filter((i) => i.type === 'benefits')
  const facts: SectionSummaryFact[] = []

  // ── Employment ──
  if (employment.length > 0 && answers['income-salary'] === 'yes') {
    const primary = employment[0]
    facts.push({ label: `Employed by ${primary.source}`, source: 'bank' })
    facts.push({
      label: `£${primary.amount.toLocaleString()} net monthly salary`,
      source: 'bank',
      gapMessage: 'For finalisation, we\'ll need your payslips and P60 for gross pay breakdown.',
    })
    if (employment.length > 1 && answers['income-second-employer'] === 'yes') {
      const second = employment[1]
      facts.push({ label: `Second job: £${second.amount.toLocaleString()}/month from ${second.source}`, source: 'bank' })
    }
  } else if (answers['income-salary'] === 'no') {
    const notSalary = answers['income-not-salary']
    if (notSalary === 'dividends') {
      facts.push({ label: 'Income is dividends from own company', source: 'self', gapMessage: 'For finalisation, we\'ll need company accounts and tax returns.' })
    } else if (notSalary === 'rental') {
      facts.push({ label: 'Income is rental income', source: 'self' })
    } else if (notSalary === 'maintenance') {
      facts.push({ label: 'Income is maintenance from ex-partner', source: 'self' })
    }
  }

  // ── No employment path ──
  const noIncome = answers['income-none']
  if (noIncome === 'different_account') {
    const amount = answers['income-other-account-amount']
    facts.push({ label: `Employed, paid into another account${amount ? ` — ~£${amount}/month` : ''}`, source: 'self' })
  } else if (noIncome === 'self_employed') {
    const structure = answers['income-self-employed-structure']
    facts.push({ label: `Self-employed${structure ? ` (${structure.replace('_', ' ')})` : ''}`, source: 'self', gapMessage: 'For finalisation, we\'ll need business accounts and tax returns (SA302).' })
  } else if (noIncome === 'retired') {
    facts.push({ label: 'Retired', source: 'self' })
  } else if (noIncome === 'not_working') {
    facts.push({ label: 'Not currently working', source: 'self' })
  } else if (noIncome === 'carer') {
    facts.push({ label: 'Full-time parent or carer', source: 'self' })
  } else if (noIncome === 'sick') {
    facts.push({ label: 'On long-term sick or disability', source: 'self' })
  }

  // ── Benefits ──
  for (const b of benefits) {
    facts.push({ label: `${b.source}: £${b.amount}/month`, source: 'bank' })
  }

  // ── DWP type ──
  const dwpType = answers['income-dwp-type']
  if (dwpType && dwpType !== 'other') {
    const labels: Record<string, string> = {
      universal_credit: 'Universal Credit',
      pip: 'PIP',
      esa: 'ESA',
      carers: 'Carer\'s Allowance',
      state_pension: 'State Pension',
    }
    facts.push({ label: `DWP benefit type: ${labels[dwpType] ?? dwpType}`, source: 'self' })
  }

  // ── Unclassified ──
  const unclassified = answers['income-unclassified']
  if (unclassified === 'rental') facts.push({ label: 'Rental income identified', source: 'self' })
  else if (unclassified === 'maintenance') facts.push({ label: 'Maintenance received from ex-partner', source: 'self' })
  else if (unclassified === 'lodger') facts.push({ label: 'Lodger income identified', source: 'self' })

  return {
    sectionKey: 'income',
    sectionLabel: 'Income',
    heading: "That's it for income",
    facts: facts.length > 0 ? facts : [{ label: 'No income sources identified', source: 'self' }],
    accordionLabel: 'Income captured, ready to share',
  }
}

function generatePropertySummary(
  answers: Record<string, string>,
  extractions: BankStatementExtraction[],
): SectionSummaryData {
  const mortgage = extractions.flatMap((e) => e.regular_payments).find((p) => p.likely_category === 'mortgage')
  const facts: SectionSummaryFact[] = []
  const calculated: { label: string; value: string }[] = []

  // ── Determine ownership from either entry path ──
  const ownsProperty =
    answers['property-mortgage'] === 'yes' ||
    answers['property-no-signal'] === 'yes_mortgage' ||
    answers['property-no-signal'] === 'yes_outright'
  const isRenting =
    answers['property-mortgage'] === 'rent' ||
    answers['property-no-signal'] === 'rent'

  const jointAnswer = answers['property-joint']
  const isJoint = jointAnswer === 'joint_partner'
  const scheme = answers['property-scheme']
  const ownershipPct = answers['property-ownership-pct'] ? parseInt(answers['property-ownership-pct'], 10) : null
  const propertyValue = answers['property-value'] ? parseInt(answers['property-value'].replace(/,/g, ''), 10) : null
  const mortgageBalance = answers['property-mortgage-balance'] ? parseInt(answers['property-mortgage-balance'].replace(/,/g, ''), 10) : null
  const htbBalance = answers['property-htb-balance'] ? parseInt(answers['property-htb-balance'].replace(/,/g, ''), 10) : null
  const occupation = answers['property-occupation']
  const status = answers['property-status']

  if (isRenting) {
    facts.push({ label: 'You rent your home — no property to add', source: 'self' })
    return {
      sectionKey: 'property',
      sectionLabel: 'Property',
      heading: "That's it for property",
      facts,
      accordionLabel: 'No property to add',
    }
  }

  if (!ownsProperty) {
    const situation = answers['property-no-signal']
    if (situation === 'partner_pays') {
      facts.push({ label: 'Your partner or family pays your housing costs', source: 'self' })
    } else if (situation === 'family') {
      facts.push({ label: 'You\'re living with family or friends', source: 'self' })
    }
    return {
      sectionKey: 'property',
      sectionLabel: 'Property',
      heading: "That's it for property",
      facts: facts.length > 0 ? facts : [{ label: 'No property to add', source: 'self' }],
      accordionLabel: 'No property to add',
    }
  }

  // ── Owns property ──

  // Ownership type
  const ownershipLabel = jointAnswer === 'sole' ? 'own' : jointAnswer === 'joint_partner' ? 'jointly own with your partner' : 'jointly own'
  const schemeLabel = scheme === 'shared_ownership' && ownershipPct ? ` (${ownershipPct}% shared ownership)` : scheme === 'help_to_buy' ? ' (Help to Buy)' : scheme === 'right_to_buy' ? ' (Right to Buy)' : ''
  const valueLabel = propertyValue ? `, estimated value £${propertyValue.toLocaleString()}` : ''
  facts.push({ label: `You ${ownershipLabel} a property${schemeLabel}${valueLabel}`, source: 'self' })

  // Mortgage balance
  if (mortgageBalance) {
    facts.push({ label: `Outstanding mortgage balance: £${mortgageBalance.toLocaleString()}`, source: mortgage ? 'bank' : 'self' })
  }

  // Help to Buy balance
  if (htbBalance) {
    facts.push({ label: `Outstanding Help to Buy loan: £${htbBalance.toLocaleString()}`, source: 'self' })
  }

  // Joint ownership note
  if (isJoint) {
    facts.push({ label: 'Jointly owned — the starting position in marriage is 50/50', source: 'self' })
  }

  // Occupation
  if (occupation === 'me') facts.push({ label: 'You currently live in the property', source: 'self' })
  else if (occupation === 'partner') facts.push({ label: 'Your partner currently lives in the property', source: 'self' })
  else if (occupation === 'both') facts.push({ label: 'You both currently live in the property', source: 'self' })
  else if (occupation === 'neither') facts.push({ label: 'The property is currently empty or rented out', source: 'self' })

  // Status
  if (status === 'on_market') facts.push({ label: 'The property is currently on the market', source: 'self' })
  else if (status === 'under_offer') facts.push({ label: 'Sale agreed or under offer', source: 'self' })
  else if (status === 'rented_out') facts.push({ label: 'The property is being rented out since separation', source: 'self' })

  // ── Equity calculation ──
  if (propertyValue) {
    let equity: number

    if (scheme === 'shared_ownership' && ownershipPct) {
      // Shared ownership: your share of value minus your mortgage
      const yourShare = Math.round(propertyValue * (ownershipPct / 100))
      equity = yourShare - (mortgageBalance ?? 0)
      calculated.push({
        label: `Your ${ownershipPct}% share is worth £${yourShare.toLocaleString()}, equity £${equity.toLocaleString()}`,
        value: `£${equity.toLocaleString()}`,
      })
    } else if (scheme === 'help_to_buy' && htbBalance) {
      // Help to Buy: value minus mortgage minus equity loan
      equity = propertyValue - (mortgageBalance ?? 0) - htbBalance
      calculated.push({
        label: `Estimated equity: £${equity.toLocaleString()} (after mortgage and Help to Buy loan)`,
        value: `£${equity.toLocaleString()}`,
      })
    } else if (mortgageBalance) {
      // Standard: value minus mortgage
      equity = propertyValue - mortgageBalance
      const label = equity >= 0
        ? `Estimated equity: £${equity.toLocaleString()}${isJoint ? ` — £${Math.round(equity / 2).toLocaleString()} each` : ''}`
        : `Negative equity: the mortgage exceeds the property value by £${Math.abs(equity).toLocaleString()}`
      calculated.push({ label, value: `£${equity.toLocaleString()}` })
    } else {
      // Own outright — full value is equity
      equity = propertyValue
      calculated.push({
        label: `No mortgage — full equity £${equity.toLocaleString()}${isJoint ? ` — £${Math.round(equity / 2).toLocaleString()} each` : ''}`,
        value: `£${equity.toLocaleString()}`,
      })
    }
  }

  // ── Gap messages ──
  if (mortgage) {
    facts.push({
      label: `Mortgage with ${mortgage.payee}`,
      source: 'bank',
      gapMessage: 'For finalisation, we\'ll need a mortgage statement for exact balance and terms. This estimate is fine for mediation.',
    })
  }

  if (answers['property-value-qualifier'] === 'estimate') {
    facts.push({
      label: 'Property value is an estimate',
      source: 'self',
      gapMessage: 'For finalisation, we\'ll need 3 estate agent valuations. This estimate is fine for mediation.',
    })
  }

  return {
    sectionKey: 'property',
    sectionLabel: 'Property',
    heading: "That's it for property",
    facts,
    calculatedValues: calculated.length > 0 ? calculated : undefined,
    accordionLabel: ownsProperty ? 'Property captured, ready to share' : 'No property to add',
  }
}

function generateAccountsSummary(
  extractions: BankStatementExtraction[],
  answers: Record<string, string>,
): SectionSummaryData {
  const facts: SectionSummaryFact[] = []

  // Connected accounts
  for (const ext of extractions) {
    const jointLabel = ext.is_joint ? ' (joint)' : ''
    facts.push({
      label: `${ext.provider} ${ext.account_type} account xxxx${ext.account_number_last4 ?? '****'}${jointLabel}, balance £${(ext.closing_balance ?? 0).toLocaleString()}`,
      source: 'bank',
    })
  }

  // Joint account clarification
  if (answers['accounts-joint'] === 'partner') {
    facts.push({ label: 'Joint account held with your partner — 50/50 starting position', source: 'self' })
  }

  // Detected transfers (iterate possible IDs)
  for (let i = 0; i < 3; i++) {
    const transferType = answers[`accounts-transfer-${i}`]
    const investmentType = answers[`accounts-investment-${i}`]
    const cryptoAnswer = answers[`accounts-crypto-${i}`]
    const value = answers[`accounts-transfer-${i}-value`] || answers[`accounts-investment-${i}-value`] || answers[`accounts-crypto-${i}-value`]
    const valueLabel = value ? ` — estimated £${parseInt(value.replace(/,/g, ''), 10).toLocaleString()}` : ''

    if (transferType === 'savings') facts.push({ label: `Savings account captured${valueLabel}`, source: 'self', gapMessage: 'For finalisation, we\'ll need a statement for this account.' })
    else if (transferType === 'isa') facts.push({ label: `ISA captured${valueLabel}`, source: 'self', gapMessage: 'For finalisation, we\'ll need a latest ISA statement.' })
    else if (transferType === 'investment') facts.push({ label: `Investment account captured${valueLabel}`, source: 'self', gapMessage: 'For finalisation, we\'ll need a latest valuation statement.' })
    else if (transferType === 'pension') facts.push({ label: 'Pension contribution identified — added to pensions section', source: 'self' })

    if (investmentType === 'isa') facts.push({ label: `Stocks & shares ISA${valueLabel}`, source: 'self', gapMessage: 'For finalisation, we\'ll need a latest valuation.' })
    else if (investmentType === 'investment') facts.push({ label: `Investment account${valueLabel}`, source: 'self', gapMessage: 'For finalisation, we\'ll need a latest valuation.' })
    else if (investmentType === 'sipp') facts.push({ label: `SIPP pension${valueLabel} — added to pensions section`, source: 'self' })

    if (cryptoAnswer === 'yes') facts.push({ label: `Cryptocurrency held${valueLabel}`, source: 'self' })
  }

  // App-based banks
  if (answers['accounts-app-banks'] === 'yes') {
    const appValue = answers['accounts-app-banks-detail']
    const appLabel = appValue ? ` — estimated £${parseInt(appValue.replace(/,/g, ''), 10).toLocaleString()}` : ''
    facts.push({ label: `App-based bank account(s) captured${appLabel}`, source: 'self', gapMessage: 'For finalisation, connect these accounts or provide screenshots.' })
  }

  // Closed accounts
  if (answers['accounts-closed'] === 'yes') {
    const closedValue = answers['accounts-closed-detail']
    const closedLabel = closedValue ? ` — balance at closure £${parseInt(closedValue.replace(/,/g, ''), 10).toLocaleString()}` : ''
    facts.push({ label: `Recently closed account(s)${closedLabel}`, source: 'self', gapMessage: 'For finalisation, we\'ll need closing statements.' })
  }

  // Other accounts catch-all
  const otherType = answers['accounts-other']
  const otherValue = answers['accounts-other-value']
  const otherLabel = otherValue ? ` — estimated £${parseInt(otherValue.replace(/,/g, ''), 10).toLocaleString()}` : ''

  if (otherType === 'savings') facts.push({ label: `Additional savings account${otherLabel}`, source: 'self' })
  else if (otherType === 'isa') facts.push({ label: `Additional ISA${otherLabel}`, source: 'self' })
  else if (otherType === 'investments') facts.push({ label: `Additional investments${otherLabel}`, source: 'self' })
  else if (otherType === 'premium_bonds') facts.push({ label: `Premium bonds${otherLabel}`, source: 'self' })

  return {
    sectionKey: 'accounts',
    sectionLabel: 'Accounts',
    heading: "That's it for accounts",
    facts,
    accordionLabel: 'Accounts captured, ready to share',
  }
}

function generatePensionsSummary(answers: Record<string, string>): SectionSummaryData {
  const detectedYes = answers['pensions-detected'] === 'yes'
  const noSignalAnswer = answers['pensions-no-signal']
  const hasPension = detectedYes ||
    noSignalAnswer === 'workplace' ||
    noSignalAnswer === 'personal' ||
    noSignalAnswer === 'multiple' ||
    noSignalAnswer === 'drawing'
  const facts: SectionSummaryFact[] = []

  if (!hasPension) {
    if (noSignalAnswer === 'unsure') {
      facts.push({ label: 'Pension situation uncertain — check your payslip or ask your employer', source: 'self' })
    } else {
      facts.push({ label: 'No pensions to add', source: 'self' })
    }
    return {
      sectionKey: 'pensions',
      sectionLabel: 'Pensions',
      heading: "That's it for pensions",
      facts,
      accordionLabel: 'No pensions to add',
    }
  }

  // ── Pension type ──
  if (noSignalAnswer === 'drawing') {
    facts.push({ label: 'Already drawing pension income', source: 'self' })
    if (answers['pensions-drawing-other'] === 'yes') {
      facts.push({ label: 'Additional pensions not yet in payment', source: 'self', gapMessage: 'You\'ll need a CETV for each pension not yet in payment. This takes 6-8 weeks.' })
    }
  } else {
    // Count
    const count = answers['pensions-count'] || answers['pensions-multiple-count']
    if (count === '1') facts.push({ label: 'One pension', source: 'self' })
    else if (count) facts.push({ label: `${count} pensions`, source: 'self' })
    else facts.push({ label: 'Pension(s) to add', source: 'self' })

    // DB vs DC
    const pensionType = answers['pensions-type']
    if (pensionType === 'db') {
      facts.push({ label: 'Defined benefit (final salary / career average)', source: 'self' })
    } else if (pensionType === 'dc') {
      facts.push({ label: 'Defined contribution (money purchase)', source: 'self' })
    }

    // CETV status
    const cetvStatus = answers['pensions-cetv'] || answers['pensions-multiple-cetv']
    if (cetvStatus === 'requested' || cetvStatus === 'all') {
      facts.push({ label: 'CETV already requested', source: 'self' })
    } else {
      facts.push({
        label: 'CETV not yet requested',
        source: 'self',
        gapMessage: 'Request a CETV from your pension provider(s) now — it takes 6-8 weeks and is required for disclosure.',
      })
    }
  }

  // Source label
  const sourceLabel = noSignalAnswer === 'workplace' ? 'Workplace pension' :
    noSignalAnswer === 'personal' ? 'Personal pension' :
    detectedYes ? 'Personal pension' : 'Pension'

  return {
    sectionKey: 'pensions',
    sectionLabel: 'Pensions',
    heading: "That's it for pensions",
    facts,
    accordionLabel: `${sourceLabel} captured, ready to share`,
  }
}

function generateDebtsSummary(answers: Record<string, string>, extractions: BankStatementExtraction[]): SectionSummaryData {
  const allPayments = extractions.flatMap((e) => e.regular_payments)
  const facts: SectionSummaryFact[] = []

  // ── Credit cards (with balance + sole/joint) ──
  const creditCards = allPayments.filter((p) => matchesPayee(p.payee, CREDIT_CARD_PROVIDERS))
  for (let i = 0; i < Math.min(creditCards.length, 2); i++) {
    const cc = creditCards[i]
    const balance = answers[`debts-cc-${i}-balance`]
    const joint = answers[`debts-cc-${i}-joint`]
    const balanceLabel = balance ? `, £${parseInt(balance.replace(/,/g, ''), 10).toLocaleString()} outstanding` : ''
    const jointLabel = joint === 'joint' ? ' (joint)' : ''
    facts.push({
      label: `Credit card: ${cc.payee}${jointLabel}${balanceLabel}`,
      source: 'bank',
      gapMessage: 'For finalisation, we\'ll need a statement showing the outstanding balance.',
    })
  }

  // ── BNPL ──
  const bnpl = allPayments.filter((p) => matchesPayee(p.payee, BNPL_PROVIDERS))
  for (const b of bnpl) {
    facts.push({ label: `Buy now pay later: ${b.payee}`, source: 'bank' })
  }

  // ── Overdraft ──
  if (extractions.some((e) => (e.closing_balance ?? 0) < 0)) {
    facts.push({ label: 'Overdraft facility used', source: 'bank' })
  }

  // ── Classified loans (with balance, purpose, sole/joint, sub-type) ──
  for (let i = 0; i < 2; i++) {
    const loanType = answers[`debts-loan-${i}`]
    if (!loanType || loanType === 'other') continue

    const balance = answers[`debts-loan-${i}-balance`]
    const purpose = answers[`debts-loan-${i}-purpose`]
    const joint = answers[`debts-loan-${i}-joint`]
    const carType = answers[`debts-loan-${i}-car-type`]
    const studentType = answers[`debts-loan-${i}-student-type`]
    const balanceLabel = balance ? ` — ~£${parseInt(balance.replace(/,/g, ''), 10).toLocaleString()} outstanding` : ''
    const jointLabel = joint === 'joint' ? ' (joint)' : joint === 'partner' ? ' (partner\'s name)' : ''

    const purposeLabels: Record<string, string> = { home: 'home improvements', car: 'car purchase', consolidation: 'debt consolidation', business: 'business purposes' }

    if (loanType === 'personal_loan') {
      const purposeText = purpose && purposeLabels[purpose] ? ` for ${purposeLabels[purpose]}` : ''
      facts.push({ label: `Personal loan${purposeText}${jointLabel}${balanceLabel}`, source: 'bank', gapMessage: 'For finalisation, we\'ll need a loan statement.' })
    } else if (loanType === 'car_finance') {
      const carLabels: Record<string, string> = { hp: 'HP — car is an asset', pcp: 'PCP — balloon payment at end', lease: 'Lease — not an asset' }
      const typeText = carType && carLabels[carType] ? ` (${carLabels[carType]})` : ''
      facts.push({ label: `Car finance${typeText}${balanceLabel}`, source: 'bank', gapMessage: 'For finalisation, we\'ll need the finance agreement.' })
    } else if (loanType === 'student_loan') {
      if (studentType === 'slc') {
        facts.push({ label: 'Student loan (SLC) — repaid through salary, often excluded from settlement', source: 'bank' })
      } else {
        facts.push({ label: 'Private student loan', source: 'bank', gapMessage: 'For finalisation, we\'ll need a statement of the outstanding balance.' })
      }
    } else if (loanType === 'secured') {
      facts.push({ label: `Secured loan on property${jointLabel}${balanceLabel}`, source: 'bank' })
    }
  }

  // ── Other debts from catch-all ──
  const otherDebts = answers['debts-other']
  const otherAmount = answers['debts-other-amount']
  const otherLabel = otherAmount ? ` — ~£${parseInt(otherAmount.replace(/,/g, ''), 10).toLocaleString()}` : ''

  if (otherDebts === 'credit_cards') facts.push({ label: `Additional credit card debt${otherLabel}`, source: 'self' })
  else if (otherDebts === 'loans') facts.push({ label: `Additional loan(s)${otherLabel}`, source: 'self' })
  else if (otherDebts === 'car_finance') facts.push({ label: `Car finance${otherLabel}`, source: 'self' })
  else if (otherDebts === 'informal') facts.push({ label: `Money owed to family or friends${otherLabel}`, source: 'self' })
  else if (otherDebts === 'tax') facts.push({ label: `Outstanding tax (HMRC)${otherLabel}`, source: 'self' })
  else if (otherDebts === 'other') facts.push({ label: `Other debts${otherLabel}`, source: 'self' })

  const hasAnyDebts = facts.length > 0

  if (!hasAnyDebts) {
    facts.push({ label: 'No debts to add', source: 'self' })
  }

  return {
    sectionKey: 'debts',
    sectionLabel: 'Debts',
    heading: "That's it for debts",
    facts,
    accordionLabel: hasAnyDebts ? 'Debts captured, ready to share' : 'No debts to add',
  }
}

// ═══ Business (Form E 2.10, 2.11, 2.16) ═══
//
// Ladder:
//   1. Check for signals (Companies House, HMRC SA, dividends answer from income)
//   2. Cold ask if no signals
//   3. If yes: structure, value, accountant
//
// Cross-section: income answer 'dividends' or 'self_employed' implies business

const BUSINESS_PAYEES = [
  'companies house', 'hmrc self assessment', 'hmrc sa', 'hmrc ndds',
  'hmrc shipley', 'hmrc cumbernauld', 'hmrc self',
  'accountant', 'bookkeeper', 'xero', 'quickbooks', 'freeagent', 'sage',
  'corporation tax', 'company tax',
]

function generateBusinessSteps(extractions: BankStatementExtraction[]): ConfirmationStep[] {
  const allPayments = extractions.flatMap((e) => e.regular_payments)
  const businessSignals = allPayments.filter((p) =>
    BUSINESS_PAYEES.some((bp) => p.payee.toLowerCase().includes(bp)),
  )
  const steps: ConfirmationStep[] = []

  if (businessSignals.length > 0) {
    const signalPayees = businessSignals.map((s) => s.payee).join(', ')
    steps.push({
      id: 'business-detected',
      sectionKey: 'business',
      sectionLabel: 'Business',
      type: 'question',
      text: `We noticed payments to ${signalPayees} — do you have business interests?`,
      options: [
        { label: 'Yes, I have a business', value: 'yes' },
        { label: 'No, that\'s something else', value: 'no' },
      ],
    })
  } else {
    steps.push({
      id: 'business-cold',
      sectionKey: 'business',
      sectionLabel: 'Business',
      type: 'question',
      text: 'Do you have any business interests?',
      subtext: 'This includes sole trading, a limited company, a partnership, or shares in a business.',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    })
  }

  steps.push({
    id: 'business-structure',
    sectionKey: 'business',
    sectionLabel: 'Business',
    type: 'question',
    text: "What's your business structure?",
    options: [
      { label: 'Sole trader', value: 'sole_trader' },
      { label: 'Limited company (Ltd)', value: 'limited' },
      { label: 'Partnership / LLP', value: 'partnership' },
      { label: 'Shares in someone else\'s business', value: 'shares' },
    ],
    showWhen: { questionId: businessSignals.length > 0 ? 'business-detected' : 'business-cold', value: 'yes' },
  })

  steps.push({
    id: 'business-value',
    sectionKey: 'business',
    sectionLabel: 'Business',
    type: 'input',
    text: "What's the approximate value of your business interest?",
    subtext: 'A rough estimate is fine for now.',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 50,000',
    showWhen: { questionId: businessSignals.length > 0 ? 'business-detected' : 'business-cold', value: 'yes' },
  })

  steps.push({
    id: 'business-accountant',
    sectionKey: 'business',
    sectionLabel: 'Business',
    type: 'question',
    text: 'Do you have an accountant who can provide business accounts?',
    options: [
      { label: 'Yes, I have an accountant', value: 'yes' },
      { label: 'No', value: 'no' },
      { label: "I'm not sure", value: 'unsure' },
    ],
    showWhen: { questionId: businessSignals.length > 0 ? 'business-detected' : 'business-cold', value: 'yes' },
  })

  // ── Director's loan account (commonly omitted, Form E 2.10/2.16) ──
  steps.push({
    id: 'business-directors-loan',
    sectionKey: 'business',
    sectionLabel: 'Business',
    type: 'question',
    text: "Do you have a director's loan account with your company?",
    subtext: "This is money you've lent to or borrowed from your company — it must be disclosed.",
    options: [
      { label: 'Yes, the company owes me money', value: 'owed_to_me' },
      { label: 'Yes, I owe the company money', value: 'i_owe' },
      { label: 'No', value: 'no' },
      { label: "I'm not sure", value: 'unsure' },
    ],
    showWhen: { questionId: 'business-structure', value: 'limited' },
  })

  steps.push({
    id: 'business-directors-loan-amount',
    sectionKey: 'business',
    sectionLabel: 'Business',
    type: 'input',
    text: "What's the balance on your director's loan account?",
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 15,000',
    showWhen: { questionId: 'business-directors-loan', value: ['owed_to_me', 'i_owe'] },
  })

  return steps
}

function generateBusinessSummary(answers: Record<string, string>): SectionSummaryData {
  const hasBusiness = answers['business-detected'] === 'yes' || answers['business-cold'] === 'yes'
  const facts: SectionSummaryFact[] = []

  if (hasBusiness) {
    const structures: Record<string, string> = {
      sole_trader: 'Sole trader',
      limited: 'Limited company',
      partnership: 'Partnership / LLP',
      shares: 'Shares in a business',
    }
    const structure = structures[answers['business-structure']] ?? 'Business'
    facts.push({ label: structure, source: 'self' })

    if (answers['business-value']) {
      facts.push({ label: `Estimated value: £${parseInt(answers['business-value'].replace(/,/g, ''), 10).toLocaleString()}`, source: 'self' })
    }

    const accountantLabels: Record<string, string> = {
      yes: 'Has an accountant',
      no: 'No accountant',
      unsure: 'Accountant status uncertain',
    }
    if (answers['business-accountant']) {
      facts.push({ label: accountantLabels[answers['business-accountant']] ?? 'Accountant unknown', source: 'self' })
    }

    // Director's loan account
    const loanAnswer = answers['business-directors-loan']
    const loanAmount = answers['business-directors-loan-amount']
    const loanLabel = loanAmount ? ` — £${parseInt(loanAmount.replace(/,/g, ''), 10).toLocaleString()}` : ''
    if (loanAnswer === 'owed_to_me') {
      facts.push({ label: `Director's loan: company owes you${loanLabel}`, source: 'self' })
    } else if (loanAnswer === 'i_owe') {
      facts.push({ label: `Director's loan: you owe the company${loanLabel}`, source: 'self' })
    }
  } else {
    facts.push({ label: 'No business interests to add', source: 'self' })
  }

  return {
    sectionKey: 'business',
    sectionLabel: 'Business',
    heading: "That's it for business",
    facts,
    accordionLabel: hasBusiness ? 'Business interests captured, ready to share' : 'No business interests to add',
  }
}

// ═══ Other assets (Form E 2.4–2.9) ═══
//
// Uses checklist step type — multi-select with follow-up value questions.
// Signals: crypto exchanges, car insurance, investment platforms.

const CRYPTO_PAYEES = ['coinbase', 'binance', 'kraken', 'crypto.com', 'bitstamp', 'gemini', 'luno', 'cex.io', 'blockchain.com', 'swissborg']
const INVESTMENT_PAYEES = ['hargreaves lansdown', 'hl ', 'aj bell', 'vanguard', 'interactive investor', 'trading 212', 'freetrade', 'nutmeg', 'moneybox', 'wealthify', 'bestinvest', 'charles stanley', 'etoro', 'dodl']

function generateOtherAssetsSteps(extractions: BankStatementExtraction[]): ConfirmationStep[] {
  const allPayments = extractions.flatMap((e) => e.regular_payments)
  const steps: ConfirmationStep[] = []

  // Detect signals for pre-checking
  const hasCryptoSignal = allPayments.some((p) =>
    CRYPTO_PAYEES.some((cp) => p.payee.toLowerCase().includes(cp)),
  )
  const hasInvestmentSignal = allPayments.some((p) =>
    INVESTMENT_PAYEES.some((ip) => p.payee.toLowerCase().includes(ip)),
  )
  const hasVehicleSignal = allPayments.some((p) =>
    p.likely_category === 'insurance' && !p.payee.toLowerCase().includes('life'),
  )

  const hints: string[] = []
  if (hasCryptoSignal) hints.push('crypto payments')
  if (hasInvestmentSignal) hints.push('investment transfers')
  if (hasVehicleSignal) hints.push('vehicle insurance')

  steps.push({
    id: 'assets-checklist',
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    type: 'checklist',
    text: 'Do you have any of these assets?',
    subtext: hints.length > 0
      ? `We noticed ${hints.join(', ')} in your bank data. Tick all that apply.`
      : 'Tick all that apply — we\'ll ask about each one briefly.',
    options: [
      { label: 'A vehicle (car, motorbike, etc.)', value: 'vehicle' },
      { label: 'Cryptocurrency or digital assets', value: 'crypto' },
      { label: 'Investments (stocks, ISAs, bonds, funds)', value: 'investments' },
      { label: 'Life insurance or endowment policies', value: 'life_insurance' },
      { label: 'Valuables worth over £500 (jewellery, art, antiques)', value: 'valuables' },
      { label: 'Property or assets held overseas', value: 'overseas' },
      { label: 'None of the above', value: 'none' },
    ],
  })

  // Follow-up value questions — each shown when the parent checklist includes that value
  steps.push({
    id: 'assets-vehicle-value',
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    type: 'input',
    text: "What's the approximate value of your vehicle(s)?",
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 8,000',
    showWhen: { questionId: 'assets-checklist', value: 'vehicle' },
  })

  steps.push({
    id: 'assets-crypto-value',
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    type: 'input',
    text: "What's the approximate value of your crypto / digital assets?",
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 5,000',
    showWhen: { questionId: 'assets-checklist', value: 'crypto' },
  })

  steps.push({
    id: 'assets-investments-value',
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    type: 'input',
    text: "What's the approximate value of your investments?",
    subtext: 'Include ISAs, stocks & shares, bonds, and funds.',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 25,000',
    showWhen: { questionId: 'assets-checklist', value: 'investments' },
  })

  steps.push({
    id: 'assets-life-insurance-type',
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    type: 'question',
    text: 'What type of life insurance do you have?',
    options: [
      { label: 'Term life (no cash value)', value: 'term' },
      { label: 'Whole of life / endowment (has a cash value)', value: 'whole_of_life' },
      { label: "I'm not sure", value: 'unsure' },
    ],
    showWhen: { questionId: 'assets-checklist', value: 'life_insurance' },
  })

  steps.push({
    id: 'assets-life-insurance-value',
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    type: 'input',
    text: "What's the current surrender value of your life insurance?",
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 15,000',
    showWhen: { questionId: 'assets-life-insurance-type', value: ['whole_of_life', 'unsure'] },
  })

  steps.push({
    id: 'assets-valuables-value',
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    type: 'input',
    text: "What's the approximate total value of your valuables?",
    subtext: 'Jewellery, art, antiques, or other items worth over £500.',
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 3,000',
    showWhen: { questionId: 'assets-checklist', value: 'valuables' },
  })

  steps.push({
    id: 'assets-overseas-value',
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    type: 'input',
    text: "What's the approximate value of your overseas assets?",
    inputPrefix: '£',
    inputPlaceholder: 'e.g. 40,000',
    showWhen: { questionId: 'assets-checklist', value: 'overseas' },
  })

  return steps
}

function generateOtherAssetsSummary(answers: Record<string, string>): SectionSummaryData {
  const checklist = answers['assets-checklist'] ?? ''
  const selected = checklist.split(',').filter(Boolean)
  const hasNone = selected.includes('none') || selected.length === 0
  const facts: SectionSummaryFact[] = []

  if (hasNone) {
    facts.push({ label: 'No other assets to add', source: 'self' })
  } else {
    const formatValue = (key: string) => {
      const raw = answers[key]
      if (!raw) return null
      const num = parseInt(raw.replace(/,/g, ''), 10)
      return isNaN(num) ? null : `£${num.toLocaleString()}`
    }

    if (selected.includes('vehicle')) {
      const v = formatValue('assets-vehicle-value')
      facts.push({ label: `Vehicle${v ? ` — estimated ${v}` : ''}`, source: 'self' })
    }
    if (selected.includes('crypto')) {
      const v = formatValue('assets-crypto-value')
      facts.push({ label: `Cryptocurrency${v ? ` — estimated ${v}` : ''}`, source: 'self' })
    }
    if (selected.includes('investments')) {
      const v = formatValue('assets-investments-value')
      facts.push({ label: `Investments${v ? ` — estimated ${v}` : ''}`, source: 'self' })
    }
    if (selected.includes('life_insurance')) {
      const liType = answers['assets-life-insurance-type']
      const v = formatValue('assets-life-insurance-value')
      const typeLabel = liType === 'term' ? 'Term life (no cash value)' : liType === 'whole_of_life' ? `Whole of life${v ? ` — surrender value ${v}` : ''}` : `Life insurance${v ? ` — estimated ${v}` : ''}`
      facts.push({ label: typeLabel, source: 'self' })
    }
    if (selected.includes('valuables')) {
      const v = formatValue('assets-valuables-value')
      facts.push({ label: `Valuables${v ? ` — estimated ${v}` : ''}`, source: 'self' })
    }
    if (selected.includes('overseas')) {
      const v = formatValue('assets-overseas-value')
      facts.push({ label: `Overseas assets${v ? ` — estimated ${v}` : ''}`, source: 'self' })
    }
  }

  return {
    sectionKey: 'other_assets',
    sectionLabel: 'Other assets',
    heading: "That's it for other assets",
    facts,
    accordionLabel: hasNone ? 'No other assets to add' : 'Other assets captured, ready to share',
  }
}
