import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  BookOpen,
  FlaskConical,
  Play,
  ListChecks,
  Grid3x3,
} from 'lucide-react'
import { useStudentStore } from '../../store/studentStore'

type Tab = 'plan' | 'mistakes' | 'heatmap'

const LEVEL_STYLE: Record<number, string> = {
  0: 'bg-danger/10 border-danger/30 text-danger',
  1: 'bg-[#DDB56E]/15 border-[#DDB56E]/40 text-[#8C6D23]',
  2: 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-[#111814]',
}

const STATUS_STYLE: Record<string, string> = {
  overdue: 'bg-danger/15 border-danger/40 text-danger',
  due_today: 'bg-[#DDB56E]/15 border-[#DDB56E]/40 text-[#8C6D23]',
  due_soon: 'bg-[#1a2421]/5 border-[#EDE8DD] text-[#111814]/70',
}

export default function LearningHubPage() {
  const { studyPlan, mistakes, heatmap, fetchStudyPlan, fetchMistakes, fetchHeatmap, resolveMistake } =
    useStudentStore()
  const [tab, setTab] = useState<Tab>('plan')

  useEffect(() => {
    void fetchStudyPlan()
    void fetchMistakes()
    void fetchHeatmap()
  }, [fetchStudyPlan, fetchMistakes, fetchHeatmap])

  const needsPractice = mistakes.filter((m) => m.status === 'needs_practice')

  return (
    <div className="min-h-full bg-[#FBF9F3] px-5 lg:px-10 py-6 lg:py-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[22px] lg:text-[26px] tracking-[-0.02em] font-medium text-[#111814]">
          Learning Hub
        </h1>
        <p className="text-[13px] text-[#8A8A7A] mt-1">
          Your daily study plan, mistake journal, and mastery progress.
        </p>
      </div>

      {/* Study Plan Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Experience Points', value: `${studyPlan?.xp ?? '—'} XP`, sub: 'Total earned', color: '#DDB56E' },
          { label: 'Daily Streak', value: `${studyPlan?.streak_days ?? '—'}`, sub: 'Days in a row', color: '#D9534F' },
          { label: 'Urgent Tasks', value: studyPlan?.urgent_tasks.length ?? 0, sub: 'Need attention', color: '#111814' },
          { label: 'Needs Practice', value: needsPractice.length, sub: 'Unresolved mistakes', color: '#D9534F' },
        ].map((z) => (
          <div key={z.label} className="relative rounded-[14px] bg-[#FCFBF8] border border-[#EDE8DD] p-3.5 overflow-hidden">
            <div className="font-mono text-[9.5px] tracking-[0.08em] text-[#9AA09B] leading-tight mb-1.5 uppercase">{z.label}</div>
            <div className="font-serif text-[22px] font-medium leading-none tracking-[-0.02em] mb-1 text-[#111814]">{z.value}</div>
            <div className="font-mono text-[10px] text-[#8A8F8B]">{z.sub}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EDE8DD]">
              <div className="h-full" style={{ width: '100%', background: z.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick links to shared learning tools */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/lessons"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] hover:border-[#DDB56E]/60 hover:bg-white shadow-card transition-all"
        >
          <Play className="w-5 h-5 text-[#DDB56E] shrink-0" />
          <div>
            <div className="text-sm font-semibold text-[#111814]">Video Lessons</div>
            <div className="text-xs text-[#111814]/60">Watch chapter walkthroughs</div>
          </div>
        </Link>
        <Link
          to="/labs"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] hover:border-[#DDB56E]/60 hover:bg-white shadow-card transition-all"
        >
          <FlaskConical className="w-5 h-5 text-[#DDB56E] shrink-0" />
          <div>
            <div className="text-sm font-semibold text-[#111814]">Virtual Labs</div>
            <div className="text-xs text-[#111814]/60">Run interactive simulations</div>
          </div>
        </Link>
        <Link
          to="/practice"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] hover:border-[#DDB56E]/60 hover:bg-white shadow-card transition-all"
        >
          <ListChecks className="w-5 h-5 text-[#DDB56E] shrink-0" />
          <div>
            <div className="text-sm font-semibold text-[#111814]">Practice Questions</div>
            <div className="text-xs text-[#111814]/60">Sharpen a specific concept</div>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {[
          { id: 'plan' as Tab, label: 'Study Plan' },
          { id: 'mistakes' as Tab, label: 'Mistake Journal' },
          { id: 'heatmap' as Tab, label: 'Mastery Heatmap' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`h-9 px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all cursor-pointer border ${
              tab === t.id ? 'bg-[#1a2421] text-white border-[#1a2421]' : 'bg-white text-[#5a554e] border-[#EDE8DD] hover:border-[#1a2421]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card space-y-3">
            <h3 className="font-semibold text-[#111814] text-sm">Today's Urgent Tasks</h3>
            {(studyPlan?.urgent_tasks.length ?? 0) === 0 ? (
              <p className="text-xs text-[#111814]/50">Nothing urgent — you're all caught up.</p>
            ) : (
              studyPlan!.urgent_tasks.map((task) => (
                <div key={task.id} className="p-3 rounded-xl border border-[#EDE8DD]/70 bg-[#FAF9F5] flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-[#111814]">{task.title}</div>
                    <div className="text-xs text-[#111814]/55">{task.subject}</div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[task.status] ?? STATUS_STYLE.due_soon}`}>
                    {task.due_label}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card space-y-3">
            <h3 className="font-semibold text-[#111814] text-sm">Recommended For You</h3>
            {(studyPlan?.recommended_tasks.length ?? 0) === 0 ? (
              <p className="text-xs text-[#111814]/50">No remedial recommendations right now.</p>
            ) : (
              studyPlan!.recommended_tasks.map((task) => (
                <div key={task.id} className="p-3 rounded-xl border border-[#DDB56E]/30 bg-[#DDB56E]/5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-[#111814]">{task.title}</div>
                    <div className="text-xs text-[#111814]/55">{task.meta}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DDB56E]/20 text-[#8C6D23] border border-[#DDB56E]/40 shrink-0">
                    {task.xp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'mistakes' && (
        <div className="space-y-3">
          {mistakes.length === 0 ? (
            <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-[#EDE8DD] rounded-2xl p-8">
              <CheckCircle2 className="w-10 h-10 text-[#111814]/30 mx-auto mb-2" />
              <p className="text-sm text-[#111814]/60">No mistakes logged yet. Keep practicing!</p>
            </div>
          ) : (
            mistakes.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F8B]">
                      {m.chapter}
                    </span>
                    <span className="text-[11px] text-[#111814]/50">{m.topic}</span>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                      m.status === 'mastered'
                        ? 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-[#111814]'
                        : 'bg-danger/10 border-danger/30 text-danger'
                    }`}
                  >
                    {m.status === 'mastered' ? 'Mastered' : 'Needs Practice'}
                  </span>
                </div>
                <p className="text-sm text-[#111814] font-medium">{m.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-danger/5 border border-danger/20">
                    <span className="text-danger font-semibold">Your answer: </span>
                    <span className="text-[#111814]/70">{m.your_answer}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#7FBF7A]/10 border border-[#7FBF7A]/30">
                    <span className="text-[#111814] font-semibold">Correct answer: </span>
                    <span className="text-[#111814]/70">{m.correct_answer}</span>
                  </div>
                </div>
                {m.solution && <p className="text-xs text-[#111814]/60 italic">{m.solution}</p>}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#111814]/40">{m.date}</span>
                  {m.status === 'needs_practice' && (
                    <button
                      onClick={() => void resolveMistake(m.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1a2421] hover:bg-black text-white cursor-pointer"
                    >
                      Mark Mastered (+20 XP)
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="space-y-5">
          {heatmap.map((subj) => (
            <div key={subj.subject} className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card space-y-3">
              <h3 className="font-semibold text-[#111814] text-sm flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-[#DDB56E]" />
                {subj.subject}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {subj.chapters.map((ch) => (
                  <div
                    key={ch.name}
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
                      LEVEL_STYLE[ch.level] ?? LEVEL_STYLE[1]
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      {ch.name}
                    </span>
                    <span className="font-semibold shrink-0">{ch.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
