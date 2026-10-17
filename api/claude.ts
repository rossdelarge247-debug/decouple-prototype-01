import Anthropic from '@anthropic-ai/sdk'
import { waitUntil } from '@vercel/functions'
import { unauthorised, who } from '../lib/api.js'
import { EFFORT_MODELS, FALLBACK_MODELS, cleanClaudeRequest, costUsd, createSpendTracker, type SpendTracker } from '../lib/claude.js'
import { env, siteOrigin, type Env } from '../lib/env.js'
import { cleanHelpRequest, helpContent, helpReady, helpVisitorAllowed } from '../lib/help.js'
import { bad, json, readJson } from '../lib/http.js'
import { claudeLimiter } from '../lib/ratelimit.js'
import { readItem, upsertItems } from '../lib/settings.js'

/* The AI proxy (spec §7). Owner or tester; with kind "help", also a visitor who passed the person
   check, and then the server builds the system prompt itself (lib/help.ts). Calls the Messages API with
   ANTHROPIC_API_KEY and CLAUDE_MODEL: no tools, no web, no streaming. 503 until the key, the model and
   the monthly cap (CLAUDE_MONTHLY_CAP_USD) are all set, and once the month's estimated spend passes
   the cap. Logs time, route, role, kind, model, token counts and status. Never content. */

export const spend: SpendTracker = createSpendTracker({
  read: () => readItem('aiSpend'),
  write: (s) => upsertItems({ aiSpend: s }),
})

export interface ClaudeConfig {
  key: string
  model: string
  capUsd: number
}

export function claudeConfig(e: Env = env()): ClaudeConfig | null {
  const key = (e.ANTHROPIC_API_KEY || '').trim()
  const model = (e.CLAUDE_MODEL || '').trim()
  const capUsd = Number(e.CLAUDE_MONTHLY_CAP_USD)
  if (!key || !model || !(capUsd > 0)) return null
  return { key, model, capUsd }
}

const log = (fields: Record<string, unknown>): void => console.log(JSON.stringify({ at: new Date().toISOString(), route: '/api/claude', ...fields }))

const offline = (): Response => json({ ok: false, error: 'The AI is not available just now.' }, 503)

export async function POST(request: Request): Promise<Response> {
  const w = await who(request)
  if (!w.owner && !w.tester && !w.human) return unauthorised()
  const body = await readJson(request)
  if (!body.ok) return body.response
  const help = !!body.body && typeof body.body === 'object' && (body.body as { kind?: unknown }).kind === 'help'
  const kind = help ? 'help' : undefined
  /* a visitor who only passed the person check may ask the help assistant, and nothing else */
  const visitor = !w.owner && !w.tester
  const role = w.owner ? 'owner' : w.tester ? 'tester' : 'human'
  if (visitor && !help) return unauthorised()
  const cfg = claudeConfig()
  if (!cfg) return offline()
  if (!(visitor ? helpVisitorAllowed(w.key) : claudeLimiter.hit(w.key))) {
    log({ role, kind, status: 429 })
    return bad(visitor ? 'Too many questions. Try again later.' : 'Too many questions. Try again in an hour.', 429)
  }
  let govuk: string | undefined
  let cleaned: ReturnType<typeof cleanClaudeRequest>
  if (help) {
    if (!helpReady()) {
      log({ role, kind, status: 503, reason: 'no help prompt builder' })
      return offline()
    }
    const page = await helpContent(new URL(request.url).origin, siteOrigin())
    govuk = page.from
    cleaned = cleanHelpRequest(body.body, page.value)
  } else cleaned = cleanClaudeRequest(body.body)
  if (!cleaned.ok) return bad(cleaned.error)
  await spend.refresh()
  if (spend.total() >= cfg.capUsd) {
    log({ role, kind, status: 503, reason: 'monthly cap' })
    return offline()
  }

  const { system, messages, max_tokens } = cleaned.request
  const client = new Anthropic({ apiKey: cfg.key, maxRetries: 1, timeout: 45_000 })
  const fallback = FALLBACK_MODELS.has(cfg.model)
  let res: Anthropic.Beta.BetaMessage
  try {
    res = await client.beta.messages.create({
      model: cfg.model,
      max_tokens,
      messages,
      ...(system ? { system } : {}),
      ...(EFFORT_MODELS.has(cfg.model) ? { output_config: { effort: 'low' as const } } : {}),
      ...(fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    })
  } catch (e) {
    const status = e instanceof Anthropic.APIError ? e.status : null
    log({ role, kind, model: cfg.model, status: 502, upstream: status ?? (e instanceof Error ? e.name : 'error') })
    return json({ ok: false, error: 'The AI did not answer just now.' }, 502)
  }

  const cost = costUsd(res.usage, [cfg.model, res.model])
  spend.add(cost)
  waitUntil(spend.flush())
  const text = res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
  const status = res.stop_reason === 'refusal' || !text ? 502 : 200
  log({ role, kind, govuk, model: res.model, status, stop: res.stop_reason, in: res.usage.input_tokens, out: res.usage.output_tokens, usd: Math.round(cost * 1e6) / 1e6 })
  if (status !== 200) return json({ ok: false, error: 'The AI did not answer that one.' }, 502)
  return json({ text })
}
