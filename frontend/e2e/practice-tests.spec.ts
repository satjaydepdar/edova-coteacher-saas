import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** The student-facing Tests section on Practice Questions (Feature B Phase 1):
 * an open test gets hero treatment, upcoming/closed collapse into a quiet
 * compact list, and opening one renders its real content (including passage +
 * live-authored math) via RichView. Assignment/visibility logic itself is
 * covered by backend/test_test_assignments.py -- this only checks the UI reads
 * and displays what the API returns. Requires the API on :8001 (migration 028)
 * and the dev server on :5173. */

let keyCode: string

test.beforeAll(() => {
  const out = execFileSync('python', [path.join(__dirname, 'fixtures', 'setup_practice_tests.py')], { encoding: 'utf-8' })
  keyCode = JSON.parse(out.trim().split('\n').pop()!).key_code
})

async function activateAndOpenPractice(page: import('@playwright/test').Page) {
  await page.goto('/activate')
  await page.waitForLoadState('networkidle')
  await page.fill('input[placeholder="EDOVA-7K4P-92MX-ABCD"]', keyCode)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
  await page.click('text=Practice Questions')
  await page.waitForSelector('text=Practice Questions')
}

test.describe('Practice Questions: assigned Tests section', () => {
  test('an open test gets hero treatment; upcoming/closed collapse into a quiet list', async ({ page }) => {
    await activateAndOpenPractice(page)

    const hero = page.locator('.test-hero')
    await expect(hero).toContainText('Open Test')
    await expect(hero.locator('.status-pill')).toContainText(/open/i)

    const upcomingRow = page.locator('.test-row', { hasText: 'Upcoming Test' })
    await expect(upcomingRow.locator('.status-pill')).toContainText(/opens in/i)

    const closedRow = page.locator('.test-row', { hasText: 'Closed Test' })
    await expect(closedRow.locator('.status-pill')).toContainText(/closed/i)
  })

  test('opening a test renders its passage and math, and Print calls window.print', async ({ page }) => {
    await activateAndOpenPractice(page)

    await page.locator('.test-hero button', { hasText: 'Preview' }).click()

    await expect(page.locator('.test-detail')).toContainText('A short E2E fixture passage')
    await expect(page.locator('.test-detail .katex').first()).toBeVisible()
    await expect(page.locator('.test-detail')).toContainText('x=2 or x=-2')

    // window.print can only be stubbed on the already-loaded page (addInitScript
    // only fires on navigation, and this SPA doesn't reload between steps)
    await page.evaluate(() => {
      ;(window as unknown as { __printCalled: boolean }).__printCalled = false
      window.print = () => { (window as unknown as { __printCalled: boolean }).__printCalled = true }
    })
    await page.click('button:has-text("Print")')
    const printCalled = await page.evaluate(() => (window as unknown as { __printCalled: boolean }).__printCalled)
    expect(printCalled).toBe(true)
  })
})
