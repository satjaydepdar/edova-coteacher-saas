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
  0: 'bg-[#F2D5D5] text-[#9B4A4A]',
  1: 'bg-[#E8E0D5] text-[#6B5D4F]',
  2: 'bg-[#E3ECE1] text-[#121A16]',
}

const STATUS_STYLE: Record<string, string> = {
  overdue: 'bg-[#F2D5D5] text-[#9B4A4A]',
  due_today: 'bg-[#E8E0D5] text-[#6B5D4F]',
  due_soon: 'bg-[#E8E0D5] text-[#6B5D4F]',
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
    <div className="min-h-full bg-[#FDFBF6] px-5 lg:px-10 py-6 lg:py-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[22px] lg:text-[26px] tracking-[-0.02em] font-medium text-[#121A16]">
          Learning Hub
        </h1>
        <p className="text-[13px] text-[#6B7B6F] mt-1">
          Your daily study plan, mistake journal, and mastery progress.
        </p>
      </div>

      {/* Study Plan Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Experience Points', value: `${studyPlan?.xp ?? '—'} XP`, sub: 'Total earned', top: '#8BA888', accent: '#E8C9A0' },
          { label: 'Daily Streak', value: `${studyPlan?.streak_days ?? '—'}`, sub: 'Days in a row', top: '#7A9DB8', accent: '#C48A7A' },
          { label: 'Urgent Tasks', value: studyPlan?.urgent_tasks.length ?? 0, sub: 'Need attention', top: '#C48A7A', accent: '#121A16' },
          { label: 'Needs Practice', value: needsPractice.length, sub: 'Unresolved mistakes', top: '#9B8FB4', accent: '#D9A89A' },
        ].map((z) => (
          <div
            key={z.label}
            className="relative rounded-[14px] bg-[#FEFEFB] border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-3.5 pt-4 overflow-hidden"
            style={{ borderTop: `6px solid ${z.top}` }}
          >
            <div className="font-mono text-[9.5px] tracking-[0.08em] text-[#6B7B6F] leading-tight mb-1.5 uppercase">{z.label}</div>
            <div className="font-serif text-[22px] font-medium leading-none tracking-[-0.02em] mb-1 text-[#121A16]">{z.value}</div>
            <div className="font-mono text-[10px] text-[#8A8F8B]">{z.sub}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: z.accent }} />
          </div>
        ))}
      </div>

      {/* Quick links to shared learning tools */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/lessons"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#B8CDB5] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:brightness-[0.97] transition-all"
        >
          <Play className="w-5 h-5 text-[#121A16] shrink-0" />
          <div>
            <div className="text-sm font-semibold text-[#121A16]">Video Lessons</div>
            <div className="text-xs text-[#121A16]/70">Watch chapter walkthroughs</div>
          </div>
        </Link>
        <Link
          to="/labs"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#D9A89A] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:brightness-[0.97] transition-all"
        >
          <FlaskConical className="w-5 h-5 text-[#121A16] shrink-0" />
          <div>
            <div className="text-sm font-semibold text-[#121A16]">Virtual Labs</div>
            <div className="text-xs text-[#121A16]/70">Run interactive simulations</div>
          </div>
        </Link>
        <Link
          to="/practice"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#B8B2CD] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:brightness-[0.97] transition-all"
        >
          <ListChecks className="w-5 h-5 text-[#121A16] shrink-0" />
          <div>
            <div className="text-sm font-semibold text-[#121A16]">Practice Questions</div>
            <div className="text-xs text-[#121A16]/70">Sharpen a specific concept</div>
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
              tab === t.id ? 'bg-[#121A16] text-white border-[#121A16]' : 'bg-white text-[#6B5D4F] border-black/5 hover:border-[#121A16]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#FDFCF8] border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-3 bg-[#E8E0D5]">
              <h3 className="font-semibold text-[#121A16] text-sm">Today's Urgent Tasks</h3>
            </div>
            <div className="p-5 space-y-3">
              {(studyPlan?.urgent_tasks.length ?? 0) === 0 ? (
                <p className="text-xs text-[#6B7B6F]">Nothing urgent — you're all caught up.</p>
              ) : (
                studyPlan!.urgent_tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-xl bg-[#F9F6F1] flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#121A16]">{task.title}</div>
                      <div className="text-xs text-[#6B7B6F]">{task.subject}</div>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[task.status] ?? STATUS_STYLE.due_soon}`}>
                      {task.due_label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-[#FDFCF8] border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-3 bg-[#E0DAE8]">
              <h3 className="font-semibold text-[#121A16] text-sm">Recommended For You</h3>
            </div>
            <div className="p-5 space-y-3">
              {(studyPlan?.recommended_tasks.length ?? 0) === 0 ? (
                <p className="text-xs text-[#6B7B6F]">No remedial recommendations right now.</p>
              ) : (
                studyPlan!.recommended_tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-xl bg-[#F9F6F1] flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#121A16]">{task.title}</div>
                      <div className="text-xs text-[#6B7B6F]">{task.meta}</div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E0DAE8] text-[#5B4F73] shrink-0">
                      {task.xp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'mistakes' && (
        <div className="space-y-3">
          {mistakes.length === 0 ? (
            <div className="py-16 text-center bg-[#FDFCF8] border border-dashed border-black/10 rounded-2xl p-8">
              <CheckCircle2 className="w-10 h-10 text-[#121A16]/30 mx-auto mb-2" />
              <p className="text-sm text-[#6B7B6F]">No mistakes logged yet. Keep practicing!</p>
            </div>
          ) : (
            mistakes.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-[#FDFCF8] border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B7B6F]">
                      {m.chapter}
                    </span>
                    <span className="text-[11px] text-[#121A16]/50">{m.topic}</span>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      m.status === 'mastered' ? 'bg-[#E3ECE1] text-[#121A16]' : 'bg-[#F2D5D5] text-[#9B4A4A]'
                    }`}
                  >
                    {m.status === 'mastered' ? 'Mastered' : 'Needs Practice'}
                  </span>
                </div>
                <p className="text-sm text-[#121A16] font-medium">{m.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#F2D5D5]/40">
                    <span className="text-[#9B4A4A] font-semibold">Your answer: </span>
                    <span className="text-[#121A16]/70">{m.your_answer}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#E3ECE1]/60">
                    <span className="text-[#121A16] font-semibold">Correct answer: </span>
                    <span className="text-[#121A16]/70">{m.correct_answer}</span>
                  </div>
                </div>
                {m.solution && <p className="text-xs text-[#6B7B6F] italic">{m.solution}</p>}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#121A16]/40">{m.date}</span>
                  {m.status === 'needs_practice' && (
                    <button
                      onClick={() => void resolveMistake(m.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#121A16] hover:bg-black text-white cursor-pointer"
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
            <div key={subj.subject} className="p-5 rounded-2xl bg-[#FDFCF8] border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-3">
              <h3 className="font-semibold text-[#121A16] text-sm flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-[#9B8FB4]" />
                {subj.subject}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {subj.chapters.map((ch) => (
                  <div
                    key={ch.name}
                    className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
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
