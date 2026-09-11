// User correction persistence for the classification engine.
// Stores corrections as JSON in localStorage (browser) initially.
// Will migrate to Supabase when auth is wired up.
//
// Each correction is simultaneously:
//   1. An override table entry (corrected category wins in future)
//   2. A golden test data point (labelled ground truth)
//   3. Future ML training data (when we graduate to ML classification)

import type { DetectedPayment } from '@/lib/ai/extraction-schemas'

// ═══ Types ═══

export interface UserCorrection {
  /** Normalised payee description (lowercase, stripped) */
  normalisedPayee: string
  /** Original raw description from bank */
  rawDescription: string
  /** What the engine classified it as */
  autoCategory: DetectedPayment['likely_category']
  /** What the user corrected it to */
  correctedCategory: DetectedPayment['likely_category']
  /** Average monthly amount */
  amount: number
  /** When the correction was made */
  timestamp: string
}

const STORAGE_KEY = 'decouple-user-corrections'

// ═══ Storage operations ═══

function loadCorrections(): UserCorrection[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCorrections(corrections: UserCorrection[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections))
}

// ═══ Public API ═══

/** Record a user correction. Overwrites any existing correction for the same payee. */
export function addCorrection(correction: UserCorrection): void {
  const corrections = loadCorrections()
  const existingIdx = corrections.findIndex((c) => c.normalisedPayee === correction.normalisedPayee)
  if (existingIdx >= 0) {
    corrections[existingIdx] = correction
  } else {
    corrections.push(correction)
  }
  saveCorrections(corrections)
}

/** Look up a user correction by normalised payee. Returns the corrected category or null. */
export function lookupCorrection(normalisedPayee: string): DetectedPayment['likely_category'] | null {
  const corrections = loadCorrections()
  const match = corrections.find((c) => c.normalisedPayee === normalisedPayee)
  return match ? match.correctedCategory : null
}

/** Get all stored corrections (for export, testing, or future ML training). */
export function getAllCorrections(): UserCorrection[] {
  return loadCorrections()
}

/** Remove a correction by normalised payee. */
export function removeCorrection(normalisedPayee: string): void {
  const corrections = loadCorrections().filter((c) => c.normalisedPayee !== normalisedPayee)
  saveCorrections(corrections)
}

/** Clear all corrections. */
export function clearAllCorrections(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/** Export corrections as JSON string (for backup or migration). */
export function exportCorrections(): string {
  return JSON.stringify(loadCorrections(), null, 2)
}

/** Import corrections from JSON string (merges with existing). */
export function importCorrections(json: string): number {
  const imported: UserCorrection[] = JSON.parse(json)
  const existing = loadCorrections()
  let addedCount = 0
  for (const correction of imported) {
    const existingIdx = existing.findIndex((c) => c.normalisedPayee === correction.normalisedPayee)
    if (existingIdx >= 0) {
      existing[existingIdx] = correction
    } else {
      existing.push(correction)
      addedCount++
    }
  }
  saveCorrections(existing)
  return addedCount
}
