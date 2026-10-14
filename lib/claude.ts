/* The AI proxy (spec §7, /api/claude): what a request may hold, what a reply costs, and the monthly
   spend cap. Pure apart from the store the spend is kept in, which is injected. Content is never
   logged or stored anywhere: only token counts, the model and the status. */

export const MAX_TOKENS = 1200
export const DEFAULT_TOKENS = 700
export const MAX_MESSAGES = 20
export const MAX_SYSTEM = 8000

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeRequest {
  system: string
  messages: ClaudeMessage[]
  max_tokens: number
}

/* Text content as a string, or as text blocks the way the API takes it */
function textOf(content: unknown): string | null {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return null
  const parts: string[] = []
  for (const b of content) {
    if (!b || typeof b !== 'object' || (b as { type?: unknown }).type !== 'text' || typeof (b as { text?: unknown }).text !== 'string') return null
    parts.push((b as { text: string }).text)
  }
  return parts.join('\n')
}

export function cleanClaudeRequest(body: unknown): { ok: true; request: ClaudeRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Expected an object.' }
  const b = body as Record<string, unknown>
  if (b.system != null && typeof b.system !== 'string') return { ok: false, error: 'system must be text.' }
  const system = (b.system as string | undefined) ?? ''
  if (system.length > MAX_SYSTEM) return { ok: false, error: `system has at most ${MAX_SYSTEM} characters.` }
  if (!Array.isArray(b.messages) || !b.messages.length) return { ok: false, error: 'messages must be a non-empty array.' }
  if (b.messages.length > MAX_MESSAGES) return { ok: false, error: `At most ${MAX_MESSAGES} messages.` }
  const messages: ClaudeMessage[] = []
  for (const raw of b.messages) {
    const m = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    if (m.role !== 'user' && m.role !== 'assistant') return { ok: false, error: 'Each message needs the role user or assistant.' }
    const content = textOf(m.content)
    if (content === null || !content.trim()) return { ok: false, error: 'Each message needs text content.' }
    messages.push({ role: m.role, content })
  }
  /* the current models take no assistant prefill: the conversation starts and ends with the person */
  if (messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') return { ok: false, error: 'The first and last messages must be the user’s.' }
  let max_tokens = DEFAULT_TOKENS
  if (b.max_tokens != null) {
    const n = Number(b.max_tokens)
    if (!Number.isInteger(n) || n < 1 || n > MAX_TOKENS) return { ok: false, error: `max_tokens must be a whole number from 1 to ${MAX_TOKENS}.` }
    max_tokens = n
  }
  return { ok: true, request: { system, messages, max_tokens } }
}

/** US dollars per million tokens, Anthropic's first-party rates (October 2026) */
export const PRICES: Readonly<Record<string, { input: number; output: number }>> = {
  'claude-fable-5-1': { input: 10, output: 50 },
  'claude-fable-5': { input: 10, output: 50 },
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-opus-4-7': { input: 5, output: 25 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'claude-haiku-4-5': { input: 1, output: 5 },
}
/** a model the table doesn't know is priced like the dearest, so the cap errs on the safe side */
export const UNKNOWN_PRICE = { input: 10, output: 50 }

export const priceOf = (model: string | null | undefined): { input: number; output: number } => (model && PRICES[model]) || UNKNOWN_PRICE

export interface Usage {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

/* What a reply cost, in dollars. When a fallback model answered, the dearer of the two prices is used. */
export function costUsd(usage: Usage | null | undefined, models: (string | null | undefined)[]): number {
  if (!usage) return 0
  const price = models.map(priceOf).reduce((a, b) => ({ input: Math.max(a.input, b.input), output: Math.max(a.output, b.output) }), { input: 0, output: 0 })
  const input = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) * 1.25 + (usage.cache_read_input_tokens || 0) * 0.1
  return (input * price.input + (usage.output_tokens || 0) * price.output) / 1_000_000
}

/** models that take output_config.effort; the proxy asks for low effort, as the replies are short */
export const EFFORT_MODELS: ReadonlySet<string> = new Set(['claude-fable-5-1', 'claude-fable-5', 'claude-opus-5-5', 'claude-opus-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-sonnet-5-5', 'claude-sonnet-5', 'claude-haiku-5-5'])
/** models with a server-side fallback when a safety classifier declines (fallbacks: "default") */
export const FALLBACK_MODELS: ReadonlySet<string> = new Set(['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'])

/* "2026-10" */
export const monthOf = (t: number): string => new Date(t).toISOString().slice(0, 7)

export interface Spend {
  month: string
  usd: number
}

export function readSpend(raw: unknown): Spend | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.month !== 'string' || !/^\d{4}-\d{2}$/.test(r.month)) return null
  const usd = Number(r.usd)
  return { month: r.month, usd: Number.isFinite(usd) && usd > 0 ? usd : 0 }
}

export interface SpendStore {
  read: () => Promise<unknown>
  write: (spend: Spend) => Promise<void>
}

export interface SpendTracker {
  /** this month's total as far as this instance knows: the store's figure plus its own unwritten spend */
  total(): number
  /** re-read the store, at most once a minute */
  refresh(): Promise<void>
  add(usd: number): void
  /** write the running total to the store, at most once a minute */
  flush(): Promise<void>
  reset(): void
}

/* The running monthly total (Global Config item aiSpend: {month, usd}). Each instance adds its own
   spend to the latest figure in the store and writes it back at most once a minute. Two instances
   writing in the same moment can each miss the other's last minute, so the cap is an estimate, set
   with that margin in mind. */
export function createSpendTracker(store: SpendStore, now: () => number = Date.now, everyMs = 60_000): SpendTracker {
  let month = monthOf(now())
  let base = 0
  let pending = 0
  let readAt = -Infinity
  let writeAt = -Infinity
  const roll = () => {
    const m = monthOf(now())
    if (m !== month) {
      month = m
      base = 0
      pending = 0
    }
  }
  const fromStore = async (): Promise<number | null> => {
    try {
      const s = readSpend(await store.read())
      return s && s.month === month ? s.usd : 0
    } catch {
      return null
    }
  }
  return {
    total() {
      roll()
      return base + pending
    },
    async refresh() {
      roll()
      if (now() - readAt < everyMs) return
      readAt = now()
      const usd = await fromStore()
      if (usd !== null) base = Math.max(base, usd)
    },
    add(usd) {
      roll()
      if (usd > 0) pending += usd
    },
    async flush() {
      roll()
      if (pending <= 0 || now() - writeAt < everyMs) return
      writeAt = now()
      const stored = await fromStore()
      const next = Math.max(stored ?? base, base) + pending
      const sent = pending
      try {
        await store.write({ month, usd: Math.round(next * 1e6) / 1e6 })
        base = next
        pending -= sent
        readAt = now()
      } catch {
        /* kept as pending; the next flush tries again */
      }
    },
    reset() {
      month = monthOf(now())
      base = 0
      pending = 0
      readAt = -Infinity
      writeAt = -Infinity
    },
  }
}
