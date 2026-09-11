import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import * as start from '@/copy/start'
import { checkCopy, wordCount } from '@/copy/rules'

type Leaf = { keyPath: string; value: string }

function leaves(value: unknown, keyPath = '', out: Leaf[] = []): Leaf[] {
  if (typeof value === 'string') out.push({ keyPath, value })
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${keyPath}[${i}]`, out))
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) leaves(v, keyPath ? `${keyPath}.${k}` : k, out)
  }
  return out
}

const all = leaves(start)
const isCta = (k: string) => /(^|\.)cta$|Cta$/.test(k)
const isHeadline = (k: string) => /(^|\.)headline$/.test(k)

function joined(...groups: unknown[]): string {
  return groups.flatMap(g => leaves(g).map(l => l.value)).join('\n')
}

function count(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length
}

describe('Start copy', () => {
  it('has strings', () => {
    expect(all.length).toBeGreaterThan(100)
  })

  for (const { keyPath, value } of all) {
    it(keyPath, () => {
      const violations = checkCopy(value, { nav: isCta(keyPath), success: /success/.test(keyPath) })
      expect(violations, value).toEqual([])
      if (isHeadline(keyPath)) expect(wordCount(value), `headline > 6 words: ${value}`).toBeLessThanOrEqual(6)
      if (isCta(keyPath)) expect(wordCount(value), `cta > 4 words: ${value}`).toBeLessThanOrEqual(4)
    })
  }

  // Strict Playwright locators in the golden path: each phrase must match exactly once
  // on the screen where it is asserted, footer and header included.
  it('"safe" appears once on the O3 screen', () => {
    const text = joined(start.o3, start.footer, start.header, start.interview, start.o1.options, start.o2)
    expect(count(text, /safe/gi)).toBe(1)
  })

  // A strict locator polls from the moment Continue is clicked, so the screen being
  // left must not carry the phrase either.
  it('no interview screen mentions the plan-page phrases', () => {
    const text = joined(start.o1, start.o2, start.o3, start.o4, start.o5, start.o6, start.interview, start.footer, start.header)
    expect(count(text, /your plan|here.s what happens|your next step|based on what you told us/gi)).toBe(0)
    const signUp = joined(start.signUp, start.footer, start.header)
    expect(count(signUp, /based on what you told us/gi)).toBe(0)
  })

  it('"your plan" and "your next step" appear once each on the plan page', () => {
    const text = joined(start.plan, start.nextStep, start.footer, start.header)
    expect(count(text, /your plan|here.s what happens/gi)).toBe(1)
    expect(count(text, /your next step/gi)).toBe(1)
  })

  it('one landing link matches the start locator', () => {
    const links = [start.landing.cta, start.landing.pricingLink, start.header.signInCta, start.header.skipToContent, start.header.homeLabel]
    expect(links.filter(l => /start|begin|get started/i.test(l))).toHaveLength(1)
  })

  it('one plan-page link matches the sign-up locator', () => {
    const links = [start.plan.nextStepCta, start.plan.seeOptionsCta, start.plan.pricingLink, start.plan.downloadCta, start.header.signInCta, start.header.skipToContent, start.header.homeLabel]
    expect(links.filter(l => /sign up|create.*account/i.test(l))).toHaveLength(1)
  })

  it('one acknowledgement link matches the build locator', () => {
    const links = [start.acknowledgement.nextStepCta, start.acknowledgement.tourCta, start.header.skipToContent, start.header.homeLabel]
    expect(links.filter(l => /connect.*bank|build/i.test(l))).toHaveLength(1)
  })

  // Next's route announcer repeats the current h1 in a hidden live region after a
  // client-side navigation, so a headline must never carry a phrase the golden path
  // asserts with a strict locator.
  it('no headline carries a golden-path phrase', () => {
    const phrases = /based on what you told us|your plan|here.s what happens|your next step|safe/i
    for (const { keyPath, value } of all.filter(l => isHeadline(l.keyPath))) {
      expect(value, keyPath).not.toMatch(phrases)
    }
  })

  it('no page sets its own tab title', () => {
    const appDir = path.resolve(__dirname, '../../src/app')
    const files: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (/page\.tsx$/.test(entry)) files.push(full)
      }
    }
    walk(appDir)
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/export const metadata|generateMetadata/)
    }
  })
})
