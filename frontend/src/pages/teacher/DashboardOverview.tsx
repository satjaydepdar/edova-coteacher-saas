import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { useTeacher } from '../../store/teacherStore'
import { teacherApi, type DashboardOverview as Overview } from '../../lib/teacherApi'

const severityColor = (pct: number) => (pct >= 70 ? 'text-emerald-700' : pct >= 50 ? 'text-gold-dark' : 'text-danger')
const severityBar = (pct: number) => (pct >= 70 ? 'bg-emerald-600' : pct >= 50 ? 'bg-gold' : 'bg-danger')
const severityBorder = (pct: number) => (pct >= 70 ? 'border-l-emerald-600' : pct >= 50 ? 'border-l-gold' : 'border-l-danger')

const CLASS_OPTIONS = Array.from({ length: 10 }, (_, i) => String(i + 1))

export default function DashboardOverview() {
  const { logout } = useTeacher()
  const navigate = useNavigate()
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [classFilter, setClassFilter] = useState<string>('ALL')

  useEffect(() => {
    teacherApi.overview().then(setData).catch(() => setError('Could not load the dashboard.'))
  }, [])

  const filteredSections = data ? data.sections.filter((s) => classFilter === 'ALL' || s.grade === classFilter) : []

  const goToSection = (sectionId: string) => {
    const chapterId = data?.chapters[0]?.chapter_id
    if (chapterId) navigate(`/dashboard/section/${sectionId}/chapter/${chapterId}`)
  }
  const goToChapter = (chapterId: string) => {
    const sectionId = filteredSections[0]?.id ?? data?.sections[0]?.id
    if (sectionId) navigate(`/dashboard/section/${sectionId}/chapter/${chapterId}`)
  }

  if (error) return <div className="flex items-center justify-center py-24 text-forest">{error}</div>
  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-5 h-5 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-[#FAF9F5] text-forest min-h-full">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-cream-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-cream border border-cream-border text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live &middot; {data.active_students} online
            </span>
            <span className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold">
              Level 1 of 3 &middot; click to drill in
            </span>
            <button onClick={logout} title="Sign out of Dashboard" className="text-forest/50 hover:text-forest">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-8">
        <h1 className="font-display font-bold text-[22px]">Student Performance Dashboard</h1>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-cream-card border border-cream-border rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-2">Overall Mastery</div>
            <div className="font-display font-bold text-[32px] leading-none">{data.overall_mastery_pct}%</div>
            <div className="text-[11px] text-forest/50 mt-1">Across all sections</div>
          </div>
          <div className="bg-cream-card border border-cream-border rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-2">Active Students</div>
            <div className="font-display font-bold text-[32px] leading-none">{data.active_students}</div>
          </div>
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.1em] uppercase text-danger/70 font-semibold mb-2">Concepts Flagged</div>
            <div className="font-display font-bold text-[32px] leading-none text-danger">{data.concepts_flagged}</div>
          </div>
          <div className="bg-gold/10 border border-gold/25 rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-2">Need Intervention</div>
            <div className="font-display font-bold text-[28px] leading-none">{data.students_needing_intervention} students</div>
          </div>
        </div>

        {/* Sections */}
        <div>
          <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-3">
            Sections &mdash; Click to Drill In
          </div>
          {filteredSections.length === 0 ? (
            <div className="text-sm text-forest/50">
              {data.sections.length === 0 ? 'No sections yet.' : 'No sections in this class.'}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => goToSection(s.id)}
                  className={`text-left bg-cream-card border border-cream-border border-l-[3px] ${severityBorder(s.mastery_pct)} rounded-2xl p-4 hover:shadow-card-hover transition`}
                >
                  <div className="text-[13px] font-semibold">{s.name}</div>
                  <div className="text-[11px] text-forest/50">{s.roster_size} students</div>
                  <div className={`font-display font-bold text-right text-[18px] ${severityColor(s.mastery_pct)}`}>{s.mastery_pct}%</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chapters */}
        <div className="bg-cream-card border border-cream-border rounded-[20px] p-5">
          <div className="text-[10px] tracking-[0.1em] uppercase text-forest/40 font-semibold mb-4">
            Chapters &mdash; Click a row to drill into its topics
          </div>
          {data.chapters.length === 0 ? (
            <div className="text-sm text-forest/50">No chapters touched yet.</div>
          ) : (
            <div className="space-y-1">
              {data.chapters.map((c) => (
                <button
                  key={c.chapter_id}
                  onClick={() => goToChapter(c.chapter_id)}
                  className="w-full flex items-center justify-between bg-white rounded-full px-4 py-3 border border-cream-border hover:shadow-card transition"
                >
                  <span className="text-[13px] font-medium w-[200px] text-left">{c.chapter_title}</span>
                  <div className="flex items-center gap-3 flex-1 max-w-[300px]">
                    <div className="flex-1 h-2 bg-cream-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${severityBar(c.mastery_pct)}`} style={{ width: `${c.mastery_pct}%` }} />
                    </div>
                    <span className={`text-[12px] w-8 ${severityColor(c.mastery_pct)}`}>{c.mastery_pct}%</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-forest/30" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
