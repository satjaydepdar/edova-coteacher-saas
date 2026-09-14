import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Play,
  X,
} from 'lucide-react'
import { useApp } from '../store'
import { api, type Chapter, type ModuleType, type Tree } from '../lib/api'

export interface WorkspaceCtx {
  tree: Tree | null
  treeError: string | null
  subjectId: string | null
  setSubjectId: (id: string) => void
  chapterId: string // 'ALL' or chapter uuid
  setChapterId: (id: string) => void
  typeFilter: ModuleType | 'ALL'
  setTypeFilter: (t: ModuleType | 'ALL') => void
  chapters: Chapter[]
  features: { allow_video: boolean; allow_lab: boolean; allow_quiz: boolean } | null
}

export function useWorkspace() {
  return useOutletContext<WorkspaceCtx>()
}

const TYPE_LABEL: Record<ModuleType | 'ALL', string> = {
  ALL: 'All Types',
  VIDEO: 'Videos',
  LAB: 'Labs',
  QUIZ: 'Quizzes',
}

export default function Shell() {
  const { session, subjects, features, boot, deactivate, bootError } = useApp()
  const [subjectId, setSubjectIdRaw] = useState<string | null>(null)
  const [chapterId, setChapterId] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState<ModuleType | 'ALL'>('ALL')
  const [tree, setTree] = useState<Tree | null>(null)
  const [treeError, setTreeError] = useState<string | null>(null)
  const [navOpen, setNavOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    boot().catch(() => {})
  }, [boot])

  useEffect(() => {
    if (!subjectId && subjects.length > 0) setSubjectIdRaw(subjects[0].id)
  }, [subjects, subjectId])

  useEffect(() => {
    if (!subjectId) return
    let cancelled = false
    setTree(null)
    setTreeError(null)
    api
      .tree(subjectId)
      .then((t) => !cancelled && setTree(t))
      .catch((e) => !cancelled && setTreeError(e instanceof Error ? e.message : 'failed to load'))
    return () => {
      cancelled = true
    }
  }, [subjectId])

  const setSubjectId = (id: string) => {
    setSubjectIdRaw(id)
    setChapterId('ALL')
    backToShelf()
  }

  // The chapter/type/subject pickers are global context: changing them while
  // viewing a module must leave the detail page, otherwise the shelf filter
  // silently changes behind the open asset.
  const navigate = useNavigate()
  const location = useLocation()
  function backToShelf() {
    if (location.pathname !== '/') navigate('/')
  }

  const chapters = useMemo(() => tree?.chapters ?? [], [tree])
  const activeSubject = subjects.find((s) => s.id === subjectId)

  if (bootError) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-black/[0.06] p-8 max-w-sm text-center shadow-card">
          <p className="font-display font-bold text-[16px] text-forest">Workspace unavailable</p>
          <p className="text-[13px] opacity-70 mt-2 text-forest">{bootError}</p>
          <button
            onClick={deactivate}
            className="mt-5 h-9 px-4 rounded-full bg-forest text-white text-[13px] font-medium"
          >
            Back to activation
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-forest/20 border-t-forest rounded-full animate-spin" />
      </div>
    )
  }

  const initials = session.tenant.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const ctx: WorkspaceCtx = {
    tree,
    treeError,
    subjectId,
    setSubjectId,
    chapterId,
    setChapterId,
    typeFilter,
    setTypeFilter,
    chapters,
    features,
  }

  return (
    <div className="min-h-screen flex w-full bg-cream text-forest overflow-hidden">
      {navOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        className={`print:hidden fixed lg:sticky top-0 left-0 z-50 h-screen shrink-0 flex flex-col transition-all duration-300 ease-in-out bg-forest ${
          navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'w-[76px] lg:w-[76px]' : 'w-[300px] max-w-[85vw] lg:w-[280px]'
        }`}
      >
        {/* Header with Expand / Collapse Toggle */}
        <div
          className={`h-[72px] flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          } border-b border-white/[0.08] shrink-0 transition-all`}
        >
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gold/20 hover:text-gold text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Expand sidebar"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-gold/20 hover:text-gold flex items-center justify-center text-white shrink-0 cursor-pointer transition-colors"
                  title="Collapse sidebar"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <div className="font-display font-bold text-white leading-none text-[16px] flex items-center gap-1.5">
                    EDOVA <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  </div>
                  <div className="text-[11px] text-white/50 mt-1 tracking-wide truncate">
                    {session.tenant.name.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="hidden lg:flex w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-gold/20 hover:text-gold items-center justify-center text-white/50 transition-colors cursor-pointer"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setNavOpen(false)}
                  className="lg:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modules Nav with Golden Highlight when Pointed / Active */}
        <div
          className={`flex-1 overflow-y-auto ${
            isCollapsed ? 'px-2' : 'px-3'
          } py-5 space-y-5 transition-all`}
        >
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/30 px-3 mb-2">
                Main
              </div>
            )}
            <NavLink
              to="/dashboard"
              title="Dashboard"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl text-[14px] transition-all duration-200 ${
                  isActive
                    ? 'bg-gold text-black font-semibold shadow-xs'
                    : 'text-white/70 hover:text-gold hover:bg-gold/15'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
          </div>

          <div>
            <NavLink
              to="/"
              end
              title="Video Lessons"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl text-[14px] transition-all duration-200 ${
                  isActive
                    ? 'bg-gold text-black font-semibold shadow-xs'
                    : 'text-white/70 hover:text-gold hover:bg-gold/15'
                }`
              }
            >
              <Play className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="font-medium">Video Lessons</span>
                  <ChevronDown className="w-4 h-4 ml-auto opacity-70" />
                </>
              )}
            </NavLink>
            {!isCollapsed && (
              <div className="mt-2 ml-3 pl-5 border-l border-white/10 space-y-1 animate-fadeIn">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubjectId(s.id)}
                    className={`w-full text-left px-3 h-8 rounded-lg text-[13px] flex items-center justify-between transition-colors cursor-pointer ${
                      subjectId === s.id
                        ? 'bg-gold text-black font-semibold shadow-xs'
                        : 'text-white/60 hover:text-gold hover:bg-gold/15'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {subjectId === s.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black/60 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <NavLink
              to="/labs"
              title="Virtual Labs"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl text-[14px] transition-all duration-200 ${
                  isActive
                    ? 'bg-gold text-black font-semibold shadow-xs'
                    : 'text-white/70 hover:text-gold hover:bg-gold/15'
                }`
              }
            >
              <FlaskConical className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Virtual Labs</span>}
            </NavLink>
          </div>

          <div>
            <NavLink
              to="/practice"
              title="Practice Questions"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl text-[14px] transition-all duration-200 ${
                  isActive
                    ? 'bg-gold text-black font-semibold shadow-xs'
                    : 'text-white/70 hover:text-gold hover:bg-gold/15'
                }`
              }
            >
              <ListChecks className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Practice Questions</span>}
            </NavLink>
          </div>
        </div>

        {/* User / School Profile Card moved to bottom (LED Classroom Mode removed) */}
        <div className="mt-auto border-t border-white/10 p-3 shrink-0">
          {isCollapsed ? (
            <div
              className="flex justify-center"
              title={`${session.tenant.name} • ${activeSubject?.name ?? ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-black font-bold text-[13px] shadow-xs">
                {initials}
              </div>
            </div>
          ) : (
            <div className="px-2 py-1 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-black font-bold text-[13px] shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[13px] font-medium leading-none truncate">
                  {session.tenant.name}
                </div>
                <div className="text-white/50 text-[11px] mt-1 truncate">
                  {activeSubject?.name ?? '—'} • {activeSubject?.standard_grade ?? ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
        {!location.pathname.startsWith('/practice') && (
          <header className="print:hidden h-[72px] shrink-0 bg-white border-b border-black/[0.06] flex items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setNavOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl border border-black/10 flex items-center justify-center"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Content Shelf's chapter/type/subject picker doesn't apply to Dashboard
              (own Class/Subject filters) or Practice (own chapter select, filters TBD)
              -- hidden on those routes only; every other route's picker is unchanged. */}
          {!location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/practice') && (
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="relative">
                <select
                  value={chapterId}
                  onChange={(e) => {
                    setChapterId(e.target.value)
                    backToShelf()
                  }}
                  className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-cream border border-black/[0.06] text-[13px] font-medium outline-none focus:border-gold cursor-pointer max-w-[140px] sm:max-w-none"
                >
                  <option value="ALL">All Chapters</option>
                  {chapters.map((c) => (
                    <option key={c.chapter_id} value={c.chapter_id}>
                      {c.chapter_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
              </div>

              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as ModuleType | 'ALL')
                    backToShelf()
                  }}
                  className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-black/[0.08] text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
                >
                  {(Object.keys(TYPE_LABEL) as (ModuleType | 'ALL')[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
              </div>

              <div className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l border-black/10">
                <span className="text-[11px] tracking-widest uppercase opacity-40 font-semibold">
                  Subject
                </span>
                <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full bg-forest text-white">
                  {activeSubject?.name ?? '—'}
                </span>
              </div>
            </div>
          )}
          {(location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/practice')) && (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <FlaskConical className="w-3.5 h-3.5 opacity-0" />
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium opacity-60">Live Classroom</span>
            </div>
            <button
              onClick={deactivate}
              className="h-9 px-3.5 rounded-xl border border-black/10 bg-white hover:bg-black/[0.03] text-[13px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Deactivate</span>
            </button>
          </div>
        </header>
        )}

        <main className="flex-1 overflow-y-auto bg-[#FBF9F3] min-w-0">
          <Outlet context={ctx} />
        </main>
      </div>
    </div>
  )
}
