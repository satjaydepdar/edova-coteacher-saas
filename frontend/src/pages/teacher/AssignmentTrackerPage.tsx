import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ClipboardList,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  BookOpen,
  Award,
  Users,
  Send,
} from 'lucide-react'
import { useAssignmentStore, type AssignmentSummaryItem, type SubmissionItem } from '../../store/assignmentStore'
import { useCalendarStore } from '../../store/calendarStore'
import PageHeader from '../../components/PageHeader'
import { searchInputClass } from '../../components/SearchToolbar'
import SummaryCard from '../../components/SummaryCard'
import { titleClass, bodyClass } from '../../components/typography'

const SECTION_CHOICES = ['All', '10-A', '10-B', '9-A']
const TYPE_CHOICES = [
  { id: 'homework', label: 'Homework' },
  { id: 'worksheet', label: 'Worksheet' },
  { id: 'practice', label: 'Practice Set' },
  { id: 'project', label: 'Project' },
]
const STATUS_CHOICES = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Active' },
  { id: 'pending_grading', label: 'Pending Review' },
  { id: 'draft', label: 'Drafts' },
  { id: 'closed', label: 'Closed' },
]
const STATUS_DOT_CLS: Record<string, string> = {
  all: 'bg-[#9CA3AF]',
  published: 'bg-[#22C55E]',
  pending_grading: 'bg-[#F97316]',
  draft: 'bg-[#D1D5DB]',
  closed: 'bg-[#6B7280]',
}
const STATUS_CARD_CLS: Record<string, string> = {
  draft: 'bg-[#F3F4F6] border border-dashed border-[#D1D5DB] text-[#6B7280]',
  published: 'bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534]',
  closed: 'bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B7280]',
}

