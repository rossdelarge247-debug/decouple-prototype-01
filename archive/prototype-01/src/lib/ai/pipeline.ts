// Two-step AI extraction pipeline
// Step 1: Haiku reads PDF (only model that supports type: 'document') → extracts raw text + classifies
// Step 2: Sonnet analyses extracted text with document-type-specific prompt + structured output schema
//
// This replaces the single-call approach in document-analysis.ts which produced
// shallow extraction, hallucinated values, and truncated JSON.

import { CLASSIFICATION_PROMPT, getExtractionPrompt } from './extraction-prompts'
import {
  CLASSIFICATION_SCHEMA,
  BANK_STATEMENT_SCHEMA,
  PAYSLIP_SCHEMA,
  MORTGAGE_STATEMENT_SCHEMA,
  PENSION_CETV_SCHEMA,
  SAVINGS_STATEMENT_SCHEMA,
  CREDIT_CARD_STATEMENT_SCHEMA,
  P60_SCHEMA,
  type DocumentClassification,
  type BankStatementExtraction,
  type PayslipExtraction,
  type MortgageStatementExtraction,
  type PensionCETVExtraction,
  type SavingsStatementExtraction,
  type CreditCardStatementExtraction,
  type P60Extraction,
} from './extraction-schemas'

// Models — verified working via /api/health on 11 April 2026
// Date-suffixed IDs (claude-sonnet-4-5-20241022 etc.) return 404.
// Plain IDs without dates work.
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const SONNET_MODEL = 'claude-sonnet-4-6' // Best available — 1.2s on health check

export type ExtractionResult =
  | BankStatementExtraction
  | PayslipExtraction
  | MortgageStatementExtraction
  | PensionCETVExtraction
  | SavingsStatementExtraction
  | CreditCardStatementExtraction
  | P60Extraction

export interface PipelineDiagnostics {
  step1: {
    model: string
    status: 'pending' | 'success' | 'error'
    inputTokens: number | null
    outputTokens: number | null
    timeMs: number | null
    textLength: number | null
    classificationResult: string | null
    error: string | null
  }
  step2: {
    model: string
    status: 'pending' | 'skipped' | 'success' | 'error'
    inputTokens: number | null
    outputTokens: number | null
    timeMs: number | null
    promptUsed: string | null
    schemaUsed: string | null
    extractionItemCount: number | null
    error: string | null
  }
}

export interface PipelineResult {
  classification: DocumentClassification
  extraction: ExtractionResult | null
  rawText: string
  stepTimings: { classify: number; extract: number }
  diagnostics: PipelineDiagnostics
  error: string | null
}

/**
 * Full two-step pipeline for PDF documents.
 * Step 1: Haiku reads the PDF and extracts text + classifies document type
 * Step 2: Sonnet analyses the extracted text with a type-specific prompt and structured output
 */
