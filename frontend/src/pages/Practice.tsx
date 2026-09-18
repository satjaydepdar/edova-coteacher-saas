import { useEffect, useState } from 'react'
import TrigonometryPractice from '../components/trig/TrigonometryPractice'
import CoordinateGeometryPractice from '../components/coordgeo/CoordinateGeometryPractice'
import { practiceApi, type PracticeChapter, type PracticeClass } from '../lib/trig/trigApiClient'
import { filterSelectClass } from '../components/SearchToolbar'

function PracticeFilters({
  classes, grade, subjectId, chapterId, onChange,
}: {
  classes: PracticeClass[]
  grade: string
  subjectId: string
  chapterId: string
  onChange: (next: { grade: string; subjectId: string; chapterId: string }) => void
}) {
  const subjects = classes.find((c) => c.grade === grade)?.subjects ?? []
  const chapters = subjects.find((s) => s.id === subjectId)?.chapters ?? []

  return (
    <>
      <select
        className={filterSelectClass}
        value={grade}
        onChange={(e) => {
          const nextGrade = e.target.value
          const nextSubject = classes.find((c) => c.grade === nextGrade)?.subjects[0]
          onChange({ grade: nextGrade, subjectId: nextSubject?.id ?? '', chapterId: nextSubject?.chapters[0]?.id ?? '' })
        }}
      >
        {classes.map((c) => (
          <option key={c.grade} value={c.grade}>Class {c.grade}</option>
        ))}
      </select>
      <select
        className={filterSelectClass}
        value={subjectId}
        onChange={(e) => {
          const nextSubject = subjects.find((s) => s.id === e.target.value)
          onChange({ grade, subjectId: e.target.value, chapterId: nextSubject?.chapters[0]?.id ?? '' })
        }}
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select
        className={filterSelectClass}
        value={chapterId}
        onChange={(e) => onChange({ grade, subjectId, chapterId: e.target.value })}
      >
        {chapters.map((c: PracticeChapter) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </>
  )
}

export default function Practice() {
  const [classes, setClasses] = useState<PracticeClass[]>([])
  const [selection, setSelection] = useState({ grade: '', subjectId: '', chapterId: '' })

  useEffect(() => {
    practiceApi
      .chapters()
      .then((r) => {
        setClasses(r.classes)
        // Default to the backend's designated default chapter (Trigonometry) if present,
        // else the first chapter with any live practice module.
        let fallback: { grade: string; subjectId: string; chapterId: string } | null = null
        for (const c of r.classes) {
          for (const s of c.subjects) {
            const isDefault = s.chapters.find((ch) => ch.is_default)
            if (isDefault) {
              setSelection({ grade: c.grade, subjectId: s.id, chapterId: isDefault.id })
              return
            }
            if (!fallback) {
              const ready = s.chapters.find((ch) => ch.practice_available)
              if (ready) fallback = { grade: c.grade, subjectId: s.id, chapterId: ready.id }
            }
          }
        }
        if (fallback) {
          setSelection(fallback)
          return
        }
        const firstSubject = r.classes[0]?.subjects[0]
        if (firstSubject) {
          setSelection({ grade: r.classes[0].grade, subjectId: firstSubject.id, chapterId: firstSubject.chapters[0]?.id ?? '' })
        }
      })
      .catch(() => setClasses([]))
  }, [])

  const selectedChapter = classes
    .find((c) => c.grade === selection.grade)?.subjects
    .find((s) => s.id === selection.subjectId)?.chapters
    .find((ch) => ch.id === selection.chapterId)

  const filterBar = classes.length > 0 ? (
    <PracticeFilters
      classes={classes}
      grade={selection.grade}
      subjectId={selection.subjectId}
      chapterId={selection.chapterId}
      onChange={setSelection}
    />
  ) : undefined

  return (
    <div className="min-h-full w-full bg-[#FBF9F3] text-[#1A221E] antialiased">
      {selectedChapter?.practice_module === 'trigonometry' ? (
        <TrigonometryPractice filterBar={filterBar} />
      ) : selectedChapter?.practice_module === 'coordinate_geometry' ? (
        <CoordinateGeometryPractice filterBar={filterBar} />
      ) : (
        <div className="py-16 text-center bg-white rounded-[18px] border border-black/[0.06] mx-6 my-6">
          <p className="text-[14px] font-medium">
            {selectedChapter ? `Practice content for "${selectedChapter.name}" is coming soon.` : 'Select a chapter to begin.'}
          </p>
        </div>
      )}
    </div>
  )
}
