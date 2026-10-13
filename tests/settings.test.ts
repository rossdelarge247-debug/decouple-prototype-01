import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULTS, clearSettingsCache, normaliseSettings, parsePatch, readSettings, useSettingsReader } from '../lib/settings.js'

afterEach(() => useSettingsReader(null))

describe('site settings', () => {
  it('normalises whatever Edge Config holds', () => {
    expect(normaliseSettings(null)).toEqual(DEFAULTS)
    expect(normaliseSettings({ mode: 'guide', requireCode: false, testMode: 'yes' })).toEqual({ mode: 'guide', requireCode: false, testMode: false })
    expect(normaliseSettings({ mode: 'other' }).mode).toBe('holding')
  })

  it('validates a patch from the owner', () => {
    expect(parsePatch({ mode: 'guide' })).toEqual({ ok: true, patch: { mode: 'guide' } })
    expect(parsePatch({ requireCode: false, testMode: true })).toEqual({ ok: true, patch: { requireCode: false, testMode: true } })
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
      return { mode: 'guide', requireCode: false, testMode: false }
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
