import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as claude, claudeConfig, spend } from '../api/claude.js'
import { MAX_TOKENS, cleanClaudeRequest, costUsd, createSpendTracker, monthOf, priceOf, type Spend } from '../lib/claude.js'
import { cookieFor, post, setup } from './helpers.js'

const AI = { ANTHROPIC_API_KEY: 'sk-ant-test', CLAUDE_MODEL: 'claude-opus-5-5', CLAUDE_MONTHLY_CAP_USD: '50' }
const ask = { system: 'You are a sounding board.', messages: [{ role: 'user', content: 'Can we sell the house before the divorce?' }], max_tokens: 700 }

const reply = (over: Record<string, unknown> = {}) => ({
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  model: 'claude-opus-5-5',
  content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: 'Yes, if you both agree.' }],
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 1000, output_tokens: 200, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  ...over,
})

function mockAnthropic(body: (n: number) => unknown, status = 200) {
  let n = 0
  const fn = vi.fn(async () => new Response(JSON.stringify(body(++n)), { status, headers: { 'content-type': 'application/json', 'request-id': 'req_1' } }))
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  setup()
  spend.reset()
})
afterEach(() => vi.unstubAllGlobals())

describe('the AI request (spec §7)', () => {
  it('accepts a system prompt, up to 20 messages and up to 1,200 tokens', () => {
    expect(cleanClaudeRequest(ask)).toEqual({ ok: true, request: ask })
    expect(cleanClaudeRequest({ messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] })).toEqual({ ok: true, request: { system: '', messages: [{ role: 'user', content: 'hi' }], max_tokens: 700 } })
    const twenty = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x' }))
    twenty[19].role = 'user'
    expect(cleanClaudeRequest({ messages: twenty }).ok).toBe(true)
  })

  it('refuses the wrong shapes and anything over the limits', () => {
    const bad = [
      null,
      { messages: [] },
      { messages: Array.from({ length: 21 }, () => ({ role: 'user', content: 'x' })) },
      { ...ask, system: 'x'.repeat(8001) },
      { ...ask, system: 42 },
      { ...ask, max_tokens: MAX_TOKENS + 1 },
      { ...ask, max_tokens: 0 },
      { ...ask, max_tokens: 1.5 },
      { messages: [{ role: 'system', content: 'x' }] },
      { messages: [{ role: 'user', content: '' }] },
      { messages: [{ role: 'user', content: [{ type: 'image', source: {} }] }] },
      { messages: [{ role: 'assistant', content: 'x' }, { role: 'user', content: 'y' }] },
      { messages: [{ role: 'user', content: 'x' }, { role: 'assistant', content: 'prefill' }] },
    ]
    for (const b of bad) expect(cleanClaudeRequest(b).ok, JSON.stringify(b)?.slice(0, 60)).toBe(false)
  })

  it('estimates cost from usage, at the dearer price when a fallback answered', () => {
    expect(costUsd({ input_tokens: 1_000_000, output_tokens: 0 }, ['claude-opus-5-5'])).toBe(4)
    expect(costUsd({ input_tokens: 0, output_tokens: 1_000_000 }, ['claude-opus-5-5'])).toBe(20)
    expect(costUsd({ input_tokens: 1_000_000, output_tokens: 1_000_000 }, ['claude-opus-5-5', 'claude-opus-4-8'])).toBe(30)
    expect(costUsd({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 }, ['claude-haiku-5-5'])).toBeCloseTo(0.135)
    expect(priceOf('claude-something-new')).toEqual({ input: 10, output: 50 })
    expect(costUsd(null, ['claude-opus-5-5'])).toBe(0)
  })
})

describe('the monthly spend', () => {
  function memoryStore(initial: Spend | null = null) {
    const s = { value: initial as Spend | null, writes: 0 }
    return { s, store: { read: async () => s.value, write: async (v: Spend) => { s.value = v; s.writes += 1 } } }
  }

  it('adds to the store at most once a minute and starts again each month', async () => {
    let now = Date.UTC(2026, 9, 14, 12)
    const { s, store } = memoryStore({ month: '2026-10', usd: 10 })
    const t = createSpendTracker(store, () => now)
    await t.refresh()
    expect(t.total()).toBe(10)
    t.add(1.5)
    await t.flush()
    expect(s.value).toEqual({ month: '2026-10', usd: 11.5 })
    t.add(1)
    await t.flush()
    expect(s.writes).toBe(1)
    expect(t.total()).toBe(12.5)
    /* another instance spent 5 meanwhile */
    s.value = { month: '2026-10', usd: 16.5 }
    now += 61_000
    await t.flush()
    expect(s.value).toEqual({ month: '2026-10', usd: 17.5 })
    now = Date.UTC(2026, 10, 1, 0, 0, 1)
    expect(monthOf(now)).toBe('2026-11')
    expect(t.total()).toBe(0)
    await t.refresh()
    expect(t.total()).toBe(0)
  })

  it('keeps counting in memory when the store cannot be written', async () => {
    const t = createSpendTracker({ read: async () => undefined, write: async () => { throw new Error('no store') } })
    t.add(2)
    await t.flush()
    t.add(3)
    expect(t.total()).toBe(5)
  })
})

