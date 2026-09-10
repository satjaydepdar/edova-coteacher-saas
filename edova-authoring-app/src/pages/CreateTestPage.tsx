import { useEffect, useMemo, useState } from 'react'
import { adminContent, adminQuestions, adminTests, AdminApiError, type AdminSection, type AuthoredQuestion } from '../lib/adminApi'
import { QUESTION_TYPE_LABELS } from '../lib/questionTypes'

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const TYPE_ROWS: { enumType: string; mark: number }[] = [
  { enumType: 'MCQ_COMBINATION', mark: 1 },
  { enumType: 'MCQ', mark: 1 },
  { enumType: 'ASSERTION_REASONING', mark: 2 },
  { enumType: 'SHORT_ANSWER', mark: 3 },
  { enumType: 'LONG_ANSWER', mark: 4 },
  { enumType: 'CASE_STUDY', mark: 4 },
]

interface TestQuestion { type: string; marks: number; text: string; version_id: string }

export default function CreateTestPage({ chapterId, chapterName }: { chapterId: string; chapterName: string }) {
  const [bank, setBank] = useState<AuthoredQuestion[]>([])
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [qty, setQty] = useState<Record<string, number>>({})
  const [timer, setTimer] = useState('60')
  const [title, setTitle] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState<{ test_id: string; total_marks: number } | null>(null)

  const [sections, setSections] = useState<AdminSection[]>([])
  const [assignSectionIds, setAssignSectionIds] = useState<Record<string, boolean>>({})
  const [assignTenantWide, setAssignTenantWide] = useState(false)
  const [opensAt, setOpensAt] = useState(() => toDatetimeLocal(new Date()))
  const [closesAt, setClosesAt] = useState(() => toDatetimeLocal(new Date(Date.now() + 7 * 24 * 3600 * 1000)))

  useEffect(() => {
    if (!chapterId) return
    adminQuestions.list(chapterId).then((r) => setBank(r.questions)).catch(() => setBank([]))
    adminContent.sections(chapterId).then((r) => setSections(r.sections)).catch(() => setSections([]))
    setTitle(`${chapterName} Mock Test`)
    setPublished(null)
    setAssignSectionIds({})
    setAssignTenantWide(false)
  }, [chapterId, chapterName])

  const shortfalls = useMemo(() => {
    const gaps: string[] = []
    for (const row of TYPE_ROWS) {
      const n = checked[row.enumType] ? qty[row.enumType] || 0 : 0
      const available = bank.filter((q) => q.question_type === row.enumType).length
      if (n > available) gaps.push(`${QUESTION_TYPE_LABELS[row.enumType]}: need ${n}, only ${available} in bank`)
    }
    return gaps
  }, [checked, qty, bank])

  const built: TestQuestion[] = useMemo(() => {
    const arr: TestQuestion[] = []
    for (const row of TYPE_ROWS) {
      if (!checked[row.enumType]) continue
      const n = qty[row.enumType] || 0
      const matches = bank.filter((q) => q.question_type === row.enumType)
      for (let j = 0; j < Math.min(n, matches.length); j++) {
        const q = matches[j]
        arr.push({ type: row.enumType, marks: row.mark, text: q.question_text, version_id: q.version_id })
      }
    }
    return arr
  }, [checked, qty, bank])

  const total = built.reduce((s, q) => s + q.marks, 0)

  async function publish() {
    if (!built.length) { alert('Please select question types and quantities.'); return }
    if (!title.trim()) { alert('Please enter a test title.'); return }
    const opensIso = new Date(opensAt).toISOString()
    const closesIso = new Date(closesAt).toISOString()
    if (new Date(closesIso) <= new Date(opensIso)) { alert('Closing time must be after the opening time.'); return }

    const assignments = [
      ...Object.keys(assignSectionIds).filter((id) => assignSectionIds[id])
        .map((section_id) => ({ section_id, opens_at: opensIso, closes_at: closesIso })),
      ...(assignTenantWide ? [{ section_id: null, opens_at: opensIso, closes_at: closesIso }] : []),
    ]

    setPublishing(true)
    try {
      const r = await adminTests.publish({
        chapter_id: chapterId,
        title: title.trim(),
        timer_minutes: Number(timer),
        questions: built.map((q) => ({ version_id: q.version_id, marks: q.marks })),
        assignments,
      })
      setPublished({ test_id: r.test_id, total_marks: r.total_marks })
    } catch (e) {
      alert(e instanceof AdminApiError ? String(e.message) : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div id="test" className="page">
      {!chapterId ? (
        <div className="muted">Pick a chapter from Curriculum View first.</div>
      ) : (
        <>
          <section className="card test-card">
            <div className="field"><label>Test Title</label>
              <input className="source-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="section-head" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
              <div><b>Question Type</b><div className="muted" style={{ marginTop: 4 }}>Select the question mix. Marks are calculated automatically.</div></div>
              <div className="pill">Total Marks: <b>{total}</b></div>
            </div>
            <div className="types">
              {TYPE_ROWS.map((row) => (
                <div className="type-row" key={row.enumType}>
                  <input type="checkbox" checked={!!checked[row.enumType]} onChange={(e) => setChecked({ ...checked, [row.enumType]: e.target.checked })} />
                  <b>{QUESTION_TYPE_LABELS[row.enumType]}</b>
                  <input type="number" min={0} placeholder="Number of questions" value={qty[row.enumType] ?? ''} onChange={(e) => setQty({ ...qty, [row.enumType]: Number(e.target.value) || 0 })} />
                  <div className="mark">{row.mark} mark{row.mark === 1 ? '' : 's'}</div>
                </div>
              ))}
            </div>
            {shortfalls.length > 0 && (
              <div className="login-error" style={{ marginTop: 10 }}>
                Not enough questions in the bank yet — {shortfalls.join('; ')}.
              </div>
            )}
            <div className="settings">
              <span className="muted">SET TIMER</span>
              <select value={timer} onChange={(e) => setTimer(e.target.value)}>
                <option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option>
              </select>
              <span className="muted" style={{ marginLeft: 'auto' }}>Questions will be selected from the Question Bank.</span>
            </div>
          </section>

          <section className="card test-card" style={{ marginTop: 16 }}>
            <div className="section-head" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
              <div><b>Assign To</b><div className="muted" style={{ marginTop: 4 }}>Leave everything unchecked to save without publishing it to anyone yet.</div></div>
            </div>
            <div className="assign-list">
              <label className="assign-tenant-wide assign-row">
                <input type="checkbox" checked={assignTenantWide} onChange={(e) => setAssignTenantWide(e.target.checked)} />
                <b>All sections (tenant-wide)</b>
              </label>
              {sections.map((s) => (
                <label className="assign-section assign-row" key={s.id}>
                  <input
                    type="checkbox"
                    checked={!!assignSectionIds[s.id]}
                    onChange={(e) => setAssignSectionIds({ ...assignSectionIds, [s.id]: e.target.checked })}
                  />
                  {s.name}{s.grade ? ` (Class ${s.grade})` : ''}
                </label>
              ))}
              {sections.length === 0 && <div className="muted">No sections in this tenant yet.</div>}
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <div className="field"><label>Opens</label>
                <input type="datetime-local" className="source-input" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
              </div>
              <div className="field"><label>Closes</label>
                <input type="datetime-local" className="source-input" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
              </div>
            </div>
          </section>
          <section className="card test-card" style={{ marginTop: 16 }}>
            <div className="section-head" style={{ border: 0, margin: 0, padding: 0 }}>
              <div><h2>Selected Questions</h2><div className="muted" style={{ marginTop: 4 }}>Review matching questions before publishing.</div></div>
              <div className="pill">{built.length} questions</div>
            </div>
            <div className="questions">
              {built.length ? built.map((q, i) => (
                <div className="question" key={i}>
                  <div className="qno">Q{i + 1}</div>
                  <div><div className="text">{q.text}</div><div className="small">{QUESTION_TYPE_LABELS[q.type]} • Question Bank</div></div>
                  <div className="mark">{q.marks} mark{q.marks === 1 ? '' : 's'}</div>
                </div>
              )) : <div className="empty">Select question types and enter quantities above to populate the test.</div>}
            </div>
          </section>
          {published && (
            <div className="pill" style={{ marginTop: 16, display: 'inline-block' }}>
              Published — {published.total_marks} marks total.
            </div>
          )}
          <div className="actions">
            <button onClick={() => setShowPreview(true)}>Preview the Created Test</button>
            <button className="primary" onClick={publish} disabled={publishing}>{publishing ? 'Publishing…' : 'Publish'}</button>
          </div>

          {showPreview && (
            <div className="modal" onClick={() => setShowPreview(false)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h2>Test Preview</h2>
                <div className="muted">{chapterName} • {timer} minutes</div>
                <div style={{ marginTop: 15 }}>
                  {built.length
                    ? built.map((q, i) => (
                        <div className="qcard" style={{ marginBottom: 8 }} key={i}>
                          <b>Q{i + 1}.</b> {q.text}
                          <div className="muted" style={{ marginTop: 7 }}>{q.marks} marks</div>
                        </div>
                      ))
                    : <div className="muted">No questions selected.</div>}
                </div>
                <div className="actions"><button onClick={() => setShowPreview(false)}>Close</button></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
