import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { seededCookies } from './fixtures'

/**
 * The accessibility floor. Every built screen passes WCAG 2.1 AA under axe, on
 * the production build, in CI. Add a route here the session it ships; a screen
 * that is not listed is not done. This exists because no critic and no human
 * caught a 3.54:1 error-text contrast or a missing aria-describedby in the
 * previous prototype; axe did.
 */
export const ROUTES = [
  '/',
  '/pricing',
  '/start/where-you-are',
  '/start/situation',
  '/start/between-you',
  '/start/work',
  '/start/what-you-know',
  '/start/priorities',
  '/start/plan',
  '/start/next',
  '/start/not-for-you',
  '/start/conventional-route',
  '/start/support',
  '/sign-up',
  '/sign-in',
  '/welcome/safety',
  '/welcome',
  '/welcome/tour',
  '/welcome/tour?panel=4',
  '/build',
]

// Every route is seeded with Sarah's answers and a stub session, so the screens
// behind sign-up render as themselves rather than redirecting to sign-in.
for (const route of ROUTES) {
  test(`${route} meets WCAG AA`, async ({ page, context, baseURL }) => {
    await context.addCookies(seededCookies(baseURL ?? 'http://localhost:3000'))
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(results.violations.map(v => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual([])
  })
}
