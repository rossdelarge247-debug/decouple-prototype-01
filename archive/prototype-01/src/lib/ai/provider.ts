// AI orchestration layer — provider-agnostic interface
// Supports Claude (primary), Gemini, and OpenAI
// Includes dry-run mode for dev/testing

export type AIProvider = 'claude' | 'gemini' | 'openai'

export type AITaskType =
  | 'route_generation'
  | 'plan_summarisation'
  | 'document_classification'
  | 'field_extraction'
  | 'safeguarding_assessment'
  | 'next_step_generation'
  | 'mediation_summary'
  | 'proposal_comparison'
  | 'general'

interface AIRequestOptions {
  taskType: AITaskType
  provider?: AIProvider
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

interface AIResponse {
  content: string
  provider: AIProvider
  model: string
  tokenUsage: { input: number; output: number }
  dryRun: boolean
  durationMs: number
}

// Only dry-run if explicitly enabled AND no API key is available
// This prevents the flag accidentally blocking real analysis on Vercel
const isDryRun = process.env.AI_DRY_RUN === 'true' && !process.env.ANTHROPIC_API_KEY

// Default provider routing by task type
const DEFAULT_ROUTING: Record<AITaskType, { provider: AIProvider; model: string }> = {
  route_generation: { provider: 'claude', model: 'claude-sonnet-4-6' },
  plan_summarisation: { provider: 'claude', model: 'claude-sonnet-4-6' },
  document_classification: { provider: 'claude', model: 'claude-haiku-4-5-20251001' },
  field_extraction: { provider: 'claude', model: 'claude-sonnet-4-6' },
  safeguarding_assessment: { provider: 'claude', model: 'claude-sonnet-4-6' },
  next_step_generation: { provider: 'claude', model: 'claude-sonnet-4-6' },
  mediation_summary: { provider: 'claude', model: 'claude-sonnet-4-6' },
  proposal_comparison: { provider: 'claude', model: 'claude-sonnet-4-6' },
  general: { provider: 'claude', model: 'claude-sonnet-4-6' },
}

export async function generateCompletion(
  prompt: string,
  options: AIRequestOptions,
): Promise<AIResponse> {
  const start = Date.now()
  const routing = DEFAULT_ROUTING[options.taskType]
  const provider = options.provider ?? routing.provider
  const model = options.model ?? routing.model

  if (isDryRun) {
    console.log(`[AI DRY RUN] Provider: ${provider}, Model: ${model}, Task: ${options.taskType}`)
    console.log(`[AI DRY RUN] No ANTHROPIC_API_KEY found — returning mock data`)

    // Return valid JSON mocks so downstream parsers don't break
    const mockContent = getDryRunMock(options.taskType)
    return {
      content: mockContent,
      provider,
      model,
      tokenUsage: { input: 0, output: 0 },
      dryRun: true,
      durationMs: Date.now() - start,
    }
  }

  switch (provider) {
    case 'claude':
      return callClaude(prompt, model, options, start)
    case 'gemini':
    case 'openai':
      // Stub — implement when needed
      throw new Error(`Provider ${provider} not yet implemented`)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

async function callClaude(
  prompt: string,
  model: string,
  options: AIRequestOptions,
  start: number,
): Promise<AIResponse> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens ?? 2048,
    ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = response.content.find(block => block.type === 'text')

  return {
    content: textContent?.text ?? '',
    provider: 'claude',
    model,
    tokenUsage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
    dryRun: false,
    durationMs: Date.now() - start,
  }
}

function getDryRunMock(taskType: AITaskType): string {
  if (taskType === 'field_extraction') {
    return JSON.stringify({
      document_summary: '[DRY RUN] Mock bank statement analysis — no API key configured',
      document_type: 'bank_statement',
      provider: 'Demo Bank',
      items: [
        {
          id: 'mock_1',
          label: 'Monthly salary (demo)',
          value: 3200,
          period: 'monthly',
          confidence: 0.95,
          tier: 'auto',
          category: 'income',
          subcategory: 'employment',
          ownership_hint: 'yours',
          source_description: 'Mock data — connect your Anthropic API key to analyse real documents',
        },
        {
          id: 'mock_2',
          label: 'Current account balance (demo)',
          value: 4850,
          period: 'total',
          confidence: 0.92,
          tier: 'auto',
          category: 'asset',
          subcategory: 'current_account',
          ownership_hint: 'yours',
          source_description: 'Mock data — connect your Anthropic API key to analyse real documents',
        },
        {
          id: 'mock_3',
          label: 'Monthly mortgage payment (demo)',
          value: 1150,
          period: 'monthly',
          confidence: 0.78,
          tier: 'confirm',
          category: 'liability',
          subcategory: 'mortgage',
          ownership_hint: 'joint',
          source_description: 'Mock data — regular payment detected',
          confirm_question: 'This £1,150/mo payment looks like a mortgage — is that right?',
          confirm_options: ['Yes, it\'s our mortgage', 'No, it\'s something else'],
        },
      ],
      gaps: [
        {
          id: 'mock_gap_1',
          domain: 'pensions',
          prompt: 'We didn\'t see any pension contributions — do you have a workplace pension?',
          options: ['Yes', 'No', 'Skip'],
        },
      ],
      spending: [
        { category: 'housing', monthly_average: 1150, transaction_count: 1 },
        { category: 'groceries', monthly_average: 380, transaction_count: 12 },
        { category: 'transport', monthly_average: 165, transaction_count: 8 },
      ],
    })
  }

  if (taskType === 'document_classification') {
    return JSON.stringify({ document_type: 'bank_statement', confidence: 0.9 })
  }

  return JSON.stringify({ result: `[DRY RUN] Mock response for ${taskType}` })
}
