import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULTS, clearSettingsCache, connectionString, normaliseSettings, parsePatch, readSettings, storeId, useSettingsReader } from '../lib/settings.js'

afterEach(() => useSettingsReader(null))

describe('site settings', () => {
  it('normalises whatever Edge Config holds', () => {
    expect(normaliseSettings(null)).toEqual(DEFAULTS)
    expect(normaliseSettings({ mode: 'guide', requireCode: false, testMode: 'yes' })).toEqual({ mode: 'guide', requireCode: false, testMode: false, landing: 'a' })
    expect(normaliseSettings({ mode: 'other' }).mode).toBe('holding')
    expect(normaliseSettings({ landing: 'random' }).landing).toBe('random')
    expect(normaliseSettings({ landing: 'i' }).landing).toBe('i')
    expect(normaliseSettings({ landing: 'z' }).landing).toBe('a')
  })

  it('finds the store id and connection string under the new and the old names', () => {
    expect(storeId({ GLOBAL_CONFIG_ID: 'ecfg_abc' })).toBe('ecfg_abc')
    expect(storeId({ EDGE_CONFIG_ID: 'ecfg_old' })).toBe('ecfg_old')
    expect(storeId({ GLOBAL_CONFIG: 'https://global-config.vercel.com/ecfg_xyz123?token=t' })).toBe('ecfg_xyz123')
    expect(storeId({ EDGE_CONFIG: 'https://edge-config.vercel.com/ecfg_xyz123?token=t' })).toBe('ecfg_xyz123')
    expect(storeId({ GLOBAL_CONFIG: 'not a url' })).toBeNull()
    expect(storeId({})).toBeNull()
    expect(connectionString({ GLOBAL_CONFIG: 'g', EDGE_CONFIG: 'e' })).toBe('g')
    expect(connectionString({ EDGE_CONFIG: 'e' })).toBe('e')
    expect(connectionString({})).toBeNull()
  })

  it('validates a patch from the owner', () => {
    expect(parsePatch({ mode: 'guide' })).toEqual({ ok: true, patch: { mode: 'guide' } })
    expect(parsePatch({ requireCode: false, testMode: true })).toEqual({ ok: true, patch: { requireCode: false, testMode: true } })
    expect(parsePatch({ landing: 'f' })).toEqual({ ok: true, patch: { landing: 'f' } })
    expect(parsePatch({ landing: 'random' })).toEqual({ ok: true, patch: { landing: 'random' } })
    expect(parsePatch({ landing: 'j' })).toMatchObject({ ok: false })
    expect(parsePatch({ mode: 'open' })).toMatchObject({ ok: false })
    expect(parsePatch({ requireCode: 'no' })).toMatchObject({ ok: false })
    expect(parsePatch({})).toMatchObject({ ok: false })
    expect(parsePatch({ other: 1 })).toMatchObject({ ok: false })
  })

  it('caches for 60 seconds and keeps the last value when the read fails', async () => {
    let calls = 0
    let fail = false
    useSettingsReader(async () => {
      calls += 1
      if (fail) throw new Error('down')
      return { mode: 'guide', requireCode: false, testMode: false, landing: 'a' }
    })
    expect((await readSettings(0)).mode).toBe('guide')
    expect((await readSettings(30_000)).mode).toBe('guide')
    expect(calls).toBe(1)
    fail = true
    expect((await readSettings(61_000)).mode).toBe('guide')
    expect(calls).toBe(2)
    clearSettingsCache()
    expect(await readSettings(200_000)).toEqual(DEFAULTS)
  })
})
