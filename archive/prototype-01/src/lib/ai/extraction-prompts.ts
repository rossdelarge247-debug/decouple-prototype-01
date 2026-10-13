// Document-type-specific extraction prompts
// Grounded in spec 13 (extraction decision tree) and Form E field mapping
// Each prompt tells the AI exactly what to look for in that document type

import * as schemas from './extraction-schemas'

export const CLASSIFICATION_PROMPT = `You are classifying a UK financial document for someone going through separation/divorce.

Determine the document type from its content. Common types:
- bank_statement: Monthly account statements showing transactions, balances
- payslip: Employment payslip showing gross/net pay, tax, NI, deductions
- mortgage_statement: Annual or periodic mortgage statement showing balance, payments, rate
- pension_cetv: Pension valuation letter showing Cash Equivalent Transfer Value
- savings_statement: Savings account or ISA statement
- credit_card_statement: Credit card statement showing balance, transactions
- tax_return: SA302 tax calculation or self-assessment return
- p60: End of year certificate showing annual pay and tax
- business_accounts: Company or sole trader accounts
- property_valuation: Estate agent or surveyor property valuation
- unknown: Cannot determine

Return the document type, your confidence (0-1), the provider/institution name if visible, and a one-sentence description.`

export const BANK_STATEMENT_PROMPT = `You are analysing a UK bank statement for someone going through separation/divorce. Extract financial FACTS only — no reasoning, no questions, no suggestions. A separate system handles user interaction.

EXTRACT:

1. ACCOUNT DETAILS
   - Provider (bank name), last 4 of account number, account type (current/savings/joint), joint holder name if visible, statement period dates, closing balance

2. INCOME DEPOSITS
   For each regular deposit pattern:
   - Source name, amount, period (monthly/annual), confidence (0-1), type (employment/benefits/rental/self_employment/pension_income/maintenance/other)
   - Confidence guide: named employer with consistent amount = 0.95+, government reference = 0.95+, irregular amounts from varying sources = 0.5-0.8

3. REGULAR PAYMENTS OUT
   For each regular outgoing:
   - Payee name, amount, frequency, confidence (0-1), likely_category (mortgage/rent/insurance/pension_contribution/childcare/loan_repayment/child_maintenance/utilities/council_tax/subscription/unknown)
   - Confidence guide: named lender + £800+/month = mortgage 0.90, council tax DD = 0.97, named utility company = 0.93, payment to a person = 0.5

4. SPENDING CATEGORIES
   Group ALL outgoing transactions: category name, monthly average, transaction count. Calculate from actual transactions only.

5. NOTABLE TRANSACTIONS
   Flag only: transfers > £2,000, payments to solicitors/mediators, crypto exchanges, gambling. Include description, amount, date, reason flagged.

RULES:
- Extract ONLY values explicitly stated. Never invent.
- Do NOT generate questions, suggestions, or gap analysis.
- Do NOT include reasoning text — just the data.`

export const PAYSLIP_PROMPT = `You are analysing a UK payslip for someone going through separation/divorce. Your analysis feeds their financial disclosure (Form E section 2.15).

EXTRACT ALL of the following — every field that is printed on the payslip:

1. EMPLOYER: Company name
2. PAY PERIOD: Month/week covered
3. PAY DATE: Date of payment
4. GROSS PAY: Total before deductions (this period)
5. NET PAY: Take-home after all deductions (this period)
6. TAX DEDUCTED: Income tax this period
7. TAX CODE: e.g. 1257L
8. NATIONAL INSURANCE: NI contribution this period
9. PENSION CONTRIBUTION: Employee pension deduction (if shown)
10. STUDENT LOAN: Student loan repayment (if shown)
11. OTHER DEDUCTIONS: Any other deductions with labels and amounts
12. YTD GROSS: Year-to-date gross pay (if shown)
13. YTD TAX: Year-to-date tax paid (if shown)
14. OVERTIME/COMMISSION: Any variable pay component (if shown)
15. IS OVERTIME REGULAR: Is the overtime/commission a regular occurrence based on any YTD pattern?

CRITICAL RULES:
- Extract ONLY values explicitly printed on the payslip
- Every value must come from the document — never estimate
- If a field is not on the payslip, return null for that field
- Payslips are structured documents — every field should be clearly identifiable`

export const MORTGAGE_STATEMENT_PROMPT = `You are analysing a UK mortgage statement for someone going through separation/divorce. Your analysis feeds Form E section 2.1 (Property).

EXTRACT:
1. LENDER: Name of the mortgage provider
2. PROPERTY ADDRESS: If shown on the statement
3. ACCOUNT HOLDERS: All names listed (determines joint/sole)
4. IS JOINT: Whether the mortgage is in joint names
5. OUTSTANDING BALANCE: Current amount owed
6. MONTHLY PAYMENT: Regular payment amount
7. INTEREST RATE: Current rate (may be multiple parts)
8. RATE TYPE: Fixed, variable, tracker, or unknown
9. MORTGAGE TYPE: Repayment, interest-only, part-and-part, or unknown
10. TERM END DATE: When the mortgage ends
11. EARLY REPAYMENT CHARGE: Amount or percentage if shown
12. ERC END DATE: When the ERC expires
13. ARREARS: Any arrears amount
14. MULTIPLE PARTS: Whether the mortgage has multiple tranches
15. PARTS: If multiple parts, list each with balance, rate, and type

CRITICAL RULES:
- Many UK mortgages have multiple parts (e.g., a fixed-rate tranche and a variable tranche). Capture ALL parts.
- The outstanding balance is the key Form E figure — it determines equity when combined with property value.
- Early repayment charges are relevant if the property might be sold or remortgaged.
- Extract ONLY values explicitly stated in the document.`

