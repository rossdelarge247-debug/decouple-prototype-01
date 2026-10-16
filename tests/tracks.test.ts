import { describe, expect, it } from 'vitest'
import { FILES, MVPS, PROTOS, slugOf } from '../lib/aliases.js'
import { slugOf as buildSlugOf } from '../lib/build/transform.mjs'
import { TRACK_RE, normaliseMode, normaliseTrack, trackAllows, trackFiles } from '../lib/tracks.js'

describe('tracks (spec §4.4)', () => {
  it('maps tokens to page files', () => {
    expect([...trackFiles('full')]).toEqual([...PROTOS])
    expect([...trackFiles('mvp')]).toEqual([...MVPS])
    expect([...trackFiles('p03,m05')]).toEqual(['Proto 03 · Playback.html', 'MVP 05 · Financial Statement.html'])
    expect([...trackFiles('m00,m07,p10,p01')]).toEqual(['MVP 00 · Public Site.html', 'MVP 07 · Ask.html', 'Proto 10 · Dashboard.html', 'Proto 01 · Discover.html'])
    expect(trackFiles('').size).toBe(0)
    expect(trackFiles(undefined).size).toBe(0)
    expect(trackFiles('p00,p11,m09').size).toBe(0)
    expect([...trackFiles('m08')]).toEqual(['MVP 08 · Help & Support.html'])
    expect(trackFiles('mvp').size).toBe(9)
  })

  it('normalises tracks and modes from the sheet', () => {
    expect(normaliseTrack(' P03, 06 m05 ')).toBe('p03,p06,m05')
    expect(normaliseTrack('everything')).toBe('')
    expect(normaliseTrack('mvp,mvp')).toBe('mvp')
    expect(normaliseMode('MOD')).toBe('mod')
    expect(normaliseMode('x')).toBe('')
  })

  it('accepts only the shapes the owner can make', () => {
    for (const t of ['', 'full', 'mvp', 'p03', 'p03,m05', 'm00,m07']) expect(TRACK_RE.test(t), t).toBe(true)
    for (const t of ['all', 'p3', 'p03,', 'p03 m05', 'full,p03', 'x03', 'P03']) expect(TRACK_RE.test(t), t).toBe(false)
  })

  it('opens the track pages, the hub, the shared folders and their inline scripts, and nothing else', () => {
    expect(trackAllows('mvp', 'MVP 03 · To-do & Journal.html')).toBe(true)
    expect(trackAllows('mvp', FILES.takePart)).toBe(true)
    expect(trackAllows('mvp', 'mvp/kit/kit.js')).toBe(true)
    expect(trackAllows('mvp', 'take-part/tp.js')).toBe(true)
    expect(trackAllows('mvp', 'inline/mvp-03-to-do-journal-1.js')).toBe(true)
    expect(trackAllows('mvp', 'inline/decouple-take-part-1.js')).toBe(true)
    expect(trackAllows('mvp', 'Proto 01 · Discover.html')).toBe(false)
    expect(trackAllows('mvp', 'inline/proto-01-discover-1.js')).toBe(false)
    expect(trackAllows('mvp', FILES.hub)).toBe(false)
    expect(trackAllows('mvp', 'hub/hub-switch.js')).toBe(false)
    expect(trackAllows('mvp', 'results/r-app.js')).toBe(false)
    expect(trackAllows('mvp', 'settings/s.js')).toBe(false)
    expect(trackAllows('', 'proto/ut/ut.js')).toBe(false)
    expect(trackAllows('', FILES.takePart)).toBe(false)
  })

  it('refuses paths that climb out of a folder', () => {
    for (const f of ['proto/../Decouple · Results.html', 'mvp/./../hub/hub-switch.js', 'proto\\..\\results/r-app.js', 'shared//x.js']) expect(trackAllows('mvp', f), f).toBe(false)
  })

  it('names inline scripts the way the build does', () => {
    for (const f of [...PROTOS, ...MVPS, FILES.takePart, FILES.hub]) expect(slugOf(f), f).toBe(buildSlugOf(f))
    expect(slugOf('MVP 03 · To-do & Journal.html')).toBe('mvp-03-to-do-journal')
  })
})
