import { generateCompletion } from '@/lib/ai/provider'
import type { InterviewSession } from '@/types/interview'

export interface AIPlanSection {
  summary: string
  key_points: string[]
}

export interface AIPlanNarrative {
  overview: string
  route: AIPlanSection
  children: AIPlanSection | null
  housing: AIPlanSection | null
  finances: AIPlanSection
  confidence_insight: string
  closing: string
}

function buildPlanPrompt(session: InterviewSession, hasSafeguardingConcerns: boolean): string {
  const s = session.situation
  const isMarried = s.relationship_status === 'married' || s.relationship_status === 'civil_partnership'
  const hasChildren = s.has_children === true
  const hasProperty = s.property_status === 'own_jointly' || s.property_status === 'own_one_name'

  const confEntries = Object.entries(session.confidence)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join(', ')

  return `You are generating a personalised plan summary for someone navigating separation in England and Wales.

THEIR SITUATION:
- Relationship: ${s.relationship_status}
- Living together: ${s.living_together}
- Children: ${hasChildren ? 'yes' : 'no'}
- Property: ${s.property_status}
- Process status: ${s.process_status}
- Relationship quality: ${s.relationship_quality}
- Safeguarding: ${hasSafeguardingConcerns ? 'YES' : 'no'}
- Financial control concerns: ${s.financial_control_concerns ? 'YES' : 'no'}

${hasChildren ? `CHILDREN: current=${session.children.current_arrangements}, desired=${session.children.desired_arrangements}, confidence=${session.children.confidence}` : ''}
${hasProperty ? `HOUSING: desired=${session.home.desired_outcome}, value_confidence=${session.home.value_confidence}, mortgage_confidence=${session.home.mortgage_confidence}` : ''}

FINANCIAL PRIORITIES: ${session.finances.priorities.join(', ') || 'none'}
FINANCIAL WORRIES: ${session.finances.worries.join(', ') || 'none'}
AWARENESS: ${session.finances.combined_awareness}

VALUES PROVIDED: ${Object.entries(session.values).filter(([, v]) => v && v.trim() !== '').map(([k, v]) => `${k.replace(/_/g, ' ')}: £${v}`).join(', ') || 'none'}

CONFIDENCE MAP: ${confEntries}

Return a JSON object. CRITICAL FORMAT RULES:
- "summary" fields: ONE sentence only. Direct. Personal.
- "key_points" fields: 2-4 bullet points. Short. Specific to their data.
- No filler words. No "it's important to note". Just the insight.
- Reference their actual numbers if provided.
- ${hasSafeguardingConcerns ? 'Suppress collaboration language. Do not recommend mediation.' : ''}

{
  "overview": "One warm sentence acknowledging where they are.",
  "route": {
    "summary": "One sentence: their likely route, specific to married/cohabiting/children status.",
    "key_points": ["Bullet 1", "Bullet 2", "Bullet 3"]
  },
  ${hasChildren ? `"children": {
    "summary": "One sentence reflecting their arrangements and aims.",
    "key_points": ["Bullet 1", "Bullet 2"]
  },` : '"children": null,'}
  ${hasProperty ? `"housing": {
    "summary": "One sentence on their housing aim. Reference values if provided.",
    "key_points": ["Bullet 1", "Bullet 2"]
  },` : '"housing": null,'}
  "finances": {
    "summary": "One sentence connecting their priorities to their confidence gaps.",
    "key_points": ["Bullet 1", "Bullet 2", "Bullet 3"]
  },
  "confidence_insight": "One perceptive sentence about the pattern in their confidence map.",
  "closing": "One warm, motivating sentence."
}

Return ONLY valid JSON. No markdown. No code blocks.`
}

export async function generatePlanNarrative(
  session: InterviewSession,
  hasSafeguardingConcerns: boolean,
): Promise<AIPlanNarrative | null> {
  try {
    const prompt = buildPlanPrompt(session, hasSafeguardingConcerns)

    const response = await generateCompletion(prompt, {
      taskType: 'plan_summarisation',
      temperature: 0.6,
      maxTokens: 768,
      systemPrompt: 'You generate concise, structured plan summaries in JSON. One sentence per summary. Short bullet points. Warm but brief. Never give legal advice. Always return valid JSON.',
    })

    return JSON.parse(response.content) as AIPlanNarrative
  } catch (error) {
    console.error('[AI Plan] Generation failed:', error)
    return null
  }
}
