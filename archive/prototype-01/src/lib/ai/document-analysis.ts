// AI Analysis — returns tiered results (auto/confirm/question/gap)
// This replaces the flat extraction approach

import { generateCompletion } from '@/lib/ai/provider'

export interface AnalysisItem {
  id: string
  label: string
  value: number
  period: 'monthly' | 'annual' | 'total'
  confidence: number
  tier: 'auto' | 'confirm' | 'question'
  category: string
  subcategory: string
  ownership_hint: 'yours' | 'joint' | 'unknown'
  source_description: string
  confirm_question?: string
  confirm_options?: string[]
  question?: string
  options?: string[]
}

export interface GapPrompt {
  id: string
  domain: string
  prompt: string
  options: string[]
}

export interface AnalysisResult {
  document_summary: string
  document_type: string
  provider: string | null
  items: AnalysisItem[]
  gaps: GapPrompt[]
  spending?: { category: string; monthly_average: number; transaction_count: number }[]
}

const ANALYSIS_SYSTEM_PROMPT = 'You are a financial document analyst for UK divorce/separation cases. Return structured JSON analysis with tiered confidence items. Always return valid JSON. No markdown, no code fences.'

const ANALYSIS_INSTRUCTIONS = `Return a JSON object with this EXACT structure:

{
  "document_summary": "One sentence describing what this document is",
  "document_type": "bank_statement|savings_statement|payslip|pension_letter|mortgage_statement|credit_card_statement|other",
  "provider": "Bank/provider name or null",
  "items": [
    {
      "id": "unique_id",
      "label": "Human-readable label",
      "value": 1234.56,
      "period": "monthly|annual|total",
      "confidence": 0.0 to 1.0,
      "tier": "auto|confirm|question",
      "category": "income|asset|liability|pension|property|other",
      "subcategory": "employment|savings|current_account|mortgage|debt|etc",
      "ownership_hint": "yours|joint|unknown",
      "source_description": "Where this value came from in the document",
      "confirm_question": "Only if tier=confirm: one-sentence question",
      "confirm_options": ["Option 1", "Option 2"],
      "question": "Only if tier=question: the question to ask",
      "options": ["Option 1", "Option 2", "Option 3", "I don't know"]
    }
  ],
  "gaps": [
    {
      "id": "gap_1",
      "domain": "pensions|savings|partner|other",
      "prompt": "Question about something not found in the document",
      "options": ["Yes", "No", "Skip"]
    }
  ],
  "spending": [
    {
      "category": "housing|insurance|utilities|groceries|transport|subscriptions|personal|eating_out|children|other",
      "monthly_average": 123.45,
      "transaction_count": 5
    }
  ]
}

TIER RULES:
- "auto" (confidence >= 0.9): Value is explicitly stated in the document. Label, value, and category are unambiguous. Examples: printed salary amounts, stated account balances, named direct debits with amounts.
- "confirm" (confidence 0.7-0.9): Value appears in the document but its purpose needs one simple confirmation. Provide confirm_question and confirm_options (2 choices max). Example: "This £2,150/mo payment looks like a mortgage — is that right?" with options ["Yes, it's my mortgage", "No, it's rent"].
- "question" (confidence < 0.7): You genuinely can't determine from the document alone. Provide question and options (2-4 choices plus "I don't know"). Example: large unusual transfers, ambiguous income sources.

GAP RULES:
- Only 1-3 gaps maximum. Only about things genuinely not found. Always include "Skip".
- Common gaps: pension contributions not visible, savings accounts not referenced

SPENDING RULES:
- Only if this is a bank statement with transactions. Categorise into standard categories above.
- Calculate from ACTUAL transactions in the document. Do not estimate or extrapolate.

CRITICAL — ACCURACY RULES:
- ONLY extract values that are EXPLICITLY STATED in the document. Never invent, estimate, or infer values.
- If a balance or amount is not printed in the document, do NOT include it.
- The source_description MUST reference the specific location in the document (e.g. "Statement balance shown as £1,842 on page 1", "Regular credit of £3,218 on 28th of each month").
- Do NOT create items for things you think "might" exist. Only extract what you can see.
- For bank statements: extract income deposits, closing/opening balances, regular commitments (rent, mortgage, bills), and spending categories from ACTUAL transactions.
- For payslips: extract gross pay, net pay, tax, NI, pension contributions — all explicitly printed.
- For pension letters: extract CETV value, provider, scheme type.
- For mortgage statements: extract balance, monthly payment, interest rate.
- If a confirm_question references a specific amount, that amount MUST appear in the document.
- Return ONLY valid JSON. No markdown, no code fences.`

/**
 * Single-call analysis for PDFs and images.
 * Sends the document directly to Claude — reads AND analyses in one pass.
 * This avoids the 2-call latency that causes Vercel timeouts.
 */
