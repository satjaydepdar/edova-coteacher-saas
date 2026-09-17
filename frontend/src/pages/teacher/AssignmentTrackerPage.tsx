import React, { useEffect, useState } from 'react'
import {
  ClipboardList,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Trash2,
  X,
  ChevronRight,
  BookOpen,
  Layers,
  Award,
  Users,
  Send,
} from 'lucide-react'
import { useAssignmentStore, type AssignmentSummaryItem, type SubmissionItem } from '../../store/assignmentStore'
import { useCalendarStore } from '../../store/calendarStore'

const SECTION_CHOICES = ['All', '10-A', '10-B', '9-A']
const TYPE_CHOICES = [
  { id: 'homework', label: 'Homework' },
  { id: 'worksheet', label: 'Worksheet' },
  { id: 'practice', label: 'Practice Set' },
  { id: 'project', label: 'Project' },
]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-forest flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-forest/5 text-forest border border-cream-border">
              <ClipboardList className="w-6 h-6 text-forest" />
            </span>
            Assignment Tracker
          </h1>
          <p className="text-sm text-forest/65 mt-1">
            Track student submissions, grade homework, and synchronize deadlines with My Calendar.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-raised text-cream font-medium text-sm transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-gold" />
          Create Assignment
        </button>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Assignments */}
        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-forest/5 flex items-center justify-center text-forest border border-cream-border shrink-0">
            <BookOpen className="w-5 h-5 text-forest" />
          </div>
          <div>
            <div className="text-xs text-forest/60 font-medium">Active Assignments</div>
            <div className="text-xl font-bold text-forest">{totalActive}</div>
          </div>
        </div>

        {/* Card 2: Submission Rate */}
        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-forest/5 flex items-center justify-center text-forest border border-cream-border shrink-0">
            <CheckCircle2 className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="text-xs text-forest/60 font-medium">Submission Rate</div>
            <div className="text-xl font-bold text-forest">{overallSubmissionRate}%</div>
          </div>
        </div>

        {/* Card 3: Pending Grading */}
        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center text-[#8C6D23] border border-gold/30 shrink-0">
            <Clock className="w-5 h-5 text-[#8C6D23]" />
          </div>
          <div>
            <div className="text-xs text-forest/60 font-medium">Pending Review</div>
            <div className="text-xl font-bold text-[#8C6D23]">{pendingGradingCount}</div>
          </div>
        </div>

        {/* Card 4: Class Avg Score */}
        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-forest/5 flex items-center justify-center text-forest border border-cream-border shrink-0">
            <Award className="w-5 h-5 text-forest" />
          </div>
          <div>
            <div className="text-xs text-forest/60 font-medium">Class Score Avg</div>
            <div className="text-xl font-bold text-forest">{classAvgScore}%</div>
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card">
        <div className="flex flex-1 items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments by title, description..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-cream-border/70 bg-[#FAF9F5] text-forest placeholder:text-forest/40 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {/* Section Picker */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-forest/60 font-medium hidden sm:inline">Section:</span>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold"
            >
              {SECTION_CHOICES.map((sec) => (
                <option key={sec} value={sec}>{sec === 'All' ? 'All Sections' : `Section ${sec}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'published', label: 'Active' },
            { id: 'pending_grading', label: 'Pending Review' },
            { id: 'draft', label: 'Drafts' },
            { id: 'closed', label: 'Closed' },
          ].map((st) => {
            const active = filterStatus === st.id
            return (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-forest text-cream shadow-xs'
                    : 'bg-[#F5F1E6] text-forest/70 hover:text-forest hover:bg-[#EDE8DC]'
                }`}
              >
                {st.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Assignments Card Grid */}
      {loading ? (
        <div className="py-20 text-center text-forest/50 flex flex-col items-center gap-2">
          <span className="w-6 h-6 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
          <span className="text-sm">Loading assignments...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-cream-border rounded-2xl p-8 space-y-3">
          <ClipboardList className="w-10 h-10 text-forest/30 mx-auto" />
          <div className="font-semibold text-forest">No assignments found</div>
          <p className="text-xs text-forest/60 max-w-sm mx-auto">
            No assignments match your search or filter. Create your first assignment or select &quot;All&quot;.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest text-cream text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-gold" />
            New Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((asg) => {
            const subRate = asg.total_students > 0 ? Math.round((asg.submitted_count / asg.total_students) * 100) : 0
            const isClosed = asg.status === 'closed'
            const formattedDate = asg.due_date ? new Date(asg.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null

            return (
              <div
                key={asg.id}
                onClick={() => handleOpenDetail(asg)}
                className="bg-[#FCFBF8] hover:bg-white border border-cream-border hover:border-gold/60 rounded-2xl p-5 shadow-card hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest/5 text-forest border border-cream-border">
                        {asg.section_name}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gold/15 text-[#8C6D23] border border-gold/30 capitalize">
                        {asg.type}
                      </span>
                      <span className="text-[11px] text-forest/60 font-medium">
                        {asg.total_points} pts
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        isClosed
                          ? 'bg-cream/70 border-cream-border text-forest/60'
                          : 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-forest'
                      }`}
                    >
                      {asg.status.charAt(0).toUpperCase() + asg.status.slice(1)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-base text-forest group-hover:text-forest leading-snug line-clamp-2 mb-1.5">
                    {asg.title}
                  </h3>
                  <p className="text-xs text-forest/65 line-clamp-2 leading-relaxed mb-4">
                    {asg.description || 'No instructions provided.'}
                  </p>

                  {/* Submission Progress Meter */}
                  <div className="mb-4 pt-3 border-t border-cream-border/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-forest">
                      <span>Submissions: {asg.submitted_count}/{asg.total_students}</span>
                      <span className="text-forest/70">{subRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E8E0CC] overflow-hidden">
                      <div
                        className="h-full bg-[#7FBF7A] rounded-full transition-all duration-500"
                        style={{ width: `${subRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-forest/55 pt-0.5">
                      <span>Graded: {asg.graded_count}</span>
                      {asg.avg_score != null ? (
                        <span className="font-semibold text-forest">Avg: {asg.avg_score}%</span>
                      ) : (
                        <span>Ungraded: {Math.max(0, asg.submitted_count - asg.graded_count)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-cream-border/60 flex items-center justify-between text-xs">
                  {formattedDate ? (
                    <div className="flex items-center gap-1.5 text-forest/75 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gold" />
                      <span>Due {formattedDate}</span>
                    </div>
                  ) : (
                    <span className="text-forest/40">No due date</span>
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
                      className="p-1.5 rounded-lg text-forest/40 hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-forest/50 group-hover:text-gold flex items-center font-medium">
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </span>
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
