// V2 workspace types

import type { ConfidenceState, FinancialCategory, WorkspacePhase } from '@/types'

export type OwnershipType = 'yours' | 'joint' | 'partners' | 'unknown'

export type ItemStatus = 'confirmed' | 'to_review' | 'estimated' | 'placeholder' | 'awaiting'

export interface FinancialPictureItem {
  id: string
  category: FinancialCategory | 'outgoings' | 'children' | 'business'
  subcategory: string
  label: string
  value: number | null
  currency: string
  period: 'monthly' | 'annual' | 'total' | null
  ownership: OwnershipType
  split: number // 0-100, percentage belonging to applicant
  confidence: ConfidenceState
  status: ItemStatus
  source_document_id: string | null
  notes: string | null
  is_inherited: boolean
  is_pre_marital: boolean
  created_at: string
  updated_at: string
}

export interface DocumentUpload {
  id: string
  file_name: string
  file_type: string
  status: 'uploading' | 'processing' | 'extracted' | 'review_needed' | 'confirmed' | 'failed'
  classification: string | null
  classification_confidence: number | null
  extracted_items: ExtractedItem[]
  uploaded_at: string
}

export interface ExtractedItem {
  id: string
  field_name: string
  value: string
  confidence: number
  category_suggestion: string | null
  review_status: 'pending' | 'accepted' | 'corrected' | 'rejected'
  corrected_value: string | null
}

export interface SpendingCategory {
  category: string
  monthly_average: number
  transaction_count: number
  examples: string[]
}

export interface FinancialSummary {
  total_assets: number
  total_liabilities: number
  net_position: number
  monthly_income: number
  monthly_outgoings: number
  items_confirmed: number
  items_to_review: number
  items_estimated: number
  items_missing: number
  categories_started: number
  categories_total: number
}

export type ReadinessLevel = 'not_started' | 'first_draft' | 'disclosure' | 'final_draft' | 'formalisation'

export interface ReadinessState {
  level: ReadinessLevel
  label: string
  description: string
  progress: number // 0-100
  blockers: string[]
}

export interface PictureCategory {
  key: string
  label: string
  form_e_section: string
  items: FinancialPictureItem[]
  status: 'not_started' | 'in_progress' | 'complete'
  visible: boolean // adaptive based on V1 data
}

// Priority order for guided flow
export const CATEGORY_PRIORITY: { key: string; label: string; formE: string; description: string; idealDocs: string }[] = [
  { key: 'current_account', label: 'Current account', formE: '2.4 + 2.11 + 2.12', description: 'Income and spending from one upload', idealDocs: '12 months bank statements' },
  { key: 'savings', label: 'Savings & accounts', formE: '2.4 + 2.5', description: 'Savings, ISAs, investments', idealDocs: 'Latest statements' },
  { key: 'property', label: 'Property', formE: '2.1–2.3', description: 'Home, other properties, value and mortgage', idealDocs: 'Valuation + mortgage statement' },
  { key: 'pensions', label: 'Pensions', formE: '2.7', description: 'Workplace and personal pensions', idealDocs: 'CETV letters (takes up to 3 months)' },
  { key: 'debts', label: 'Debts & liabilities', formE: '2.10', description: 'Loans, credit cards, other debts', idealDocs: 'Latest statements' },
  { key: 'other_income', label: 'Other income', formE: '2.11', description: 'Benefits, rental, maintenance received', idealDocs: 'Varies' },
  { key: 'other_assets', label: 'Other assets', formE: '2.9', description: 'Vehicles, valuables, crypto, insurance', idealDocs: 'Varies' },
  { key: 'business', label: 'Business interests', formE: '2.8', description: 'Self-employment, company, partnership', idealDocs: 'Business accounts, SA302' },
  { key: 'outgoings', label: 'Outgoings review', formE: '2.12', description: 'Review auto-categorised spending', idealDocs: 'Already extracted from bank' },
  { key: 'budget', label: 'Post-separation budget', formE: 'Part 3', description: 'Projected needs after separation', idealDocs: 'Guided — no documents' },
  { key: 'children', label: 'Children', formE: 'Part 1 + arrangements', description: 'Arrangements, school, holidays', idealDocs: 'Guided — no documents' },
]
