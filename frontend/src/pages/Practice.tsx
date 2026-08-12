import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ListChecks, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../components/Shell'
import { api, ApiError, type GeneratedQuiz, type Module } from '../lib/api'

const DIFF_CLS: Record<string, string> = {
  EASY: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  MEDIUM: 'bg-amber-50 border-amber-200 text-amber-700',
  HARD: 'bg-red-50 border-red-200 text-red-700',
}

export default function Practice() {
  const { tree, subjectId } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const quizModules = useMemo(() => {
    const out: (Module & { chapter_name: string })[] = []
    for (const c of tree?.chapters ?? [])
      for (const t of c.topics)
        for (const m of t.modules)
          if (m.type === 'QUIZ') out.push({ ...m, chapter_name: c.chapter_name })
    return out
  }, [tree])

  const selectedId = params.get('module') ?? quizModules[0]?.module_id ?? null

  const generate = async (moduleId: string) => {
    setBusy(true)
    setError(null)
    setQuiz(null)
    try {
      setQuiz(await api.quizGenerate(moduleId))
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setError('This quiz is not configured yet.')
      else if (e instanceof ApiError && e.status === 403)
        setError('Quiz access is not included in your plan.')
      else setError('Could not generate the question set.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    setQuiz(null)
    setError(null)
  }, [subjectId, selectedId])

  const selectedModule = quizModules.find((m) => m.module_id === selectedId)

  return (
    <div className="p-4 lg:p-6 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-[22px] font-bold tracking-tight flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-forest text-white flex items-center justify-center">
            <ListChecks className="w-5 h-5" />
          </span>
          Practice Questions
          {tree && (
            <span className="text-[12px] font-normal opacity-50 bg-white border px-2 py-0.5 rounded-full">
              {tree.subject_name}
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

      {quizModules.length === 0 && tree && (
        <div className="py-20 text-center">
          <p className="text-[14px] font-medium">No quiz modules on this shelf</p>
          <p className="text-[12px] opacity-60 mt-1">Pick another subject or check back later.</p>
        </div>
      )}

      {quizModules.length > 0 && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">
            <div className="bg-white rounded-[16px] border border-black/[0.06] p-4 flex flex-wrap items-center gap-3">
              <select
                value={selectedId ?? ''}
                onChange={(e) => setParams({ module: e.target.value })}
                className="h-9 px-3 rounded-xl bg-cream border border-black/[0.08] text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
              >
                {quizModules.map((m) => (
                  <option key={m.module_id} value={m.module_id}>
                    {m.title} — {m.chapter_name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => selectedId && generate(selectedId)}
                disabled={busy || !selectedId}
                className="h-9 px-4 rounded-full bg-gold text-black text-[13px] font-semibold flex items-center gap-1.5 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {busy ? (
                  <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate set
              </button>
              {quiz && (
                <span className="text-[12px] opacity-60 ml-auto">
                  {quiz.metadata.total_delivered}/{quiz.metadata.total_requested} questions
                  {quiz.metadata.shortfall && ' • pool shortfall'}
                </span>
              )}
            </div>

            {error && (
              <div className="bg-white rounded-[16px] border border-black/[0.06] p-8 text-center">
                <p className="text-[14px] font-medium">{error}</p>
              </div>
            )}

            {!quiz && !error && (
              <div className="py-16 text-center bg-white rounded-[18px] border border-black/[0.06]">
                <p className="text-[14px] font-medium">
                  Generate a set from “{selectedModule?.title}”
                </p>
                <p className="text-[12px] opacity-60 mt-1">
                  Questions are drawn at random from the chapter's question bank per its selection
                  rules.
                </p>
              </div>
            )}

            {quiz?.questions.map((q, i) => (
              <div
                key={q.qid}
                className="bg-white rounded-[18px] border border-black/[0.06] p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-cream border border-black/5 flex items-center justify-center text-[12px] font-bold">
                      Q{i + 1}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${DIFF_CLS[q.difficulty] ?? 'bg-cream border-black/10'}`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] opacity-60">PYQ {q.year}</span>
                  </div>
                </div>
                <p className="text-[14px] font-medium leading-relaxed mb-4">{q.question_text}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className="text-left p-3 rounded-xl border text-[13px] flex items-center gap-2.5 bg-paper border-black/5"
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-white border">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-[16px] p-4 text-white bg-forest">
              <div className="text-[12px] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" /> Teacher preview
              </div>
              <p className="text-[12px] leading-relaxed opacity-80 mt-2">
                Sets are generated with the same engine students get. Answer keys are withheld from
                the teacher preview — review them in the admin console.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