export default function AssignmentTrackerPage() {
  const {
    assignments,
    activeAssignment,
    loading,
    filterSection,
    filterStatus,
    searchQuery,
    fetchAssignments,
    fetchAssignmentDetail,
    createAssignment,
    deleteAssignment,
    gradeSubmission,
    setFilterSection,
    setFilterStatus,
    setSearchQuery,
    setActiveAssignment,
  } = useAssignmentStore()

  const { fetchEvents } = useCalendarStore()

  // Creation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSection, setNewSection] = useState('10-A')
  const [newSubject, setNewSubject] = useState('Mathematics')
  const [newType, setNewType] = useState('homework')
  const [newPoints, setNewPoints] = useState(100)
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 86400 * 1000 * 3).toISOString().split('T')[0])
  const [newDueTime, setNewDueTime] = useState('17:00')
  const [newDescription, setNewDescription] = useState('')
  const [newSyncCalendar, setNewSyncCalendar] = useState(true)

  // Submissions drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [gradingState, setGradingState] = useState<Record<string, { score: number; feedback: string }>>({})
  const [gradeSuccessId, setGradeSuccessId] = useState<string | null>(null)

  // View + filter toolbar state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const sectionMenuRef = useRef<HTMLDivElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sectionMenuRef.current && !sectionMenuRef.current.contains(e.target as Node)) setSectionMenuOpen(false)
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setStatusMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    void fetchAssignments()
    void fetchEvents()
  }, [fetchAssignments, fetchEvents])

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchesSection = filterSection === 'All' || a.section_name === filterSection
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending_grading'
        ? a.submitted_count > a.graded_count
        : a.status === filterStatus
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.section_name.toLowerCase().includes(q)
    return matchesSection && matchesStatus && matchesSearch
  })

  // KPI calculations
  const totalActive = assignments.filter((a) => a.status === 'published').length
  const totalSubmissions = assignments.reduce((acc, a) => acc + a.submitted_count, 0)
  const totalPossible = assignments.reduce((acc, a) => acc + (a.total_students || 28), 0)
  const overallSubmissionRate = totalPossible > 0 ? Math.round((totalSubmissions / totalPossible) * 100) : 0
  const pendingGradingCount = assignments.reduce(
    (acc, a) => acc + Math.max(0, a.submitted_count - a.graded_count),
    0
  )
  const scoredAssignments = assignments.filter((a) => a.avg_score != null)
  const classAvgScore =
    scoredAssignments.length > 0
      ? (scoredAssignments.reduce((acc, a) => acc + (a.avg_score || 0), 0) / scoredAssignments.length).toFixed(1)
      : '86.5'

  // Open Submissions Drawer
  const handleOpenDetail = async (asg: AssignmentSummaryItem) => {
    const detail = await fetchAssignmentDetail(asg.id)
    if (detail) {
      // Initialize grading state
      const initial: Record<string, { score: number; feedback: string }> = {}
      detail.submissions.forEach((s) => {
        initial[s.student_id] = {
          score: s.score != null ? s.score : asg.total_points,
          feedback: s.feedback || '',
        }
      })
      setGradingState(initial)
      setDrawerOpen(true)
    }
  }

  // Handle Grade Submission
  const handleSaveGrade = async (sub: SubmissionItem) => {
    if (!activeAssignment) return
    const current = gradingState[sub.student_id] || { score: activeAssignment.total_points, feedback: '' }
    await gradeSubmission(activeAssignment.id, sub.student_id, current.score, current.feedback)
    setGradeSuccessId(sub.student_id)
    setTimeout(() => setGradeSuccessId(null), 1500)
  }

  // Handle Create Assignment Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const dueIso = `${newDueDate}T${newDueTime}:00Z`
    await createAssignment({
      title: newTitle.trim(),
      description: newDescription.trim(),
      section_name: newSection,
      subject: newSubject,
      type: newType as any,
      total_points: Number(newPoints) || 100,
      due_date: dueIso,
      status: 'published',
      sync_calendar: newSyncCalendar,
    })

    setCreateModalOpen(false)
    setNewTitle('')
    setNewDescription('')
  }

  const activeStatusLabel = STATUS_CHOICES.find((s) => s.id === filterStatus)?.label ?? 'All'
  const activeSectionLabel = filterSection === 'All' ? 'All Sections' : filterSection

  return (
    <div className="min-h-full bg-[#FFFBF0]">
      <PageHeader
        title="Assignment Tracker"
        description="Track student submissions, grade homework, and synchronize deadlines with My Calendar."
      />

      <div className="px-8 pt-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          eyebrow="Active Assignments" metric={totalActive} sub="Currently Published"
          icon={<BookOpen className="w-4 h-4" />} accent="#8A7F6B" iconBg="#F2F1ED"
        />
        <SummaryCard
          eyebrow="Submission Rate" metric={`${overallSubmissionRate}%`} sub="All Assignments"
          icon={<CheckCircle2 className="w-4 h-4" />} accent="#8A6D00" iconBg="#FFF4CC"
        />
        <SummaryCard
          eyebrow="Pending Review" metric={pendingGradingCount} sub="Awaiting Grades"
          icon={<Clock className="w-4 h-4" />} accent="#B45309" iconBg="#FFEDD5"
        />
        <SummaryCard
          eyebrow="Class Score Avg" metric={`${classAvgScore}%`} sub="Across Graded Work"
          icon={<Award className="w-4 h-4" />} accent="#2F6F46" iconBg="#E6F7ED"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="px-8 pb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments by title, description..."
            className={`${searchInputClass} pl-10`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="h-10 px-4 bg-[#11181C] hover:bg-black text-white rounded-[12px] text-[14px] font-medium flex items-center gap-2 shadow-sm shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>

          <div className="flex items-center bg-[#F8F5EE] border border-[#E5E7EB] rounded-[10px] p-[3px] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                viewMode === 'grid' ? 'bg-[#11181C] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#11181C]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                viewMode === 'list' ? 'bg-[#11181C] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#11181C]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="relative shrink-0" ref={sectionMenuRef}>
            <button
              onClick={() => { setSectionMenuOpen((v) => !v); setStatusMenuOpen(false) }}
              className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[13px] font-medium text-[#11181C] flex items-center gap-2 shadow-sm min-w-[135px] justify-between"
            >
              <span>{activeSectionLabel}</span>
              <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${sectionMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {sectionMenuOpen && (
              <div className="absolute right-0 top-[44px] w-[160px] bg-white border border-[#E5E7EB] rounded-[12px] shadow-lg p-1 z-30">
                {SECTION_CHOICES.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => { setFilterSection(sec); setSectionMenuOpen(false) }}
                    className={`w-full text-left px-3 py-2 rounded-[8px] text-[13px] ${
                      filterSection === sec ? 'bg-[#F8F5EE] font-medium' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {sec === 'All' ? 'All Sections' : sec}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative shrink-0" ref={statusMenuRef}>
            <button
              onClick={() => { setStatusMenuOpen((v) => !v); setSectionMenuOpen(false) }}
              className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[13px] font-medium text-[#11181C] flex items-center gap-2 shadow-sm min-w-[150px] justify-between"
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT_CLS[filterStatus] ?? 'bg-[#9CA3AF]'}`} />
                {activeStatusLabel}
              </span>
              <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusMenuOpen && (
              <div className="absolute right-0 top-[44px] w-[180px] bg-white border border-[#E5E7EB] rounded-[12px] shadow-lg p-1 z-30">
                {STATUS_CHOICES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => { setFilterStatus(st.id); setStatusMenuOpen(false) }}
                    className={`w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2 ${
                      filterStatus === st.id ? 'bg-[#F8F5EE] font-medium' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT_CLS[st.id]}`} />
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignments Card Grid */}
      {loading ? (
        <div className="px-8 pb-8 py-20 text-center text-[#6B7280] flex flex-col items-center gap-2">
          <span className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#11181C] rounded-full animate-spin" />
          <span className="text-sm">Loading assignments...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="px-8 pb-8">
          <div className="py-16 text-center bg-[#FFFEF8] border border-dashed border-[#E5DDC8] rounded-[16px] p-8 space-y-3">
            <ClipboardList className="w-10 h-10 text-[#9CA3AF] mx-auto" />
            <div className="font-semibold text-[#11181C]">No assignments found</div>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              No assignments match your search or filter. Create your first assignment or select &quot;All&quot;.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#11181C] text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Assignment
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`px-8 pb-8 ${
            viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-3'
          }`}
        >
          {filteredAssignments.map((asg) => {
            const subRate = asg.total_students > 0 ? Math.round((asg.submitted_count / asg.total_students) * 100) : 0
            const formattedDate = asg.due_date ? new Date(asg.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null

            return (
              <div
                key={asg.id}
                onClick={() => handleOpenDetail(asg)}
                className={`bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow cursor-pointer group ${
                  viewMode === 'list' ? 'flex flex-col lg:flex-row lg:items-center gap-4' : 'flex flex-col justify-between'
                }`}
              >
                <div className={viewMode === 'list' ? 'flex-1' : undefined}>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="h-6 px-2 inline-flex items-center bg-[#F3F1EB] border border-[#E5E0D5] rounded-[6px] text-[11px] font-medium font-mono text-[#5A554B]">
                        {asg.section_name}
                      </span>
                      <span className="h-6 px-2 inline-flex items-center bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] text-[11px] font-medium text-[#92400E] capitalize">
                        {asg.type}
                      </span>
                      <span className="h-6 px-2 inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-[6px] text-[11px] font-mono text-[#6B7280]">
                        {asg.total_points} pts
                      </span>
                    </div>

                    <span
                      className={`h-6 px-2.5 inline-flex items-center rounded-full text-[11px] font-medium ${
                        STATUS_CARD_CLS[asg.status] ?? STATUS_CARD_CLS.closed
                      }`}
                    >
                      {asg.status.charAt(0).toUpperCase() + asg.status.slice(1)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className={`${titleClass} line-clamp-2 mb-1.5 group-hover:text-black transition-colors`}>
                    {asg.title}
                  </h3>
                  <p className={`${bodyClass} line-clamp-2 mb-4`}>
                    {asg.description || 'No instructions provided.'}
                  </p>
                </div>

                <div className={viewMode === 'list' ? 'lg:w-[260px] w-full' : undefined}>
                  {/* Submission Progress Meter */}
                  <div className="pt-3 border-t border-[#F3F4F6] space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#11181C]">
                      <span>Submissions: {asg.submitted_count}/{asg.total_students}</span>
                      <span className="text-[#6B7280]">{subRate}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#F3F1EB] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${subRate}%`, background: subRate >= 50 ? '#86C87E' : '#D6CFC0' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#8A8F98] pt-0.5">
                      <div className="flex items-center gap-3">
                        <span>Graded: {asg.graded_count}</span>
                        <span>Ungraded: {Math.max(0, asg.submitted_count - asg.graded_count)}</span>
                      </div>
                      {asg.avg_score != null && (
                        <span className="font-bold text-[#11181C]">Avg: {asg.avg_score}%</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Card Actions */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    {formattedDate ? (
                      <div className="flex items-center gap-1.5 font-mono font-medium text-[#11181C]">
                        <Calendar className="w-3.5 h-3.5 text-[#C8A86A]" />
                        <span>Due {formattedDate}</span>
                      </div>
                    ) : (
                      <span className="text-[#9CA3AF]">No due date</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete assignment "${asg.title}"?`)) {
                          void deleteAssignment(asg.id)
                        }
                      }}
                      className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[#6B7280] group-hover:text-[#11181C] flex items-center gap-1 font-medium">
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ================= SUBMISSIONS DRAWER / MODAL ================= */}
      {drawerOpen && activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-forest/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl h-full bg-[#FCFBF8] border-l border-cream-border shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-cream-border bg-[#FAF9F5] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-forest/5 text-forest border border-cream-border">
                    {activeAssignment.section_name} • {activeAssignment.subject}
                  </span>
                  <span className="text-xs text-forest/60 font-medium">
                    {activeAssignment.total_points} Points
                  </span>
                </div>
                <h2 className="text-lg font-bold text-forest mt-1">{activeAssignment.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-forest/40 hover:text-forest hover:bg-cream transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submissions List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-forest uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gold" />
                  Student Roster Submissions ({activeAssignment.submissions?.length || 0})
                </span>
                <span className="text-forest/60 font-normal">
                  {activeAssignment.graded_count} of {activeAssignment.submitted_count} Graded
                </span>
              </div>

              {activeAssignment.submissions?.length === 0 ? (
                <div className="py-12 text-center text-forest/50 text-xs">
                  No student submissions recorded for this assignment yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAssignment.submissions?.map((sub) => {
                    const isGraded = sub.status === 'graded'
                    const isSubmitted = sub.status === 'submitted'
                    const isLate = sub.status === 'late'
                    const currentGrading = gradingState[sub.student_id] || { score: activeAssignment.total_points, feedback: '' }

                    return (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl border border-cream-border bg-[#FAF9F5] space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-forest text-cream font-bold text-xs flex items-center justify-center">
                              {sub.student_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-forest">{sub.student_name}</div>
                              <div className="text-[11px] text-forest/50">
                                {sub.submitted_at
                                  ? `Submitted: ${new Date(sub.submitted_at).toLocaleDateString()}`
                                  : 'Awaiting submission'}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              isGraded
                                ? 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-forest'
                                : isSubmitted
                                ? 'bg-gold/15 border-gold/40 text-[#8C6D23]'
                                : isLate
                                ? 'bg-danger/15 border-danger/40 text-danger'
                                : 'bg-cream/80 border-cream-border text-forest/50'
                            }`}
                          >
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                        </div>

                        {/* Grading Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-cream-border/60">
                          <div>
                            <label className="block text-[11px] font-medium text-forest/70 mb-1">
                              Score (Max: {activeAssignment.total_points})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={activeAssignment.total_points}
                              value={currentGrading.score ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setGradingState({
                                  ...gradingState,
                                  [sub.student_id]: { ...currentGrading, score: val },
                                })
                              }}
                              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-cream-border bg-white text-forest outline-none focus:border-gold"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-forest/70 mb-1">
                              Teacher Feedback
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="Add encouraging feedback..."
                                value={currentGrading.feedback || ''}
                                onChange={(e) => {
                                  setGradingState({
                                    ...gradingState,
                                    [sub.student_id]: { ...currentGrading, feedback: e.target.value },
                                  })
                                }}
                                className="flex-1 text-xs py-1.5 px-2.5 rounded-lg border border-cream-border bg-white text-forest outline-none focus:border-gold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveGrade(sub)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                                  gradeSuccessId === sub.student_id
                                    ? 'bg-[#7FBF7A] text-forest'
                                    : 'bg-forest hover:bg-forest-raised text-cream'
                                }`}
                              >
                                {gradeSuccessId === sub.student_id ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Saved
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5 text-gold" />
                                    Save
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-cream-border bg-[#FAF9F5] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-raised text-cream text-xs font-semibold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE ASSIGNMENT MODAL ================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-[#FCFBF8] border border-cream-border rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-forest/5 text-forest">
                  <ClipboardList className="w-5 h-5 text-gold" />
                </span>
                <h3 className="font-semibold text-forest text-base">Create New Assignment</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-forest/40 hover:text-forest p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-forest/70 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Quadratic Equations: Exercise 4.2 Practice Set"
                  className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                />
              </div>

              {/* Section & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">
                    Target Section
                  </label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                  >
                    <option value="10-A">Class 10 - Section A</option>
                    <option value="10-B">Class 10 - Section B</option>
                    <option value="9-A">Class 9 - Section A</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                  >
                    {TYPE_CHOICES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & Points */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">
                    Total Points
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Description & Instructions */}
              <div>
                <label className="block text-xs font-semibold text-forest/70 mb-1">
                  Instructions &amp; Prompts
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide step-by-step instructions or problems to solve..."
                  className="w-full p-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold resize-y"
                />
              </div>

              {/* Calendar Sync Checkbox */}
              <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 flex items-center gap-2.5 text-xs text-forest">
                <input
                  type="checkbox"
                  id="syncCalendar"
                  checked={newSyncCalendar}
                  onChange={(e) => setNewSyncCalendar(e.target.checked)}
                  className="rounded border-cream-border text-forest focus:ring-gold"
                />
                <label htmlFor="syncCalendar" className="cursor-pointer font-medium">
                  Add homework due date directly to <strong>My Calendar</strong>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-cream-border text-forest/70 text-xs font-semibold hover:bg-[#FAF9F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-raised text-cream text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
