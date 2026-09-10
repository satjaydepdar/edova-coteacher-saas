import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { teacherApi, type ClassroomHeatmap, type SectionRollup } from '../../lib/teacherApi'

const severityColor = (pct: number) => (pct >= 70 ? 'text-emerald-700' : pct >= 30 ? 'text-gold-dark' : 'text-danger')
const severityBar = (pct: number) => (pct >= 70 ? 'bg-emerald-600' : pct >= 30 ? 'bg-gold' : 'bg-danger')
const severityDot = (pct: number) => (pct >= 70 ? 'bg-emerald-600' : pct >= 30 ? 'bg-gold' : 'bg-danger')

export default function SectionDeepdive() {
  const { sectionId = '', chapterId = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ClassroomHeatmap | null>(null)
  const [rollup, setRollup] = useState<SectionRollup | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    teacherApi.classroomHeatmap(sectionId, chapterId).then(setData).catch(() => setError('Could not load this section.'))
  }, [sectionId, chapterId])

  useEffect(() => {
    teacherApi.sectionRollup(sectionId).then(setRollup).catch(() => {})
  }, [sectionId])

  // Which subjects does this section actually have activity in, and which chapter is
  // "current" for the selected subject -- selecting a subject jumps to its first chapter.
  const subjectOptions = rollup ? [...new Set(rollup.chapters.map((c) => c.subject_name))] : []
  const currentSubject = rollup?.chapters.find((c) => c.chapter_id === chapterId)?.subject_name ?? ''
  const goToSubject = (subjectName: string) => {
    const firstChapter = rollup?.chapters.find((c) => c.subject_name === subjectName)
    if (firstChapter) navigate(`/dashboard/section/${sectionId}/chapter/${firstChapter.chapter_id}`)
  }

  if (error) return <div className="flex items-center justify-center py-24 text-forest">{error}</div>
  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-5 h-5 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    )
  }

  const rosterSize = data.section_roster_size ?? data.total_active_students
  const bottlenecks = data.bottleneck_alerts

  // intervention_queue has one row PER STUCK CONCEPT, so one student can appear
  // several times -- collapse to one row per student (worst concept first),
  // carrying how many distinct concepts they're stuck on.
  const byStudent = new Map<string, { topicsCount: number; worst: (typeof data.intervention_queue)[number] }>()
  for (const s of data.intervention_queue) {
    const existing = byStudent.get(s.student_id)
    if (!existing) {
      byStudent.set(s.student_id, { topicsCount: 1, worst: s })
    } else {
      existing.topicsCount += 1
      if (s.attempts_count > existing.worst.attempts_count) existing.worst = s
    }
  }
  const strugglingStudents = [...byStudent.entries()]
    .map(([studentId, v]) => ({ studentId, topicsCount: v.topicsCount, ...v.worst }))
    .sort((a, b) => b.attempts_count - a.attempts_count)

  return (
    <div className="bg-[#FAF9F5] text-forest min-h-full">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-cream-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate('/dashboard')} className="text-[11px] bg-cream border border-cream-border rounded-full px-3 py-1">
              All Sections
            </button>
            <span className="text-forest/30">&rsaquo;</span>
            <span className="text-[11px] bg-forest text-white rounded-full px-3 py-1">{data.classroom_name}</span>
            <span className="text-[11px] bg-cream border border-cream-border rounded-full px-3 py-1 ml-2">{data.chapter_title}</span>
          </div>
          <div className="flex items-center gap-3">
            {subjectOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold">Subject</label>
                <select
                  value={currentSubject}
                  onChange={(e) => goToSubject(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-cream border border-cream-border text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
                >
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            <span className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold">
              Level 2 of 3 &middot; click a student to open their profile
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-cream-card border border-cream-border rounded-2xl p-5">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-1">Mastery</div>
            <div className="font-display font-bold text-[34px] leading-none">{data.overall_chapter_mastery}%</div>
          </div>
          <div className="bg-cream-card border border-cream-border rounded-2xl p-5">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-1">Active Students</div>
            <div className="font-display font-bold text-[34px] leading-none">{data.total_active_students}</div>
            <div className="text-[11px] text-forest/50 mt-2">{data.total_active_students}/{rosterSize} touched {data.chapter_title}</div>
          </div>
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-5">
            <div className="text-[10px] tracking-[0.1em] uppercase text-danger/70 font-semibold mb-1">Concepts Flagged</div>
            <div className="font-display font-bold text-[34px] leading-none text-danger">{bottlenecks.length}</div>
          </div>
          <div className="bg-gold/10 border border-gold/25 rounded-2xl p-5">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-1">Need Intervention</div>
            <div className="font-display font-bold text-[30px] leading-none">{data.intervention_queue.length} students</div>
          </div>
        </div>

        {/* Bottlenecks */}
        <div>
          <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-3">
            Bottlenecks &mdash; {data.classroom_name} &middot; {data.chapter_title}
          </div>
          {bottlenecks.length === 0 ? (
            <div className="text-sm text-forest/50">No bottlenecks &mdash; nothing crossed the struggling threshold.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {bottlenecks.map((b) => (
                <div key={b.concept_id} className={`bg-white border border-cream-border rounded-2xl p-5 border-l-[4px] ${b.severity === 'HIGH' ? 'border-l-danger' : 'border-l-gold'} shadow-card`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-[16px]">{b.concept_name}</div>
                      <div className={`text-[12px] mt-1 ${b.severity === 'HIGH' ? 'text-danger' : 'text-forest/60'}`}>
                        {b.struggling_percentage}% struggling &middot; {b.affected_students_count} students
                      </div>
                    </div>
                    <span className={`text-[10px] rounded-full px-2.5 py-1 border ${b.severity === 'HIGH' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-gold/10 border-gold/30 text-gold-dark'}`}>
                      {b.severity === 'HIGH' ? 'Critical' : 'Watch'}
                    </span>
                  </div>
                  <div className="mt-3 bg-cream rounded-xl px-3 py-2.5">
                    <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold">Top confusion &mdash; Ask:</div>
                    <div className="text-[12px] mt-1 italic">&ldquo;{b.teacher_action_hint}&rdquo;</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 bg-cream-card border border-cream-border rounded-[20px] p-6">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-5">
              Topics &mdash; {data.chapter_title} &middot; {data.classroom_name}
            </div>
            <div className="space-y-3">
              {data.concept_heatmaps.map((c) => (
                <div key={c.concept_id} className="flex items-center justify-between bg-white border border-cream-border rounded-full px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${severityDot(c.mastery_percentage)}`} />
                    <span className="text-[14px] font-medium">{c.concept_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-forest/50">{c.total_students_engaged} eng.</span>
                    <div className="w-[180px] h-2 bg-cream-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${severityBar(c.mastery_percentage)}`} style={{ width: `${c.mastery_percentage}%` }} />
                    </div>
                    <span className={`text-[13px] font-medium w-10 text-right ${severityColor(c.mastery_percentage)}`}>{c.mastery_percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-4 bg-white border border-cream-border rounded-[20px] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold">
                Students Needing Help &mdash; click to open profile
              </span>
              {strugglingStudents.length > 0 && (
                <span className="w-5 h-5 bg-danger text-white rounded-full grid place-items-center text-[10px]">{strugglingStudents.length}</span>
              )}
            </div>
            {strugglingStudents.length === 0 ? (
              <div className="text-sm text-forest/50">No students currently need help here.</div>
            ) : (
              <div className="space-y-3">
                {strugglingStudents.map((s) => (
                  <button
                    key={s.studentId}
                    onClick={() =>
                      navigate(
                        `/dashboard/student/${s.studentId}?name=${encodeURIComponent(s.student_name)}&section=${encodeURIComponent(data.classroom_name)}`
                      )
                    }
                    className="w-full flex items-center gap-3 bg-cream border border-cream-border rounded-2xl p-3 hover:bg-white hover:shadow-card transition text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gold/30 grid place-items-center text-[12px] font-bold">
                      {s.student_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold flex items-center gap-2">
                        {s.student_name}
                        {s.topicsCount > 1 && (
                          <span className="text-[9px] bg-white border border-cream-border rounded-full px-1.5 py-0.5 text-forest/60">
                            {s.topicsCount} topics
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-forest/50 truncate">{s.stuck_concept_name} &middot; {s.attempts_count} tries</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-forest/30 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
