import { test, expect, type APIRequestContext, type Page, type Locator } from '@playwright/test'

/** Covers the rich-text editor (Tiptap + KaTeX) built into AuthoringPage: the
 * click-to-edit lifecycle (clean rendered view by default, toolbar only while
 * editing, reverts to the rendered view on blur), formatted text, live-inserted
 * math, source-paper tags, and the console-clean regression guard for the
 * flushSync warning found during manual verification. AuthoringPage is
 * create-only (the Question Bank panel -- browse/edit/duplicate/delete -- was
 * removed), so saves are verified via the API rather than a bank list in the UI.
 * Requires the API on :8001 (migration 027 applied) and the dev server on :5174,
 * same as the backend's test_*.py house tests expect a live API. */

const API = 'http://localhost:8001'
const EMAIL = 'admin@edova.dev'
const PASSWORD = 'testpass'
const TENANT_NAME = 'RichEditorE2E Tenant'
const SUBJECT_NAME = 'RichEditorE2E Subject'
const CHAPTER_NAME = 'RichEditorE2E Chapter'

let token: string
let subjectId: string
let chapterId: string

async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: { email: EMAIL, password: PASSWORD } })
  const { access_token } = await res.json()
  return access_token
}

// Idempotent fixture, same convention as the backend's test_*.py files -- reuse
// the subject/chapter if a previous run already created them, never delete.
test.beforeAll(async ({ request }) => {
  token = await apiLogin(request)
  const auth = { Authorization: `Bearer ${token}` }

  // A dedicated fixture tenant, never the admin's own tenant -- creating this
  // subject directly under admin's real "Edova Platform" tenant (via
  // /admin/session's tenant_id) previously leaked it into the real Curriculum
  // View dropdown for every platform admin, which is exactly the QA-tenant
  // pitfall testutil.py's qa_tenant_id() warns about on the backend side.
  const tenants = (await (await request.get(`${API}/admin/tenants`, { headers: auth })).json()).tenants
  const existingTenant = tenants.find((t: { name: string }) => t.name === TENANT_NAME)
  const tenantId = existingTenant
    ? existingTenant.id
    : (await (await request.post(`${API}/admin/tenants`, { headers: auth, data: { name: TENANT_NAME } })).json()).id

  const subjects = (await (await request.get(`${API}/admin/subjects`, { headers: auth })).json()).subjects
  const existingSubject = subjects.find((s: { name: string }) => s.name === SUBJECT_NAME)
  if (existingSubject) {
    subjectId = existingSubject.id
  } else {
    const r = await request.post(`${API}/admin/subjects`, {
      headers: auth,
      data: { name: SUBJECT_NAME, standard_grade: '10', sequence_order: 950, tenant_id: tenantId },
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
})

async function loginUi(page: Page) {
  await page.goto('/')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")')
  await page.waitForSelector('text=Authoring Studio')
}

async function openAuthoringForFixtureChapter(page: Page) {
  await page.click('text=Curriculum View')
  await page.waitForSelector('select')
  const subjectOption = page.locator('.toolbar select option', { hasText: SUBJECT_NAME })
  const optionValue = await subjectOption.getAttribute('value')
  await page.selectOption('.toolbar select', optionValue!)
  // The chapter grid re-fetches and re-renders on subject change; networkidle
  // isn't a reliable signal for that (Vite's own dev-server connections and the
  // fetch's actual start can both land outside the idle window it samples), so
  // just retry-wait directly on the real end state with a generous timeout
  // instead -- covers a slow fetch or a re-render race either way.
  const chapterCard = page.locator('article', { hasText: CHAPTER_NAME })
  await expect(chapterCard).toBeVisible({ timeout: 15_000 })
  await chapterCard.locator('button:has-text("View Bank")').click()
  await page.waitForSelector('#authoring')
}

/** Fields render as a clean read-only view by default -- click it to reveal the
 * toolbar and start editing, matching the click-to-edit lifecycle. */
async function enterEditMode(fieldLocator: Locator) {
  await fieldLocator.locator('.rte-view-mode').click()
  await expect(fieldLocator.locator('.rte-toolbar')).toBeVisible()
}

async function insertEquation(fieldLocator: Locator, latex: string, page: Page) {
  await fieldLocator.locator('.rte-toolbar button:has-text("Equation")').click()
  await page.locator('.qmath-popover input').fill(latex)
  await page.locator('.qmath-popover button.primary').click()
}

/** There's no bank list in the UI anymore -- verify a save landed by asking the
 * API directly, the same way the backend's own test_*.py suite does. */
async function fetchQuestions(page: Page) {
  const r = await page.request.get(`${API}/admin/questions?chapter_id=${chapterId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return (await r.json()).questions as Array<{
    question_text: string
    status: string
    source_papers: string[]
  }>
}

test.describe('Rich-text question authoring', () => {
  test('click-to-edit lifecycle: view by default, toolbar while editing, rendered view on blur', async ({ page }) => {
    const consoleIssues: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('Warning:')) consoleIssues.push(msg.text())
    })

    await loginUi(page)
    await openAuthoringForFixtureChapter(page)

    const questionField = page.locator('#authoring .field:has-text("Question Text")')

    // 1. Default: a clean view with a placeholder, no toolbar at all.
    await expect(questionField.locator('.rte-toolbar')).toHaveCount(0)
    await expect(questionField.locator('.rte-view-mode')).toContainText('Type your question here')

    // 2. Clicking it reveals the toolbar and becomes editable.
    await enterEditMode(questionField)
    await questionField.locator('.rte-content').click()
    await page.keyboard.type('Solve for x: ')
    await insertEquation(questionField, 'x^2 - 4 = 0', page)
    await expect(questionField.locator('.katex').first()).toBeVisible()

    const optionFields = page.locator('#authoring .option')
    await enterEditMode(optionFields.nth(0))
    await optionFields.nth(0).locator('.rte-content').click()
    await page.keyboard.type('x = 2 or x = -2')
    await enterEditMode(optionFields.nth(1))
    await optionFields.nth(1).locator('.rte-content').click()
    await page.keyboard.type('x = 4')

    // 3. Moving focus elsewhere (blur) reverts the first field to the rendered
    //    view -- toolbar gone, math still shown correctly, nothing cut off.
    await page.click('.paper-input')
    await expect(questionField.locator('.rte-toolbar')).toHaveCount(0)
    await expect(questionField.locator('.rte-view-mode .katex')).toBeVisible()

    await page.fill('.paper-input', 'E2E Fixture Paper')
    await page.keyboard.press('Enter')
    await expect(page.locator('.paper-tag', { hasText: 'E2E Fixture Paper' })).toBeVisible()

    // Add to Bank is gated behind Preview (design-system V2 spec: publishing
    // without previewing first is disallowed).
    await page.click('button:has-text("Preview")')
    await expect(page.locator('.preview-panel')).toHaveClass(/open/)
    await page.click('button.primary:has-text("Add to Bank")')

    const questions = await fetchQuestions(page)
    const saved = questions.find((q) => q.question_text.includes('Solve for x'))
    expect(saved).toBeTruthy()
    expect(saved!.question_text).toContain('data-latex="x^2 - 4 = 0"')
    expect(saved!.source_papers).toContain('E2E Fixture Paper')

    expect(consoleIssues, `unexpected console errors/warnings:\n${consoleIssues.join('\n')}`).toEqual([])
  })

  test('empty question text is rejected before hitting the API', async ({ page }) => {
    await loginUi(page)
    await openAuthoringForFixtureChapter(page)

    let dialogMessage = ''
    page.once('dialog', (d) => {
      dialogMessage = d.message()
      void d.accept()
    })

    // bold-toggle with no actual text typed -- rich HTML like <p><strong></strong></p>
    // must still be treated as empty, not saved as a "non-empty" string. Add to
    // Bank is gated behind Preview, so the empty-text guard now fires on the
    // Preview click (the only path that could otherwise flip the gate open).
    const questionField = page.locator('#authoring .field:has-text("Question Text")')
    await enterEditMode(questionField)
    await questionField.locator('.rte-content').click()
    await questionField.locator('.rte-toolbar button', { hasText: 'B' }).first().click()
    await page.click('button:has-text("Preview")')

    expect(dialogMessage).toContain('question text')
    await expect(page.locator('button.primary:has-text("Add to Bank")')).toBeDisabled()
  })

  test('a long unbroken equation does not overflow its field horizontally', async ({ page }) => {
    await loginUi(page)
    await openAuthoringForFixtureChapter(page)

    const questionField = page.locator('#authoring .field:has-text("Question Text")')
    await enterEditMode(questionField)
    await questionField.locator('.rte-content').click()
    await page.keyboard.type('Given the following: ')
    await insertEquation(
      questionField,
      'AB=\\sqrt{(6-5)^2+(4+2)^2}=\\sqrt{(-1)^2+(6)^2}=\\sqrt{37}\\text{ and }BC=\\sqrt{(7-6)^2+(-2-4)^2+(9-9)^2+(1-1)^2}',
      page,
    )
    await page.click('.paper-input') // blur back to the rendered view

    const box = questionField.locator('.rte-view-mode')
    const { scrollWidth, clientWidth } = await box.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // +1: subpixel rounding
  })

  test('Question Text, Passage, Explanation, and Option fields cap at 50-90px and scroll past that', async ({ page }) => {
    await loginUi(page)
    await openAuthoringForFixtureChapter(page)

    const questionBox = page.locator('#authoring .field:has-text("Question Text") .rte-view-mode').first()
    const passageBox = page.locator('#authoring .field:has-text("Passage") .rte-view-mode').first()
    const explanationBox = page.locator('#authoring .field:has-text("Explanation") .rte-view-mode').first()
    const optionBox = page.locator('#authoring .option .rte-view-mode').first()
    for (const box of [questionBox, passageBox, explanationBox, optionBox]) {
      await expect(box).toHaveCSS('min-height', '50px')
      await expect(box).toHaveCSS('max-height', '90px')
      await expect(box).toHaveCSS('overflow-y', 'auto')
    }

    // content taller than 90px scrolls inside the box instead of growing past it
    const questionField = page.locator('#authoring .field:has-text("Question Text")')
    await enterEditMode(questionField)
    await questionField.locator('.rte-content').click()
    for (let i = 0; i < 10; i++) await page.keyboard.type(`Line ${i}\n`)
    await page.click('.paper-input') // blur back to the rendered view

    const box = questionField.locator('.rte-view-mode')
    const { scrollHeight, clientHeight } = await box.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(clientHeight).toBeLessThanOrEqual(90)
    expect(scrollHeight).toBeGreaterThan(clientHeight) // content overflows -> scrollable, not cut off
  })

  test('Save As Draft persists an incomplete question without validation, listed as DRAFT', async ({ page }) => {
    await loginUi(page)
    await openAuthoringForFixtureChapter(page)

    const before = (await fetchQuestions(page)).length

    let dialogFired = false
    page.once('dialog', (d) => { dialogFired = true; void d.dismiss() })
    // Question text left empty -- "Add to Bank" would reject this; "Save As Draft" must not.
    await page.click('button:has-text("Save As Draft")')

    await expect(async () => {
      expect((await fetchQuestions(page)).length).toBe(before + 1)
    }).toPass()
    expect(dialogFired).toBe(false)
    const questions = await fetchQuestions(page)
    expect(questions.some((q) => q.status === 'DRAFT')).toBe(true)
  })

  test('Preview shows a live rendered preview of the in-progress question, in a collapsible side panel', async ({ page }) => {
    await loginUi(page)
    await openAuthoringForFixtureChapter(page)

    const questionField = page.locator('#authoring .field:has-text("Question Text")')
    await enterEditMode(questionField)
    await questionField.locator('.rte-content').click()
    await page.keyboard.type('Preview target question text')

    const panel = page.locator('.preview-panel')
    await expect(panel).not.toHaveClass(/open/)

    await page.click('button:has-text("Preview")')
    await expect(panel).toHaveClass(/open/)
    await expect(panel.locator('.preview-card', { hasText: 'Preview target question text' })).toBeVisible()

    // the collapse handle hides the panel again without losing the preview content
    await panel.locator('.preview-handle').click()
    await expect(panel).not.toHaveClass(/open/)
  })

  test('Add to Bank stays disabled until the question has been previewed at least once', async ({ page }) => {
    await loginUi(page)
    await openAuthoringForFixtureChapter(page)

    const addToBank = page.locator('button.primary:has-text("Add to Bank")')
    await expect(addToBank).toBeDisabled()

    const questionField = page.locator('#authoring .field:has-text("Question Text")')
    await enterEditMode(questionField)
    await questionField.locator('.rte-content').click()
    await page.keyboard.type('Gated publish question')
    await page.click('.paper-input')

    await expect(addToBank).toBeDisabled()
    await page.click('button:has-text("Preview")')
    await expect(page.locator('.preview-panel')).toHaveClass(/open/)
    await expect(addToBank).toBeEnabled()

    await page.click('button.primary:has-text("Add to Bank")')
    await expect(async () => {
      const questions = await fetchQuestions(page)
      expect(questions.some((q) => q.question_text.includes('Gated publish question'))).toBe(true)
    }).toPass()

    // A successful Add to Bank replaces the form with a success state -- clicking
    // "Add New Question" is what resets the gate for the next question.
    await page.click('button:has-text("Add New Question")')
    await expect(addToBank).toBeDisabled()
  })

  test('after Add to Bank succeeds, a success state replaces the form until "Add New Question" is clicked', async ({ page }) => {
    await loginUi(page)
    await openAuthoringForFixtureChapter(page)

    const questionField = page.locator('#authoring .field:has-text("Question Text")')
    await enterEditMode(questionField)
    await questionField.locator('.rte-content').click()
    await page.keyboard.type('Success state question')
    await page.click('button:has-text("Preview")')
    await expect(page.locator('.preview-panel')).toHaveClass(/open/)
    await page.click('button.primary:has-text("Add to Bank")')

    // form is replaced by a success state with an explicit continue action
    await expect(questionField).toHaveCount(0)
    const addNew = page.locator('button:has-text("Add New Question")')
    await expect(addNew).toBeVisible()
    // the just-saved question stays visible in the preview panel as confirmation
    await expect(page.locator('.preview-panel .preview-card', { hasText: 'Success state question' })).toBeVisible()

    await addNew.click()
    // back to a blank form, gate re-armed
    await expect(page.locator('#authoring .field:has-text("Question Text")')).toBeVisible()
    await expect(page.locator('button.primary:has-text("Add to Bank")')).toBeDisabled()
  })
})