describe('/api/claude', () => {
  it('needs a session, then a key, a model and a cap', async () => {
    const fetch = mockAnthropic(() => reply())
    expect((await claude(post('/api/claude', ask))).status).toBe(401)
    expect((await claude(post('/api/claude', ask, await cookieFor('human')))).status).toBe(401)
    const tester = await cookieFor('tester', { l: 'P02', c: 'OAK-WREN-40' })
    expect((await claude(post('/api/claude', ask, tester))).status).toBe(503)
    Object.assign(process.env, AI, { CLAUDE_MONTHLY_CAP_USD: '' })
    expect(claudeConfig()).toBeNull()
    expect((await claude(post('/api/claude', ask, tester))).status).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
    for (const k of Object.keys(AI)) delete process.env[k]
  })

  it('answers a tester with the reply text, asks for low effort with the default fallback, and logs no content', async () => {
    Object.assign(process.env, AI)
    const fetch = mockAnthropic(() => reply())
    const logs: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void logs.push(a.join(' ')))
    const r = await claude(post('/api/claude', ask, await cookieFor('tester', { l: 'P02', c: 'OAK-WREN-40' })))
    spy.mockRestore()
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ text: 'Yes, if you both agree.' })
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(String(url)).toBe('https://api.anthropic.com/v1/messages?beta=true')
    const headers = new Headers(init.headers)
    expect(headers.get('x-api-key')).toBe('sk-ant-test')
    expect(headers.get('anthropic-beta')).toBe('server-side-fallback-2026-07-01')
    const sent = JSON.parse(String(init.body))
    expect(sent).toEqual({ model: 'claude-opus-5-5', max_tokens: 700, system: 'You are a sounding board.', messages: ask.messages, output_config: { effort: 'low' }, fallbacks: 'default' })
    expect(sent.tools).toBeUndefined()
    expect(sent.stream).toBeUndefined()
    const line = logs.join('\n')
    expect(line).toContain('"route":"/api/claude"')
    expect(line).toContain('"in":1000')
    expect(line).not.toContain('house')
    expect(line).not.toContain('sounding board')
    expect(line).not.toContain('both agree')
    expect(spend.total()).toBeCloseTo(0.008)
  })

  it('leaves out the fallback and effort for models that take neither', async () => {
    Object.assign(process.env, AI, { CLAUDE_MODEL: 'claude-haiku-4-5' })
    const fetch = mockAnthropic(() => reply({ model: 'claude-haiku-4-5' }))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    expect((await claude(post('/api/claude', ask, await cookieFor('owner')))).status).toBe(200)
    const sent = JSON.parse(String((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(sent.fallbacks).toBeUndefined()
    expect(sent.output_config).toBeUndefined()
    vi.restoreAllMocks()
  })

  it('returns 400, 429, 502 and the 503 at the cap honestly', async () => {
    Object.assign(process.env, AI)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const tester = await cookieFor('tester', { l: 'P02', c: 'OAK-WREN-40' })
    mockAnthropic(() => reply({ stop_reason: 'refusal', content: [] }))
    expect((await claude(post('/api/claude', { messages: [] }, tester))).status).toBe(400)
    expect((await claude(post('/api/claude', ask, tester))).status).toBe(502)
    mockAnthropic(() => ({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }), 529)
    expect((await claude(post('/api/claude', ask, tester))).status).toBe(502)
    mockAnthropic(() => reply())
    spend.add(50)
    expect((await claude(post('/api/claude', ask, tester))).status).toBe(503)
    spend.reset()
    for (let i = 4; i < 40; i++) await claude(post('/api/claude', ask, tester))
    expect((await claude(post('/api/claude', ask, tester))).status).toBe(429)
    vi.restoreAllMocks()
  }, 20_000)
})
