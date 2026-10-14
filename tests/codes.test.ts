import { describe, expect, it, vi } from 'vitest'
import { CODE_RE, createCodeStore, findCode, isLive, normaliseCode, normaliseRow, normaliseRows, parseFallback } from '../lib/codes.js'

describe('tester codes', () => {
  it('normalises what the sheet returns', () => {
    expect(normaliseRow({ code: ' fern-lark-27 ', label: 'P01', active: 'TRUE', test: 'false', expires: '2026-11-03T00:00:00.000Z', uses: '3' })).toEqual({
      code: 'FERN-LARK-27',
      label: 'P01',
      active: true,
      test: false,
      expires: '2026-11-03',
      track: '',
      mode: '',
      uses: 3,
    })
    expect(normaliseRow({ code: 'A-B-01', active: true, track: ' MVP ', mode: 'MOD' })).toMatchObject({ track: 'mvp', mode: 'mod' })
    expect(normaliseRow({ code: 'A-B-01', active: true, track: 'p03, 06,m05,zz', mode: 'later' })).toMatchObject({ track: 'p03,p06,m05', mode: '' })
    expect(normaliseRow({ code: '', label: 'x' })).toBeNull()
    expect(normaliseRows([{ code: 'A-B-01', active: true }, null, 'junk'])).toHaveLength(1)
  })

  it('knows when a code is live', () => {
    expect(isLive({ code: 'A-B-01', label: '', active: true, test: false, expires: '', track: '', mode: '' as const }, '2026-10-13')).toBe(true)
    expect(isLive({ code: 'A-B-01', label: '', active: true, test: false, expires: '2026-10-13', track: '', mode: '' as const }, '2026-10-13')).toBe(true)
    expect(isLive({ code: 'A-B-01', label: '', active: true, test: false, expires: '2026-10-12', track: '', mode: '' as const }, '2026-10-13')).toBe(false)
    expect(isLive({ code: 'A-B-01', label: '', active: false, test: false, expires: '', track: '', mode: '' as const }, '2026-10-13')).toBe(false)
  })

  it('parses the TESTER_CODES fallback and matches regardless of case', () => {
    const rows = parseFallback(' blue-oak-42:P01, GOLD-REED-07 ,:nothing')
    expect(rows).toEqual([
      { code: 'BLUE-OAK-42', label: 'P01', active: true, test: false, expires: '', track: '', mode: '' as const },
      { code: 'GOLD-REED-07', label: '', active: true, test: false, expires: '', track: '', mode: '' as const },
    ])
    expect(findCode(rows, 'blue-oak-42')?.label).toBe('P01')
    expect(normaliseCode(undefined)).toBe('')
    expect(CODE_RE.test('FERN-LARK-27')).toBe(true)
    expect(CODE_RE.test('fern-lark-27')).toBe(false)
    expect(CODE_RE.test('TOOLONGWORD-OAK-27')).toBe(false)
  })

  it('caches the list for a minute and falls back when the script is unreachable', async () => {
    let now = 1_000_000
    const fetchCodes = vi.fn(async () => [{ code: 'A-B-01', label: 'one', active: true, test: false, expires: '', track: '', mode: '' as const }])
    const store = createCodeStore({ fetchCodes, fallback: () => parseFallback('Z-Z-99:fb'), now: () => now, ttlMs: 60_000 })
    expect((await store.check('a-b-01')).row).toMatchObject({ code: 'A-B-01' })
    expect((await store.check('A-B-01')).row).toMatchObject({ code: 'A-B-01' })
    expect(fetchCodes).toHaveBeenCalledTimes(1)
    now += 61_000
    await store.list()
    expect(fetchCodes).toHaveBeenCalledTimes(2)
    store.clear()
    fetchCodes.mockRejectedValue(new Error('down'))
    expect((await store.check('Z-Z-99')).row).toMatchObject({ label: 'fb' })
    expect((await store.check('A-B-01')).row).toBeNull()
    expect(fetchCodes).toHaveBeenCalledTimes(4)
  })

  it('re-reads the list once for a code it does not know, so a new code works within seconds', async () => {
    let now = 0
    const rows = [{ code: 'A-B-01', label: 'one', active: true, test: false, expires: '', track: '', mode: '' as const }]
    const fetchCodes = vi.fn(async () => [...rows])
    const store = createCodeStore({ fetchCodes, fallback: () => [], now: () => now, missRefreshMs: 5_000 })
    expect((await store.check('A-B-01')).row).not.toBeNull()
    rows.push({ code: 'NEW-ONE-02', label: 'new', active: true, test: false, expires: '', track: '', mode: '' as const })
    now = 3_000
    expect((await store.check('NEW-ONE-02')).row).toBeNull()
    expect(fetchCodes).toHaveBeenCalledTimes(1)
    now = 6_000
    expect((await store.check('NEW-ONE-02')).row).toMatchObject({ label: 'new' })
    expect(fetchCodes).toHaveBeenCalledTimes(2)
    expect((await store.check('NOPE-NOPE-00')).row).toBeNull()
    expect(fetchCodes).toHaveBeenCalledTimes(2)
  })

  it('answers unknown when neither the script nor the fallback can be read', async () => {
    const store = createCodeStore({ fetchCodes: async () => { throw new Error('down') }, fallback: () => [] })
    expect((await store.check('A-B-01')).row).toBe('unknown')
    expect((await store.check('')).row).toBeNull()
  })

  it('keeps serving the last good list while a refresh fails', async () => {
    let now = 0
    let fail = false
    const store = createCodeStore({
      fetchCodes: async () => {
        if (fail) throw new Error('down')
        return [{ code: 'A-B-01', label: 'one', active: true, test: true, expires: '', track: '', mode: '' as const }]
      },
      fallback: () => [],
      now: () => now,
    })
    expect((await store.check('A-B-01')).row).toMatchObject({ test: true })
    fail = true
    now = 120_000
    expect((await store.check('A-B-01')).row).toMatchObject({ code: 'A-B-01' })
  })
})