export async function extractFromPDF(
  base64Data: string,
): Promise<PipelineResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 90_000,  // 90s per-request — real PDFs can take 30-60s for Haiku to read
  })

  const timings = { classify: 0, extract: 0 }
  const diagnostics: PipelineDiagnostics = {
    step1: { model: HAIKU_MODEL, status: 'pending', inputTokens: null, outputTokens: null, timeMs: null, textLength: null, classificationResult: null, error: null },
    step2: { model: SONNET_MODEL, status: 'pending', inputTokens: null, outputTokens: null, timeMs: null, promptUsed: null, schemaUsed: null, extractionItemCount: null, error: null },
  }

  // ═══ Step 1: Haiku reads PDF + classifies ═══
  console.log('[Pipeline] Step 1: Haiku reading PDF and classifying...')
  const step1Start = Date.now()

  let rawText: string
  let classification: DocumentClassification

  try {
    const step1Response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
          },
          {
            type: 'text',
            text: `Read this UK financial document carefully. Do two things:

1. EXTRACT ALL TEXT from the document. Include every number, every label, every transaction. Preserve the structure (tables, columns, rows). This text will be analysed by another system, so completeness is critical.

2. CLASSIFY the document type.

Return your response in this exact format:

---CLASSIFICATION---
{classification JSON}
---TEXT---
{full extracted text}

${CLASSIFICATION_PROMPT}`,
          },
        ],
      }],
    })

    timings.classify = Date.now() - step1Start
    const step1Text = step1Response.content.find(b => b.type === 'text')?.text ?? ''

    diagnostics.step1.inputTokens = step1Response.usage.input_tokens
    diagnostics.step1.outputTokens = step1Response.usage.output_tokens
    diagnostics.step1.timeMs = timings.classify

    console.log(`[Pipeline] Step 1 complete: ${step1Response.usage.input_tokens} in, ${step1Response.usage.output_tokens} out, ${timings.classify}ms`)

    // Parse the two-part response
    const classificationMatch = step1Text.match(/---CLASSIFICATION---\s*([\s\S]*?)---TEXT---/)
    const textMatch = step1Text.match(/---TEXT---\s*([\s\S]*)$/)

    if (!classificationMatch || !textMatch) {
      // Fallback: treat entire response as text, classify as unknown
      console.warn('[Pipeline] Could not parse step 1 response format, using fallback')
      rawText = step1Text
      classification = { document_type: 'unknown', confidence: 0, provider: null, description: 'Could not parse classification' }
    } else {
      const classJson = classificationMatch[1].trim()
      rawText = textMatch[1].trim()

      try {
        classification = JSON.parse(classJson.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
      } catch {
        console.warn('[Pipeline] Classification JSON parse failed, attempting text extraction')
        classification = { document_type: 'unknown', confidence: 0, provider: null, description: 'Classification parse failed' }
      }
    }

    diagnostics.step1.textLength = rawText.length
    diagnostics.step1.classificationResult = `${classification.document_type} (${classification.confidence})`
    diagnostics.step1.status = 'success'

    console.log(`[Pipeline] Classified as: ${classification.document_type} (confidence: ${classification.confidence}), text length: ${rawText.length} chars`)

    if (rawText.length < 50) {
      diagnostics.step2.status = 'skipped'
      diagnostics.step2.error = 'Insufficient text extracted from document'
      return {
        classification,
        extraction: null,
        rawText,
        stepTimings: timings,
        diagnostics,
        error: 'Could not extract readable text from this document. Try a digital PDF from your online banking.',
      }
    }
  } catch (step1Error) {
    const msg = step1Error instanceof Error ? step1Error.message : 'Unknown error'
    console.error('[Pipeline] Step 1 failed:', msg)
    diagnostics.step1.status = 'error'
    diagnostics.step1.error = msg
    diagnostics.step2.status = 'skipped'
    return {
      classification: { document_type: 'unknown', confidence: 0, provider: null, description: 'Step 1 failed' },
      extraction: null,
      rawText: '',
      stepTimings: timings,
      diagnostics,
      error: `Could not read this document: ${msg}`,
    }
  }

  // ═══ Step 2: Sonnet analyses extracted text ═══
  console.log(`[Pipeline] Step 2: ${SONNET_MODEL} analysing as ${classification.document_type}...`)
  const step2Start = Date.now()

  const extractionPrompt = getExtractionPrompt(classification.document_type)
  const schema = getSchemaForType(classification.document_type)

  diagnostics.step2.model = SONNET_MODEL
  diagnostics.step2.promptUsed = classification.document_type
  diagnostics.step2.schemaUsed = schema ? `${classification.document_type}_extraction` : 'none'

  try {
    const step2Response = await client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8192,
      system: 'You are a financial document analyst for UK divorce/separation cases. Extract data precisely from the provided text. Return structured JSON matching the required schema. Never invent values — only extract what is explicitly stated.',
      messages: [{
        role: 'user',
        content: `${extractionPrompt}\n\nDOCUMENT TEXT:\n${rawText.substring(0, 15000)}`,
      }],
      ...(schema ? {
        output_config: {
          format: {
            type: 'json_schema' as const,
            schema,
          },
        },
      } : {}),
    })

    timings.extract = Date.now() - step2Start
    const step2Text = step2Response.content.find(b => b.type === 'text')?.text ?? ''

    diagnostics.step2.inputTokens = step2Response.usage.input_tokens
    diagnostics.step2.outputTokens = step2Response.usage.output_tokens
    diagnostics.step2.timeMs = timings.extract

    console.log(`[Pipeline] Step 2 complete: ${step2Response.usage.input_tokens} in, ${step2Response.usage.output_tokens} out, ${timings.extract}ms`)

    let extraction: ExtractionResult
    try {
      extraction = JSON.parse(step2Text)
    } catch {
      const cleaned = step2Text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      try {
        extraction = JSON.parse(cleaned)
      } catch {
        diagnostics.step2.status = 'error'
        diagnostics.step2.error = `JSON parse failed. Response started with: "${step2Text.substring(0, 200)}..."`
        return { classification, extraction: null, rawText, stepTimings: timings, diagnostics, error: 'Could not parse extraction results.' }
      }
    }

    diagnostics.step2.status = 'success'
    diagnostics.step2.extractionItemCount = countExtractionItems(extraction)

    console.log(`[Pipeline] Extraction complete for ${classification.document_type}`)
    return { classification, extraction, rawText, stepTimings: timings, diagnostics, error: null }

  } catch (step2Error) {
    const msg = step2Error instanceof Error ? step2Error.message : 'Unknown error'
    console.error(`[Pipeline] ${SONNET_MODEL} failed: ${msg}`)

    // Fall back to Haiku (lower quality, no structured outputs)
    console.log('[Pipeline] Falling back to Haiku for analysis...')
    diagnostics.step2.error = `${SONNET_MODEL}: ${msg}`

    try {
      const fallbackResponse = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 8192,
        system: 'You are a financial document analyst. Extract data precisely. Return valid JSON matching the extraction format. Never invent values.',
        messages: [{
          role: 'user',
          content: `${extractionPrompt}\n\nDOCUMENT TEXT:\n${rawText.substring(0, 15000)}\n\nIMPORTANT: Return valid JSON only. No markdown, no code fences, no explanation.`,
        }],
      })

      timings.extract = Date.now() - step2Start
      const fallbackText = fallbackResponse.content.find(b => b.type === 'text')?.text ?? ''
      const cleaned = fallbackText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      const extraction = JSON.parse(cleaned)

      diagnostics.step2.status = 'success'
      diagnostics.step2.model = HAIKU_MODEL + ' (fallback)'
      diagnostics.step2.inputTokens = fallbackResponse.usage.input_tokens
      diagnostics.step2.outputTokens = fallbackResponse.usage.output_tokens
      diagnostics.step2.timeMs = timings.extract
      diagnostics.step2.extractionItemCount = countExtractionItems(extraction)
      diagnostics.step2.error = `Sonnet failed (${msg}). Haiku fallback succeeded — quality may be lower.`

      return { classification, extraction, rawText, stepTimings: timings, diagnostics, error: null }
    } catch (fallbackError) {
      const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown'
      timings.extract = Date.now() - step2Start
      diagnostics.step2.status = 'error'
      diagnostics.step2.timeMs = timings.extract
      diagnostics.step2.error = `Sonnet: ${msg}. Haiku fallback: ${fallbackMsg}`

      return { classification, extraction: null, rawText, stepTimings: timings, diagnostics, error: `Analysis failed: ${msg}` }
    }
  }
}

