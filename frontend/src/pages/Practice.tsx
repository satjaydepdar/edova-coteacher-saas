import { useEffect, useState } from 'react'
import { ArrowLeft, Download, ListChecks, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import RichView from '../lib/richtext/RichView'
import { api, type StudentTest, type StudentTestDetail } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import TrigonometryPractice from '../components/trig/TrigonometryPractice'
import CoordinateGeometryPractice from '../components/coordgeo/CoordinateGeometryPractice'
import { practiceApi, type PracticeChapter, type PracticeClass } from '../lib/trig/trigApiClient'

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

  const selectCls = 'h-9 px-3 rounded-full bg-white border border-[#EDE8DD] text-[12px] font-medium text-[#1A221E]'

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-[#EDE8DD] bg-[#FCFBF8]">
      <select
        className={selectCls}
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
        className={selectCls}
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
        className={selectCls}
        value={chapterId}
        onChange={(e) => onChange({ grade, subjectId, chapterId: e.target.value })}
      >
        {chapters.map((c: PracticeChapter) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}

const STATUS_STYLE: Record<StudentTest['status'], string> = {
  OPEN: 'bg-emerald-50 text-emerald-700',
  UPCOMING: 'bg-gold/15 text-gold-dark',
  CLOSED: 'bg-black/5 text-black/45',
}
function daysUntil(iso: string): number {
  return Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function statusLabel(t: StudentTest): string {
  if (t.status === 'OPEN') return 'Open now'
  if (t.status === 'UPCOMING') return `Opens in ${daysUntil(t.opens_at)}d`
  return 'Closed'
}

function TestDetailView({ test, onBack }: { test: StudentTestDetail; onBack: () => void }) {
  return (
    <div className="test-detail p-4 lg:p-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={onBack} className="h-9 px-4 rounded-full bg-white border border-black/10 text-[13px] font-medium flex items-center gap-1.5 hover:bg-black/5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => window.print()} className="h-9 px-4 rounded-full bg-forest text-white text-[13px] font-semibold flex items-center gap-1.5">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
      <h1 className="font-display text-[20px] font-bold mb-1">{test.title}</h1>
      <p className="text-[12px] opacity-60 mb-6">{test.timer_minutes} minutes • {test.total_marks} marks</p>
      <div className="space-y-4">
        {test.questions.map((q, i) => (
          <div key={i} className="bg-white rounded-[18px] border border-black/[0.06] p-5">
            {q.passage && (
              <div className="bg-cream rounded-xl p-3 mb-3 text-[13px]">
                <RichView html={q.passage} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-full bg-cream border border-black/5 flex items-center justify-center text-[12px] font-bold">Q{i + 1}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-cream border-black/10">{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
            </div>
            <RichView html={q.question_text} className="font-medium mb-3" />
            {q.options.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt) => (
                  <div key={opt.key} className="p-3 rounded-xl border border-black/5 bg-paper text-[13px] flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-white border">{opt.key}</span>
                    <RichView html={opt.text} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Practice() {
  const { user } = useAuthStore()
  const isStudent = user?.role === 'STUDENT'
  const [error, setError] = useState<string | null>(null)
  const [tests, setTests] = useState<StudentTest[]>([])
  const [viewingTest, setViewingTest] = useState<StudentTestDetail | null>(null)
  const [showAssignedTests, setShowAssignedTests] = useState(false)
  const [classes, setClasses] = useState<PracticeClass[]>([])
  const [selection, setSelection] = useState({ grade: '', subjectId: '', chapterId: '' })

  useEffect(() => {
    if (!isStudent) return
    api.studentTests().then((r) => setTests(r.tests)).catch(() => setTests([]))
  }, [isStudent])

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

  const openTest = tests.find((t) => t.status === 'OPEN')
  const otherTests = tests.filter((t) => t.test_id !== openTest?.test_id)

  const openTestPreview = async (testId: string) => {
    try {
      setViewingTest(await api.studentTestDetail(testId))
    } catch {
      setError('Could not load this test.')
    }
  }

  if (viewingTest) {
    return <TestDetailView test={viewingTest} onBack={() => setViewingTest(null)} />
  }

  return (
    <div className="min-h-full w-full bg-[#FBF9F3] text-[#1A221E] antialiased">
      {/* Assigned Tests Notification / Drawer Banner (Only for Student login) */}
      {isStudent && tests.length > 0 && (
        <div className="border-b border-[#EDE8DD] bg-[#FCFBF8] px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#DDB56E] animate-pulse" />
            <span className="font-semibold text-[#1A221E]">
              {openTest ? `Assigned Test Available: ${openTest.title}` : `${tests.length} tests in curriculum`}
            </span>
            {openTest && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE.OPEN}`}>
                {statusLabel(openTest)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {openTest && (
              <button
                onClick={() => openTestPreview(openTest.test_id)}
                className="h-7 px-3 rounded-full bg-[#1A221E] text-white text-[11px] font-medium hover:bg-[#232E27] transition-colors"
              >
                Open Assigned Test
              </button>
            )}
            <button
              onClick={() => setShowAssignedTests(!showAssignedTests)}
              className="text-[11px] font-mono text-[#6B7280] hover:text-[#1A221E] underline"
            >
              {showAssignedTests ? 'Hide List' : 'View All Tests'}
            </button>
          </div>
        </div>
      )}

      {isStudent && showAssignedTests && tests.length > 0 && (
        <div className="p-4 bg-white border-b border-[#EDE8DD] max-w-[960px] mx-auto my-3 rounded-2xl card-shadow">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-40 mb-3 font-mono">Assigned Tests</div>
          <div className="divide-y divide-[#EDE8DD]">
            {tests.map((t) => (
              <div key={t.test_id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-[#1A221E] truncate">{t.title}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`status-pill text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status]}`}>
                    {statusLabel(t)}
                  </span>
                  <button
                    onClick={() => openTestPreview(t.test_id)}
                    disabled={t.status === 'UPCOMING'}
                    className="text-[11px] font-mono text-[#2E5A3A] hover:underline disabled:opacity-30"
                  >
                    Preview / Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-[16px] border border-[#EDE8DD] p-4 text-center mx-6 my-3 card-shadow">
          <p className="text-[13px] font-medium text-red-700">{error}</p>
        </div>
      )}

      {classes.length > 0 && (
        <PracticeFilters
          classes={classes}
          grade={selection.grade}
          subjectId={selection.subjectId}
          chapterId={selection.chapterId}
          onChange={setSelection}
        />
      )}

      {selectedChapter?.practice_module === 'trigonometry' ? (
        <TrigonometryPractice />
      ) : selectedChapter?.practice_module === 'coordinate_geometry' ? (
        <CoordinateGeometryPractice />
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
