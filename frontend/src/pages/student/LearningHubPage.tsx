import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Flame,
  Trophy,
  Clock,
  AlertTriangle,
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
  1: 'bg-gold/15 border-gold/40 text-[#8C6D23]',
  2: 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-forest',
}

const STATUS_STYLE: Record<string, string> = {
  overdue: 'bg-danger/15 border-danger/40 text-danger',
  due_today: 'bg-gold/15 border-gold/40 text-[#8C6D23]',
  due_soon: 'bg-forest/5 border-cream-border text-forest/70',
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-forest flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-forest/5 text-forest border border-cream-border">
            <Sparkles className="w-6 h-6 text-gold" />
          </span>
          Learning Hub
        </h1>
        <p className="text-sm text-forest/65 mt-1">
          Your daily study plan, mistake journal, and mastery progress.
        </p>
      </div>

      {/* Study Plan Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center text-[#8C6D23] border border-gold/30 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-forest/60 font-medium">Experience Points</div>
            <div className="text-xl font-bold text-forest">{studyPlan?.xp ?? '—'} XP</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-forest/5 flex items-center justify-center text-forest border border-cream-border shrink-0">
            <Flame className="w-5 h-5 text-danger" />
          </div>
          <div>
            <div className="text-xs text-forest/60 font-medium">Daily Streak</div>
            <div className="text-xl font-bold text-forest">{studyPlan?.streak_days ?? '—'} days</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-forest/5 flex items-center justify-center text-forest border border-cream-border shrink-0">
            <Clock className="w-5 h-5 text-forest" />
          </div>
          <div>
            <div className="text-xs text-forest/60 font-medium">Urgent Tasks</div>
            <div className="text-xl font-bold text-forest">{studyPlan?.urgent_tasks.length ?? 0}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-danger/10 flex items-center justify-center text-danger border border-danger/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-forest/60 font-medium">Needs Practice</div>
            <div className="text-xl font-bold text-forest">{needsPractice.length}</div>
          </div>
        </div>
      </div>

      {/* Quick links to shared learning tools */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/lessons"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border hover:border-gold/60 hover:bg-white shadow-card transition-all"
        >
          <Play className="w-5 h-5 text-gold shrink-0" />
          <div>
            <div className="text-sm font-semibold text-forest">Video Lessons</div>
            <div className="text-xs text-forest/60">Watch chapter walkthroughs</div>
          </div>
        </Link>
        <Link
          to="/labs"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border hover:border-gold/60 hover:bg-white shadow-card transition-all"
        >
          <FlaskConical className="w-5 h-5 text-gold shrink-0" />
          <div>
            <div className="text-sm font-semibold text-forest">Virtual Labs</div>
            <div className="text-xs text-forest/60">Run interactive simulations</div>
          </div>
        </Link>
        <Link
          to="/practice"
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border hover:border-gold/60 hover:bg-white shadow-card transition-all"
        >
          <ListChecks className="w-5 h-5 text-gold shrink-0" />
          <div>
            <div className="text-sm font-semibold text-forest">Practice Questions</div>
            <div className="text-xs text-forest/60">Sharpen a specific concept</div>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F5F1E6] w-fit">
        {[
          { id: 'plan' as Tab, label: 'Study Plan' },
          { id: 'mistakes' as Tab, label: 'Mistake Journal' },
          { id: 'heatmap' as Tab, label: 'Mastery Heatmap' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === t.id ? 'bg-forest text-cream shadow-xs' : 'text-forest/60 hover:text-forest'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-3">
            <h3 className="font-semibold text-forest text-sm">Today's Urgent Tasks</h3>
            {(studyPlan?.urgent_tasks.length ?? 0) === 0 ? (
              <p className="text-xs text-forest/50">Nothing urgent — you're all caught up.</p>
            ) : (
              studyPlan!.urgent_tasks.map((task) => (
                <div key={task.id} className="p-3 rounded-xl border border-cream-border/70 bg-[#FAF9F5] flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-forest">{task.title}</div>
                    <div className="text-xs text-forest/55">{task.subject}</div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[task.status] ?? STATUS_STYLE.due_soon}`}>
                    {task.due_label}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-3">
            <h3 className="font-semibold text-forest text-sm">Recommended For You</h3>
            {(studyPlan?.recommended_tasks.length ?? 0) === 0 ? (
              <p className="text-xs text-forest/50">No remedial recommendations right now.</p>
            ) : (
              studyPlan!.recommended_tasks.map((task) => (
                <div key={task.id} className="p-3 rounded-xl border border-gold/30 bg-gold/5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-forest">{task.title}</div>
                    <div className="text-xs text-forest/55">{task.meta}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gold/20 text-[#8C6D23] border border-gold/40 shrink-0">
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
            <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-cream-border rounded-2xl p-8">
              <CheckCircle2 className="w-10 h-10 text-forest/30 mx-auto mb-2" />
              <p className="text-sm text-forest/60">No mistakes logged yet. Keep practicing!</p>
            </div>
          ) : (
            mistakes.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest/5 text-forest border border-cream-border">
                      {m.chapter}
                    </span>
                    <span className="text-[11px] text-forest/50">{m.topic}</span>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                      m.status === 'mastered'
                        ? 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-forest'
                        : 'bg-danger/10 border-danger/30 text-danger'
                    }`}
                  >
                    {m.status === 'mastered' ? 'Mastered' : 'Needs Practice'}
                  </span>
                </div>
                <p className="text-sm text-forest font-medium">{m.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-danger/5 border border-danger/20">
                    <span className="text-danger font-semibold">Your answer: </span>
                    <span className="text-forest/70">{m.your_answer}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#7FBF7A]/10 border border-[#7FBF7A]/30">
                    <span className="text-forest font-semibold">Correct answer: </span>
                    <span className="text-forest/70">{m.correct_answer}</span>
                  </div>
                </div>
                {m.solution && <p className="text-xs text-forest/60 italic">{m.solution}</p>}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-forest/40">{m.date}</span>
                  {m.status === 'needs_practice' && (
                    <button
                      onClick={() => void resolveMistake(m.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-raised text-cream cursor-pointer"
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
            <div key={subj.subject} className="p-5 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-3">
              <h3 className="font-semibold text-forest text-sm flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-gold" />
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
