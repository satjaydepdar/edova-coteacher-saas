import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Feature B Phase 1's Publish picker: assigning a test to a section (or
 * tenant-wide) with a window. Backend behavior itself is covered by
 * backend/test_test_assignments.py -- this only checks the UI actually sends the
 * assignment payload it claims to. Requires the API on :8001 (migration 028
 * applied) and the dev server on :5174. */

const API = 'http://localhost:8001'
const EMAIL = 'admin@edova.dev'
const PASSWORD = 'testpass'
const SUBJECT_NAME = 'CreateTestE2E Subject'
const CHAPTER_NAME = 'CreateTestE2E Chapter'

let token: string
let subjectId: string
let chapterId: string
let realSectionId: string
let realSectionName: string

async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: { email: EMAIL, password: PASSWORD } })
  return (await res.json()).access_token
}

test.beforeAll(async ({ request }) => {
  token = await apiLogin(request)
  const auth = { Authorization: `Bearer ${token}` }

  // Sections can only be created via a TEACHER-role login (no admin endpoint for
  // it) -- seed a dedicated tenant + section directly, same convention every
  // backend test_*.py fixture already uses, just invoked from Node since
  // Playwright/TS has no DB driver here.
  const out = execFileSync('python', [path.join(__dirname, 'fixtures', 'setup_test_assignments.py')], { encoding: 'utf-8' })
  const fixture = JSON.parse(out.trim().split('\n').pop()!)
  const tenantId = fixture.tenant_id
  realSectionId = fixture.section_id
  realSectionName = 'E2E Section'

  const subjects = (await (await request.get(`${API}/admin/subjects`, { headers: auth })).json()).subjects
  let existingSubject = subjects.find((s: { name: string }) => s.name === SUBJECT_NAME)
  if (existingSubject) {
    subjectId = existingSubject.id
  } else {
    const r = await request.post(`${API}/admin/subjects`, {
      headers: auth,
      data: { name: SUBJECT_NAME, standard_grade: '9', sequence_order: 960, tenant_id: tenantId },
    })
    subjectId = (await r.json()).id
  }

  const tree = await (await request.get(`${API}/admin/subjects/${subjectId}/tree`, { headers: auth })).json()
  const existingChapter = tree.chapters.find((c: { name: string }) => c.name === CHAPTER_NAME)
  if (existingChapter) {
    chapterId = existingChapter.id
  } else {
    const r = await request.post(`${API}/admin/subjects/${subjectId}/chapters`, {
      headers: auth,
      data: { name: CHAPTER_NAME, sequence_order: 1 },
    })
    chapterId = (await r.json()).id
  }

  const bank = (await (await request.get(`${API}/admin/questions?chapter_id=${chapterId}`, { headers: auth })).json()).questions
  if (!bank.length) {
    await request.post(`${API}/admin/questions`, {
      headers: auth,
      data: {
        chapter_id: chapterId, question_type: 'MCQ', question_text: '<p>2+2=?</p>', marks: 1,
        options: [{ key: 'A', text: '4', correct: true }, { key: 'B', text: '5', correct: false }],
      },
    })
  }
})

async function loginUi(page: Page) {
  await page.goto('/')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")')
  await page.waitForSelector('text=Authoring Studio')
}

async function openCreateTestForFixtureChapter(page: Page) {
  await page.click('text=Curriculum View')
  await page.waitForSelector('select')
  const subjectOption = page.locator('.toolbar select option', { hasText: SUBJECT_NAME })
  const optionValue = await subjectOption.getAttribute('value')
  await page.selectOption('.toolbar select', optionValue!)
  // The chapter grid re-fetches and re-renders on subject change; networkidle
  // isn't a reliable signal for that, so retry-wait directly on the real end
  // state with a generous timeout instead.
  const chapterCard = page.locator('article', { hasText: CHAPTER_NAME })
  await expect(chapterCard).toBeVisible({ timeout: 15_000 })
  await chapterCard.locator('button:has-text("Mock Test")').click()
  await page.waitForSelector('#test')
  const mcqRow = page.locator('.type-row').filter({ has: page.locator('b', { hasText: /^MCQ$/ }) })
  await mcqRow.locator('input[type=checkbox]').check()
  await mcqRow.locator('input[type=number]').fill('1')
}

test.describe('Publish: assign to a section with a window', () => {
  test('a chosen section + window is sent as an assignment on publish', async ({ page }) => {
    await loginUi(page)
    await openCreateTestForFixtureChapter(page)

    await page.locator('.assign-section', { hasText: realSectionName }).locator('input[type=checkbox]').check()

    const publishRequest = page.waitForRequest((req) => req.url().includes('/admin/tests') && req.method() === 'POST')
    await page.click('button.primary:has-text("Publish")')
    const req = await publishRequest
    const body = req.postDataJSON()

    expect(body.assignments).toHaveLength(1)
    expect(body.assignments[0].section_id).toBe(realSectionId)
    expect(new Date(body.assignments[0].opens_at).getTime()).toBeLessThan(new Date(body.assignments[0].closes_at).getTime())

    await expect(page.locator('.pill', { hasText: 'Published' })).toBeVisible()
  })

  test('the tenant-wide checkbox sends a null-section assignment', async ({ page }) => {
    await loginUi(page)
    await openCreateTestForFixtureChapter(page)

    await page.locator('.assign-tenant-wide input[type=checkbox]').check()

    const publishRequest = page.waitForRequest((req) => req.url().includes('/admin/tests') && req.method() === 'POST')
    await page.click('button.primary:has-text("Publish")')
    const req = await publishRequest
    const body = req.postDataJSON()

    expect(body.assignments).toHaveLength(1)
    expect(body.assignments[0].section_id).toBeNull()
  })

  test('publishing with nothing checked sends no assignments at all', async ({ page }) => {
    await loginUi(page)
    await openCreateTestForFixtureChapter(page)

    const publishRequest = page.waitForRequest((req) => req.url().includes('/admin/tests') && req.method() === 'POST')
    await page.click('button.primary:has-text("Publish")')
    const req = await publishRequest
    const body = req.postDataJSON()

    expect(body.assignments).toEqual([])
  })
})
