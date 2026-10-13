import { describe, expect, it } from 'vitest'
import { MAX_ANSWER, blockedQid, cleanAnswers, cleanSignup, stripControl } from '../lib/clean.ts'

const base = () => ({
  batchKey: 'b1',
  sid: 'm02-abc',
  pid: 'P-typed',
  test: 'M02 Guide',
  step: 'about',
  price: 'A',
  landing: 'b',
  device: '390×844',
  hp: '',
  rows: [
    { qid: 'm02.stage', qv: 1, q: 'Where are you?', type: 'cards', a: 'decided' },
    { qid: 'm02.safe', qv: 1, q: 'Safe?', type: 'cards', a: 'safe' },
    { qid: 'm02.name_me', qv: 1, q: 'Name', type: 'text', a: 'Ross' },
    { qid: 'm02.contact_email', qv: 1, q: 'Email', type: 'text', a: 'a@b.co' },
    { qid: 'm02.empty', qv: 1, q: 'Empty', type: 'text', a: '' },
  ],
})

describe('cleaning answers', () => {
  it('blocks the safety, name and email questions', () => {
    expect(blockedQid('m02.safe')).toBe(true)
    expect(blockedQid('safe2')).toBe(true)
    expect(blockedQid('name_them')).toBe(true)
    expect(blockedQid('m02.optin_email')).toBe(true)
    expect(blockedQid('m02.stage')).toBe(false)
  })

  it('removes control characters but keeps line breaks', () => {
    expect(stripControl('a\u0000b\u001Fc\nd\te\u009F')).toBe('abc\nd\te')
  })

  it('keeps only the rows that may be stored', () => {
    const r = cleanAnswers(base(), { owner: false, label: 'P01' })
    expect(r.kind).toBe('ok')
    if (r.kind !== 'ok') return
    expect(r.batch.rows.map((x) => x.qid)).toEqual(['m02.stage'])
    expect(r.batch.pid).toBe('P01')
    expect(r.batch).toMatchObject({ batchKey: 'b1', sid: 'm02-abc', test: 'M02 Guide', step: 'about', price: 'A', landing: 'b', device: '390×844' })
  })

  it('uses the client pid only for the owner, trimmed to 40, and anon otherwise', () => {
    const long = { ...base(), pid: 'x'.repeat(60) }
    const owner = cleanAnswers(long, { owner: true })
    expect(owner.kind === 'ok' && owner.batch.pid).toBe('x'.repeat(40))
    const human = cleanAnswers(base(), { owner: false })
    expect(human.kind === 'ok' && human.batch.pid).toBe('anon')
    const blankOwner = cleanAnswers({ ...base(), pid: '  ' }, { owner: true })
    expect(blankOwner.kind === 'ok' && blankOwner.batch.pid).toBe('anon')
  })

  it('drops a batch with a filled trap field and rejects the wrong shape', () => {
    expect(cleanAnswers({ ...base(), hp: 'http://spam' }, { owner: false }).kind).toBe('drop')
    expect(cleanAnswers({ ...base(), test: 'M03 Other' }, { owner: false })).toMatchObject({ kind: 'bad' })
    expect(cleanAnswers({ ...base(), rows: 'no' }, { owner: false })).toMatchObject({ kind: 'bad' })
    expect(cleanAnswers({ ...base(), rows: Array(81).fill(base().rows[0]) }, { owner: false })).toMatchObject({ kind: 'bad' })
    expect(cleanAnswers({ ...base(), sid: '' }, { owner: false })).toMatchObject({ kind: 'bad' })
    expect(cleanAnswers(null, { owner: false })).toMatchObject({ kind: 'bad' })
    expect(cleanAnswers({ ...base(), rows: [{ qid: '', a: 'x' }] }, { owner: false })).toMatchObject({ kind: 'bad' })
  })

  it('caps every answer at 2,000 characters and strips control characters', () => {
    const r = cleanAnswers({ ...base(), rows: [{ qid: 'm02.long', qv: 2, q: 'q', type: 'long', a: 'x'.repeat(3000) + '\u0007' }] }, { owner: false, label: 'P01' })
    expect(r.kind === 'ok' && r.batch.rows[0].a.length).toBe(MAX_ANSWER)
    expect(r.kind === 'ok' && r.batch.rows[0].qv).toBe(2)
  })
})

describe('cleaning sign-ups', () => {
  it('accepts the three sources and joins the stage list', () => {
    const r = cleanSignup({ email: ' You@Example.com ', stage: 'thinking; decided ;', source: 'holding:instagram', sid: 's1', hp: '' })
    expect(r).toEqual({ kind: 'ok', signup: { email: 'you@example.com', stage: 'thinking;decided', source: 'holding:instagram', sid: 's1' } })
    expect(cleanSignup({ email: 'a@b.co', source: 'guide-optin', sid: 's' }).kind).toBe('ok')
    expect(cleanSignup({ email: 'a@b.co', source: 'other', sid: 's' })).toMatchObject({ kind: 'bad' })
    expect(cleanSignup({ email: 'not-an-email', source: 'guide', sid: 's' })).toMatchObject({ kind: 'bad' })
    expect(cleanSignup({ email: 'a@b.co', source: 'guide', sid: 's', hp: 'bot' }).kind).toBe('drop')
  })
})
