import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * The bar. This is the golden-path script from docs/BRIEF.md §The bar, written as
 * one test that fails at the first unbuilt step. Each session moves that point.
 *
 * Sarah and Mark. Sarah answers the interview, signs up, invites Mark. Both connect
 * the Tink demo bank (or a test scenario) and upload evidence. Both disclose. The
 * shared picture flags Mark's missing pension; Sarah queries it; Mark responds; the
 * item turns agreed. They agree the pot. Sarah proposes 55/45 with the house
 * deferred; Mark counters 50/50 with a sale; they land on version 4. The pack
 * renders. Under 40 minutes, no help.
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

  // Phase 1 — Orient. The interview is the first act of care.
  await page.goto('/')
  await page.getByRole('link', { name: /start|begin|get started/i }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await accessible(page, 'interview start')

  // The interview asks about safety early, gently, privately.
  await expect(page.getByText(/feel unsafe|safe/i)).toBeVisible({ timeout: 60_000 })

  // It ends with a plan and a price, and one next step.
  await expect(page.getByText(/your plan|here.s what happens/i)).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText(/your next step/i)).toHaveCount(1)

  // Phase 2 — Sign up and invite.
  await page.getByRole('link', { name: /sign up|create.*account/i }).click()
  await page.getByLabel(/email/i).fill('sarah@example.com')
  await page.getByLabel(/password/i).first().fill('correct-horse-battery-staple')
  await page.getByRole('button', { name: /create|sign up|continue/i }).click()
  await page.getByLabel(/invite|their email/i).fill('mark@example.com')
  await page.getByRole('button', { name: /send invite|invite/i }).click()
  await expect(page.getByText(/invited|invite sent/i)).toBeVisible()

  // Phase 3 — Build, privately. Bank first; confirm by exception.
  await page.getByRole('link', { name: /connect.*bank/i }).click()
  await page.getByRole('button', { name: /sarah/i }).click() // test scenario stands in for the Tink demo bank
  await expect(page.getByRole('heading', { name: /your picture/i })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/your income/i)).toBeVisible()
  await expect(page.getByText(/private/i).first()).toBeVisible() // the space is named on every screen
  await accessible(page, 'your picture')

  // Phase 4 — Share and reconcile. A single deliberate send with a preview.
  await page.getByRole('button', { name: /disclose|share/i }).click()
  await expect(page.getByText(/mark will see/i)).toBeVisible()
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByRole('heading', { name: /shared picture/i })).toBeVisible()
  await expect(page.getByText(/pension.*missing|missing.*pension/i)).toBeVisible()
  await page.getByRole('button', { name: /query|ask/i }).first().click()
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByText(/waiting for mark/i)).toBeVisible()
  // Mark's turn is simulated by the test harness until two real accounts exist.
  await expect(page.getByText(/agreed/i).first()).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/the pot|household total/i)).toBeVisible()

  // Phase 5 — Propose and negotiate. Versions, redlines, accept or counter.
  await page.getByRole('link', { name: /propose|proposal/i }).click()
  await expect(page.getByText(/version 1/i)).toBeVisible()
  await page.getByRole('button', { name: /send/i }).click()
  await expect(page.getByText(/version 2|counter/i)).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/changed|→/).first()).toBeVisible() // a redline with author and reason
  await expect(page.getByText(/version 4/i)).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText(/accepted by both|agreed version/i)).toBeVisible()
  await accessible(page, 'negotiation')

  // Phase 6 — Agree and pack.
  await page.getByRole('link', { name: /pack|consent order/i }).click()
  await expect(page.getByText(/form a/i)).toBeVisible()
  await expect(page.getByText(/d81/i)).toBeVisible()
  await expect(page.getByText(/draft.*order/i)).toBeVisible()
  await expect(page.getByText(/harlow/i)).toBeVisible()
  await expect(page.getByText(/conditional order/i)).toBeVisible()
})
