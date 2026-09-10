import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Download, ListChecks, Printer, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../components/Shell'
import RichView from '../lib/richtext/RichView'
import {
  api, ApiError,
  type PracticeChapter, type PracticeCheckResult, type PracticeSet,
  type StudentTest, type StudentTestDetail,
} from '../lib/api'

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
  const { subjectId } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [subjectName, setSubjectName] = useState<string | null>(null)
  const [chapters, setChapters] = useState<PracticeChapter[]>([])
  const [chaptersLoaded, setChaptersLoaded] = useState(false)
  const [count, setCount] = useState(5)
  const [set, setSet] = useState<PracticeSet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, PracticeCheckResult> | null>(null)
  const [checking, setChecking] = useState(false)

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

  useEffect(() => {
    if (!subjectId) return
    setChaptersLoaded(false)
    setChapters([])
    setSet(null)
    setError(null)
    Promise.all([api.practiceChapters(subjectId), api.appSubjects()])
      .then(([ch, shelf]) => {
        setChapters(ch.chapters)
        setSubjectName(shelf.subjects.find((s) => s.id === subjectId)?.name ?? null)
      })
      .catch(() => setChapters([]))
      .finally(() => setChaptersLoaded(true))
  }, [subjectId])

  const selectedChapterId = params.get('chapter') ?? chapters[0]?.chapter_id ?? null
  const selectedChapter = chapters.find((c) => c.chapter_id === selectedChapterId)

  const generate = async () => {
    if (!subjectId || !selectedChapterId) return
    setBusy(true)
    setError(null)
    setSet(null)
    setSelected({})
    setResults(null)
    try {
      setSet(await api.practiceGenerate(subjectId, selectedChapterId, count))
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setError('Quiz access is not included in your plan.')
      else setError('Could not generate the question set.')
    } finally {
      setBusy(false)
    }
  }

  const selectOption = (versionId: string, key: string) => {
    setSelected((prev) => ({ ...prev, [versionId]: key }))
    setResults(null)
  }

  const checkAnswers = async () => {
    const answers = Object.entries(selected).map(([version_id, selected_key]) => ({ version_id, selected_key }))
    if (answers.length === 0) return
    setChecking(true)
    try {
      const { results: r } = await api.practiceCheck(answers)
      setResults(Object.fromEntries(r.map((x) => [x.version_id, x])))
    } catch {
      setError('Could not check your answers.')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    setSet(null)
    setError(null)
    setSelected({})
    setResults(null)
  }, [subjectId, selectedChapterId])

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
          {subjectName && (
            <span className="text-[12px] font-normal opacity-50 bg-white border px-2 py-0.5 rounded-full">
              {subjectName}
            </span>
          )}
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

      {chapters.length === 0 && chaptersLoaded && (
        <div className="py-20 text-center">
          <p className="text-[14px] font-medium">No practice questions on this shelf yet</p>
          <p className="text-[12px] opacity-60 mt-1">Pick another subject or check back later.</p>
        </div>
      )}

      {chapters.length > 0 && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">
            <div className="bg-white rounded-[16px] border border-black/[0.06] p-4 flex flex-wrap items-center gap-3">
              <select
                value={selectedChapterId ?? ''}
                onChange={(e) => setParams({ chapter: e.target.value })}
                className="h-9 px-3 rounded-xl bg-cream border border-black/[0.08] text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
              >
                {chapters.map((c) => (
                  <option key={c.chapter_id} value={c.chapter_id}>
                    {c.chapter_name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                className="h-9 w-20 px-3 rounded-xl bg-cream border border-black/[0.08] text-[13px] font-medium outline-none focus:border-gold"
                aria-label="Number of questions"
              />
              <button
                onClick={generate}
                disabled={busy || !selectedChapterId}
                className="h-9 px-4 rounded-full bg-gold text-black text-[13px] font-semibold flex items-center gap-1.5 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {busy ? (
                  <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate set
              </button>
              {set && (
                <span className="text-[12px] opacity-60 ml-auto">
                  {set.metadata.total_delivered}/{set.metadata.total_requested} questions
                  {set.metadata.shortfall && ' • pool shortfall'}
                </span>
              )}
            </div>

            {error && (
              <div className="bg-white rounded-[16px] border border-black/[0.06] p-8 text-center">
                <p className="text-[14px] font-medium">{error}</p>
              </div>
            )}

            {!set && !error && (
              <div className="py-16 text-center bg-white rounded-[18px] border border-black/[0.06]">
                <p className="text-[14px] font-medium">
                  Generate a set from “{selectedChapter?.chapter_name}”
                </p>
                <p className="text-[12px] opacity-60 mt-1">
                  Pick how many questions you need — they're drawn at random from that chapter's
                  question bank.
                </p>
              </div>
            )}

            {set?.questions.map((q, i) => (
              <div
                key={q.version_id}
                className="bg-white rounded-[18px] border border-black/[0.06] p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-cream border border-black/5 flex items-center justify-center text-[12px] font-bold">
                      Q{i + 1}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-cream border-black/10">
                      {q.marks} mark{q.marks === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <p className="text-[14px] font-medium leading-relaxed mb-4">{q.question_text}</p>
                {q.options.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const isSelected = selected[q.version_id] === opt.key
                      const result = results?.[q.version_id]
                      const isCorrectKey = result && result.correct_key === opt.key
                      const isWrongPick = result && isSelected && !result.correct
                      const style = isCorrectKey
                        ? 'bg-forest/10 border-forest text-forest'
                        : isWrongPick
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : isSelected
                            ? 'bg-gold/10 border-gold'
                            : 'bg-paper border-black/5 hover:border-black/15'
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => selectOption(q.version_id, opt.key)}
                          className={`text-left p-3 rounded-xl border text-[13px] flex items-center gap-2.5 transition-colors ${style}`}
                        >
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-white border">
                            {opt.key}
                          </span>
                          {opt.text}
                          {isCorrectKey && <Check className="w-4 h-4 ml-auto shrink-0" />}
                          {isWrongPick && <X className="w-4 h-4 ml-auto shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {set && set.questions.some((q) => q.options.length > 0) && (
              <div className="flex items-center gap-3">
                <button
                  onClick={checkAnswers}
                  disabled={checking || Object.keys(selected).length === 0}
                  className="h-9 px-4 rounded-full bg-forest text-white text-[13px] font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {checking ? 'Checking…' : 'Check answers'}
                </button>
                {results && (
                  <span className="text-[12px] opacity-60">
                    {Object.values(results).filter((r) => r.correct).length}/{Object.keys(results).length} correct
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[16px] p-4 text-white bg-forest">
              <div className="text-[12px] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" /> How this works
              </div>
              <p className="text-[12px] leading-relaxed opacity-80 mt-2">
                Pick an option per question, then hit “Check answers.” The correct answer only
                shows once you've made a selection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
