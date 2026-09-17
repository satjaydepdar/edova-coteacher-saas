import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Video, PlayCircle } from 'lucide-react'
import { teacherApi, type StudentProfile as Profile, type StudentTopic } from '../../lib/teacherApi'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const statusColor = (status: StudentTopic['status']) =>
  status === 'mastered' ? 'text-emerald-700' : status === 'struggling' ? 'text-[#DC2626]' : 'text-[#B48429]'
const statusBar = (status: StudentTopic['status']) =>
  status === 'mastered' ? 'bg-emerald-600' : status === 'struggling' ? 'bg-[#DC2626]' : 'bg-[#D9A94E]'
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

  const initials = displayName.slice(0, 2).toUpperCase()
  const worstFirst = [...data.topics].sort((a, b) => statusWidth(a.status) - statusWidth(b.status))

  return (
    <div className="min-h-full bg-white text-forest">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-7 space-y-7">
        {/* Navigation Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[13px] font-[Inter]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-[12px] font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>
            <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-[12px] text-[#6B7280]"
            >
              Dashboard
            </Button>
            {sectionName && (
              <>
                <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>
                <Badge variant="secondary" className="text-[12px]">
                  {sectionName}
                </Badge>
              </>
            )}
            <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>
            <Badge variant="default" className="text-[12px] font-semibold">
              {displayName}
            </Badge>
          </div>
          <span className="text-[11px] tracking-widest uppercase text-[#6B7280] font-bold font-[Inter]">
            Student 360 &bull; All Subjects
          </span>
        </div>

        {/* Page Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (col-4) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Student ID Card */}
            <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#D9A94E]/25 text-[#13231F] font-bold text-[20px] grid place-items-center shadow-xs font-[Poppins]">
                {initials}
              </div>
              <h2 className="font-[Poppins] font-bold text-[22px] text-[#13231F] mt-3">
                {displayName}
              </h2>
              {sectionName && (
                <p className="text-[12px] text-[#6B7280] font-[Inter] mt-0.5">{sectionName}</p>
              )}

              <div className="grid grid-cols-3 gap-2 mt-5">
                {data.subjects.map((s) => (
                  <div
                    key={s.subject_name}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-center"
                  >
                    <div className="font-[Poppins] font-bold text-[16px] text-[#13231F]">
                      {s.mastery_pct}%
                    </div>
                    <div className="text-[10px] tracking-widest uppercase text-[#6B7280] font-bold font-[Inter] truncate">
                      {s.subject_name}
                    </div>
                  </div>
                ))}
                <div className="bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl p-2.5 text-center">
                  <div className="font-[Poppins] font-bold text-[16px] text-[#DC2626]">
                    {data.concepts_stuck}
                  </div>
                  <div className="text-[10px] tracking-widest uppercase text-[#DC2626] font-bold font-[Inter]">
                    Stuck
                  </div>
                </div>
              </div>
            </Card>

            {/* Engagement Card */}
            <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5">
              <div className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase mb-3 font-[Inter]">
                Engagement &mdash; This Week
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-2.5">
                  <div className="font-[Poppins] font-bold text-[15px] text-[#13231F]">
                    {formatDuration(data.engagement.time_spent_seconds_week)}
                  </div>
                  <div className="text-[10px] text-[#6B7280] font-[Inter] mt-0.5">Time on task</div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-2.5">
                  <div className="font-[Poppins] font-bold text-[15px] text-[#13231F]">
                    {data.engagement.modules_touched_week}
                  </div>
                  <div className="text-[10px] text-[#6B7280] font-[Inter] mt-0.5">Modules</div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-2.5">
                  <div className="font-[Poppins] font-bold text-[15px] text-[#13231F]">
                    {data.engagement.quiz_attempts_week}
                  </div>
                  <div className="text-[10px] text-[#6B7280] font-[Inter] mt-0.5">Quizzes</div>
                </div>
              </div>
              <div className="text-[11px] text-[#6B7280] font-[Inter] mt-3 text-center">
                Last active: {formatLastActive(data.engagement.last_active)}
              </div>
            </Card>

            {/* Video Explainer Scaffolding (AI Coach Telemetry) */}
            {data.video_scaffolding && (
              <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#13231F]" />
                    <span className="text-[11px] font-bold tracking-widest text-[#13231F] uppercase font-[Inter]">
                      Video Scaffolding
                    </span>
                  </div>
                  {data.video_scaffolding.relies_on_video_hints ? (
                    <Badge variant="warning" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300">
                      Relies on Videos
                    </Badge>
                  ) : (
                    <Badge variant="okf" className="text-[10px]">
                      Independent Solver
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-2.5">
                    <div className="font-[Poppins] font-bold text-[17px] text-[#13231F]">
                      {data.video_scaffolding.total_explainers_requested}
                    </div>
                    <div className="text-[10px] text-[#6B7280] font-[Inter] mt-0.5">Videos Generated</div>
                  </div>
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-2.5">
                    <div className="font-[Poppins] font-bold text-[17px] text-[#13231F]">
                      {data.video_scaffolding.explainers_watched}
                    </div>
                    <div className="text-[10px] text-[#6B7280] font-[Inter] mt-0.5">Watched Before Solving</div>
                  </div>
                </div>

                {data.video_scaffolding.recent_videos && data.video_scaffolding.recent_videos.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold tracking-wider text-[#6B7280] uppercase font-[Inter]">
                      Recent On-Demand Videos
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {data.video_scaffolding.recent_videos.map((v, i) => (
                        <div
                          key={i}
                          className="bg-white border border-[#E5E7EB] rounded-lg p-2 flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <PlayCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-mono text-[10.5px] text-[#13231F] truncate" title={v.file_name || 'video_explainer.mp4'}>
                              {v.file_name || 'video_explainer.mp4'}
                            </span>
                          </div>
                          <span className="text-[9px] font-semibold text-[#6B7280] bg-[#F5F1E6] px-1.5 py-0.5 rounded shrink-0">
                            {v.s3_folder || 'Ondemand videos'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#6B7280] font-[Inter] py-2 text-center bg-white rounded-xl border border-[#E5E7EB]">
                    No video explainers requested. Solves problems directly.
                  </div>
                )}
              </Card>
            )}

            {/* Misconception Pattern */}
            {data.misconception_pattern && (
              <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 border-l-4 border-l-[#D9A94E]">
                <div className="text-[11px] font-bold tracking-widest text-[#B48429] uppercase font-[Inter]">
                  Repeated Misconception Pattern
                </div>
                <div className="text-[13px] text-[#13231F] mt-2 font-[Inter] leading-relaxed">
                  {data.misconception_pattern}
                </div>
              </Card>
            )}

            {/* Suggested Next Steps */}
            {data.suggested_next_steps.length > 0 && (
              <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5">
                <div className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase mb-3 font-[Inter]">
                  Suggested Next Steps
                </div>
                <div className="space-y-2.5">
                  {data.suggested_next_steps.map((step, i) => (
                    <div
                      key={step.concept_id}
                      className="flex items-start gap-2.5 bg-white border border-[#E5E7EB] rounded-xl p-3"
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-white grid place-items-center text-[11px] font-bold shrink-0 mt-0.5 ${
                          i === 0 ? 'bg-[#DC2626]' : 'bg-[#D9A94E]'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-[#13231F] font-[Inter] leading-snug">
                        {step.action}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column (col-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Strengths & Struggling Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 border-l-4 border-l-emerald-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-widest text-emerald-800 uppercase font-[Inter]">
                    Strengths
                  </span>
                  <Badge variant="okf" className="text-[10px]">
                    Mastered
                  </Badge>
                </div>
                <div className="space-y-2">
                  {data.strengths.length === 0 ? (
                    <div className="text-sm text-[#6B7280] font-[Inter] py-2">
                      No concepts mastered yet.
                    </div>
                  ) : (
                    data.strengths.map((t) => (
                      <div
                        key={t.concept_id}
                        className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2"
                      >
                        <span className="text-[13px] font-medium text-[#13231F] font-[Inter]">
                          {t.concept_name}
                        </span>
                        <span className="text-xs text-emerald-700 font-semibold font-[Inter]">
                          Mastered
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 border-l-4 border-l-[#DC2626]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-widest text-[#DC2626] uppercase font-[Inter]">
                    Struggling
                  </span>
                  <Badge variant="danger" className="text-[10px]">
                    Attention
                  </Badge>
                </div>
                <div className="space-y-2">
                  {data.struggling.length === 0 ? (
                    <div className="text-sm text-[#6B7280] font-[Inter] py-2">
                      No concepts flagged right now.
                    </div>
                  ) : (
                    data.struggling.map((t) => (
                      <div
                        key={t.concept_id}
                        className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2"
                      >
                        <span className="text-[13px] font-medium text-[#13231F] font-[Inter]">
                          {t.concept_name}
                        </span>
                        <span className="text-xs text-[#DC2626] font-semibold font-[Inter]">
                          {t.attempts_count} tries
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Every Topic Table */}
            <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5">
              <div className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase mb-4 font-[Inter]">
                Topic Performance &mdash; All Subjects (Worst First)
              </div>
              <div className="space-y-2">
                {worstFirst.map((t) => (
                  <div
                    key={`${t.chapter_id}-${t.concept_id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-xl px-4 py-3 border border-[#E5E7EB]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {t.chapter_title}
                      </Badge>
                      <span className="text-[13px] font-medium text-[#13231F] font-[Inter] truncate">
                        {t.concept_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <span className="text-[11px] text-[#6B7280] font-[Inter]">
                        {t.attempts_count} attempts
                      </span>
                      <div className="w-24 sm:w-36 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${statusBar(t.status)}`}
                          style={{ width: `${statusWidth(t.status)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[12px] font-semibold w-20 text-right font-[Poppins] ${statusColor(
                          t.status
                        )}`}
                      >
                        {statusLabel(t.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
