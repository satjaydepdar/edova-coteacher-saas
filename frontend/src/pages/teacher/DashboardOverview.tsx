import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useWorkspace } from '../../components/Shell'
import { teacherApi, type DashboardOverview as Overview } from '../../lib/teacherApi'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const severityColor = (pct: number) =>
  pct >= 70 ? 'text-emerald-700' : pct >= 50 ? 'text-[#B48429]' : 'text-[#DC2626]'
const severityBar = (pct: number) =>
  pct >= 70 ? 'bg-emerald-600' : pct >= 50 ? 'bg-[#D9A94E]' : 'bg-[#DC2626]'
const severityBorder = (pct: number) =>
  pct >= 70 ? 'border-l-emerald-600' : pct >= 50 ? 'border-l-[#D9A94E]' : 'border-l-[#DC2626]'

export default function DashboardOverview() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const { classFilter, chapterId } = useWorkspace()
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    teacherApi
      .overview()
      .then(setData)
      .catch((err) => {
        if (err?.status === 401 || err?.status === 403) {
          logout()
          navigate('/login', { replace: true })
        } else {
          setError('Could not load the dashboard. Session may be expired or server unavailable.')
        }
      })
  }, [logout, navigate])

  const filteredSections = data
    ? data.sections.filter((s) => classFilter === 'ALL' || s.grade === classFilter)
    : []

  const filteredChapters = data
    ? data.chapters.filter((c) => chapterId === 'ALL' || c.chapter_id === chapterId)
    : []

  const goToSection = (sectionId: string) => {
    const targetChapterId = chapterId !== 'ALL' ? chapterId : data?.chapters[0]?.chapter_id
    if (targetChapterId) navigate(`/dashboard/section/${sectionId}/chapter/${targetChapterId}`)
  }
  const goToChapter = (cId: string) => {
    const sectionId = filteredSections[0]?.id ?? data?.sections[0]?.id
    if (sectionId) navigate(`/dashboard/section/${sectionId}/chapter/${cId}`)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-4">
          <LogOut className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-forest mb-2">Teacher Session Notice</h2>
        <p className="text-sm text-forest/70 mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="px-4 py-2.5 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-forest-raised transition-colors"
          >
            Return to Sign In
          </button>
        </div>
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

  return (
    <div className="min-h-full bg-white text-forest">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-7 space-y-8">
        <h1 className="font-[Poppins] font-bold text-[24px] text-[#13231F]">
          Student Performance Dashboard
        </h1>

        {/* Replace your 4 cards grid with this */}
        <div className="grid grid-cols-4 gap-6 mt-6">
          {/* Card 1 */}
          <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-[#6B7280] font-[Inter]">OVERALL MASTERY</p>
            </div>
            <p className="font-[Poppins] font-bold text-[32px] leading-none text-[#13231F]">
              {data ? `${data.overall_mastery_pct}%` : '0%'}
            </p>
            <p className="text-[12px] text-[#6B7280] font-[Inter]">Across all sections</p>
          </Card>

          {/* Card 2 */}
          <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-[#6B7280] font-[Inter]">ACTIVE STUDENTS</p>
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            </div>
            <p className="font-[Poppins] font-bold text-[32px] leading-none text-[#13231F]">
              {data ? data.active_students : 0}
            </p>
            <p className="text-[12px] text-[#6B7280] font-[Inter]">Currently engaging</p>
          </Card>

          {/* Card 3 - Alert */}
          <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 flex flex-col gap-2 border-l-4 border-l-[#DC2626]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-[#6B7280] font-[Inter]">CONCEPTS FLAGGED</p>
              <Badge variant="danger" className="h-5 px-2 text-[10px] font-bold rounded-full">Alert</Badge>
            </div>
            <p className="font-[Poppins] font-bold text-[32px] leading-none text-[#DC2626]">
              {data ? data.concepts_flagged : 0}
            </p>
            <p className="text-[12px] text-[#6B7280] font-[Inter]">Mastery &lt; 50%</p>
          </Card>

          {/* Card 4 - Action */}
          <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5 flex flex-col gap-2 border-l-4 border-l-[#D9A94E]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-[#6B7280] font-[Inter]">NEED INTERVENTION</p>
              <Badge variant="warning" className="h-5 px-2 text-[10px] font-bold rounded-full">Action</Badge>
            </div>
            <p className="font-[Poppins] font-bold text-[28px] leading-none text-[#13231F]">
              {data ? `${data.students_needing_intervention} students` : '0 students'}
            </p>
            <p className="text-[12px] text-[#6B7280] font-[Inter]">Score below 60%</p>
          </Card>
        </div>

        {/* Sections */}
        <div>
          <div className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase mb-3 font-[Inter]">
            Sections — Click to Drill In
          </div>
          {filteredSections.length === 0 ? (
            <Card className="bg-[#F5F1E6] border-dashed border-[#E5E7EB] p-8 text-center rounded-[12px]">
              <div className="text-3xl mb-2">📚</div>
              <p className="font-[Poppins] font-semibold text-[16px] text-[#13231F]">
                {data.sections.length === 0 ? 'No sections yet' : 'No sections in this class'}
              </p>
              <p className="text-[13px] text-[#6B7280] font-[Inter] mt-1 mb-4">
                Assign a lesson to see performance
              </p>
              <Button variant="gold" onClick={() => navigate('/lessons')}>
                Assign First Lesson
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => goToSection(s.id)}
                  className={`text-left bg-[#F5F1E6] border border-[#E5E7EB] border-l-4 ${severityBorder(
                    s.mastery_pct
                  )} rounded-[12px] p-4 hover:shadow-md transition cursor-pointer`}
                >
                  <div className="text-[14px] font-semibold text-[#13231F] font-[Inter]">{s.name}</div>
                  <div className="text-[12px] text-[#6B7280] font-[Inter] mt-0.5">{s.roster_size} students</div>
                  <div
                    className={`font-[Poppins] font-bold text-right text-[20px] mt-2 ${severityColor(
                      s.mastery_pct
                    )}`}
                  >
                    {s.mastery_pct}%
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chapters */}
        <div>
          {filteredChapters.length === 0 ? (
            <div>
              <div className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase mb-3 font-[Inter]">
                Chapters
              </div>
              <Card className="bg-[#F5F1E6] border-dashed border-[#E5E7EB] p-8 text-center rounded-[12px]">
                <div className="text-3xl mb-2">🔬</div>
                <p className="font-[Poppins] font-semibold text-[16px] text-[#13231F]">
                  {data.chapters.length === 0 ? 'No chapters touched yet' : 'No activity for selected chapter'}
                </p>
                <p className="text-[13px] text-[#6B7280] font-[Inter] mt-1">
                  Student activity will appear here
                </p>
              </Card>
            </div>
          ) : (
            <Card className="bg-[#F5F1E6] border-[#E5E7EB] rounded-[12px] p-5">
              <div className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase mb-4 font-[Inter]">
                Chapters — Click a row to drill into its topics
              </div>
              <div className="space-y-2">
                {filteredChapters.map((c) => (
                  <button
                    key={c.chapter_id}
                    onClick={() => goToChapter(c.chapter_id)}
                    className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#E5E7EB] hover:shadow-sm hover:border-[#D9A94E]/50 transition cursor-pointer"
                  >
                    <span className="text-[14px] font-medium text-[#13231F] w-[240px] text-left truncate font-[Inter]">
                      {c.chapter_title}
                    </span>
                    <div className="flex items-center gap-3 flex-1 max-w-[320px]">
                      <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${severityBar(c.mastery_pct)}`}
                          style={{ width: `${c.mastery_pct}%` }}
                        />
                      </div>
                      <span
                        className={`text-[13px] font-semibold w-10 text-right font-[Poppins] ${severityColor(
                          c.mastery_pct
                        )}`}
                      >
                        {c.mastery_pct}%
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
