import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import {
  adminContent, adminQuestions, AdminApiError,
  type AdminChapter, type AdminSubject, type AdminTree, type QuestionOption,
} from '../lib/adminApi'
import { QUESTION_TYPE_ENUMS, QUESTION_TYPE_LABELS } from '../lib/questionTypes'
import RichEditor from '../lib/richtext/RichEditor'
import RichView from '../lib/richtext/RichView'
import { isRichTextEmpty, richTextToPlain } from '../lib/richtext/utils'

interface Draft {
  question_type: string
  question_text: string
  marks: number
  options: QuestionOption[]
  correct: number
  passage: string
  explanation: string
  topic_id: string
  source_papers: string[]
}

const emptyDraft = (): Draft => ({
  question_type: 'MCQ',
  question_text: '',
  marks: 1,
  options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: '', correct: false })),
  correct: 0,
  passage: '',
  explanation: '',
  topic_id: '',
  source_papers: [],
})

interface Props {
  subjectId: string
  chapterId: string
  chapterName: string
  onChangeChapter: (subjectId: string, chapter: AdminChapter) => void
}

export interface AuthoringPageHandle {
  startNewQuestion: () => void
}

const AuthoringPage = forwardRef<AuthoringPageHandle, Props>(function AuthoringPage(
  { subjectId, chapterId, chapterName, onChangeChapter },
  ref,
) {
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [paperDraft, setPaperDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [hasPreviewed, setHasPreviewed] = useState(false)
  const [showExplanationPreview, setShowExplanationPreview] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  useImperativeHandle(ref, () => ({ startNewQuestion: clear }))

  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [tree, setTree] = useState<AdminTree | null>(null)

  useEffect(() => {
    adminContent.subjects().then((r) => setSubjects(r.subjects)).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    if (!subjectId) {
      setTree(null)
      return
    }
    adminContent.tree(subjectId).then(setTree).catch(() => setTree(null))
  }, [subjectId])

  const currentTopics = tree?.chapters.find((c) => c.id === chapterId)?.topics ?? []

  async function handleSubjectChange(newSubjectId: string) {
    try {
      const t = await adminContent.tree(newSubjectId)
      const first = t.chapters[0]
      if (first) onChangeChapter(newSubjectId, first)
    } catch {
      /* leave selection unchanged on failure */
    }
  }

  function handleChapterChange(newChapterId: string) {
    const c = tree?.chapters.find((ch) => ch.id === newChapterId)
    if (c) onChangeChapter(subjectId, c)
  }

  async function save(opts?: { asDraft?: boolean }) {
    const asDraft = opts?.asDraft ?? false
    if (!asDraft && isRichTextEmpty(draft.question_text)) {
      alert('Please enter the question text.')
      return
    }
    const usesOptions = draft.question_type === 'MCQ' || draft.question_type === 'MCQ_COMBINATION'
    const options = usesOptions
      ? draft.options.map((o, i) => ({ ...o, correct: i === draft.correct })).filter((o) => !isRichTextEmpty(o.text))
      : []
    setSaving(true)
    try {
      const body = {
        question_type: draft.question_type,
        question_text: draft.question_text,
        marks: draft.marks,
        options,
        passage: draft.passage || null,
        explanation: draft.explanation || null,
        topic_id: draft.topic_id || null,
        source_papers: draft.source_papers,
      }
      const r = await adminQuestions.create({ chapter_id: chapterId, ...body, save_as_draft: asDraft })
      if (pendingImages.length) {
        for (const file of pendingImages) await adminQuestions.uploadMedia(r.question_id, file)
      }
      if (asDraft) clear()
      else setJustAdded(true)
    } catch (e) {
      alert(e instanceof AdminApiError ? String(e.message) : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function clear() {
    setDraft(emptyDraft())
    setPendingImages([])
    setPaperDraft('')
    setPreviewOpen(false)
    setHasPreviewed(false)
    setShowExplanationPreview(false)
    setJustAdded(false)
  }

  function triggerPreview() {
    if (isRichTextEmpty(draft.question_text)) {
      alert('Please enter the question text.')
      return
    }
    setPreviewing(true)
    window.setTimeout(() => {
      setPreviewing(false)
      setHasPreviewed(true)
      setPreviewOpen(true)
    }, 400)
  }

  function addPaper() {
    const v = paperDraft.trim()
    if (v && !draft.source_papers.includes(v)) setDraft({ ...draft, source_papers: [...draft.source_papers, v] })
    setPaperDraft('')
  }

  function removePaper(p: string) {
    setDraft({ ...draft, source_papers: draft.source_papers.filter((x) => x !== p) })
  }

  const usesOptions = draft.question_type === 'MCQ' || draft.question_type === 'MCQ_COMBINATION'

  return (
    <div id="authoring" className="page">
      {!chapterId ? (
        <div className="muted">Pick a chapter from Curriculum View first.</div>
      ) : (
        <div className={`author-layout${previewOpen ? ' preview-open' : ''}`}>
          <section className="card author-main">
            {justAdded ? (
              <div className="success-state">
                <div className="success-title">✓ Question added to the bank</div>
                <div className="muted">The saved question is still shown in the preview on the right. Use "Add New Question" at the top to continue.</div>
              </div>
            ) : (
            <>
            <h2>New Question</h2>
            <div className="muted" style={{ margin: '5px 0 20px' }}>{chapterName} — add a question to the Question Bank.</div>

            <div className="row3">
              <div className="field"><label>Subject</label>
                <select value={subjectId} onChange={(e) => void handleSubjectChange(e.target.value)}>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Chapter</label>
                <select value={chapterId} onChange={(e) => handleChapterChange(e.target.value)}>
                  {(tree?.chapters ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Topic (optional)</label>
                <select value={draft.topic_id} onChange={(e) => setDraft({ ...draft, topic_id: e.target.value })}>
                  <option value="">No topic</option>
                  {currentTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="field qtext-field"><label>Question Text</label>
              <RichEditor
                value={draft.question_text}
                onChange={(html) => setDraft({ ...draft, question_text: html })}
                placeholder="Type your question here… e.g., Prove that √5 is irrational"
              />
              <div className="field-helper">
                <span>Markdown + LaTeX. Use $ for inline math.</span>
                <span>{richTextToPlain(draft.question_text).length}/650</span>
              </div>
            </div>

            <div className="field passage-field"><label>Passage (optional)</label>
              <RichEditor
                value={draft.passage}
                onChange={(html) => setDraft({ ...draft, passage: html })}
                placeholder="Comprehension passage or case-study context (100–200 words)…"
              />
            </div>

            <div className="row">
              <div className="field"><label>Question Type</label>
                <select value={draft.question_type} onChange={(e) => setDraft({ ...draft, question_type: e.target.value })}>
                  {QUESTION_TYPE_ENUMS.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="field"><label>Marks</label>
                <input className="source-input marks-input" type="number" min={0} value={draft.marks} onChange={(e) => setDraft({ ...draft, marks: Number(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="field"><label>Question Image / Diagram</label>
              <div className="upload">
                {pendingImages.map((f, i) => (
                  <div className="pending-image" key={i}>
                    <span>{f.name}</span>
                    <button type="button" className="mini" onClick={() => setPendingImages(pendingImages.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                ))}
                <div className="upload-actions">
                  <label className="mini" style={{ display: 'inline-block' }}>
                    Add Image
                    <input
                      type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? [])
                        e.target.value = ''
                        if (!files.length) return
                        setPendingImages((prev) => [...prev, ...files])
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {usesOptions && (
              <div className="field"><label>Multiple Choice Options</label>
                <div className="options">
                  {draft.options.map((opt, i) => (
                    <div className="option" key={opt.key}>
                      <button type="button" className={`correct${draft.correct === i ? ' on' : ''}`} onClick={() => setDraft({ ...draft, correct: i })}>
                        {draft.correct === i ? '✓' : opt.key}
                      </button>
                      <RichEditor
                        value={opt.text}
                        onChange={(html) => setDraft({ ...draft, options: draft.options.map((o, j) => (j === i ? { ...o, text: html } : o)) })}
                        placeholder={`Option ${opt.key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field"><label>Explanation (optional)</label>
              <RichEditor
                value={draft.explanation}
                onChange={(html) => setDraft({ ...draft, explanation: html })}
                placeholder="Shown to the student after they answer…"
              />
            </div>

            <div className="field"><label>Source Papers (optional)</label>
              <div className="paper-tags">
                {draft.source_papers.map((p) => (
                  <span key={p} className="paper-tag">{p} <button type="button" onClick={() => removePaper(p)}>&times;</button></span>
                ))}
                <input
                  className="source-input paper-input"
                  placeholder="NCERT Exemplar / PYQ 2023 — press Enter to add"
                  value={paperDraft}
                  onChange={(e) => setPaperDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPaper() } }}
                />
              </div>
            </div>

            <div className="author-actions">
              <button onClick={clear}>Clear</button>
              <button onClick={() => void save({ asDraft: true })} disabled={saving}>Save As Draft</button>
              <button className="btn-outline" onClick={triggerPreview} disabled={previewing}>{previewing ? 'Previewing…' : 'Preview'}</button>
              <button
                className="primary"
                onClick={() => void save()}
                disabled={saving || !hasPreviewed}
              >
                {saving ? 'Saving…' : 'Add to Bank'}
              </button>
            </div>
            </>
            )}
          </section>

          <div className={`preview-panel${previewOpen ? ' open' : ''}`}>
            <button
              type="button"
              className="preview-handle"
              onClick={() => setPreviewOpen((v) => !v)}
              aria-label={previewOpen ? 'Collapse preview' : 'Expand preview'}
            >
              {previewOpen ? '›' : '‹'}
            </button>
            <div className="preview-panel-inner">
              <div className="preview-head">
                <div>
                  <div className="preview-title">Question Preview</div>
                  <div className="muted">Student view — exact as student sees</div>
                </div>
                <span className={`preview-badge${hasPreviewed ? ' live' : ''}`}>{hasPreviewed ? 'LIVE' : 'EMPTY'}</span>
              </div>
              <div className="preview-body">
                {!hasPreviewed ? (
                  <div className="preview-empty">Click Preview to see student view</div>
                ) : (
                  <div className="preview-card">
                    <div className="preview-tags">
                      <span className="preview-tag">
                        {subjects.find((s) => s.id === subjectId)?.name ?? 'Subject'} • {chapterName}
                      </span>
                      <span className="preview-marks-pill">{draft.marks} mark{draft.marks === 1 ? '' : 's'}</span>
                    </div>
                    {!isRichTextEmpty(draft.passage) && (
                      <div className="preview-passage"><RichView html={draft.passage} /></div>
                    )}
                    <RichView html={draft.question_text} />
                    {usesOptions && (
                      <div className="options" style={{ marginTop: 12 }}>
                        {draft.options.filter((o) => !isRichTextEmpty(o.text)).map((opt) => {
                          const i = draft.options.indexOf(opt)
                          return (
                            <div className="option" key={opt.key}>
                              <button type="button" className={`correct${draft.correct === i ? ' on' : ''}`} disabled>
                                {draft.correct === i ? '✓' : opt.key}
                              </button>
                              <RichView html={opt.text} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {!isRichTextEmpty(draft.explanation) && (
                      <div className="preview-explanation-toggle">
                        <button type="button" onClick={() => setShowExplanationPreview((v) => !v)}>
                          {showExplanationPreview ? 'Hide explanation' : 'Show explanation after answer'}
                        </button>
                        {showExplanationPreview && <RichView html={draft.explanation} />}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default AuthoringPage
