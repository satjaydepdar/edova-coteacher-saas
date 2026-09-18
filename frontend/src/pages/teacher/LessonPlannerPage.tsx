import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  CalendarDays,
  FileText,
  Trash2,
  ArrowLeft,
  Sparkles,
  Layers,
  Award,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  X,
  MapPin,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SearchToolbar from '../../components/SearchToolbar'
import { useLessonPlanStore, type LessonPlanItem } from '../../store/lessonPlanStore'
import { useSyllabusStore } from '../../store/syllabusStore'
import { useCalendarStore } from '../../store/calendarStore'

const STATUS_FILTERS = [
  { id: 'all', label: 'All Plans' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'planned', label: 'Planned' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'completed', label: 'Completed' },
]

const STATUS_PILL_CLS: Record<string, string> = {
  scheduled: 'bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]',
  planned: 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]',
  draft: 'bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280]',
  completed: 'bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280]',
}

const BLOOM_OPTIONS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
const NEP_OPTIONS = ['Concept', 'Application', 'Critical thinking', 'Case Study']
const CLASS_OPTIONS = ['Class 10', 'Class 9', 'Class 11', 'Class 12']
const SECTION_OPTIONS = ['Section A', 'Section B', 'Section C']
const DURATION_OPTIONS = [30, 40, 45, 60, 90]

