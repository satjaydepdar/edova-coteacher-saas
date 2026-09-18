import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useApp } from '../../store'
import { useWorkspace } from '../../components/Shell'
import { teacherApi, type DashboardOverview as Overview } from '../../lib/teacherApi'
import PageHeader from '../../components/PageHeader'
import SearchToolbar, { filterSelectClass } from '../../components/SearchToolbar'
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
  const { subjects } = useApp()
  const { classFilter, setClassFilter, subjectId, setSubjectId, chapterId, setChapterId, chapters } = useWorkspace()
  const activeSubject = subjects.find((s) => s.id === subjectId)
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
    <div className="min-h-full bg-[#FFFBF0] text-[#11181C] font-[Inter]">
      <PageHeader
        title="Student Performance Dashboard"
        description="Real-time mastery, engagement, and intervention insights"
      />

      <SearchToolbar>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className={filterSelectClass}
        >
          <option value="ALL">All Classes</option>
          {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
        <span className="text-[#9CA3AF] text-[11px] font-semibold">&gt;&gt;</span>
        <select
          value={subjectId ?? ''}
          onChange={(e) => setSubjectId(e.target.value)}
          className={filterSelectClass}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <span className="text-[#9CA3AF] text-[11px] font-semibold">&gt;&gt;</span>
        <select
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          className={filterSelectClass}
        >
          <option value="ALL">All Chapters</option>
          {chapters.map((c) => (
            <option key={c.chapter_id} value={c.chapter_id}>{c.chapter_name}</option>
          ))}
        </select>
        <span className="h-8 px-3 rounded-full bg-[#11181C] text-white text-[11px] font-bold tracking-[0.06em] inline-flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5C542]" />
          {activeSubject ? `C10.${activeSubject.name.slice(0, 3).toUpperCase()}` : 'C10.ALL'}
        </span>
        <span className="h-8 px-3 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-medium text-[#374151] inline-flex items-center gap-2 shadow-[0_1px_1px_rgba(0,0,0,0.03)] shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
          Live • {data.active_students} online • LEVEL 1 OF 3
        </span>
      </SearchToolbar>

      <div className="px-8 pt-2 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#FFFEF8] border-[#E5E7EB] rounded-[16px] p-5 flex flex-col gap-2 border-l-4 border-l-[#F5C542] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-bold font-mono tracking-[0.14em] text-[#8A8F98] uppercase">OVERALL MASTERY</p>
          <p className="font-bold font-mono tracking-[-0.02em] text-[32px] leading-none text-[#11181C]">
            {data.overall_mastery_pct}%
          </p>
          <p className="text-[12px] text-[#6B7280]">Across all sections</p>
        </Card>

        <Card className="bg-[#F6FEF8] border-[#E5E7EB] rounded-[16px] p-5 flex flex-col gap-2 border-l-4 border-l-[#22C55E] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold font-mono tracking-[0.14em] text-[#8A8F98] uppercase">ACTIVE STUDENTS</p>
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
          </div>
          <p className="font-bold font-mono tracking-[-0.02em] text-[32px] leading-none text-[#11181C]">
            {data.active_students}
          </p>
          <p className="text-[12px] text-[#6B7280]">Currently engaging</p>
        </Card>

        <Card className="bg-[#FFFBFB] border-[#E5E7EB] rounded-[16px] p-5 flex flex-col gap-2 border-l-4 border-l-[#EF4444] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold font-mono tracking-[0.14em] text-[#8A8F98] uppercase">CONCEPTS FLAGGED</p>
            <Badge variant="danger" className="h-5 px-2 text-[10px] font-bold rounded-full">Alert</Badge>
          </div>
          <p className="font-bold font-mono tracking-[-0.02em] text-[28px] leading-none text-[#DC2626]">
            {data.concepts_flagged}
          </p>
          <p className="text-[12px] text-[#6B7280]">Mastery &lt; 50%</p>
        </Card>

        <Card className="bg-[#FFFBF5] border-[#E5E7EB] rounded-[16px] p-5 flex flex-col gap-2 border-l-4 border-l-[#F97316] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold font-mono tracking-[0.14em] text-[#8A8F98] uppercase">NEED INTERVENTION</p>
            <Badge variant="warning" className="h-5 px-2 text-[10px] font-bold rounded-full">Action</Badge>
          </div>
          <p className="font-bold font-mono tracking-[-0.02em] text-[24px] leading-none text-[#11181C]">
            {data.students_needing_intervention} students
          </p>
          <p className="text-[12px] text-[#6B7280]">Score below 60%</p>
        </Card>
      </div>

      <div className="px-8 pb-3">
        <div className="text-[10px] font-bold font-mono tracking-[0.14em] text-[#8A8F98] uppercase">
          Sections — Click to Drill In
        </div>
      </div>
      <div className="px-8 pb-6">
        {filteredSections.length === 0 ? (
          <div className="bg-[#FFFEF8] border border-dashed border-[#E5DDC8] rounded-[16px] p-12 text-center">
            <div className="text-3xl mb-2">📚</div>
            <p className="font-bold text-[16px] text-[#11181C]">
              {data.sections.length === 0 ? 'No sections yet' : 'No sections in this class'}
            </p>
            <p className="text-[13px] text-[#6B7280] mt-1 mb-4">
              Assign a lesson to see performance
            </p>
            <Button variant="gold" onClick={() => navigate('/lessons')}>
              Assign First Lesson
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => goToSection(s.id)}
                className={`text-left bg-white border border-[#E5E7EB] border-l-[3px] ${severityBorder(
                  s.mastery_pct
                )} rounded-[12px] p-4 hover:shadow-md transition cursor-pointer`}
              >
                <div className="text-[14px] font-semibold text-[#11181C]">{s.name}</div>
                <div className="text-[12px] text-[#6B7280] mt-0.5">{s.roster_size} students</div>
                <div
                  className={`font-bold font-mono text-right text-[18px] mt-2 ${severityColor(
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

      <div className="px-8 pb-12">
        {filteredChapters.length === 0 ? (
          <div>
            <div className="text-[10px] font-bold font-mono tracking-[0.14em] text-[#8A8F98] uppercase mb-3">
              Chapters
            </div>
            <div className="bg-[#FFFEF8] border border-dashed border-[#E5DDC8] rounded-[16px] p-12 text-center">
              <div className="text-3xl mb-2">🔬</div>
              <p className="font-bold text-[16px] text-[#11181C]">
                {data.chapters.length === 0 ? 'No chapters touched yet' : 'No activity for selected chapter'}
              </p>
              <p className="text-[13px] text-[#6B7280] mt-1">
                Student activity will appear here
              </p>
            </div>
          </div>
        ) : (
          <Card className="bg-white border-[#E5E7EB] rounded-[16px] p-5">
            <div className="text-[10px] font-bold font-mono tracking-[0.14em] text-[#8A8F98] uppercase mb-4">
              Chapters — Click a row to drill into its topics
            </div>
            <div className="space-y-2">
              {filteredChapters.map((c) => (
                <button
                  key={c.chapter_id}
                  onClick={() => goToChapter(c.chapter_id)}
                  className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#E5E7EB] hover:shadow-sm hover:border-[#D9A94E]/50 transition cursor-pointer"
                >
                  <span className="text-[14px] font-medium text-[#11181C] w-[240px] text-left truncate">
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
                      className={`text-[13px] font-semibold w-10 text-right font-mono ${severityColor(
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
  )
}
