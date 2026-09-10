import { useEffect, useState } from 'react'
import { adminContent, AdminApiError, type AdminChapter, type AdminSubject } from '../lib/adminApi'

export default function CurriculumPage({
  subjectId,
  onSelectSubject,
  onSelectChapter,
}: {
  subjectId: string
  onSelectSubject: (id: string) => void
  onSelectChapter: (chapter: AdminChapter, page: 'authoring' | 'test') => void
}) {
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [chapters, setChapters] = useState<AdminChapter[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminContent.subjects()
      .then((r) => {
        setSubjects(r.subjects)
        if (!subjectId && r.subjects.length) onSelectSubject(r.subjects[0].id)
      })
      .catch((e) => setError(e instanceof AdminApiError ? String(e.message) : 'Failed to load subjects'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!subjectId) return
    adminContent.tree(subjectId)
      .then((r) => setChapters(r.chapters))
      .catch((e) => setError(e instanceof AdminApiError ? String(e.message) : 'Failed to load chapters'))
  }, [subjectId])

  return (
    <div id="curriculum" className="page">
      <div className="toolbar">
        <select value={subjectId} onChange={(e) => onSelectSubject(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.standard_grade})</option>)}
        </select>
      </div>
      {error && <div className="login-error">{error}</div>}
      <div className="grid">
        {chapters.map((c) => (
          <article className="card subject" key={c.id}>
            <div className="tag">• CHAPTER {c.sequence_order}</div>
            <h3>{c.name}</h3>
            <div className="subject-actions">
              <button onClick={() => onSelectChapter(c, 'authoring')}>View Bank</button>
              <button onClick={() => onSelectChapter(c, 'test')}>Mock Test</button>
            </div>
          </article>
        ))}
        {subjectId && chapters.length === 0 && !error && <div className="muted">No chapters yet.</div>}
      </div>
    </div>
  )
}