export default function LessonPlannerPage() {
  const {
    plans,
    loading,
    filterStatus,
    searchQuery,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    schedulePlan,
    setFilterStatus,
    setSearchQuery,
  } = useLessonPlanStore()

  const { units, fetchPacing } = useSyllabusStore()
  const { fetchEvents } = useCalendarStore()

  const [viewMode, setViewMode] = useState<'library' | 'editor'>('library')
  const [editingPlan, setEditingPlan] = useState<Partial<LessonPlanItem> | null>(null)
  const [isNewPlan, setIsNewPlan] = useState(false)

  // Library toolbar UI state
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid')
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Scheduling modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [planToSchedule, setPlanToSchedule] = useState<LessonPlanItem | null>(null)
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleTime, setScheduleTime] = useState('09:30')
  const [scheduleLocation, setScheduleLocation] = useState('Room 204')
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    void fetchPlans()
    void fetchPacing()
    void fetchEvents()
  }, [fetchPlans, fetchPacing, fetchEvents])

  // Filtered plans
  const filteredPlans = plans.filter((p) => {
    const matchesFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'drafts'
        ? p.status === 'draft'
        : p.status === filterStatus
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.objective.toLowerCase().includes(q) ||
      p.class_label.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: plans.length, scheduled: 0, planned: 0, drafts: 0, completed: 0 }
    plans.forEach((p) => {
      if (p.status === 'draft') counts.drafts += 1
      else if (counts[p.status] !== undefined) counts[p.status] += 1
    })
    return counts
  }, [plans])

  const activeStatusLabel = STATUS_FILTERS.find((f) => f.id === filterStatus)?.label ?? 'All Plans'

  // Open Editor for new plan
  const handleOpenNewPlan = () => {
    setIsNewPlan(true)
    setEditingPlan({
      title: '',
      subject: 'Mathematics',
      class_label: 'Class 10',
      section_name: 'Section A',
      unit_id: units[0]?.id || 'unit-2',
      chapter_id: units[0]?.chapters[0]?.id || 'ch-2-1',
      topic_id: units[0]?.chapters[0]?.topics[0]?.id || '',
      duration_minutes: 45,
      objective: '',
      outcomes: ['Identify key principles', 'Solve representative textbook problems'],
      bloom_levels: ['Understand', 'Apply'],
      nep_tags: ['Concept', 'Application'],
      phases: {
        warmup: '',
        instruction: '',
        activity: '',
        assessment: '',
        homework: '',
      },
      materials: ['NCERT Mathematics Class 10 Textbook'],
      status: 'draft',
    })
    setViewMode('editor')
  }

  // Open Editor for existing plan
  const handleEditPlan = (plan: LessonPlanItem) => {
    setIsNewPlan(false)
    setEditingPlan({ ...plan })
    setViewMode('editor')
  }

  // Save Plan action
  const handleSavePlan = async (targetStatus?: 'draft' | 'planned') => {
    if (!editingPlan || !editingPlan.title?.trim()) {
      alert('Please provide a lesson plan title.')
      return
    }

    const payload = {
      ...editingPlan,
      status: targetStatus ?? editingPlan.status ?? 'draft',
      title: editingPlan.title.trim(),
      objective: editingPlan.objective || '',
      outcomes: editingPlan.outcomes || [],
      bloom_levels: editingPlan.bloom_levels || [],
      nep_tags: editingPlan.nep_tags || [],
      phases: editingPlan.phases || { warmup: '', instruction: '', activity: '', assessment: '', homework: '' },
      materials: editingPlan.materials || [],
      duration_minutes: editingPlan.duration_minutes || 45,
      class_label: editingPlan.class_label || 'Class 10',
      section_name: editingPlan.section_name || 'Section A',
      subject: editingPlan.subject || 'Mathematics',
    } as LessonPlanItem

    if (isNewPlan) {
      await createPlan(payload)
    } else if (editingPlan.id) {
      await updatePlan(editingPlan.id, payload)
    }

    setViewMode('library')
    setEditingPlan(null)
  }

  // Open schedule modal
  const handleOpenScheduleModal = (plan: LessonPlanItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPlanToSchedule(plan)
    setScheduleDate(plan.scheduled_date || new Date().toISOString().split('T')[0])
    setScheduleTime('09:30')
    setScheduleLocation('Room 204')
    setScheduleSuccessMsg(null)
    setScheduleModalOpen(true)
  }

  // Confirm schedule to calendar
  const handleConfirmSchedule = async () => {
    if (!planToSchedule) return
    await schedulePlan(planToSchedule.id, {
      scheduled_date: scheduleDate,
      start_time: scheduleTime,
      location: scheduleLocation,
    })
    setScheduleSuccessMsg(`Scheduled on ${scheduleDate} at ${scheduleTime} in ${scheduleLocation}. Event synced to My Calendar!`)
    setTimeout(() => {
      setScheduleModalOpen(false)
      setPlanToSchedule(null)
      setScheduleSuccessMsg(null)
    }, 1800)
  }

  // Toggle Bloom tag
  const toggleBloom = (level: string) => {
    if (!editingPlan) return
    const current = editingPlan.bloom_levels || []
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level]
    setEditingPlan({ ...editingPlan, bloom_levels: updated })
  }

  // Toggle NEP tag
  const toggleNep = (tag: string) => {
    if (!editingPlan) return
    const current = editingPlan.nep_tags || []
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    setEditingPlan({ ...editingPlan, nep_tags: updated })
  }

  const PHASE_LABELS = [
    { key: 'warmup', label: 'Warm' },
    { key: 'instruction', label: 'Direct' },
    { key: 'activity', label: 'Active' },
    { key: 'assessment', label: 'Check' },
    { key: 'homework', label: 'Home' },
  ] as const

  function renderPlanCard(plan: LessonPlanItem) {
    const statusCls = STATUS_PILL_CLS[plan.status] || STATUS_PILL_CLS.draft
    const metaRow = (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="h-[22px] px-2 flex items-center rounded-[6px] bg-[#F3F1EB] border border-[#E5E0D5] text-[11px] font-mono font-medium tracking-[0.04em] text-[#44403C]">
          {plan.class_label} • {plan.section_name}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-mono text-[#8A8F98]">
          <Clock className="w-3 h-3" />
          {plan.duration_minutes}m
        </span>
      </div>
    )
    const statusPill = (
      <span className={`shrink-0 h-6 px-2.5 rounded-full border flex items-center font-mono text-[11px] font-medium tracking-[0.02em] ${statusCls}`}>
        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
      </span>
    )
    const phasesBlock = (
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#8A8F98] mb-2">
          5E Lesson Phases
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PHASE_LABELS.map((ph) => {
            const hasContent = Boolean(plan.phases?.[ph.key as keyof typeof plan.phases])
            return (
              <span
                key={ph.key}
                title={ph.label}
                className={`h-7 px-2.5 rounded-[8px] border flex items-center text-[11px] font-medium tracking-[-0.01em] ${
                  hasContent
                    ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]'
                    : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF]'
                }`}
              >
                {ph.label}
              </span>
            )
          })}
        </div>
      </div>
    )
    const tagsBlock = (
      <div className="flex flex-wrap gap-1.5">
        {plan.bloom_levels?.slice(0, 3).map((b) => (
          <span key={b} className="h-6 px-2 rounded-[6px] bg-[#FFFBEB] border border-[#FDE68A] text-[11px] font-medium text-[#92400E] flex items-center">
            {b}
          </span>
        ))}
        {plan.nep_tags?.slice(0, 2).map((n) => (
          <span key={n} className="h-6 px-2 rounded-[6px] bg-[#FFFBEB] border border-[#FDE68A] text-[11px] font-medium text-[#92400E] flex items-center">
            {n}
          </span>
        ))}
      </div>
    )
    const dateBlock = (
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-[#C8A86A]" />
        <span className="font-mono text-[12px] font-medium text-[#11181C]">
          {plan.status === 'scheduled' && plan.scheduled_date ? plan.scheduled_date : 'Schedule'}
        </span>
      </div>
    )
    const actionsBlock = (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Delete plan "${plan.title}"?`)) void deletePlan(plan.id)
          }}
          className="w-7 h-7 rounded-[8px] hover:bg-[#F9FAFB] flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
          title="Delete plan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {plan.status === 'scheduled' ? (
          <span className="text-[12px] font-medium text-[#6B7280] flex items-center gap-1">
            Open <ChevronRight className="w-3.5 h-3.5" />
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => handleOpenScheduleModal(plan, e)}
            className="h-8 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[12px] font-medium text-[#11181C] hover:bg-[#F8F5EE] flex items-center gap-1 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#C8A86A]" />
            Schedule
          </button>
        )}
      </div>
    )

    if (layoutMode === 'list') {
      return (
        <div
          key={plan.id}
          onClick={() => handleEditPlan(plan)}
          className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#E5E0D5] transition-all duration-200 flex flex-col lg:flex-row overflow-hidden cursor-pointer group"
        >
          <div className="flex-1 p-5 min-w-0">
            <div className="flex items-start justify-between gap-3">
              {metaRow}
              {statusPill}
            </div>
            <h3 className="mt-3 text-[16px] font-bold leading-[1.3] tracking-[-0.01em] text-[#11181C] line-clamp-2">
              {plan.title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-[1.5] text-[#6B7280] line-clamp-2">
              {plan.objective || 'No broad objective defined.'}
            </p>
          </div>
          <div className="lg:w-[360px] shrink-0 p-5 bg-[#FFFEFB] border-t lg:border-t-0 lg:border-l border-[#F3F4F6] flex flex-col justify-between gap-4">
            <div className="space-y-3">
              {phasesBlock}
              {tagsBlock}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6] lg:border-0 lg:pt-0">
              {dateBlock}
              {actionsBlock}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={plan.id}
        onClick={() => handleEditPlan(plan)}
        className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#E5E0D5] transition-all duration-200 flex flex-col cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2">
          {metaRow}
          {statusPill}
        </div>
        <h3 className="mt-3.5 text-[16px] font-bold leading-[1.3] tracking-[-0.01em] text-[#11181C] line-clamp-2">
          {plan.title}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.5] text-[#6B7280] line-clamp-2 min-h-[40px]">
          {plan.objective || 'No broad objective defined.'}
        </p>
        <div className="h-px bg-[#F3F4F6] my-4" />
        {phasesBlock}
        <div className="mt-3">{tagsBlock}</div>
        <div className="mt-auto pt-4 flex items-center justify-between">
          {dateBlock}
          {actionsBlock}
        </div>
      </div>
    )
  }

  return (
    <div className={viewMode === 'library' ? 'min-h-full bg-[#FFFBF0]' : 'p-6 lg:p-8 space-y-6'}>
      {/* ================= VIEW 1: PLAN LIBRARY ================= */}
      {viewMode === 'library' && (
        <>
          <PageHeader
            title="Lesson Planner"
            description="Author, organize, and schedule NEP 2020 competency-grounded pedagogical lesson plans."
          />

          <SearchToolbar>
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-[18px] h-[18px] text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plans by title, objective, or class..."
                className="w-full h-11 pl-11 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-[14px] placeholder:text-[#9CA3AF] outline-none focus:border-[#11181C]/20 focus:ring-4 focus:ring-[#11181C]/[0.04] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              />
            </div>

            <div className="flex items-center p-[3px] bg-[#F8F5EE] border border-[#E5E7EB] rounded-[10px] shrink-0">
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                aria-label="Grid view"
                className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                  layoutMode === 'grid' ? 'bg-[#11181C] text-white shadow-sm' : 'text-[#8A8F98] hover:text-[#6B7280]'
                }`}
              >
                <LayoutGrid className="w-[18px] h-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('list')}
                aria-label="List view"
                className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                  layoutMode === 'list' ? 'bg-[#11181C] text-white shadow-sm' : 'text-[#8A8F98] hover:text-[#6B7280]'
                }`}
              >
                <List className="w-[18px] h-[18px]" />
              </button>
            </div>

            <div className="relative shrink-0" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setStatusMenuOpen((v) => !v)}
                className="w-[180px] h-10 px-3.5 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between text-[13px] font-medium text-[#11181C] shadow-sm hover:bg-[#FFFEFB] transition-colors cursor-pointer"
              >
                <span>{activeStatusLabel}</span>
                <ChevronDown className={`w-4 h-4 text-[#8A8F98] shrink-0 ml-2 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusMenuOpen && (
                <div className="absolute top-[46px] right-0 w-[220px] bg-white border border-[#E5E7EB] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.10)] p-1.5 z-30">
                  {STATUS_FILTERS.map((filter) => {
                    const active = filterStatus === filter.id
                    const count = statusCounts[filter.id] ?? 0
                    return (
                      <div
                        key={filter.id}
                        onClick={() => {
                          setFilterStatus(filter.id)
                          setStatusMenuOpen(false)
                        }}
                        className={`px-3 py-2.5 rounded-[8px] text-[13px] cursor-pointer flex items-center justify-between transition-colors ${
                          active ? 'bg-[#11181C] text-white' : 'hover:bg-[#F8F5EE] text-[#374151]'
                        }`}
                      >
                        <span className="font-medium">{filter.label}</span>
                        <span className={`font-mono text-[11px] px-2 h-5 rounded-full flex items-center justify-center min-w-[22px] ${
                          active ? 'bg-white/15 text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}>
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleOpenNewPlan}
              className="h-10 px-4 bg-[#11181C] rounded-xl text-white text-[14px] font-medium flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.12)] hover:bg-black transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Lesson Plan
            </button>
          </SearchToolbar>

          <div className="px-8 pb-8">
            {loading ? (
              <div className="py-20 text-center text-[#6B7280] flex flex-col items-center gap-2">
                <span className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#11181C] rounded-full animate-spin" />
                <span className="text-sm">Loading lesson plans...</span>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="py-16 text-center bg-white border border-dashed border-[#E5E7EB] rounded-2xl p-8 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#F8F5EE] flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#8A8F98]" />
                </div>
                <div className="font-semibold text-[#11181C]">No lesson plans found</div>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                  No lesson plans match your search or filter. Create your first pedagogical plan or select &quot;All Plans&quot;.
                </p>
                <button
                  onClick={handleOpenNewPlan}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#11181C] text-white text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Plan
                </button>
              </div>
            ) : (
              <div className={layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
                {filteredPlans.map((plan) => renderPlanCard(plan))}
              </div>
            )}
          </div>
        </>
      )}

      {viewMode === 'editor' && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setViewMode('library')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cream-border bg-[#FCFBF8] text-forest/80 hover:text-forest text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </button>
        </div>
      )}

      {/* ================= VIEW 2: PLAN STUDIO / EDITOR ================= */}
      {viewMode === 'editor' && editingPlan && (
        <div className="space-y-6">
          {/* Top Actions Bar */}
          <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={editingPlan.title || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                placeholder="Lesson Plan Title (e.g. Quadratic Equations: Factorisation & Roots)..."
                className="w-full text-lg font-bold text-forest bg-transparent border-b border-cream-border focus:border-gold outline-none pb-1 placeholder:text-forest/30 font-display"
              />
              <div className="flex items-center gap-2 mt-2 text-xs text-forest/60">
                <span>Subject: {editingPlan.subject}</span>
                <span>•</span>
                <span>Class: {editingPlan.class_label} ({editingPlan.section_name})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('library')}
                className="px-3 py-2 rounded-xl border border-cream-border text-forest/70 hover:text-forest text-xs font-semibold bg-[#FAF9F5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePlan('draft')}
                className="px-3.5 py-2 rounded-xl border border-cream-border text-forest hover:bg-forest/5 text-xs font-semibold bg-[#FCFBF8] transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSavePlan('planned')}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-raised text-cream text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                Save &amp; Complete Plan
              </button>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Pedagogical Metadata & Curriculum */}
            <div className="space-y-6">
              {/* Card 1: Curriculum Alignment */}
              <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-forest uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-gold" />
                  Curriculum &amp; Class Grounding
                </div>

                {/* Class & Section */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-forest/70 mb-1">Class Level</label>
                    <select
                      value={editingPlan.class_label}
                      onChange={(e) => setEditingPlan({ ...editingPlan, class_label: e.target.value })}
                      className="w-full text-xs py-2 px-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold"
                    >
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-forest/70 mb-1">Section</label>
                    <select
                      value={editingPlan.section_name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, section_name: e.target.value })}
                      className="w-full text-xs py-2 px-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold"
                    >
                      {SECTION_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-forest/70 mb-1">Period Duration</label>
                  <div className="flex items-center gap-1.5">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEditingPlan({ ...editingPlan, duration_minutes: d })}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          editingPlan.duration_minutes === d
                            ? 'bg-forest text-cream border-forest'
                            : 'bg-[#FAF9F5] text-forest/70 border-cream-border hover:border-gold'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Syllabus Unit & Chapter */}
                <div>
                  <label className="block text-xs font-medium text-forest/70 mb-1">CBSE Syllabus Unit</label>
                  <select
                    value={editingPlan.unit_id}
                    onChange={(e) => setEditingPlan({ ...editingPlan, unit_id: e.target.value })}
                    className="w-full text-xs py-2 px-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber}: {u.title} ({u.marks} Marks)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card 2: Bloom's Taxonomy & NEP 2020 Framework */}
              <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-forest uppercase tracking-wider">
                  <Award className="w-4 h-4 text-gold" />
                  Pedagogical Framework
                </div>

                {/* Bloom's Taxonomy Pills */}
                <div>
                  <label className="block text-xs font-medium text-forest/70 mb-1.5">
                    Bloom&apos;s Taxonomy Cognitive Levels
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOOM_OPTIONS.map((level) => {
                      const active = editingPlan.bloom_levels?.includes(level)
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleBloom(level)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            active
                              ? 'bg-forest text-cream border-forest font-semibold shadow-xs'
                              : 'bg-[#FAF9F5] text-forest/70 border-cream-border hover:border-gold/70'
                          }`}
                        >
                          {level}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* NEP 2020 Tag Pills */}
                <div>
                  <label className="block text-xs font-medium text-forest/70 mb-1.5">
                    NEP 2020 Focus Attributes
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {NEP_OPTIONS.map((tag) => {
                      const active = editingPlan.nep_tags?.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleNep(tag)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            active
                              ? 'bg-gold/25 text-[#7A5B17] border-gold font-semibold shadow-xs'
                              : 'bg-[#FAF9F5] text-forest/70 border-cream-border hover:border-gold/70'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Card 3: Teaching Aids & Materials */}
              <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-3">
                <div className="text-xs font-semibold text-forest uppercase tracking-wider">
                  Required Teaching Aids
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editingPlan.materials?.map((mat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[#F5F1E6] text-forest border border-cream-border"
                    >
                      {mat}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingPlan.materials?.filter((_, i) => i !== idx)
                          setEditingPlan({ ...editingPlan, materials: updated })
                        }}
                        className="text-forest/40 hover:text-danger"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add material and press Enter (e.g. Graph paper)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = e.currentTarget.value.trim()
                      if (val) {
                        setEditingPlan({
                          ...editingPlan,
                          materials: [...(editingPlan.materials || []), val],
                        })
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Right Column: Objectives & 5E Structured Procedure */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 4: Learning Objectives & Outcomes */}
              <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-forest uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-gold" />
                  Broad Objective &amp; Learning Outcomes
                </div>

                <div>
                  <label className="block text-xs font-medium text-forest/70 mb-1">
                    Central Learning Objective
                  </label>
                  <textarea
                    rows={2}
                    value={editingPlan.objective || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, objective: e.target.value })}
                    placeholder="State the core conceptual target of this lesson (e.g. Master splitting the middle term to solve quadratic equations)..."
                    className="w-full text-xs p-3 rounded-xl border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold resize-y leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-forest/70 mb-1">
                    Specific Measurable Outcomes (Students will be able to...)
                  </label>
                  <div className="space-y-2">
                    {editingPlan.outcomes?.map((out, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                        <input
                          type="text"
                          value={out}
                          onChange={(e) => {
                            const updated = [...(editingPlan.outcomes || [])]
                            updated[idx] = e.target.value
                            setEditingPlan({ ...editingPlan, outcomes: updated })
                          }}
                          className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingPlan.outcomes?.filter((_, i) => i !== idx)
                            setEditingPlan({ ...editingPlan, outcomes: updated })
                          }}
                          className="p-1 text-forest/40 hover:text-danger"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setEditingPlan({
                          ...editingPlan,
                          outcomes: [...(editingPlan.outcomes || []), ''],
                        })
                      }
                      className="text-xs text-forest/70 hover:text-forest font-medium flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-gold" />
                      Add Outcome
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 5: 5E Structured Lesson Procedure */}
              <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-forest uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-gold" />
                    5-Phase Pedagogical Procedure (5E Model)
                  </div>
                  <span className="text-[11px] text-forest/50 font-medium">Standard 45-min Period</span>
                </div>

                {/* Phase 1: Warm-up */}
                <div className="p-3.5 rounded-xl border border-cream-border bg-[#FAF9F5] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-forest">
                    <span>1. Warm-Up / Prior Knowledge Hook (5–10 mins)</span>
                    <span className="text-[11px] font-normal text-forest/60">Retrieval &amp; Engagement</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editingPlan.phases?.warmup || ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        phases: { ...editingPlan.phases!, warmup: e.target.value },
                      })
                    }
                    placeholder="Quick hook, puzzle prompt, or prior concept retrieval question..."
                    className="w-full text-xs p-2.5 rounded-lg border border-cream-border/70 bg-white text-forest outline-none focus:border-gold"
                  />
                </div>

                {/* Phase 2: Direct Instruction */}
                <div className="p-3.5 rounded-xl border border-cream-border bg-[#FAF9F5] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-forest">
                    <span>2. Direct Instruction &amp; Misconceptions (15–20 mins)</span>
                    <span className="text-[11px] font-normal text-forest/60">Core Theory &amp; Modeling</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editingPlan.phases?.instruction || ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        phases: { ...editingPlan.phases!, instruction: e.target.value },
                      })
                    }
                    placeholder="Teacher walkthrough, board derivations, and common sign/concept error traps..."
                    className="w-full text-xs p-2.5 rounded-lg border border-cream-border/70 bg-white text-forest outline-none focus:border-gold"
                  />
                </div>

                {/* Phase 3: Active Learning / Activity */}
                <div className="p-3.5 rounded-xl border border-cream-border bg-[#FAF9F5] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-forest">
                    <span>3. Guided Practice &amp; Active Learning (15 mins)</span>
                    <span className="text-[11px] font-normal text-forest/60">Collaborative Problem Solving</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editingPlan.phases?.activity || ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        phases: { ...editingPlan.phases!, activity: e.target.value },
                      })
                    }
                    placeholder="Paired worksheet exercise, whiteboard practice, or virtual lab simulation..."
                    className="w-full text-xs p-2.5 rounded-lg border border-cream-border/70 bg-white text-forest outline-none focus:border-gold"
                  />
                </div>

                {/* Phase 4: Formative Check */}
                <div className="p-3.5 rounded-xl border border-cream-border bg-[#FAF9F5] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-forest">
                    <span>4. Formative Assessment / Exit Ticket (5 mins)</span>
                    <span className="text-[11px] font-normal text-forest/60">Understanding Check</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editingPlan.phases?.assessment || ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        phases: { ...editingPlan.phases!, assessment: e.target.value },
                      })
                    }
                    placeholder="Single prompt or exit check question to evaluate individual mastery..."
                    className="w-full text-xs p-2.5 rounded-lg border border-cream-border/70 bg-white text-forest outline-none focus:border-gold"
                  />
                </div>

                {/* Phase 5: Homework */}
                <div className="p-3.5 rounded-xl border border-cream-border bg-[#FAF9F5] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-forest">
                    <span>5. Homework &amp; Extended Practice</span>
                    <span className="text-[11px] font-normal text-forest/60">Retention Task</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editingPlan.phases?.homework || ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        phases: { ...editingPlan.phases!, homework: e.target.value },
                      })
                    }
                    placeholder="NCERT textbook exercises and challenge problem links..."
                    className="w-full text-xs p-2.5 rounded-lg border border-cream-border/70 bg-white text-forest outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCHEDULE TO CALENDAR MODAL ================= */}
      {scheduleModalOpen && planToSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FCFBF8] border border-cream-border rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-forest/5 text-forest">
                  <Calendar className="w-5 h-5 text-gold" />
                </span>
                <h3 className="font-semibold text-forest text-base">Schedule to My Calendar</h3>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="text-forest/40 hover:text-forest p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-cream-border/70 text-xs text-forest space-y-1">
              <div className="font-semibold">{planToSchedule.title}</div>
              <div className="text-forest/60">
                {planToSchedule.class_label} ({planToSchedule.section_name}) • {planToSchedule.duration_minutes} mins
              </div>
            </div>

            {scheduleSuccessMsg ? (
              <div className="p-3.5 rounded-xl bg-[#7FBF7A]/15 border border-[#7FBF7A]/40 text-forest text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                <span>{scheduleSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">
                      Classroom / Venue
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-forest/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={scheduleLocation}
                        onChange={(e) => setScheduleLocation(e.target.value)}
                        placeholder="e.g. Room 204"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-3 py-2 rounded-xl border border-cream-border text-forest/70 text-xs font-semibold hover:bg-[#FAF9F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSchedule}
                    className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-raised text-cream text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    Confirm &amp; Sync to Calendar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
