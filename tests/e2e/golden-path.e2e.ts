import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * The bar. This is the golden-path script from docs/BRIEF.md §The bar, written as
 * one test that fails at the first unbuilt step. Each session moves that point.
 *
 * Sarah and Mark. Sarah answers the interview, signs up, profiles, connects the Tink
 * demo bank (or a test scenario), confirms by exception and sees Your Picture. She
 * shares it. Mark enters by link, confirms his facts, builds his own picture and
 * triages hers; his pension is a gap she queries; he responds; the item turns agreed.
 * Sarah proposes 55/45 with the house deferred; Mark counters 50/50 with a sale;
 * version 4 is accepted and signed. Pre-flight passes. The pack renders. Under 40
 * minutes, no help. Five phases: Start · Build · Reconcile · Settle · Finalise.
 *
 * Selectors are role- and text-based on purpose: the test describes what a person
 * sees, not how the DOM is built.
 */

async function accessible(page: import('@playwright/test').Page, step: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations, `${step}: WCAG AA violations`).toEqual([])
}

test('Sarah and Mark reach a court-ready pack', async ({ page }) => {
  test.setTimeout(40 * 60_000)

  // Start — the interview is the first act of care.
  await page.goto('/')
  await page.getByRole('link', { name: /start|begin|get started/i }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await accessible(page, 'interview start')

  // Sarah's answers, one topic per screen. Radios are scoped by their group.
  const group = (name: RegExp) => page.getByRole('group', { name })
  const next = () => page.getByRole('button', { name: /continue/i }).click()
  await page.getByLabel(/decided to separate/i).check()
  await next()
  await group(/your relationship/i).getByLabel(/^married/i).check()
  await group(/living together/i).getByLabel(/^yes$/i).check()
  await group(/children under 18/i).getByLabel(/^yes$/i).check()
  await group(/how many/i).getByLabel(/^2$/i).check()
  await group(/your home/i).getByLabel(/own with mortgage/i).check()
  await next()

  // The interview asks about safety early, gently, privately.
  await expect(page.getByText(/feel unsafe|safe/i)).toBeVisible({ timeout: 60_000 })
  await page.getByLabel(/^amicable/i).check()
  await group(/device private/i).getByLabel(/^yes$/i).check()
  await next()
  await page.getByLabel(/^no/i).check()
  await next()
  await page.getByLabel(/some things but not all/i).check()
  await next()
  await page.getByLabel(/keeping the family home/i).check()
  await page.getByLabel(/stability for the children/i).check()
  await page.getByLabel(/protecting my pension/i).check()
  await page.getByLabel(/afford the mortgage/i).check()
  await page.getByLabel(/knowing what.s fair/i).check()
  await page.getByRole('button', { name: /see my plan/i }).click()

  // It ends with a plan and a price, and one next step.
  await expect(page.getByText(/your plan|here.s what happens/i)).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText(/your next step/i)).toHaveCount(1)

  // Start — sign up, acknowledgement, tour.
  await page.getByRole('link', { name: /sign up|create.*account/i }).click()
  await page.getByLabel(/full name/i).fill('Sarah Jones')
  await page.getByLabel(/email/i).fill('sarah@example.com')
  await page.getByLabel(/password/i).first().fill('correct-horse-battery-staple')
  await page.getByLabel(/agree to the terms/i).check()
  await page.getByRole('button', { name: /create|sign up|continue/i }).click()
  await expect(page.getByText(/based on what you told us/i)).toBeVisible()

  // Build — profile, then bank, then confirm by exception. No banned words anywhere.
  await page.getByRole('link', { name: /connect.*bank|build/i }).click()
  await page.getByRole('button', { name: /sarah/i }).click() // test scenario stands in for the Tink demo bank
  await expect(page.getByRole('heading', { name: /your picture/i })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/your income/i)).toBeVisible()
  await expect(page.getByText(/private/i).first()).toBeVisible() // the space is named on every screen
  await expect(page.getByText(/disclos|position/i)).toHaveCount(0)
  await accessible(page, 'your picture')

  // Reconcile — a deliberate send with section selection and a preview.
  await page.getByRole('button', { name: /share/i }).click()
  await expect(page.getByText(/you're sharing \d+ of \d+ sections/i)).toBeVisible()
  await expect(page.getByText(/mark will see/i)).toBeVisible()
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByText(/what i've sent/i)).toBeVisible()
  // Mark's entry and build are simulated by the test harness until two real accounts exist.
  await expect(page.getByRole('heading', { name: /household picture|shared picture/i })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/agreed by both/i)).toBeVisible() // the status quad
  await expect(page.getByText(/values differ/i)).toBeVisible()
  await expect(page.getByText(/gap to address/i)).toBeVisible()
  await page.getByRole('button', { name: /query|ask/i }).first().click()
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByText(/waiting for mark/i)).toBeVisible()
  await expect(page.getByText(/nothing here is final/i)).toBeVisible()
  await expect(page.getByText(/agreed/i).first()).toBeVisible({ timeout: 60_000 })

  // Settle — option cards, a running split, counter side by side, both sign.
  await page.getByRole('link', { name: /settle|propos/i }).click()
  await expect(page.getByText(/version 1/i)).toBeVisible()
  await expect(page.getByText(/sarah \d+%/i)).toBeVisible() // the running split banner
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByText(/version 2|counter/i)).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('button', { name: /^accept$/i }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^counter$/i }).first()).toBeVisible()
  await expect(page.getByText(/version 4/i)).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText(/signed by both|accepted by both/i)).toBeVisible()
  await accessible(page, 'settle')

  // Finalise — pre-flight, then the print-and-post pack.
  await page.getByRole('link', { name: /finalise|pack|consent order/i }).click()
  await expect(page.getByText(/pre-flight/i)).toBeVisible()
  await expect(page.getByText(/form a/i)).toBeVisible()
  await expect(page.getByText(/d81/i)).toBeVisible()
  await expect(page.getByText(/draft.*order/i)).toBeVisible()
  await expect(page.getByText(/section 10/i)).toBeVisible()
  await expect(page.getByText(/harlow/i)).toBeVisible()
  await expect(page.getByText(/conditional order/i)).toBeVisible()
})
