import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { teacherApi, type StudentProfile as Profile, type StudentTopic } from '../../lib/teacherApi'

const statusColor = (status: StudentTopic['status']) =>
  status === 'mastered' ? 'text-emerald-700' : status === 'struggling' ? 'text-danger' : 'text-gold-dark'
const statusBar = (status: StudentTopic['status']) =>
  status === 'mastered' ? 'bg-emerald-600' : status === 'struggling' ? 'bg-danger' : 'bg-gold'
const statusWidth = (status: StudentTopic['status']) => (status === 'mastered' ? 100 : status === 'attempted' ? 45 : 20)
const statusLabel = (status: StudentTopic['status']) =>
  status === 'mastered' ? 'Mastered' : status === 'struggling' ? 'Struggling' : 'In progress'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0 && m === 0) return '0m'
  return `${h > 0 ? `${h}h ` : ''}${m}m`
}

function formatLastActive(iso: string | null): string {
  if (!iso) return 'No recent activity'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  return `${Math.round(hrs / 24)} day(s) ago`
}

export default function StudentProfile() {
  const { studentId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const displayName = params.get('name') || studentId
  const sectionName = params.get('section')

  useEffect(() => {
    teacherApi.studentProfile(studentId).then(setData).catch(() => setError('Could not load this student.'))
  }, [studentId])

  if (error) return <div className="flex items-center justify-center py-24 text-forest">{error}</div>
  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-5 h-5 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    )
  }

  const initials = displayName.slice(0, 2).toUpperCase()
  const worstFirst = [...data.topics].sort((a, b) => statusWidth(a.status) - statusWidth(b.status))

  return (
    <div className="bg-[#FAF9F5] text-forest min-h-full">
      <div className="max-w-[1400px] mx-auto px-6 py-4 border-b border-cream-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px]">
          <button onClick={() => navigate('/dashboard')} className="bg-cream border border-cream-border rounded-full px-3 py-1">
            All Sections
          </button>
          {sectionName && (
            <>
              <span className="text-forest/30">&rsaquo;</span>
              <span className="bg-cream border border-cream-border rounded-full px-3 py-1">{sectionName}</span>
            </>
          )}
          <span className="text-forest/30">&rsaquo;</span>
          <span className="bg-forest text-white rounded-full px-3 py-1">{displayName}</span>
        </div>
        <span className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold">
          Student 360 &middot; all subjects, all activity
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="bg-cream-card border border-cream-border rounded-[20px] p-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gold/30 grid place-items-center font-bold">{initials}</div>
            <div className="font-display font-semibold text-[20px] mt-3">{displayName}</div>
            {sectionName && <div className="text-[11px] text-forest/50">{sectionName}</div>}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {data.subjects.map((s) => (
                <div key={s.subject_name} className="bg-white border border-cream-border rounded-xl py-2">
                  <div className="text-[14px] font-bold">{s.mastery_pct}%</div>
                  <div className="text-[9px] tracking-[0.1em] uppercase text-forest/40 font-semibold">{s.subject_name}</div>
                </div>
              ))}
              <div className="bg-danger/10 border border-danger/20 rounded-xl py-2">
                <div className="text-[14px] font-bold text-danger">{data.concepts_stuck}</div>
                <div className="text-[9px] tracking-[0.1em] uppercase text-forest/40 font-semibold">Stuck</div>
              </div>
            </div>
          </div>

          <div className="bg-cream-card border border-cream-border rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-2">Engagement &mdash; This Week</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="font-bold">{formatDuration(data.engagement.time_spent_seconds_week)}</div>
                <div className="text-[10px] text-forest/50">Time on task</div>
              </div>
              <div>
                <div className="font-bold">{data.engagement.modules_touched_week}</div>
                <div className="text-[10px] text-forest/50">Modules touched</div>
              </div>
              <div>
                <div className="font-bold">{data.engagement.quiz_attempts_week}</div>
                <div className="text-[10px] text-forest/50">Quiz attempts</div>
              </div>
            </div>
            <div className="text-[11px] text-forest/50 mt-2">Last active: {formatLastActive(data.engagement.last_active)}</div>
          </div>

          {data.misconception_pattern && (
            <div className="bg-gold/10 border border-gold/25 rounded-2xl p-4">
              <div className="text-[10px] tracking-[0.1em] uppercase text-gold-dark font-semibold">Repeated Pattern</div>
              <div className="text-[13px] mt-2 leading-snug">{data.misconception_pattern}</div>
            </div>
          )}

          {data.suggested_next_steps.length > 0 && (
            <div className="bg-white border border-cream-border rounded-2xl p-4">
              <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-3">Suggested Next Steps</div>
              <div className="space-y-3">
                {data.suggested_next_steps.map((step, i) => (
                  <div key={step.concept_id} className="flex gap-2">
                    <span className={`w-5 h-5 rounded-full text-white grid place-items-center text-[11px] shrink-0 ${i === 0 ? 'bg-danger' : 'bg-gold'}`}>
                      {i + 1}
                    </span>
                    <span className="text-[12px]">{step.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="text-[10px] tracking-[0.1em] uppercase text-emerald-800 font-semibold">Strengths</div>
              <div className="mt-2 space-y-1 text-[13px]">
                {data.strengths.length === 0 ? (
                  <div className="text-forest/40">Nothing mastered yet.</div>
                ) : (
                  data.strengths.map((t) => (
                    <div key={t.concept_id} className="flex justify-between">
                      <span>{t.concept_name}</span>
                      <span className="text-emerald-700 font-medium">Mastered</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4">
              <div className="text-[10px] tracking-[0.1em] uppercase text-danger/80 font-semibold">Struggling</div>
              <div className="mt-2 space-y-1 text-[13px]">
                {data.struggling.length === 0 ? (
                  <div className="text-forest/40">Nothing flagged right now.</div>
                ) : (
                  data.struggling.map((t) => (
                    <div key={t.concept_id} className="flex justify-between">
                      <span>{t.concept_name}</span>
                      <span className="text-danger">{t.attempts_count} tries</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-cream-card border border-cream-border rounded-[20px] p-5">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-4">
              Every Topic &mdash; All Subjects &middot; Worst First
            </div>
            <div className="space-y-1">
              {worstFirst.map((t) => (
                <div key={`${t.chapter_id}-${t.concept_id}`} className="flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-cream-border">
                  <span className="text-[11px] text-forest/50 w-28">{t.chapter_title}</span>
                  <span className="text-[13px] font-medium flex-1">{t.concept_name}</span>
                  <span className="text-[11px] text-forest/50">{t.attempts_count} tries</span>
                  <div className="w-[180px] h-2 bg-cream-border rounded-full mx-3">
                    <div className={`h-full rounded-full ${statusBar(t.status)}`} style={{ width: `${statusWidth(t.status)}%` }} />
                  </div>
                  <span className={`text-[12px] w-24 text-right ${statusColor(t.status)}`}>{statusLabel(t.status)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
