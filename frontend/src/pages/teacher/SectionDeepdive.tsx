import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { teacherApi, type ClassroomHeatmap, type SectionRollup } from '../../lib/teacherApi'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const severityColor = (pct: number) =>
  pct >= 70 ? 'text-emerald-700' : pct >= 30 ? 'text-[#B48429]' : 'text-[#DC2626]'
const severityBar = (pct: number) =>
  pct >= 70 ? 'bg-emerald-600' : pct >= 30 ? 'bg-[#D9A94E]' : 'bg-[#DC2626]'
const severityDot = (pct: number) =>
  pct >= 70 ? 'bg-emerald-600' : pct >= 30 ? 'bg-[#D9A94E]' : 'bg-[#DC2626]'

export default function SectionDeepdive() {
  const { sectionId = '', chapterId = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ClassroomHeatmap | null>(null)
  const [rollup, setRollup] = useState<SectionRollup | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    teacherApi
      .classroomHeatmap(sectionId, chapterId)
      .then(setData)
      .catch(() => setError('Could not load this section.'))
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
        <p className="text-sm text-forest/70 mb-4">{error}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>
    )
  }
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
    <div className="min-h-full bg-white text-forest">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-7 space-y-7">
        {/* Navigation & Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[13px] font-[Inter]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-[12px] font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>All Sections</span>
            </Button>
            <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>
            <Badge variant="default" className="text-[12px] font-semibold px-2.5 py-1">
              {data.classroom_name}
            </Badge>
            <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>
            <Badge variant="secondary" className="text-[12px] px-2.5 py-1 font-medium">
              {data.chapter_title}
            </Badge>
          </div>

          {subjectOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] tracking-widest uppercase text-[#6B7280] font-bold font-[Inter]">
                Subject
              </label>
              <div className="relative">
                <select
                  value={currentSubject}
                  onChange={(e) => goToSubject(e.target.value)}
                  className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
                >
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
              </div>
            </div>
          )}
        </div>

        {/* Page Title */}
        <div>
          <h1 className="font-[Poppins] font-bold text-[24px] text-[#13231F]">
            {data.classroom_name} &mdash; {data.chapter_title}
          </h1>
          <p className="text-[13px] text-[#6B7280] font-[Inter] mt-1">
            Section Drilldown &bull; Click a student row to inspect their 360 profile
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-4 gap-6 mt-6">
          {/* Card 1: Chapter Mastery */}
          <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-[#6B7280] font-[Inter]">
                CHAPTER MASTERY
              </p>
            </div>
            <p className="font-[Poppins] font-bold text-[32px] leading-none text-[#13231F]">
              {data.overall_chapter_mastery}%
            </p>
            <p className="text-[12px] text-[#6B7280] font-[Inter]">Section average</p>
          </Card>

          {/* Card 2: Active Students */}
          <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-[#6B7280] font-[Inter]">
                ACTIVE STUDENTS
              </p>
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            </div>
            <p className="font-[Poppins] font-bold text-[32px] leading-none text-[#13231F]">
              {data.total_active_students}
            </p>
            <p className="text-[12px] text-[#6B7280] font-[Inter]">
              {data.total_active_students}/{rosterSize} touched chapter
            </p>
          </Card>

          {/* Card 3 - Alert: Concepts Flagged */}
          <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 flex flex-col gap-2 border-l-4 border-l-[#DC2626]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-[#6B7280] font-[Inter]">
                CONCEPTS FLAGGED
              </p>
              <Badge variant="danger" className="h-5 px-2 text-[10px] font-bold rounded-full">
                Alert
              </Badge>
            </div>
            <p className="font-[Poppins] font-bold text-[32px] leading-none text-[#DC2626]">
              {bottlenecks.length}
            </p>
            <p className="text-[12px] text-[#6B7280] font-[Inter]">Bottlenecks identified</p>
          </Card>

          {/* Card 4 - Action: Need Intervention */}
          <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 flex flex-col gap-2 border-l-4 border-l-[#D9A94E]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-[#6B7280] font-[Inter]">
                NEED INTERVENTION
              </p>
              <Badge variant="warning" className="h-5 px-2 text-[10px] font-bold rounded-full">
                Action
              </Badge>
            </div>
            <p className="font-[Poppins] font-bold text-[28px] leading-none text-[#13231F]">
              {data.intervention_queue.length} students
            </p>
            <p className="text-[12px] text-[#6B7280] font-[Inter]">Immediate support</p>
          </Card>
        </div>

        {/* Bottlenecks Section */}
        <div>
          <div className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase mb-3 font-[Inter]">
            Bottlenecks &mdash; {data.classroom_name} &middot; {data.chapter_title}
          </div>
          {bottlenecks.length === 0 ? (
            <Card className="bg-[#F5F1E6] border-dashed border-[#E5E7EB] p-8 text-center rounded-[12px]">
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-[Poppins] font-semibold text-[16px] text-[#13231F]">
                No bottlenecks found
              </p>
              <p className="text-[13px] text-[#6B7280] font-[Inter] mt-1">
                All topics in this chapter are above the struggling threshold.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bottlenecks.map((b) => (
                <Card
                  key={b.concept_id}
                  className={`bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 border-l-4 ${
                    b.severity === 'HIGH' ? 'border-l-[#DC2626]' : 'border-l-[#D9A94E]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-[Poppins] font-semibold text-[16px] text-[#13231F]">
                        {b.concept_name}
                      </div>
                      <div
                        className={`text-[12px] mt-1 font-[Inter] ${
                          b.severity === 'HIGH' ? 'text-[#DC2626] font-semibold' : 'text-[#6B7280]'
                        }`}
                      >
                        {b.struggling_percentage}% struggling &bull; {b.affected_students_count} students
                      </div>
                    </div>
                    <Badge variant={b.severity === 'HIGH' ? 'danger' : 'warning'}>
                      {b.severity === 'HIGH' ? 'Critical' : 'Watch'}
                    </Badge>
                  </div>
                  <div className="mt-3 bg-white rounded-xl p-3 border border-[#E5E7EB]">
                    <div className="text-[10px] tracking-widest uppercase text-[#6B7280] font-bold font-[Inter]">
                      Top confusion &mdash; Ask:
                    </div>
                    <div className="text-[13px] mt-1 italic text-[#13231F] font-[Inter]">
                      &ldquo;{b.teacher_action_hint}&rdquo;
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Main Grid: Topics Heatmap (col-8) & Students Needing Help (col-4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5">
            <div className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase mb-4 font-[Inter]">
              Topics &mdash; {data.chapter_title} &middot; {data.classroom_name}
            </div>
            <div className="space-y-2">
              {data.concept_heatmaps.map((c) => (
                <div
                  key={c.concept_id}
                  className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${severityDot(c.mastery_percentage)} shrink-0`} />
                    <span className="text-[14px] font-medium text-[#13231F] font-[Inter] truncate">
                      {c.concept_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[12px] text-[#6B7280] font-[Inter]">
                      {c.total_students_engaged} engaged
                    </span>
                    <div className="w-32 sm:w-44 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${severityBar(c.mastery_percentage)}`}
                        style={{ width: `${c.mastery_percentage}%` }}
                      />
                    </div>
                    <span
                      className={`text-[13px] font-semibold w-10 text-right font-[Poppins] ${severityColor(
                        c.mastery_percentage
                      )}`}
                    >
                      {c.mastery_percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-4 bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase font-[Inter]">
                Students Needing Help
              </span>
              {strugglingStudents.length > 0 && (
                <Badge variant="danger" className="text-[10px] font-bold">
                  {strugglingStudents.length}
                </Badge>
              )}
            </div>
            {strugglingStudents.length === 0 ? (
              <div className="text-sm text-[#6B7280] font-[Inter] py-6 text-center">
                No students currently need intervention in this section.
              </div>
            ) : (
              <div className="space-y-2">
                {strugglingStudents.map((s) => (
                  <button
                    key={s.studentId}
                    onClick={() =>
                      navigate(
                        `/dashboard/student/${s.studentId}?name=${encodeURIComponent(
                          s.student_name
                        )}&section=${encodeURIComponent(data.classroom_name)}`
                      )
                    }
                    className="w-full flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl p-3 hover:border-[#D9A94E]/50 hover:shadow-xs transition text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#D9A94E]/20 text-[#13231F] font-bold text-[12px] grid place-items-center shrink-0">
                      {s.student_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 font-[Inter]">
                      <div className="text-[13px] font-semibold text-[#13231F] flex items-center gap-2">
                        <span className="truncate">{s.student_name}</span>
                        {s.topicsCount > 1 && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {s.topicsCount} topics
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6B7280] truncate mt-0.5">
                        {s.stuck_concept_name} &bull; {s.attempts_count} tries
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
