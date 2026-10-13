import { describe, expect, it } from 'vitest'
import {
  EMPTY_ANSWERS, answersHash, deriveFlags, isComplete, isFlagged, isStartAnswers, nextRoute, parseStep, progress, stepRoute,
  type StartAnswers,
} from '@/lib/start/answers'
import { decode, encode } from '@/lib/codec'

export const sarah: StartAnswers = {
  stage: 'decided',
  relationship: 'married',
  living: 'yes',
  children: 2,
  home: 'mortgage',
  quality: 'amicable',
  devicePrivate: true,
  selfEmployed: 'no',
  awareness: 'some',
  priorities: ['home', 'children', 'pension'],
  worries: ['mortgage', 'fair'],
}

function form(entries: Array<[string, string]>): FormData {
  const f = new FormData()
  for (const [k, v] of entries) f.append(k, v)
  return f
}

describe('interview answers', () => {
  it('routes cohabiting couples to the honest exit', () => {
    expect(nextRoute('o2', { ...sarah, relationship: 'cohabiting' })).toBe('/start/not-for-you')
    expect(nextRoute('o2', sarah)).toBe('/start/between-you')
    expect(nextRoute('o6', sarah)).toBe('/start/plan')
    expect(nextRoute('o7', sarah)).toBe('/start/next')
    expect(stepRoute('o1')).toBe('/start/where-you-are')
  })

  it('sets flags silently', () => {
    expect(deriveFlags(sarah)).toEqual({ safety: false, devicePrivate: true, complexity: false })
    expect(isFlagged(sarah)).toBe(false)
    expect(isFlagged({ ...sarah, quality: 'safety' })).toBe(true)
    expect(isFlagged({ ...sarah, devicePrivate: false })).toBe(true)
    expect(deriveFlags({ ...sarah, selfEmployed: 'ex' }).complexity).toBe(true)
    expect(deriveFlags({ ...sarah, awareness: 'hiding' }).complexity).toBe(true)
  })

  it('validates each screen', () => {
    expect(parseStep('o1', form([['stage', 'decided']]))).toEqual({ ok: true, patch: { stage: 'decided' } })
    expect(parseStep('o1', form([]))).toEqual({ ok: false, errors: { stage: 'chooseOne' } })
    expect(parseStep('o2', form([['relationship', 'married'], ['living', 'yes'], ['children', 'yes'], ['childrenCount', '2'], ['home', 'mortgage']]))).toEqual({
      ok: true, patch: { relationship: 'married', living: 'yes', children: 2, home: 'mortgage' },
    })
    expect(parseStep('o2', form([['relationship', 'married'], ['living', 'yes'], ['children', 'yes'], ['home', 'rent']]))).toMatchObject({ ok: false, errors: { childrenCount: 'chooseOne' } })
    expect(parseStep('o2', form([['relationship', 'married'], ['living', 'no'], ['children', 'no'], ['childrenCount', '3'], ['home', 'rent']]))).toMatchObject({ ok: true, patch: { children: 0 } })
    expect(parseStep('o3', form([['quality', 'safety'], ['device', 'notSure']]))).toEqual({ ok: true, patch: { quality: 'safety', devicePrivate: false } })
    expect(parseStep('o6', form([['priorities', 'home'], ['priorities', 'pension'], ['priorities', 'children'], ['priorities', 'costs']]))).toMatchObject({ ok: false, errors: { priorities: 'chooseUpToThree' } })
    expect(parseStep('o6', form([['worries', 'fair'], ['priorities', 'nonsense']]))).toEqual({ ok: true, patch: { priorities: [], worries: ['fair'] } })
  })

  it('tracks completeness and progress', () => {
    expect(isComplete(EMPTY_ANSWERS)).toBe(false)
    expect(isComplete(sarah)).toBe(true)
    expect(progress(EMPTY_ANSWERS)).toBe(0)
    expect(progress(sarah)).toBe(1)
    expect(progress({ ...EMPTY_ANSWERS, stage: 'decided' })).toBeCloseTo(1 / 6)
  })

  it('round-trips through the cookie codec and rejects corrupt payloads', () => {
    expect(decode(encode(sarah), isStartAnswers)).toEqual(sarah)
    expect(decode('not base64 json', isStartAnswers)).toBeNull()
    expect(decode(encode({ ...sarah, stage: 'later' }), isStartAnswers)).toBeNull()
    expect(decode(undefined, isStartAnswers)).toBeNull()
    expect(encode(sarah)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('hashes answers stably', () => {
    expect(answersHash(sarah)).toBe(answersHash({ ...sarah }))
    expect(answersHash(sarah)).not.toBe(answersHash({ ...sarah, children: 1 }))
  })
})
