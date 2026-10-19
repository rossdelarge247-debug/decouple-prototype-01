import { afterEach, describe, expect, it, vi } from 'vitest'

/* the store client, recording how it is asked */
const calls: unknown[][] = []
vi.mock('@vercel/global-config', () => ({
  createClient: () => ({
    getAll: async (...a: unknown[]) => {
      calls.push(['getAll', ...a])
      return { mode: 'guide', landing: 'b', theme: 'field' }
    },
    get: async (...a: unknown[]) => {
      calls.push(['get', ...a])
      return { month: '2026-10', usd: 1 }
    },
  }),
}))

const { clearSettingsCache, readItem, readSettings, useSettingsReader } = await import('../lib/settings.js')

afterEach(() => {
  delete process.env.GLOBAL_CONFIG
  calls.length = 0
})

describe('reading the settings store', () => {
  it('always asks the store itself, never the copy a function starts with', async () => {
    process.env.GLOBAL_CONFIG = 'https://global-config.vercel.com/ecfg_1?token=t'
    useSettingsReader(null)
    clearSettingsCache()
    const s = await readSettings(0)
    expect(s).toMatchObject({ mode: 'guide', landing: 'b', theme: 'field' })
    expect(calls[0]).toEqual(['getAll', ['mode', 'requireCode', 'testMode', 'landing', 'indexing', 'theme'], { consistentRead: true }])
    expect(await readItem('aiSpend')).toEqual({ month: '2026-10', usd: 1 })
    expect(calls[1]).toEqual(['get', 'aiSpend', { consistentRead: true }])
  })

  it('past the cache time, gives the last copy at once and reads a fresh one in the background, when asked to', async () => {
    let landing = 'b'
    let release: () => void = () => {}
    let slow = false
    const reader = vi.fn(async () => {
      if (slow) await new Promise<void>((r) => (release = r))
      return { landing }
    })
    useSettingsReader(reader)
    expect((await readSettings(0)).landing).toBe('b')
    landing = 'f'
    slow = true
    /* 2 minutes on, the middleware asks with staleMs: no waiting for the store */
    expect((await readSettings(120_000, 60_000, 600_000)).landing).toBe('b')
    expect((await readSettings(120_001, 60_000, 600_000)).landing).toBe('b')
    expect(reader).toHaveBeenCalledTimes(2)
    release()
    await new Promise((r) => setTimeout(r, 0))
    expect((await readSettings(120_002, 60_000, 600_000)).landing).toBe('f')
    expect(reader).toHaveBeenCalledTimes(2)
  })

  it('waits for the store with no staleMs, and when the copy is older than staleMs', async () => {
    let landing = 'b'
    const reader = vi.fn(async () => ({ landing }))
    useSettingsReader(reader)
    await readSettings(0)
    landing = 'c'
    expect((await readSettings(6_000, 5_000)).landing, 'the functions read fresh').toBe('c')
    landing = 'd'
    expect((await readSettings(6_000 + 11 * 60_000, 60_000, 600_000)).landing, 'eleven minutes old').toBe('d')
    expect(reader).toHaveBeenCalledTimes(3)
    useSettingsReader(null)
  })
})