/**
 * Pipeline for image documents (photos of statements, etc.)
 * Same two-step approach but Step 1 uses image content type
 */
export async function extractFromImage(
  base64Data: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<PipelineResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 90_000,  // 90s per-request — real PDFs can take 30-60s for Haiku to read
  })

  const timings = { classify: 0, extract: 0 }
  const step1Start = Date.now()

  try {
    // Step 1: Haiku reads image
    const step1Response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: `Read this UK financial document image carefully. Extract ALL text including numbers, labels, and table data. Then classify the document type.

Return in this format:
---CLASSIFICATION---
{"document_type": "...", "confidence": 0.0, "provider": "...", "description": "..."}
---TEXT---
[all extracted text]

${CLASSIFICATION_PROMPT}`,
          },
        ],
      }],
    })

    timings.classify = Date.now() - step1Start
    const step1Text = step1Response.content.find(b => b.type === 'text')?.text ?? ''

    const classificationMatch = step1Text.match(/---CLASSIFICATION---\s*([\s\S]*?)---TEXT---/)
    const textMatch = step1Text.match(/---TEXT---\s*([\s\S]*)$/)

    const rawText = textMatch?.[1]?.trim() ?? step1Text
    let classification: DocumentClassification

    try {
      const classJson = classificationMatch?.[1]?.trim().replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      classification = classJson ? JSON.parse(classJson) : { document_type: 'unknown', confidence: 0, provider: null, description: 'Could not classify' }
    } catch {
      classification = { document_type: 'unknown', confidence: 0, provider: null, description: 'Classification parse failed' }
    }

    if (rawText.length < 50) {
      return { classification, extraction: null, rawText, stepTimings: timings, diagnostics: createEmptyDiagnostics(), error: 'Could not read enough text from this image. Try a clearer photo or upload as PDF.' }
    }

    // Step 2: Same as PDF pipeline
    const step2Start = Date.now()
    const extractionPrompt = getExtractionPrompt(classification.document_type)
    const schema = getSchemaForType(classification.document_type)

    const step2Response = await client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8192,
      system: 'You are a financial document analyst for UK divorce/separation cases. Extract data precisely. Return structured JSON. Never invent values.',
      messages: [{
        role: 'user',
        content: `${extractionPrompt}\n\nDOCUMENT TEXT:\n${rawText.substring(0, 15000)}`,
      }],
      ...(schema ? {
        output_config: {
          format: {
            type: 'json_schema' as const,
            schema,
          },
        },
      } : {}),
    })

    timings.extract = Date.now() - step2Start
    const step2Text = step2Response.content.find(b => b.type === 'text')?.text ?? ''
    const extraction = JSON.parse(step2Text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())

    return { classification, extraction, rawText, stepTimings: timings, diagnostics: createEmptyDiagnostics(), error: null }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return {
      classification: { document_type: 'unknown', confidence: 0, provider: null, description: 'Failed' },
      extraction: null,
      rawText: '',
      stepTimings: timings,
      diagnostics: createEmptyDiagnostics(),
      error: `Could not process image: ${msg}`,
    }
  }
}

