import { checkCopy } from '@/copy/rules'
import type { StartAnswers } from './answers'
import { JOURNEY_STEP_KEYS, type JourneyStepKey } from './facts'

// The generative half of the plan: one model call, a narrow schema, and a null on
// any failure so the deterministic plan renders alone with no visible error.
// The model never receives the safety answers, the device answer or any flag.

export const PLAN_MODEL = 'claude-opus-5'
export const PLAN_TIMEOUT_MS = 90_000

export interface ProseStep {
  step: JourneyStepKey
  position: string
}

export interface ProseNote {
  anchor: 'children' | 'home' | 'general'
  text: string
}

export interface PlanProse {
  situation_summary: string
  steps: ProseStep[]
  notes: ProseNote[]
  key_difference: string
}

export const PLAN_PROSE_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false as const,
  properties: {
    situation_summary: { type: 'string' as const },
    steps: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        additionalProperties: false as const,
        properties: {
          step: { type: 'string' as const, enum: [...JOURNEY_STEP_KEYS] },
          position: { type: 'string' as const },
        },
        required: ['step', 'position'],
      },
    },
    notes: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        additionalProperties: false as const,
        properties: {
          anchor: { type: 'string' as const, enum: ['children', 'home', 'general'] },
          text: { type: 'string' as const },
        },
        required: ['anchor', 'text'],
      },
    },
    key_difference: { type: 'string' as const },
  },
  required: ['situation_summary', 'steps', 'notes', 'key_difference'],
}

/** What the model sees: the situation, never how things are between them or the device. */
export function toModelInput(a: StartAnswers): Record<string, unknown> {
  return {
    stage: a.stage,
    relationship: a.relationship,
    living_together: a.living,
    children_under_18: a.children === 4 ? '4 or more' : a.children,
    home: a.home,
    self_employed_or_director: a.selfEmployed,
    knowledge_of_partner_finances: a.awareness === 'hiding' ? 'little' : a.awareness,
    priorities: a.priorities,
    worries: a.worries,
  }
}

export const SYSTEM_PROMPT = `You write the short personal prose for a separation plan produced by Decouple, the complete settlement workspace for separating couples in England and Wales. The app has already computed every fact. You write only prose.

Rules:
- Never state a number, date, cost, percentage, statistic, timescale or legal outcome. The app supplies those.
- Inform, never advise. Never say what someone should accept, is entitled to, or is likely to get.
- No urgency, scarcity or social proof. Never "save thousands". No exclamation marks. No emoji.
- Never use the words "disclose", "disclosure" or "position" in any form.
- Plain English, warm and steady, as a patient analyst sitting beside someone late at night. One or two short sentences per field.
- situation_summary: reflect their situation back in one or two sentences, second person.
- steps: exactly six entries, one per step in this order: filing, building, reconciling, settling, court, implementation. Each "position" says what that step means for this person in one sentence.
- notes: one to three notes. Use anchor "children" only if they have children, "home" for their home, "general" otherwise. Draw on their priorities and worries.
- key_difference: one sentence on the single thing that most changes their journey compared with the conventional route, without a number.`

export interface ProseResponse {
  stop_reason: string | null
  content: Array<{ type: string; text?: string }>
}

export interface ProseClient {
  messages: {
    create(params: Record<string, unknown>): Promise<ProseResponse>
  }
}

export interface ProseDeps {
  hasKey: boolean
  client: () => Promise<ProseClient>
}

const STRICT_PHRASES = /your plan|your next step/i

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x)
}

function cleanString(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0 && x.length <= 600 && checkCopy(x).length === 0 && !STRICT_PHRASES.test(x)
}

/** Shape and copy validation. Structured outputs do not enforce array lengths, so we do. */
export function validateProse(x: unknown): PlanProse | null {
  if (!isRecord(x)) return null
  if (!cleanString(x.situation_summary) || !cleanString(x.key_difference)) return null
  if (!Array.isArray(x.steps) || x.steps.length !== JOURNEY_STEP_KEYS.length) return null
  const steps: ProseStep[] = []
  for (let i = 0; i < JOURNEY_STEP_KEYS.length; i++) {
    const s = x.steps[i]
    if (!isRecord(s) || s.step !== JOURNEY_STEP_KEYS[i] || !cleanString(s.position)) return null
    steps.push({ step: JOURNEY_STEP_KEYS[i], position: s.position })
  }
  if (!Array.isArray(x.notes) || x.notes.length < 1 || x.notes.length > 3) return null
  const notes: ProseNote[] = []
  for (const n of x.notes) {
    if (!isRecord(n) || !['children', 'home', 'general'].includes(String(n.anchor)) || !cleanString(n.text)) return null
    notes.push({ anchor: n.anchor as ProseNote['anchor'], text: n.text })
  }
  return { situation_summary: x.situation_summary, steps, notes, key_difference: x.key_difference }
}

export async function generatePlanProse(a: StartAnswers, deps: ProseDeps): Promise<PlanProse | null> {
  if (!deps.hasKey) return null
  try {
    const client = await deps.client()
    const response = await client.messages.create({
      model: PLAN_MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(toModelInput(a)) }],
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: PLAN_PROSE_SCHEMA },
      },
    })
    if (response.stop_reason !== 'end_turn') return null
    const text = response.content.find(b => b.type === 'text')?.text
    if (!text) return null
    return validateProse(JSON.parse(text))
  } catch {
    return null
  }
}