export async function analyseDocumentDirect(
  base64Data: string,
  mediaType: string,
): Promise<AnalysisResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const isPdf = mediaType === 'application/pdf'

  // Build the message content with the document/image + analysis instructions
  const documentContent = isPdf
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64Data } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', data: base64Data } }

  const textContent = {
    type: 'text' as const,
    text: `You are analysing a UK financial document for someone going through separation/divorce. Read every detail in this document and extract all financial data.\n\n${ANALYSIS_INSTRUCTIONS}`,
  }

  // Haiku 4.5 is confirmed working with PDF document type.
  // Quality controlled via prompt, not model size.
  const model = 'claude-haiku-4-5-20251001'
  console.log(`[AI Direct Analysis] Using ${model}`)

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [documentContent, textContent],
    }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const raw = textBlock?.text ?? ''

  console.log(`[AI Direct Analysis] Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`)
  console.log(`[AI Direct Analysis] Response preview: ${raw.substring(0, 200)}`)

  const result = parseAnalysisResponse(raw, false)

  if (result.items.length === 0) {
    console.warn(`[AI Direct Analysis] 0 items returned. Summary: ${result.document_summary}`)
  }

  return result
}

/**
 * Text-based analysis for pre-extracted text (CSV, plain text, etc.)
 * Uses the provider abstraction layer.
 */
export async function analyseDocument(documentText: string): Promise<AnalysisResult> {
  const response = await generateCompletion(
    `You are analysing a UK financial document for someone going through separation/divorce. Your job is to extract financial data AND assess what needs clarification.

DOCUMENT TEXT:
${documentText.substring(0, 10000)}

${ANALYSIS_INSTRUCTIONS}`,
    {
      taskType: 'field_extraction',
      maxTokens: 4096,
      temperature: 0.3,
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
    },
  )

  return parseAnalysisResponse(response.content, response.dryRun)
}

function parseAnalysisResponse(raw: string, isDryRun: boolean): AnalysisResult {
  if (isDryRun) {
    console.log('[AI Analysis] Running in DRY RUN mode — returning mock data')
  }

  let content = raw.trim()

  // Strip markdown code fences if present
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }

  // Try to extract JSON if there's surrounding text
  if (!content.startsWith('{')) {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      content = jsonMatch[0]
    }
  }

  // Attempt 1: parse as-is
  try {
    return finaliseResult(JSON.parse(content), isDryRun)
  } catch {
    console.warn(`[AI Analysis] Direct parse failed, attempting truncated JSON repair...`)
  }

  // Attempt 2: repair truncated JSON
  // The AI hit max_tokens and the JSON was cut off mid-way.
  // Strategy: find the last complete item in the items array, close all brackets.
  try {
    const repaired = repairTruncatedJson(content)
    if (repaired) {
      console.log(`[AI Analysis] Repaired truncated JSON (${content.length} → ${repaired.length} chars)`)
      return finaliseResult(JSON.parse(repaired), isDryRun)
    }
  } catch (repairError) {
    console.warn(`[AI Analysis] Repair also failed: ${repairError instanceof Error ? repairError.message : 'Unknown'}`)
  }

  // Attempt 3: extract just the items array if the top-level object is broken
  try {
    const itemsMatch = content.match(/"items"\s*:\s*\[([\s\S]*?)(?:\]\s*,|\]\s*\})/);
    if (itemsMatch) {
      const partialJson = `{"document_summary":"Partial extraction","document_type":"bank_statement","provider":null,"items":[${itemsMatch[1]}],"gaps":[]}`
      return finaliseResult(JSON.parse(partialJson), isDryRun)
    }
  } catch {
    console.warn('[AI Analysis] Partial items extraction also failed')
  }

  // All attempts failed
  const errorSnippet = raw.substring(0, 150).replace(/\n/g, ' ')
  console.error(`[AI Analysis] All parse attempts failed. Raw (first 500): ${raw.substring(0, 500)}`)
  return {
    document_summary: `Parse error — AI response was truncated. Preview: "${errorSnippet}..."`,
    document_type: 'other',
    provider: null,
    items: [],
    gaps: [],
  }
}

function finaliseResult(parsed: AnalysisResult, isDryRun: boolean): AnalysisResult {
  parsed.items = (parsed.items || []).map((item, i) => ({
    ...item,
    id: item.id || `item_${i}_${Date.now()}`,
  }))
  parsed.gaps = (parsed.gaps || []).map((gap, i) => ({
    ...gap,
    id: gap.id || `gap_${i}_${Date.now()}`,
  }))
  console.log(`[AI Analysis] Parsed OK: ${parsed.items.length} items, ${parsed.gaps.length} gaps, dry_run: ${isDryRun}`)
  return parsed
}

/**
 * Attempts to repair JSON truncated by max_tokens.
 * Finds the last complete object in the items array and closes all brackets.
 */
function repairTruncatedJson(content: string): string | null {
  // Find the last complete object boundary (closing brace followed by comma or array end)
  // Work backwards from the end to find the last "}," or "}" that ends a complete item
  const lastCompleteItem = content.lastIndexOf('},')
  if (lastCompleteItem === -1) return null

  // Take everything up to and including that closing brace
  let repaired = content.substring(0, lastCompleteItem + 1)

  // Count open brackets to close them
  let openBraces = 0
  let openBrackets = 0
  for (const ch of repaired) {
    if (ch === '{') openBraces++
    if (ch === '}') openBraces--
    if (ch === '[') openBrackets++
    if (ch === ']') openBrackets--
  }

  // Close any open arrays and objects
  while (openBrackets > 0) { repaired += ']'; openBrackets-- }
  while (openBraces > 0) { repaired += '}'; openBraces-- }

  return repaired
}