export const PENSION_CETV_PROMPT = `You are analysing a UK pension CETV (Cash Equivalent Transfer Value) letter for someone going through separation/divorce. This feeds Form E section 2.13 (Pensions).

EXTRACT:
1. SCHEME NAME: Full name of the pension scheme
2. PROVIDER: The pension provider or administrator
3. PENSION TYPE: defined_benefit (final salary/career average), defined_contribution (money purchase), sipp, or unknown
4. CETV VALUE: The Cash Equivalent Transfer Value figure
5. CETV DATE: The date the CETV was calculated
6. ANNUAL PENSION AT RETIREMENT: If stated (typically for defined benefit schemes) — the annual pension income at normal retirement age
7. RETIREMENT AGE: Normal retirement age for this scheme
8. MEMBERSHIP START DATE: When the member joined the scheme
9. MEMBERSHIP END DATE: When membership ended (if applicable)
10. IS PUBLIC SECTOR: Whether this is a public sector scheme (NHS, Teachers, Police, Armed Forces, Civil Service)
11. SCHEME TYPE NAME: Specific scheme name if public sector (e.g., "NHS Pension Scheme", "Teachers' Pension Scheme")

CRITICAL RULES:
- The CETV is the single most important number — extract it precisely
- For defined benefit pensions, the annual pension figure is equally important
- Note whether this is public sector — processing times and complexity differ significantly
- If the letter mentions the CESS discount rate or McCloud remedy, note this
- Extract ONLY values explicitly stated in the document`

export const SAVINGS_STATEMENT_PROMPT = `You are analysing a UK savings or investment statement for someone going through separation/divorce. This feeds Form E sections 2.3 (Bank accounts) and 2.4 (Investments).

EXTRACT:
1. Provider name
2. Account type: savings, cash_isa, stocks_and_shares_isa, lifetime_isa, investment_fund, premium_bonds, other
3. Current balance or value
4. Account holder(s) — determines ownership (sole/joint)
5. Interest rate (if shown)
6. Any recent large withdrawals (date and amount)

Return as a bank_statement type with is_joint, provider, closing_balance, and any notable transactions.

CRITICAL RULES:
- For ISAs, distinguish between Cash ISA and Stocks & Shares ISA — they're different asset classes
- For investments, the current market value is what matters, not the amount originally invested
- Premium Bonds: the holding amount is the value (not the face value of individual bonds)
- Extract ONLY values explicitly stated in the document`

export const CREDIT_CARD_PROMPT = `You are analysing a UK credit card statement for someone going through separation/divorce. This feeds Form E section 2.14 (Liabilities).

EXTRACT:
1. Provider name
2. Outstanding balance
3. Credit limit
4. Minimum payment
5. Interest rate (APR)
6. Account holder(s) — sole or joint
7. Any notable purchases or payments

Return as a simple extraction with the key liability figures.

CRITICAL RULES:
- The outstanding balance is the key Form E figure — this is a liability
- Note whether the card is in sole or joint names
- Do not list individual transactions unless they're notable (>£500 or unusual)
- Extract ONLY values explicitly stated in the document`

export const P60_PROMPT = `You are analysing a UK P60 or SA302 tax calculation for someone going through separation/divorce. This feeds Form E sections 2.15–2.16 (Income).

EXTRACT:
1. Employer name (P60) or "Self Assessment" (SA302)
2. Tax year (e.g., "2025/26")
3. Total pay / total income for the year
4. Total tax deducted
5. Total National Insurance contributions
6. If SA302: self-employment profit, dividend income, rental income, any other income sources with amounts

CROSS-REFERENCING:
- P60 annual figures should broadly match payslip × 12 and bank statement deposits × 12
- SA302 shows ALL income sources — dividends indicate a company, rental indicates property income
- If this is a self-employed person, the profit figure is the key Form E disclosure value (not revenue)

CRITICAL RULES:
- The tax year matters — Form E needs current or most recent full year
- If there are multiple income sources, extract each separately
- Self-employment profit is NET profit after expenses, not turnover
- Extract ONLY values explicitly stated in the document`

// ═══ Prompt routing ═══

export function getExtractionPrompt(documentType: string): string {
  switch (documentType) {
    case 'bank_statement': return BANK_STATEMENT_PROMPT
    case 'payslip': return PAYSLIP_PROMPT
    case 'mortgage_statement': return MORTGAGE_STATEMENT_PROMPT
    case 'pension_cetv': return PENSION_CETV_PROMPT
    case 'savings_statement': return SAVINGS_STATEMENT_PROMPT
    case 'credit_card_statement': return CREDIT_CARD_PROMPT
    case 'p60':
    case 'tax_return': return P60_PROMPT
    default: return BANK_STATEMENT_PROMPT
  }
}

export function getExtractionSchema(documentType: string) {
  switch (documentType) {
    case 'bank_statement': return schemas.BANK_STATEMENT_SCHEMA
    case 'payslip': return schemas.PAYSLIP_SCHEMA
    case 'mortgage_statement': return schemas.MORTGAGE_STATEMENT_SCHEMA
    case 'pension_cetv': return schemas.PENSION_CETV_SCHEMA
    case 'savings_statement': return schemas.SAVINGS_STATEMENT_SCHEMA
    case 'credit_card_statement': return schemas.CREDIT_CARD_STATEMENT_SCHEMA
    case 'p60':
    case 'tax_return': return schemas.P60_SCHEMA
    default: return schemas.BANK_STATEMENT_SCHEMA
  }
}
