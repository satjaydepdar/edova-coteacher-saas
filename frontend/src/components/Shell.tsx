import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FileQuestion,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  NotebookPen,
  PenTool,
  Play,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react'
import { useApp } from '../store'
import { useTeacher } from '../store/teacherStore'
import { useAuthStore } from '../store/authStore'
import { api, type Chapter, type ModuleType, type Tree } from '../lib/api'
import { CURRICULUM_DATABASE } from '../data/curriculumData'
import { Badge } from './ui/badge'

const activeNavClass =
  'bg-[rgba(127,191,122,0.3)] text-[#FBF7EE] border border-[rgba(127,191,122,0.2)] font-[Inter] text-[14px] font-medium shadow-xs'
const inactiveNavClass =
  'text-white/70 hover:bg-[rgba(127,191,122,0.15)] hover:text-[#FBF7EE] font-[Inter] text-[14px] transition-all duration-200'

export interface WorkspaceCtx {
  tree: Tree | null
  treeError: string | null
  subjectId: string | null
  setSubjectId: (id: string) => void
  chapterId: string // 'ALL' or chapter uuid
  setChapterId: (id: string) => void
  classFilter: string
  setClassFilter: (c: string) => void
  typeFilter: ModuleType | 'ALL'
  setTypeFilter: (t: ModuleType | 'ALL') => void
  chapters: Chapter[]
  features: { allow_video: boolean; allow_lab: boolean; allow_quiz: boolean } | null
  // Virtual Labs filter context
  labSubject: 'maths' | 'science' | 'social' | 'english'
  setLabSubject: (s: 'maths' | 'science' | 'social' | 'english') => void
  labChapterId: string
  setLabChapterId: (c: string) => void
  labTopicId: string
  setLabTopicId: (t: string) => void
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
  const { authed: teacherAuthed, logout: logoutTeacher } = useTeacher()
  const { user, logout: logoutUser } = useAuthStore()
  const [subjectId, setSubjectIdRaw] = useState<string | null>(null)
  const [chapterId, setChapterId] = useState('ALL')
  const [classFilter, setClassFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState<ModuleType | 'ALL'>('ALL')
  const [lessonsExpanded, setLessonsExpanded] = useState(true)
  const [learningHubExpanded, setLearningHubExpanded] = useState(true)
  const [labSubject, setLabSubject] = useState<'maths' | 'science' | 'social' | 'english'>('science')
  const [labChapterId, setLabChapterId] = useState('ALL')
  const [labTopicId, setLabTopicId] = useState('ALL')
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

  const navigate = useNavigate()
  const location = useLocation()
  const isLessonsActive = location.pathname.startsWith('/lessons') || location.pathname.startsWith('/module')

  function backToShelf() {
    if (location.pathname.startsWith('/module')) navigate('/lessons')
  }

  const setSubjectId = (id: string) => {
    setSubjectIdRaw(id)
    setChapterId('ALL')
    backToShelf()
  }

  const chapters = useMemo(() => tree?.chapters ?? [], [tree])
  const activeSubject = subjects.find((s) => s.id === subjectId)
  const isStudent = user?.role === 'STUDENT'
  const isAdmin = user?.role === 'ADMIN'

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
    classFilter,
    setClassFilter,
    typeFilter,
    setTypeFilter,
    chapters,
    features,
    labSubject,
    setLabSubject,
    labChapterId,
    setLabChapterId,
    labTopicId,
    setLabTopicId,
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
          } py-4 space-y-4 transition-all`}
        >
          {/* PLANNING GROUP (teacher/admin only) */}
          {!isStudent && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/35 px-3 mb-1.5 font-[Inter]">
                Planning
              </div>
            )}
            <NavLink
              to="/calendar"
              title="My Calendar"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${
                  isActive ? activeNavClass : inactiveNavClass
                }`
              }
            >
              <Calendar className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>My Calendar</span>}
            </NavLink>

            <NavLink
              to="/syllabus"
              title="Syllabus Map"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${
                  isActive ? activeNavClass : inactiveNavClass
                }`
              }
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Syllabus Map</span>}
            </NavLink>

            <NavLink
              to="/lesson-planner"
              title="Lesson Planner"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${
                  isActive ? activeNavClass : inactiveNavClass
                }`
              }
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Lesson Planner</span>}
            </NavLink>
          </div>
          )}

          {/* STUDENT WORKSPACE GROUP (Student and School Admin logins only) */}
          {(isStudent || isAdmin) && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/35 px-3 mb-1.5 font-[Inter]">
                Student Workspace
              </div>
            )}
            <div>
              <div className="flex items-center">
                <NavLink
                  to="/learning"
                  title="Learning Hub"
                  onClick={() => {
                    if (!learningHubExpanded) setLearningHubExpanded(true)
                  }}
                  className={({ isActive }) =>
                    `flex-1 flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                    } h-10 rounded-xl ${isActive ? activeNavClass : inactiveNavClass}`
                  }
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Learning Hub</span>}
                </NavLink>
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setLearningHubExpanded((prev) => !prev)
                    }}
                    title={learningHubExpanded ? 'Collapse Learning Hub' : 'Expand Learning Hub'}
                    className="w-8 h-8 ml-1 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        learningHubExpanded ? 'rotate-0 text-white' : '-rotate-90 text-white/50'
                      }`}
                    />
                  </button>
                )}
              </div>

              {!isCollapsed && learningHubExpanded && (
                <div className="mt-2 ml-3 pl-5 border-l border-white/10 space-y-1 animate-fadeIn">
                  <div>
                    <div className="flex items-center">
                      <NavLink
                        to="/lessons"
                        title="Video Lessons"
                        onClick={() => {
                          if (!lessonsExpanded) setLessonsExpanded(true)
                        }}
                        className={`flex-1 flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] ${
                          isLessonsActive ? activeNavClass : inactiveNavClass
                        }`}
                      >
                        <Play className="w-4 h-4 shrink-0" />
                        <span className="font-medium">Video Lessons</span>
                      </NavLink>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setLessonsExpanded((prev) => !prev)
                        }}
                        title={lessonsExpanded ? 'Collapse subjects' : 'Expand subjects'}
                        className="w-7 h-7 ml-1 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            lessonsExpanded ? 'rotate-0 text-white' : '-rotate-90 text-white/50'
                          }`}
                        />
                      </button>
                    </div>
                    {lessonsExpanded && (
                      <div className="mt-1 ml-3 pl-4 border-l border-white/10 space-y-1 animate-fadeIn">
                        {subjects.map((s) => {
                          const isSubjectActive = isLessonsActive && subjectId === s.id
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSubjectId(s.id)
                                if (!isLessonsActive) navigate('/lessons')
                              }}
                              className={`w-full text-left px-3 h-7 rounded-lg text-[12.5px] flex items-center justify-between transition-colors cursor-pointer font-[Inter] ${
                                isSubjectActive
                                  ? activeNavClass
                                  : 'text-white/60 hover:bg-[rgba(127,191,122,0.15)] hover:text-[#FBF7EE]'
                              }`}
                            >
                              <span className="truncate">{s.name}</span>
                              {isSubjectActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#7FBF7A] shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <NavLink
                    to="/labs"
                    title="Virtual Labs"
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] ${
                        isActive ? activeNavClass : inactiveNavClass
                      }`
                    }
                  >
                    <FlaskConical className="w-4 h-4 shrink-0" />
                    <span>Virtual Labs</span>
                  </NavLink>

                  <NavLink
                    to="/practice"
                    title="Practice Questions"
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] ${
                        isActive ? activeNavClass : inactiveNavClass
                      }`
                    }
                  >
                    <ListChecks className="w-4 h-4 shrink-0" />
                    <span>Practice Questions</span>
                  </NavLink>

                  <NavLink
                    to="/resources"
                    title="Learning Resources"
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] ${
                        isActive ? activeNavClass : inactiveNavClass
                      }`
                    }
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <span>Learning Resources</span>
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink
              to="/my-assignments"
              title="My Assignments"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${isActive ? activeNavClass : inactiveNavClass}`
              }
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>My Assignments</span>}
            </NavLink>

            <NavLink
              to="/wiki"
              title="My Wiki"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${isActive ? activeNavClass : inactiveNavClass}`
              }
            >
              <NotebookPen className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>My Wiki</span>}
            </NavLink>
          </div>
          )}

          {/* TEACHING GROUP */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/35 px-3 mb-1.5 font-[Inter]">
                Teaching
              </div>
            )}
            {!isStudent && (
            <NavLink
              to="/dashboard"
              title="Dashboard"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${
                  isActive ? activeNavClass : inactiveNavClass
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
            )}

            {!isStudent && (
            <NavLink
              to="/assignments"
              title="Assignment Tracker"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${
                  isActive ? activeNavClass : inactiveNavClass
                }`
              }
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Assignment Tracker</span>}
            </NavLink>
            )}

            {!isStudent && (
            <NavLink
              to="/assessment-builder"
              title="Assessment Builder"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${isActive ? activeNavClass : inactiveNavClass}`
              }
            >
              <FileQuestion className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <span className="font-[Inter] text-[14px]">Assessment Builder</span>
              )}
            </NavLink>
            )}

            {!isStudent && (
            <NavLink
              to="/attendance"
              title="Attendance"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${isActive ? activeNavClass : inactiveNavClass}`
              }
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <span className="font-[Inter] text-[14px]">Attendance</span>
              )}
            </NavLink>
            )}

            <div>
              <div
                title="Authoring Studio (In Development • Coming Soon)"
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl text-white/35 cursor-not-allowed select-none transition-colors`}
              >
                <PenTool className="w-4 h-4 shrink-0 opacity-60" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-[Inter] text-[14px]">Authoring Studio</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/50 tracking-wider">
                      Soon
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ADMIN & SYSTEM */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/35 px-3 mb-1.5 font-[Inter]">
                System
              </div>
            )}
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/cms"
                title="Admin Portal (Schools, Users, Subscriptions)"
                className={({ isActive }) =>
                  `w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                  } h-10 rounded-xl ${
                    isActive ? activeNavClass : inactiveNavClass
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Admin CMS</span>}
              </NavLink>
            )}

            <NavLink
              to="/settings"
              title="Settings & Preferences"
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } h-10 rounded-xl ${
                  isActive ? activeNavClass : inactiveNavClass
                }`
              }
            >
              <SettingsIcon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </div>
        </div>

        {/* User / School Profile Card */}
        <div className="mt-auto border-t border-white/10 p-3 shrink-0">
          {isCollapsed ? (
            <div
              className="flex justify-center"
              title={`${user?.full_name ?? session.tenant.name} • ${user?.role ?? ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-black font-bold text-[13px] shadow-xs">
                {user ? user.full_name.slice(0, 2).toUpperCase() : initials}
              </div>
            </div>
          ) : (
            <div className="px-2 py-1 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-black font-bold text-[13px] shrink-0 shadow-xs">
                {user ? user.full_name.slice(0, 2).toUpperCase() : initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[13px] font-medium leading-none truncate">
                  {user?.full_name ?? session.tenant.name}
                </div>
                <div className="text-white/50 text-[11px] mt-1 truncate">
                  <span className="text-gold font-semibold">{user?.role ?? 'MEMBER'}</span> • {user?.tenant_name ?? session.tenant.name}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
        {!location.pathname.startsWith('/practice') &&
          !location.pathname.startsWith('/settings') &&
          !location.pathname.startsWith('/learning') &&
          !location.pathname.startsWith('/my-assignments') &&
          !location.pathname.startsWith('/wiki') && (
          <header className="print:hidden h-16 shrink-0 bg-[#F5F1E6] border-b border-[#E5E1D2] flex items-center justify-between gap-3 px-6 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setNavOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl border border-black/10 flex items-center justify-center cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>

              {location.pathname.startsWith('/dashboard') ? (
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 font-[Inter] text-[13px]">
                  <div className="relative">
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
                    >
                      <option value="ALL">All Classes</option>
                      {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((c) => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                  </div>

                  <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>

                  <div className="relative">
                    <select
                      value={subjectId ?? ''}
                      onChange={(e) => {
                        setSubjectIdRaw(e.target.value)
                        setChapterId('ALL')
                      }}
                      className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                  </div>

                  <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>

                  <div className="relative">
                    <select
                      value={chapterId}
                      onChange={(e) => setChapterId(e.target.value)}
                      className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer max-w-[140px] sm:max-w-none"
                    >
                      <option value="ALL">All Chapters</option>
                      {chapters.map((c) => (
                        <option key={c.chapter_id} value={c.chapter_id}>
                          {c.chapter_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                  </div>

                  <Badge variant="okf" className="font-mono text-[11px]">
                    {activeSubject ? `C10.${activeSubject.name.slice(0, 3).toUpperCase()}` : 'C10.ALL'}
                  </Badge>
                </div>
              ) : location.pathname.startsWith('/labs') ? (
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 font-[Inter] text-[13px]">
                  {/* Dedicated Subject Filter for Labs */}
                  <div className="relative">
                    <select
                      value={labSubject}
                      onChange={(e) => {
                        const newSubj = e.target.value as 'maths' | 'science' | 'social' | 'english'
                        setLabSubject(newSubj)
                        setLabChapterId('ALL')
                        setLabTopicId('ALL')
                      }}
                      className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
                    >
                      <option value="maths">Mathematics</option>
                      <option value="science">Science</option>
                      <option value="social">Social Science</option>
                      <option value="english">English</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                  </div>

                  <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>

                  {/* Dedicated Chapter Filter for Labs */}
                  <div className="relative">
                    <select
                      value={labChapterId}
                      onChange={(e) => {
                        setLabChapterId(e.target.value)
                        setLabTopicId('ALL')
                      }}
                      className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer max-w-[160px] sm:max-w-none"
                    >
                      <option value="ALL">All Chapters</option>
                      {(CURRICULUM_DATABASE[labSubject]?.chapters ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                  </div>

                  <span className="text-[#6B7280] font-semibold text-xs">&gt;&gt;</span>

                  {/* Dedicated Topic Filter for Labs */}
                  <div className="relative">
                    <select
                      value={labTopicId}
                      onChange={(e) => setLabTopicId(e.target.value)}
                      disabled={labChapterId === 'ALL'}
                      className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer max-w-[180px] sm:max-w-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="ALL">All Topics</option>
                      {labChapterId !== 'ALL' &&
                        (CURRICULUM_DATABASE[labSubject]?.chapters.find((c) => c.id === labChapterId)?.subtopics ?? []).map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.title}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                  </div>

                  <Badge variant="okf" className="font-mono text-[11px] hidden sm:inline-flex">
                    {labSubject === 'maths'
                      ? 'LABS.MATH'
                      : labSubject === 'science'
                      ? 'LABS.SCI'
                      : labSubject === 'social'
                      ? 'LABS.SOC'
                      : 'LABS.ENG'}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="relative">
                    <select
                      value={chapterId}
                      onChange={(e) => {
                        setChapterId(e.target.value)
                        backToShelf()
                      }}
                      className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer max-w-[140px] sm:max-w-none"
                    >
                      <option value="ALL">All Chapters</option>
                      {chapters.map((c) => (
                        <option key={c.chapter_id} value={c.chapter_id}>
                          {c.chapter_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                  </div>

                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value as ModuleType | 'ALL')
                        backToShelf()
                      }}
                      className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white border border-[#E5E7EB] font-[Inter] text-[13px] font-medium outline-none focus:border-gold cursor-pointer"
                    >
                      {(Object.keys(TYPE_LABEL) as (ModuleType | 'ALL')[]).map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                  </div>

                  <div className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l border-black/10">
                    <span className="text-[11px] tracking-widest uppercase opacity-40 font-semibold font-[Inter]">
                      Subject
                    </span>
                    <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full bg-forest text-white font-[Inter]">
                      {activeSubject?.name ?? '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {location.pathname.startsWith('/dashboard') && (
                <div className="hidden md:flex items-center gap-2 mr-2">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="text-[12px] font-mono text-[#13231F]">Live • 0 online</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {location.pathname.includes('/student/')
                      ? 'LEVEL 3 OF 3'
                      : location.pathname.includes('/section/')
                      ? 'LEVEL 2 OF 3'
                      : 'LEVEL 1 OF 3'}
                  </Badge>
                </div>
              )}
              {location.pathname.startsWith('/labs') && (
                <div className="hidden md:flex items-center gap-2 mr-2">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="text-[12px] font-mono text-[#13231F]">Virtual Labs • Ready</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    CBSE CLASS 10
                  </Badge>
                </div>
              )}

              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest/5 border border-forest/10">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-forest text-cream tracking-wide">
                    {user.role}
                  </span>
                  <span className="text-[13px] font-medium text-forest truncate max-w-40 font-[Inter]">
                    {user.full_name}
                  </span>
                  <span className="text-[11px] text-forest/40">·</span>
                  <span className="text-[11px] text-forest/60 font-medium truncate max-w-36 font-[Inter]">
                    {user.tenant_name}
                  </span>
                </div>
              )}

              <button
                onClick={() => {
                  logoutUser()
                  navigate('/login', { replace: true })
                }}
                className="h-9 px-3.5 rounded-xl border border-danger/30 bg-danger/5 hover:bg-danger/10 text-danger text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer font-[Inter]"
                title="Sign out of Edova"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto bg-white min-w-0">
          <Outlet context={ctx} />
        </main>
      </div>
    </div>
  )
}
