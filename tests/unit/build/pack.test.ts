import { describe, expect, it } from 'vitest'
import { CHUNK_SIZE, fits, pack, unpack } from '@/lib/build/pack'

const isRecord = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object'

describe('pack', () => {
  it('round-trips through gzip and base64url chunks', () => {
    const value = { kind: 'scenario', id: 'sarah-employed-homeowner', connectedAt: '2026-09-11T00:00:00.000Z' }
    const chunks = pack(value)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(unpack(chunks, isRecord)).toEqual(value)
  })

  it('splits large values into cookie-sized chunks and reports what fits', () => {
    const big = { rows: Array.from({ length: 600 }, (_, i) => ({ date: `2025-${String((i % 12) + 1).padStart(2, '0')}-11`, description: `PAYEE NUMBER ${i} ${Math.random()}`, amount: -(i + 1) * 1.5 })) }
    const chunks = pack(big)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every(c => c.length <= CHUNK_SIZE)).toBe(true)
    expect(unpack(chunks, isRecord)).toEqual(big)
    expect(fits({ a: 1 })).toBe(true)
  })

  it('returns null for tampered or empty input', () => {
    expect(unpack([], isRecord)).toBeNull()
    expect(unpack(['not-gzip'], isRecord)).toBeNull()
    expect(unpack(pack('a string'), isRecord)).toBeNull()
  })
})
