import React, { useEffect, useState } from 'react'
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
  Edit3,
  ArrowLeft,
  Sparkles,
  Layers,
  Award,
  ChevronRight,
  X,
  MapPin,
} from 'lucide-react'
import { useLessonPlanStore, type LessonPlanItem } from '../../store/lessonPlanStore'
import { useSyllabusStore } from '../../store/syllabusStore'
import { useCalendarStore } from '../../store/calendarStore'

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-forest flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-forest/5 text-forest border border-cream-border">
                <FileText className="w-6 h-6 text-forest" />
              </span>
              Lesson Planner
            </h1>
          </div>
          <p className="text-sm text-forest/65 mt-1">
            Author, organize, and schedule NEP 2020 competency-grounded pedagogical lesson plans.
          </p>
        </div>

        {viewMode === 'library' ? (
          <button
            onClick={handleOpenNewPlan}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-raised text-cream font-medium text-sm transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gold" />
            Create Lesson Plan
          </button>
        ) : (
          <button
            onClick={() => setViewMode('library')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cream-border bg-[#FCFBF8] text-forest/80 hover:text-forest text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </button>
        )}
      </div>

      {/* ================= VIEW 1: PLAN LIBRARY ================= */}
      {viewMode === 'library' && (
        <div className="space-y-5">
          {/* Controls bar: Search & Status Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plans by title, objective, or class..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-cream-border/70 bg-[#FAF9F5] text-forest placeholder:text-forest/40 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All Plans' },
                { id: 'scheduled', label: 'Scheduled' },
                { id: 'planned', label: 'Planned' },
                { id: 'drafts', label: 'Drafts' },
                { id: 'completed', label: 'Completed' },
              ].map((filter) => {
                const active = filterStatus === filter.id
                return (
                  <button
                    key={filter.id}
                    onClick={() => setFilterStatus(filter.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-forest text-cream shadow-xs'
                        : 'bg-[#F5F1E6] text-forest/70 hover:text-forest hover:bg-[#EDE8DC]'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lesson Plans Grid */}
          {loading ? (
            <div className="py-20 text-center text-forest/50 flex flex-col items-center gap-2">
              <span className="w-6 h-6 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
              <span className="text-sm">Loading lesson plans...</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-cream-border rounded-2xl p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-forest/30 mx-auto" />
              <div className="font-semibold text-forest">No lesson plans found</div>
              <p className="text-xs text-forest/60 max-w-sm mx-auto">
                No lesson plans match your search or filter. Create your first pedagogical plan or select &quot;All Plans&quot;.
              </p>
              <button
                onClick={handleOpenNewPlan}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest text-cream text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-gold" />
                New Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => {
                const isScheduled = plan.status === 'scheduled'
                const isPlanned = plan.status === 'planned'

                return (
                  <div
                    key={plan.id}
                    onClick={() => handleEditPlan(plan)}
                    className="bg-[#FCFBF8] hover:bg-white border border-cream-border hover:border-gold/60 rounded-2xl p-5 shadow-card hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest/5 text-forest border border-cream-border">
                            {plan.class_label} • {plan.section_name}
                          </span>
                          <span className="text-[11px] text-forest/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {plan.duration_minutes}m
                          </span>
                        </div>

                        {/* Status chip */}
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                            isScheduled
                              ? 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-forest'
                              : isPlanned
                              ? 'bg-[#D9A94E]/15 border-[#D9A94E]/40 text-[#8C6D23]'
                              : 'bg-cream/70 border-cream-border text-forest/60'
                          }`}
                        >
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </span>
                      </div>

                      {/* Title & Objective */}
                      <h3 className="font-semibold text-base text-forest group-hover:text-forest leading-snug line-clamp-2 mb-1.5">
                        {plan.title}
                      </h3>
                      <p className="text-xs text-forest/65 line-clamp-2 leading-relaxed mb-4">
                        {plan.objective || 'No broad objective defined.'}
                      </p>

                      {/* 5-Phase Mini Flow Indicators */}
                      <div className="mb-4 pt-3 border-t border-cream-border/60">
                        <div className="text-[10px] font-semibold text-forest/50 uppercase tracking-wider mb-1.5">
                          5E Lesson Phases
                        </div>
                        <div className="grid grid-cols-5 gap-1 text-[10px] font-medium text-center">
                          {[
                            { key: 'warmup', label: 'Warm' },
                            { key: 'instruction', label: 'Direct' },
                            { key: 'activity', label: 'Active' },
                            { key: 'assessment', label: 'Check' },
                            { key: 'homework', label: 'Home' },
                          ].map((ph) => {
                            const hasContent = Boolean(plan.phases?.[ph.key as keyof typeof plan.phases])
                            return (
                              <div
                                key={ph.key}
                                className={`py-1 rounded px-0.5 truncate transition-colors ${
                                  hasContent
                                    ? 'bg-[#7FBF7A]/20 text-forest border border-[#7FBF7A]/30 font-semibold'
                                    : 'bg-[#F5F1E6] text-forest/40 border border-cream-border/40'
                                }`}
                                title={ph.label}
                              >
                                {ph.label}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Bloom's & NEP Tag chips */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {plan.bloom_levels?.slice(0, 3).map((b) => (
                          <span
                            key={b}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-forest/5 text-forest border border-cream-border"
                          >
                            {b}
                          </span>
                        ))}
                        {plan.nep_tags?.slice(0, 2).map((n) => (
                          <span
                            key={n}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-[#8C6D23] border border-gold/30"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-cream-border/60 flex items-center justify-between text-xs">
                      {isScheduled && plan.scheduled_date ? (
                        <div className="flex items-center gap-1.5 text-forest/80 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gold" />
                          <span>{plan.scheduled_date}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenScheduleModal(plan, e)}
                          className="text-forest/70 hover:text-forest hover:underline font-medium flex items-center gap-1"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-gold" />
                          Schedule
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete plan "${plan.title}"?`)) {
                              void deletePlan(plan.id)
                            }
                          }}
                          className="p-1.5 rounded-lg text-forest/40 hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-forest/40 group-hover:text-gold flex items-center font-medium">
                          Open <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
