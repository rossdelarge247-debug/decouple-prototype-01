// Signal detection engine.
// Runs all registered rules against the financial data and returns detected signals.

import type { SignalRule, SignalInput, DetectedSignal } from './types'
import { INCOME_RULES } from './income-rules'
import { PROPERTY_RULES } from './property-rules'
import { PENSION_RULES } from './pension-rules'
import { ACCOUNTS_RULES } from './accounts-rules'
import { DEBT_RULES } from './debt-rules'

// ═══ Rule registry ═══

export const ALL_RULES: SignalRule[] = [
  ...INCOME_RULES,
  ...PROPERTY_RULES,
  ...PENSION_RULES,
  ...ACCOUNTS_RULES,
  ...DEBT_RULES,
]

// ═══ Engine ═══

export interface SignalDetectionResult {
  signals: DetectedSignal[]
  ruleResults: {
    rule: SignalRule
    fired: boolean
    signal: DetectedSignal | null
  }[]
  stats: {
    totalRules: number
    fired: number
    notFired: number
    highConfidence: number
    mediumConfidence: number
    flags: number
  }
}

export function runSignalDetection(input: SignalInput): SignalDetectionResult {
  const ruleResults = ALL_RULES.map(rule => {
    const signal = rule.detect(input)
    return { rule, fired: signal !== null, signal }
  })

  const signals = ruleResults
    .filter(r => r.signal !== null)
    .map(r => r.signal!)

  const fired = signals.length
  const highConfidence = signals.filter(s => s.confidence >= 0.85).length
  const mediumConfidence = signals.filter(s => s.confidence >= 0.6 && s.confidence < 0.85).length
  const flags = signals.filter(s => s.section === 'flags').length

  return {
    signals,
    ruleResults,
    stats: {
      totalRules: ALL_RULES.length,
      fired,
      notFired: ALL_RULES.length - fired,
      highConfidence,
      mediumConfidence,
      flags,
    },
  }
}
