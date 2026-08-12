import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Play,
  Sparkles,
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
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[300px] max-w-[85vw] lg:w-[280px] shrink-0 flex flex-col transition-transform duration-300 lg:translate-x-0 bg-forest ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-[72px] flex items-center gap-3 px-6 border-b border-white/[0.08] shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold text-white leading-none text-[16px] flex items-center gap-1.5">
              EDOVA <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
            <div className="text-[11px] text-white/50 mt-1 tracking-wide">{session.tenant.name.toUpperCase()}</div>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/30 px-3 mb-2">
              Main
            </div>
            <button
              className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-white/40 text-[14px] cursor-not-allowed"
              title="Dashboard is not part of this release"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
              <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Soon</span>
            </button>
          </div>

          <div>
            <NavLink
              to="/"
              end
              className="w-full flex items-center gap-3 px-3 h-10 rounded-xl bg-white/[0.08] text-white text-[14px] font-medium"
            >
              <Play className="w-4 h-4" /> Content Shelf
              <ChevronDown className="w-4 h-4 ml-auto opacity-70" />
            </NavLink>
            <div className="mt-2 ml-3 pl-5 border-l border-white/10 space-y-1 animate-fadeIn">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={`w-full text-left px-3 h-8 rounded-lg text-[13px] flex items-center justify-between transition-colors ${
                    subjectId === s.id
                      ? 'bg-gold text-black font-semibold'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {s.name}
                  {subjectId === s.id && <span className="w-1.5 h-1.5 rounded-full bg-black/60" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <NavLink
              to="/practice"
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[14px] transition-colors ${
                  isActive
                    ? 'bg-white text-forest font-semibold shadow'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`
              }
            >
              <ListChecks className="w-4 h-4" /> Practice Questions
            </NavLink>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10">
            <div className="px-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-black font-bold text-[13px]">
                {initials}
              </div>
              <div>
                <div className="text-white text-[13px] font-medium leading-none">
                  {session.tenant.name}
                </div>
                <div className="text-white/50 text-[11px] mt-1">
                  {activeSubject?.name ?? '—'} • {activeSubject?.standard_grade ?? ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-white/10">
          <div className="rounded-xl bg-white/[0.06] p-3 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div>
              <div className="text-white text-[12px] font-medium">LED Classroom Mode</div>
              <div className="text-white/50 text-[11px] leading-snug mt-0.5">
                Fullscreen video optimized for projector & smart boards.
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
        <header className="h-[72px] shrink-0 bg-white border-b border-black/[0.06] flex items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setNavOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl border border-black/10 flex items-center justify-center"
          >
            <Menu className="w-4 h-4" />
          </button>

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

        <main className="flex-1 overflow-y-auto bg-cream min-w-0">
          <Outlet context={ctx} />
        </main>
      </div>
    </div>
  )
}
