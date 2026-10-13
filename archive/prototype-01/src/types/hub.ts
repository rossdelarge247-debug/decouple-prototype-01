// Hub page types — post-pivot architecture
// Session 9: New workspace types below, legacy types retained for backward compatibility

// ═══ Workspace types (v2 — wireframe-driven) ═══

export type Phase = 'preparation' | 'sharing' | 'finalisation'

export type EvidenceSource = 'bank_connection' | 'self_disclosed' | 'document'

export type WorkspaceView =
  | 'carousel'
  | 'task_list'
  | 'bank_connection'
  | 'confirmation'
  | 'financial_summary'
  | 'spending_upgrade'

export type BankConnectionPhase =
  | 'idle'
  | 'loader'
  | 'dimming'
  | 'tink_modal'
  | 'processing'
  | 'reveal'
  | 'complete'

export interface ConnectedAccount {
  id: string
  bankName: string
  accountType: 'current' | 'savings' | 'credit_card'
  lastFour: string
  monthsOfData: number
}

export interface RevealItem {
  id: string
  accountId: string
  label: string
  detail: string
  icon: 'income' | 'spending' | 'mortgage' | 'balance' | 'commitments' | 'pension'
}

export interface TaskItem {
  id: string
  phase: Phase
  label: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'locked'
  action?: {
    label: string
    type: 'primary' | 'secondary'
  }
  skipLabel?: string
  badge?: { label: string; variant: 'green' | 'orange' | 'grey' }
}

export interface SectionConfirmation {
  sectionKey: SectionKey
  status: 'pending' | 'confirmed' | 'skipped'
  answers: Record<string, string>
  confirmedFacts: string[]
  gapMessages: string[]
}

export interface WorkspaceState {
  view: WorkspaceView
  carouselStep: number
  carouselComplete: boolean
  bankConnected: boolean
  bankConnectionPhase: BankConnectionPhase
  connectedAccounts: ConnectedAccount[]
  revealItems: RevealItem[]
  completedSections: SectionConfirmation[]
  currentSection: SectionKey | null
  tasks: TaskItem[]
}

// ═══ Fidelity model ═══

export type FidelityLevel = 'sketch' | 'draft' | 'evidenced' | 'locked'

export interface FidelityState {
  level: FidelityLevel
  label: string
  description: string
  canShare: boolean
}

export const FIDELITY_LABELS: Record<FidelityLevel, FidelityState> = {
  sketch: {
    level: 'sketch',
    label: 'Not yet ready for first mediation conversation',
    description: 'Based on estimates only. Upload evidence to improve accuracy.',
    canShare: false,
  },
  draft: {
    level: 'draft',
    label: 'Ready for first mediation conversation',
    description: 'Some evidence uploaded. Enough for an initial discussion.',
    canShare: true,
  },
  evidenced: {
    level: 'evidenced',
    label: 'Ready for formal disclosure',
    description: 'Full evidence provided. Meets Form E requirements.',
    canShare: true,
  },
  locked: {
    level: 'locked',
    label: 'Complete — ready for consent order',
    description: 'All sections confirmed and evidenced. No outstanding items.',
    canShare: true,
  },
}

// ═══ Section model ═══

export type SectionKey =
  | 'income'
  | 'accounts'
  | 'spending'
  | 'property'
  | 'other_property'
  | 'pensions'
  | 'debts'
  | 'business'
  | 'other_assets'

export type SectionStatus = 'not_started' | 'estimate_only' | 'partial_evidence' | 'fully_evidenced'

export interface SectionData {
  key: SectionKey
  label: string
  formESections: string
  status: SectionStatus
  items: FinancialItem[]
  visible: boolean
  estimateFromConfig: string | null // e.g. "£3,200 gross per/month"
  evidenceSummary: string | null // e.g. "Barclays statements, 2 of 12 months"
  outstandingQuestions: number
}

export const SECTION_DEFINITIONS: { key: SectionKey; label: string; formESections: string }[] = [
  { key: 'income', label: 'Income', formESections: '2.15–2.20' },
  { key: 'accounts', label: 'Accounts', formESections: '2.3, 2.4' },
  { key: 'spending', label: 'Spending', formESections: '3.1' },
  { key: 'property', label: 'Property', formESections: '2.1' },
  { key: 'other_property', label: 'Other property', formESections: '2.2' },
  { key: 'pensions', label: 'Your pensions', formESections: '2.13' },
  { key: 'debts', label: 'What you owe', formESections: '2.14' },
  { key: 'business', label: 'Your business', formESections: '2.10, 2.11, 2.16' },
  { key: 'other_assets', label: 'Other assets', formESections: '2.4–2.9' },
]

// ═══ Financial items ═══

export type OwnershipType = 'yours' | 'joint' | 'partners' | 'unknown'
export type ConfidenceLevel = 'confirmed' | 'estimated' | 'unknown'

export interface FinancialItem {
  id: string
  sectionKey: SectionKey
  label: string
  value: number | null
  period: 'monthly' | 'annual' | 'total' | null
  ownership: OwnershipType
  confidence: ConfidenceLevel
  sourceDocumentId: string | null
  sourceDescription: string | null
  formECategory: string | null  // Form E budget category for grouping (e.g. "Vehicle costs", "Healthcare")
  isInherited: boolean
  isPreMarital: boolean
  asAtDate: string | null
  createdAt: string
  updatedAt: string
}

// ═══ Spending flow types ═══

export type SpendingSubCategory =
  | 'housing'
  | 'utilities'
  | 'personal'
  | 'transport'
  | 'children'
  | 'leisure'

export interface SpendingSubCategoryDef {
  key: SpendingSubCategory
  label: string
  formERef: string
  /** Sub-sub-categories for the "Other costs" dropdown */
  otherOptions: string[]
}

