import { useEffect, useState } from 'react'
import { ArrowLeft, Download, ListChecks, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import RichView from '../lib/richtext/RichView'
import { api, type StudentTest, type StudentTestDetail } from '../lib/api'
import TrigonometryPractice from '../components/trig/TrigonometryPractice'

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
  const [error, setError] = useState<string | null>(null)

  const [tests, setTests] = useState<StudentTest[]>([])
  const [viewingTest, setViewingTest] = useState<StudentTestDetail | null>(null)

  useEffect(() => {
    api.studentTests().then((r) => setTests(r.tests)).catch(() => setTests([]))
  }, [])

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
    <div className="p-4 lg:p-6 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-[22px] font-bold tracking-tight flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-forest text-white flex items-center justify-center">
            <ListChecks className="w-5 h-5" />
          </span>
          Practice Questions
        </h2>
        <Link
          to="/"
          className="h-9 px-4 rounded-full bg-white border border-black/10 text-[13px] font-medium flex items-center gap-1.5 hover:bg-black/5 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </Link>
      </div>

      {tests.length > 0 && (
        <div className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-40 mb-3">Assigned to you</div>

          {openTest && (
            <div className="test-hero bg-white rounded-2xl border border-emerald-200 border-l-4 border-l-emerald-500 p-5 mb-3 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-display font-semibold text-[15px]">{openTest.title}</span>
                  <span className={`status-pill text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE.OPEN}`}>
                    {statusLabel(openTest)}
                  </span>
                </div>
                <div className="text-[12px] opacity-60 flex flex-wrap gap-3">
                  <span>{openTest.subject_name}</span>
                  <span>{openTest.question_count} questions</span>
                  <span>{openTest.total_marks} marks</span>
                  <span>{openTest.timer_minutes} min</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[11px] opacity-50">Closes {new Date(openTest.closes_at).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => openTestPreview(openTest.test_id)} className="h-8 px-3 rounded-full text-[12px] font-medium opacity-70 hover:opacity-100">Preview</button>
                  <button onClick={() => openTestPreview(openTest.test_id)} className="h-8 px-3 rounded-full bg-forest text-white text-[12px] font-semibold flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {otherTests.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/[0.06] divide-y divide-black/[0.05]">
              {otherTests.map((t) => (
                <div key={t.test_id} className="test-row flex items-center gap-3 px-4 py-2.5">
                  <span className="text-[12px] font-medium opacity-70 flex-1 truncate">{t.title}</span>
                  <span className={`status-pill text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status]}`}>
                    {statusLabel(t)}
                  </span>
                  <span className="text-[11px] opacity-40 hidden sm:inline">{t.question_count} q • {t.total_marks} marks</span>
                  <button
                    onClick={() => openTestPreview(t.test_id)}
                    disabled={t.status === 'UPCOMING'}
                    className="text-[11px] font-medium opacity-60 hover:opacity-100 disabled:opacity-30"
                  >
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-white rounded-[16px] border border-black/[0.06] p-8 text-center mb-4">
          <p className="text-[14px] font-medium">{error}</p>
        </div>
      )}

      <TrigonometryPractice />
    </div>
  )
}
