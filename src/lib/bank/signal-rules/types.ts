// Signal detection types.
// A signal is a named pattern detected in financial data, with visible reasoning.
// Layer 2 in the pipeline: classification → signals → questions.

import type { DetectedPayment, ExtractedIncome } from '@/lib/ai/extraction-schemas'

// ═══ Signal types ═══

export interface SignalEvidence {
  label: string                   // "12 credits from ACME LTD, avg £3,200"
  transactions?: { date: string; description: string; amount: number }[]
  metrics?: { name: string; value: string }[]  // "variation: 2%", "frequency: monthly"
}

export interface DetectedSignal {
  id: string                      // "income.regular-salary.acme"
  ruleId: string                  // "income.regular-salary"
  name: string                    // "Regular salary detected"
  section: string                 // "income" | "property" | etc.
  formEField: string              // "2.15"
  confidence: number              // 0-1
  determination: string           // "Salary: £3,200/month from ACME Ltd"
  reasoning: string[]             // Human-readable bullet points
  evidence: SignalEvidence[]
  crossSectionImpacts: string[]   // ["needs payslips", "triggers business section"]
}

// ═══ Rule types ═══

export interface SignalInput {
  incomes: ExtractedIncome[]
  payments: DetectedPayment[]
  transactions: { date: string; description: string; amount: number }[]
  accountMeta: { provider: string; isJoint: boolean; type: string }
}

export interface SignalRule {
  id: string
  name: string
  section: string
  tier: 'must_nail' | 'good_enough' | 'ask_for_help'
  formEField: string
  description: string             // What this rule looks for
  detect: (input: SignalInput) => DetectedSignal | null
}
