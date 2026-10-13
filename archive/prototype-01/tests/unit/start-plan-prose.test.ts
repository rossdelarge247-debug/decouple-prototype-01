import { describe, expect, it, vi } from 'vitest'
import { PLAN_PROSE_SCHEMA, generatePlanProse, toModelInput, validateProse, type ProseClient } from '@/lib/start/plan-prose'
import { sarah } from './start-answers.test'

const good = {
  situation_summary: 'You have decided to separate and want the finances sorted.',
  steps: ['filing', 'building', 'reconciling', 'settling', 'court', 'implementation'].map(step => ({ step, position: `What ${step} means for you.` })),
  notes: [{ anchor: 'children', text: 'The children come first.' }, { anchor: 'home', text: 'Get the home valued early.' }],
  key_difference: 'You both build one picture instead of trading letters.',
}

function client(text: string, stop = 'end_turn'): ProseClient {
  return { messages: { create: vi.fn().mockResolvedValue({ stop_reason: stop, content: [{ type: 'text', text }] }) } }
}

function walk(schema: unknown, path = 'root'): string[] {
  const out: string[] = []
  if (!schema || typeof schema !== 'object') return out
  const s = schema as Record<string, unknown>
  if (s.type === 'object' && s.additionalProperties !== false) out.push(path)
  for (const [k, v] of Object.entries(s.properties ?? {})) out.push(...walk(v, `${path}.${k}`))
  if (s.items) out.push(...walk(s.items, `${path}[]`))
  return out
}

describe('plan prose', () => {
  it('has additionalProperties: false on every object in the schema', () => {
    expect(walk(PLAN_PROSE_SCHEMA)).toEqual([])
  })

  it('never sends how things are between them or the device', () => {
    const input = toModelInput({ ...sarah, quality: 'safety', devicePrivate: false, awareness: 'hiding' })
    const text = JSON.stringify(input)
    expect(text).not.toMatch(/quality|device|safety|hiding|flag/i)
    expect(input.knowledge_of_partner_finances).toBe('little')
  })

  it('accepts valid prose and calls the model with the schema', async () => {
    const c = client(JSON.stringify(good))
    const prose = await generatePlanProse(sarah, { hasKey: true, client: async () => c })
    expect(prose?.steps).toHaveLength(6)
    const params = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>
    expect(params.model).toBe('claude-opus-5')
    expect(params.output_config).toMatchObject({ format: { type: 'json_schema', schema: PLAN_PROSE_SCHEMA } })
  })

  it('returns null without a key and never builds a client', async () => {
    const factory = vi.fn()
    expect(await generatePlanProse(sarah, { hasKey: false, client: factory })).toBeNull()
    expect(factory).not.toHaveBeenCalled()
  })

  it('returns null on a thrown error, a truncated response, bad shape, or banned copy', async () => {
    const throwing: ProseClient = { messages: { create: vi.fn().mockRejectedValue(new Error('down')) } }
    expect(await generatePlanProse(sarah, { hasKey: true, client: async () => throwing })).toBeNull()
    expect(await generatePlanProse(sarah, { hasKey: true, client: async () => client(JSON.stringify(good), 'max_tokens') })).toBeNull()
    expect(await generatePlanProse(sarah, { hasKey: true, client: async () => client('not json') })).toBeNull()
    expect(validateProse({ ...good, steps: good.steps.slice(0, 5) })).toBeNull()
    expect(validateProse({ ...good, steps: [...good.steps].reverse() })).toBeNull()
    expect(validateProse({ ...good, notes: [] })).toBeNull()
    expect(validateProse({ ...good, key_difference: 'Full disclosure is the key.' })).toBeNull()
    expect(validateProse({ ...good, situation_summary: 'You could save thousands.' })).toBeNull()
    expect(validateProse({ ...good, situation_summary: 'Your next step is easy.' })).toBeNull()
    expect(validateProse(good)).not.toBeNull()
  })
})