export const SPENDING_CATEGORIES: SpendingSubCategoryDef[] = [
  {
    key: 'housing',
    label: 'Housing',
    formERef: '3.1(a)',
    otherOptions: ['Ground rent', 'Service charges', 'Buildings insurance', 'Contents insurance', 'Repairs & maintenance', 'Other housing costs'],
  },
  {
    key: 'utilities',
    label: 'Household utilities & maintenance',
    formERef: '3.1(b)',
    otherOptions: ['Water rates', 'TV licence', 'Landline', 'Window cleaning', 'Garden maintenance', 'Other utility costs'],
  },
  {
    key: 'personal',
    label: 'Personal & living expenses',
    formERef: '3.1(c)',
    otherOptions: ['Toiletries', 'Hairdressing', 'Clothing', 'Medical & dental', 'Prescriptions', 'Dry cleaning', 'Other personal costs'],
  },
  {
    key: 'transport',
    label: 'Transportation costs',
    formERef: '3.1(d)',
    otherOptions: ['Car insurance', 'MOT & servicing', 'Road tax', 'Parking', 'Public transport', 'Congestion charges', 'Other transport costs'],
  },
  {
    key: 'children',
    label: 'Child expenses',
    formERef: '3.1(e)',
    otherOptions: ['School fees', 'School meals & uniform', 'Activities & clubs', 'Pocket money', 'Tutoring', 'Other child costs'],
  },
  {
    key: 'leisure',
    label: 'Leisure & other expenditure',
    formERef: '3.1(f)',
    otherOptions: ['Holidays', 'Eating out', 'Hobbies', 'Gifts', 'Pets', 'Charitable donations', 'Other leisure costs'],
  },
]

export type SpendingMode = 'estimates' | 'bank_data'

export interface SpendingItem {
  id: string
  subCategory: SpendingSubCategory
  label: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one_off'
  monthlyEquivalent: number
  source: 'bank' | 'manual' | 'search'
  transactionIds?: string[]
}

export interface SpendingCategoryResult {
  key: SpendingSubCategory
  items: SpendingItem[]
  totalMonthly: number
  confirmed: boolean
}

export interface SpendingFlowResult {
  mode: SpendingMode
  categories: SpendingCategoryResult[]
  totalMonthly: number
}

// ═══ Evidence lozenges ═══

export type EvidenceType =
  | 'current_account'
  | 'savings_account'
  | 'pensions'
  | 'mortgage_details'
  | 'payslips'
  | 'tax_returns'
  | 'business_accounts'
  | 'credit_cards'
  | 'other_assets'

export type LozengeStatus = 'empty' | 'uploading' | 'uploaded'

export interface EvidenceLozenge {
  type: EvidenceType
  label: string
  status: LozengeStatus
  count: number
  documents: UploadedDocument[]
}

export interface UploadedDocument {
  id: string
  fileName: string
  fileType: string
  description: string // e.g. "June 2026 Barclays statement"
  uploadedAt: string
  monthsCovered: number
  monthsRequired: number
}

// ═══ Config / discovery ═══

export interface ConfigAnswers {
  v1DataConfirmed: boolean
  employment: 'employed' | 'self_employed' | 'both' | 'not_working' | 'retired' | null
  businessStructure: 'sole_trader' | 'limited' | 'partnership' | 'llp' | null
  ownsProperty: boolean
  propertyCount: number
  propertyEstimate: number | null
  hasMortgage: boolean
  mortgageEstimate: number | null
  hasPensions: boolean
  pensionEstimate: number | null
  cetvRequested: boolean | null
  hasSavings: boolean
  savingsEstimate: number | null
  hasDebts: boolean
  debtsEstimate: number | null
  otherAssets: string[] // ['crypto', 'vehicle', 'valuables', 'life_insurance', 'overseas']
  hasChildren: boolean
  configCompleted: boolean
}

export const INITIAL_CONFIG: ConfigAnswers = {
  v1DataConfirmed: false,
  employment: null,
  businessStructure: null,
  ownsProperty: false,
  propertyCount: 0,
  propertyEstimate: null,
  hasMortgage: false,
  mortgageEstimate: null,
  hasPensions: false,
  pensionEstimate: null,
  cetvRequested: null,
  hasSavings: false,
  savingsEstimate: null,
  hasDebts: false,
  debtsEstimate: null,
  otherAssets: [],
  hasChildren: false,
  configCompleted: false,
}

// ═══ Hero panel state machine ═══

export type HeroPanelState =
  | 'ready'           // State 1: drag-and-drop zone visible
  | 'uploading'       // State 2a: initial upload, no context
  | 'uploading_context' // State 2b: file count and type identified
  | 'analysing'       // State 2c: files uploaded, processing content
  | 'review_ready'    // State 2d: analysis complete, ready for Q&A
  | 'auto_confirm'    // State 3a: batch accept high-confidence items
  | 'clarification'   // State 3b–3n: one question at a time
  | 'summary'         // State 4: achievements + todo

export interface ClarificationQuestion {
  id: string
  questionText: string
  reasoning: string | null
  options: { label: string; value: string }[]
  primaryOption: string | null
  secondaryLabel: string
  formEField: string
  answered: boolean
  answer: string | null
}

export interface AutoConfirmItem {
  id: string
  label: string
  detail: string
  accepted: boolean
}

// ═══ Hub state (top-level) ═══

export interface HubState {
  config: ConfigAnswers
  sections: SectionData[]
  lozenges: EvidenceLozenge[]
  items: FinancialItem[]
  fidelity: FidelityLevel
  heroPanelState: HeroPanelState
  currentQuestionIndex: number
  questions: ClarificationQuestion[]
  autoConfirmItems: AutoConfirmItem[]
}