/**
 * Pipeline for pre-extracted text (CSV, plain text)
 * Skips Step 1 — goes straight to classification + extraction
 */
export async function extractFromText(
  text: string,
): Promise<PipelineResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 90_000,  // 90s per-request — real PDFs can take 30-60s for Haiku to read
  })

  const timings = { classify: 0, extract: 0 }

  // Classify first
  const classifyStart = Date.now()
  try {
    const classifyResponse = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 256,
      system: 'Classify this UK financial document. Return JSON only.',
      messages: [{
        role: 'user',
        content: `${CLASSIFICATION_PROMPT}\n\nDOCUMENT TEXT:\n${text.substring(0, 2000)}`,
      }],
    })

    timings.classify = Date.now() - classifyStart
    const classText = classifyResponse.content.find(b => b.type === 'text')?.text ?? '{}'
    const classification: DocumentClassification = JSON.parse(classText.replace(/```json?\n?/g, '').replace(/```/g, '').trim())

    // Extract
    const extractStart = Date.now()
    const extractionPrompt = getExtractionPrompt(classification.document_type)
    const schema = getSchemaForType(classification.document_type)

    const extractResponse = await client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 8192,
      system: 'You are a financial document analyst. Extract data precisely. Return structured JSON. Never invent values.',
      messages: [{
        role: 'user',
        content: `${extractionPrompt}\n\nDOCUMENT TEXT:\n${text.substring(0, 15000)}`,
      }],
      ...(schema ? {
        output_config: {
          format: {
            type: 'json_schema' as const,
            schema,
          },
        },
      } : {}),
    })

    timings.extract = Date.now() - extractStart
    const extractText = extractResponse.content.find(b => b.type === 'text')?.text ?? ''
    const extraction = JSON.parse(extractText.replace(/```json?\n?/g, '').replace(/```/g, '').trim())

    return { classification, extraction, rawText: text, stepTimings: timings, diagnostics: createEmptyDiagnostics(), error: null }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return {
      classification: { document_type: 'unknown', confidence: 0, provider: null, description: 'Failed' },
      extraction: null,
      rawText: text,
      stepTimings: timings,
      diagnostics: createEmptyDiagnostics(),
      error: `Could not process text: ${msg}`,
    }
  }
}

// ═══ Helpers ═══

function countExtractionItems(extraction: ExtractionResult): number {
  if ('income_deposits' in extraction) {
    return (extraction.income_deposits?.length || 0) + (extraction.regular_payments?.length || 0)
  }
  if ('gross_pay' in extraction) return 1
  if ('outstanding_balance' in extraction && 'lender' in extraction) return 1
  if ('cetv_value' in extraction) return 1
  if ('current_balance' in extraction) return 1
  if ('outstanding_balance' in extraction) return 1
  if ('total_pay' in extraction) return 1
  return 0
}

function createEmptyDiagnostics(): PipelineDiagnostics {
  return {
    step1: { model: HAIKU_MODEL, status: 'pending', inputTokens: null, outputTokens: null, timeMs: null, textLength: null, classificationResult: null, error: null },
    step2: { model: SONNET_MODEL, status: 'pending', inputTokens: null, outputTokens: null, timeMs: null, promptUsed: null, schemaUsed: null, extractionItemCount: null, error: null },
  }
}

function getSchemaForType(documentType: string) {
  switch (documentType) {
    case 'bank_statement': return BANK_STATEMENT_SCHEMA
    case 'payslip': return PAYSLIP_SCHEMA
    case 'mortgage_statement': return MORTGAGE_STATEMENT_SCHEMA
    case 'pension_cetv': return PENSION_CETV_SCHEMA
    case 'savings_statement': return SAVINGS_STATEMENT_SCHEMA
    case 'credit_card_statement': return CREDIT_CARD_STATEMENT_SCHEMA
    case 'p60':
    case 'tax_return': return P60_SCHEMA
    default: return BANK_STATEMENT_SCHEMA
  }
}
