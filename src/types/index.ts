// Core TypeScript types for the Calm Separation Workspace

// ── Enums ──

export type CaseStatus = 'active' | 'archived' | 'closed'

export type ParticipantRole = 'applicant' | 'respondent' | 'mediator' | 'adviser'
export type InviteStatus = 'pending' | 'accepted' | 'declined'

export type ProposalStatus = 'draft' | 'shared' | 'accepted' | 'disputed' | 'superseded' | 'withdrawn'

export type FinancialCategory = 'asset' | 'liability' | 'income' | 'pension' | 'property' | 'obligation' | 'other'
export type ConfidenceState = 'known' | 'estimated' | 'unknown'
export type FollowUpState = 'fine_for_now' | 'confirm_later' | 'priority_to_confirm' | 'resolved'
export type VisibilityState = 'private' | 'shared' | 'requested' | 'disputed' | 'accepted' | 'archived'

export type DocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ExtractionReviewStatus = 'pending' | 'accepted' | 'corrected' | 'rejected'

export type QuestionStatus = 'open' | 'in_progress' | 'answered' | 'resolved' | 'deferred'
export type QuestionPriority = 'low' | 'medium' | 'high'

export type OutputType =
  | 'plan_summary'
  | 'disclosure_pack'
  | 'adviser_bundle'
  | 'consent_order_draft'
  | 'd81_data'
  | 'form_a_data'
  | 'mediation_agenda'
  | 'unresolved_summary'
export type OutputFormat = 'json' | 'pdf' | 'html'

export type TimelineActorType = 'user' | 'system' | 'ai'
export type PermissionLevel = 'none' | 'view' | 'comment' | 'edit' | 'admin'

// ── Workspace phases ──

export type WorkspacePhase =
  | 'build_your_picture'
  | 'share_and_disclose'
  | 'work_through_it'
  | 'reach_agreement'
  | 'make_it_official'

// ── V1 specific types ──

export type ReadinessTier = 'full' | 'partial' | 'thin' | 'not_ready'

export type ChapterStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'not_applicable'

export interface ChapterProgress {
  situation: ChapterStatus
  route: ChapterStatus
  children: ChapterStatus
  home: ChapterStatus
  finances: ChapterStatus
  confidence: ChapterStatus
}

export type SafeguardingFlag = 'safety_concern' | 'high_conflict' | 'coercive_control' | 'financial_abuse' | 'vulnerability_indicator'
export type RouteAdjustment = 'suppress_collaboration' | 'flag_mediation_suitability' | 'surface_resources'

export interface SafeguardingState {
  risk_signals_detected: boolean
  flags: SafeguardingFlag[]
  route_adjustments: RouteAdjustment[]
  resources_surfaced: boolean
  assessed_at: string | null
}

// ── Core entities ──

export interface User {
  id: string
  supabase_auth_id: string
  display_name: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  owner_id: string
  title: string | null
  status: CaseStatus
  current_phase: WorkspacePhase
  safeguarding: SafeguardingState
  chapter_progress: ChapterProgress
  readiness_tier: ReadinessTier | null
  plan_generated: boolean
  pdf_generated: boolean
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  case_id: string
  user_id: string | null
  role: ParticipantRole
  invite_status: InviteStatus
  created_at: string
}

export interface Proposal {
  id: string
  case_id: string
  author_id: string
  version: number
  parent_proposal_id: string | null
  status: ProposalStatus
  children_arrangements: Record<string, unknown> | null
  housing_arrangements: Record<string, unknown> | null
  financial_arrangements: Record<string, unknown> | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FinancialItem {
  id: string
  case_id: string
  participant_id: string
  category: FinancialCategory
  subcategory: string | null
  description: string
  value_amount: number | null
  value_currency: string
  confidence_state: ConfidenceState
  follow_up_state: FollowUpState
  visibility: VisibilityState
  source_description: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  case_id: string
  uploaded_by: string
  file_name: string
  file_type: string
  storage_path: string
  file_size: number
  classification: string | null
  classification_confidence: number | null
  processing_status: DocumentProcessingStatus
  visibility: VisibilityState
  created_at: string
  updated_at: string
}

export interface ExtractedField {
  id: string
  document_id: string
  financial_item_id: string | null
  field_name: string
  extracted_value: string
  confidence: number
  review_status: ExtractionReviewStatus
  corrected_value: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Question {
  id: string
  case_id: string
  raised_by: string
  assigned_to: string | null
  category: string
  question_text: string
  context: string | null
  status: QuestionStatus
  priority: QuestionPriority
  answer_text: string | null
  answered_by: string | null
  answered_at: string | null
  linked_financial_item_id: string | null
  linked_document_id: string | null
  created_at: string
  updated_at: string
}

export interface Output {
  id: string
  case_id: string
  generated_by: string
  output_type: OutputType
  title: string
  content: Record<string, unknown>
  format: OutputFormat
  storage_path: string | null
  version: number
  created_at: string
}

export interface TimelineEvent {
  id: string
  case_id: string
  actor_id: string | null
  actor_type: TimelineActorType
  event_type: string
  event_data: Record<string, unknown>
  related_entity_type: string | null
  related_entity_id: string | null
  created_at: string
}

export interface Permission {
  id: string
  case_id: string
  participant_id: string
  resource_type: string
  resource_id: string
  permission_level: PermissionLevel
  granted_by: string
  created_at: string
  revoked_at: string | null
}
