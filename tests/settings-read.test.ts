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
})
