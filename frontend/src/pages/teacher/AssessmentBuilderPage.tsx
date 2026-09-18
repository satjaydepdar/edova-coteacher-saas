import React, { useEffect, useRef, useState } from 'react'
import {
  FileQuestion,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Pencil,
} from 'lucide-react'
import {
  useAssessmentStore,
  type AssessmentSummaryItem,
  type AssessmentDetailItem,
  type AssessmentSection,
  type QuestionItem,
} from '../../store/assessmentStore'
import { useCalendarStore } from '../../store/calendarStore'
import PageHeader from '../../components/PageHeader'
import { searchInputClass } from '../../components/SearchToolbar'

const BLUEPRINT_CHOICES = [
  { id: 'all', label: 'All Blueprints' },
  { id: 'cbse_80m', label: 'CBSE 80M Board Paper' },
  { id: 'periodic_40m', label: 'Periodic Test (40M)' },
  { id: 'unit_20m', label: 'Unit Diagnostic (20M)' },
]
const STATUS_CHOICES = [
  { id: 'all', label: 'All Papers' },
  { id: 'ready', label: 'Ready' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'draft', label: 'Drafts' },
]
const STATUS_DOT_CLS: Record<string, string> = {
  all: 'bg-[#9CA3AF]',
  ready: 'bg-[#22C55E]',
  scheduled: 'bg-[#3B82F6]',
  draft: 'bg-[#D1D5DB]',
}
const STATUS_CARD_CLS: Record<string, string> = {
  draft: 'bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563]',
  ready: 'bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534]',
  scheduled: 'bg-[#DBEAFE] border border-[#BFDBFE] text-[#1E40AF]',
  completed: 'bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563]',
}

const BLUEPRINT_TEMPLATES = [
  {
    id: 'cbse_80m',
    name: 'CBSE 80-Mark Board Exam',
    duration: 180,
    marks: 80,
    sections: [
      { id: 'sec-a', name: 'Section A', type: 'mcq', marks_per_q: 1, count: 20, desc: 'Multiple Choice Questions' },
      { id: 'sec-b', name: 'Section B', type: 'short_answer_1', marks_per_q: 2, count: 5, desc: 'Very Short Answer' },
      { id: 'sec-c', name: 'Section C', type: 'short_answer_2', marks_per_q: 3, count: 6, desc: 'Short Answer' },
      { id: 'sec-d', name: 'Section D', type: 'long_answer', marks_per_q: 5, count: 4, desc: 'Long Answer' },
      { id: 'sec-e', name: 'Section E', type: 'case_study', marks_per_q: 4, count: 3, desc: 'Case-Based Integrated' },
    ],
  },
  {
    id: 'periodic_40m',
    name: 'Periodic Assessment (40 Marks)',
    duration: 90,
    marks: 40,
    sections: [
      { id: 'sec-a', name: 'Section A', type: 'mcq', marks_per_q: 1, count: 10, desc: 'MCQs' },
      { id: 'sec-b', name: 'Section B', type: 'short_answer_1', marks_per_q: 2, count: 6, desc: 'Short Answer I' },
      { id: 'sec-c', name: 'Section C', type: 'short_answer_2', marks_per_q: 3, count: 6, desc: 'Short Answer II' },
    ],
  },
  {
    id: 'unit_20m',
    name: 'Unit Diagnostic Quiz (20 Marks)',
    duration: 40,
    marks: 20,
    sections: [
      { id: 'sec-a', name: 'Section A', type: 'mcq', marks_per_q: 1, count: 8, desc: 'Concept Check' },
      { id: 'sec-b', name: 'Section B', type: 'short_answer_1', marks_per_q: 2, count: 6, desc: 'Application Questions' },
    ],
  },
]

export default function AssessmentBuilderPage() {
  const {
    assessments,
    activeAssessment,
    loading,
    filterStatus,
    filterBlueprint,
    searchQuery,
    fetchAssessments,
    fetchAssessmentDetail,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    scheduleAssessment,
    setFilterStatus,
    setFilterBlueprint,
    setSearchQuery,
    setActiveAssessment,
  } = useAssessmentStore()

  const { fetchEvents } = useCalendarStore()

  const [viewMode, setViewMode] = useState<'library' | 'builder'>('library')
  const [editingAssessment, setEditingAssessment] = useState<AssessmentDetailItem | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !(prev[sectionId] ?? true) }))
  }

  // Scheduling Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [targetAsmt, setTargetAsmt] = useState<AssessmentSummaryItem | null>(null)
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0])
  const [examTime, setExamTime] = useState('09:30')
  const [examHall, setExamHall] = useState('Examination Hall A')
  const [scheduleToast, setScheduleToast] = useState<string | null>(null)

  // Print Preview Modal
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printAsmt, setPrintAsmt] = useState<AssessmentDetailItem | null>(null)

  // Library toolbar state
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid')
  const [blueprintMenuOpen, setBlueprintMenuOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const blueprintMenuRef = useRef<HTMLDivElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (blueprintMenuRef.current && !blueprintMenuRef.current.contains(e.target as Node)) setBlueprintMenuOpen(false)
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setStatusMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    void fetchAssessments()
    void fetchEvents()
  }, [fetchAssessments, fetchEvents])

  // Filtered list
  const filteredAssessments = assessments.filter((a) => {
    const matchesBp = filterBlueprint === 'all' || a.blueprint_type === filterBlueprint
    const matchesSt = filterStatus === 'all' || a.status === filterStatus
    const q = searchQuery.toLowerCase().trim()
    const matchesQ = !q || a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q)
    return matchesBp && matchesSt && matchesQ
  })

  // Start new assessment from blueprint
  const handleOpenNewFromBlueprint = (bpId: string = 'cbse_80m') => {
    const bp = BLUEPRINT_TEMPLATES.find((t) => t.id === bpId) || BLUEPRINT_TEMPLATES[0]
    setIsNew(true)
    const initialSections: AssessmentSection[] = bp.sections.map((s) => ({
      section_id: s.id,
      name: s.name,
      type: s.type as any,
      marks_per_q: s.marks_per_q,
      instructions: `Questions carrying ${s.marks_per_q} marks each.`,
      questions: [
        {
          id: `q-${s.id}-1`,
          text: `Sample question for ${s.name}...`,
          options: s.type === 'mcq' ? [
            { key: 'A', text: 'Option A', correct: true },
            { key: 'B', text: 'Option B', correct: false },
            { key: 'C', text: 'Option C', correct: false },
            { key: 'D', text: 'Option D', correct: false },
          ] : undefined,
          difficulty: 'Medium',
          bloom: 'Understand',
          marks: s.marks_per_q,
        },
      ],
    }))

    const newObj: any = {
      title: `${bp.name}: Term Evaluation`,
      subject: 'Mathematics',
      class_label: 'Class 10',
      section_name: '10-A',
      blueprint_type: bp.id,
      duration_minutes: bp.duration,
      total_marks: bp.marks,
      instructions: 'All questions are compulsory. Write answers legibly in the booklet.',
      sections: initialSections,
      question_count: initialSections.length,
      section_count: initialSections.length,
      sections_summary: [],
      difficulty_spread: { easy: 30, medium: 50, hard: 20 },
      status: 'draft',
    }
    setEditingAssessment(newObj)
    setViewMode('builder')
  }

  // Open existing assessment in builder
  const handleEdit = async (asmt: AssessmentSummaryItem) => {
    setIsNew(false)
    const detail = await fetchAssessmentDetail(asmt.id)
    if (detail) {
      setEditingAssessment(detail)
      setViewMode('builder')
    }
  }

  // Open Print preview
  const handleOpenPrint = async (asmt: AssessmentSummaryItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const detail = await fetchAssessmentDetail(asmt.id)
    if (detail) {
      setPrintAsmt(detail)
      setPrintModalOpen(true)
    }
  }

  // Open Schedule modal
  const handleOpenSchedule = (asmt: AssessmentSummaryItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setTargetAsmt(asmt)
    setExamDate(asmt.scheduled_date || new Date().toISOString().split('T')[0])
    setExamTime('09:30')
    setExamHall('Examination Hall A')
    setScheduleToast(null)
    setScheduleModalOpen(true)
  }

  // Confirm schedule to calendar
  const handleConfirmSchedule = async () => {
    if (!targetAsmt) return
    await scheduleAssessment(targetAsmt.id, {
      scheduled_date: examDate,
      start_time: examTime,
      location: examHall,
    })
    setScheduleToast(`Exam scheduled on ${examDate} at ${examTime} in ${examHall}. Added to My Calendar!`)
    setTimeout(() => {
      setScheduleModalOpen(false)
      setTargetAsmt(null)
      setScheduleToast(null)
    }, 1800)
  }

  // Save assessment in builder
  const handleSaveAssessment = async (targetStatus?: 'draft' | 'ready') => {
    if (!editingAssessment || !editingAssessment.title.trim()) return

    const payload = {
      ...editingAssessment,
      status: targetStatus ?? editingAssessment.status ?? 'ready',
    }

    if (isNew) {
      await createAssessment(payload)
    } else if (editingAssessment.id) {
      await updateAssessment(editingAssessment.id, payload)
    }

    setViewMode('library')
    setEditingAssessment(null)
  }

  // Calculate live marks in builder
  const liveTotalMarks = editingAssessment?.sections.reduce((acc, sec) => {
    return acc + sec.questions.reduce((qAcc, q) => qAcc + (q.marks || sec.marks_per_q || 1), 0)
  }, 0) || 0

  const activeBlueprintLabel = BLUEPRINT_CHOICES.find((b) => b.id === filterBlueprint)?.label ?? 'All Blueprints'
  const activeStatusLabel = STATUS_CHOICES.find((s) => s.id === filterStatus)?.label ?? 'All Papers'

  return (
    <div className="min-h-full bg-[#FFFBF0]">
      {viewMode === 'library' ? (
        <PageHeader
          title="Assessment Builder"
          description="Author CBSE blueprint-aligned question papers, verify cognitive balance, and schedule hall examinations."
          actions={
            <button
              onClick={() => handleOpenNewFromBlueprint('cbse_80m')}
              className="h-10 px-5 bg-[#11181C] hover:bg-[#1F2937] text-white rounded-[12px] text-[14px] font-medium flex items-center gap-2 shadow-sm shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Assessment
            </button>
          }
        />
      ) : null}

      {/* ================= VIEW 1: ASSESSMENT BANK / LIBRARY ================= */}
      {viewMode === 'library' && (
        <div>
          {/* Search & Filter Toolbar */}
          <div className="px-8 pb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments by title, subject..."
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
              <div className="flex items-center bg-[#F8F5EE] border border-[#E5E7EB] rounded-[10px] p-[3px] shrink-0">
                <button
                  onClick={() => setLayoutMode('grid')}
                  aria-label="Grid view"
                  className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                    layoutMode === 'grid' ? 'bg-[#11181C] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#11181C]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  aria-label="List view"
                  className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                    layoutMode === 'list' ? 'bg-[#11181C] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#11181C]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="relative shrink-0" ref={blueprintMenuRef}>
                <button
                  onClick={() => { setBlueprintMenuOpen((v) => !v); setStatusMenuOpen(false) }}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[13px] font-medium text-[#11181C] flex items-center gap-2 shadow-sm w-[160px] justify-between"
                >
                  <span className="truncate">{activeBlueprintLabel}</span>
                  <ChevronDown className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform ${blueprintMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {blueprintMenuOpen && (
                  <div className="absolute right-0 top-[44px] w-[200px] bg-white border border-[#E5E7EB] rounded-[12px] shadow-lg p-1 z-30">
                    {BLUEPRINT_CHOICES.map((bp) => (
                      <button
                        key={bp.id}
                        onClick={() => { setFilterBlueprint(bp.id); setBlueprintMenuOpen(false) }}
                        className={`w-full text-left px-3 py-2 rounded-[8px] text-[13px] ${
                          filterBlueprint === bp.id ? 'bg-[#F8F5EE] font-medium' : 'hover:bg-[#F9FAFB]'
                        }`}
                      >
                        {bp.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative shrink-0" ref={statusMenuRef}>
                <button
                  onClick={() => { setStatusMenuOpen((v) => !v); setBlueprintMenuOpen(false) }}
                  className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[13px] font-medium text-[#11181C] flex items-center gap-2 shadow-sm w-[160px] justify-between"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_CLS[filterStatus] ?? 'bg-[#9CA3AF]'}`} />
                    {activeStatusLabel}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} />
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

          {/* Assessment Cards Grid */}
          {loading ? (
            <div className="px-8 pb-8 py-20 text-center text-[#6B7280] flex flex-col items-center gap-2">
              <span className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#11181C] rounded-full animate-spin" />
              <span className="text-sm">Loading assessments...</span>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="px-8 pb-8">
              <div className="py-16 text-center bg-[#FFFEF8] border border-dashed border-[#E5DDC8] rounded-[16px] p-8 space-y-3">
                <FileQuestion className="w-10 h-10 text-[#9CA3AF] mx-auto" />
                <div className="font-semibold text-[#11181C]">No assessments found</div>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                  Author your first CBSE blueprint-grounded examination or change filter parameters.
                </p>
                <button
                  onClick={() => handleOpenNewFromBlueprint('cbse_80m')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#11181C] text-white text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  CBSE 80M Blueprint
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`px-8 pb-8 ${
                layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3'
              }`}
            >
              {filteredAssessments.map((asmt) => {
                const bpLabel =
                  asmt.blueprint_type === 'cbse_80m'
                    ? 'CBSE 80M'
                    : asmt.blueprint_type === 'periodic_40m'
                    ? 'Periodic 40M'
                    : asmt.blueprint_type === 'unit_20m'
                    ? 'Unit 20M'
                    : 'Custom'

                return (
                  <div
                    key={asmt.id}
                    onClick={() => handleEdit(asmt)}
                    className={`bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#E5E0D5] transition-all cursor-pointer group ${
                      layoutMode === 'list' ? 'flex flex-col lg:flex-row lg:items-start gap-5' : 'flex flex-col'
                    }`}
                  >
                    <div className={layoutMode === 'list' ? 'flex-1 min-w-0' : undefined}>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="h-[22px] px-2 inline-flex items-center bg-[#F3F1EB] border border-[#E5E0D5] rounded-[6px] text-[11px] font-semibold tracking-[0.02em] font-mono text-[#11181C]">
                            {bpLabel}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-mono text-[#6B7280]">
                            <Clock className="w-3 h-3 text-[#9CA3AF]" />
                            {asmt.duration_minutes}m
                          </span>
                          <span className="text-[12px] font-bold text-[#11181C]">
                            {asmt.total_marks} Marks
                          </span>
                        </div>

                        <span
                          className={`h-[22px] px-2.5 inline-flex items-center rounded-full text-[11px] font-medium font-mono ${
                            STATUS_CARD_CLS[asmt.status] ?? STATUS_CARD_CLS.draft
                          }`}
                        >
                          {asmt.status.charAt(0).toUpperCase() + asmt.status.slice(1)}
                        </span>
                      </div>

                      {/* Title & Instructions */}
                      <h3 className="text-[15px] font-bold text-[#11181C] leading-[1.3] line-clamp-2 mt-[14px] mb-2">
                        {asmt.title}
                      </h3>
                      <p className="text-[13px] text-[#6B7280] leading-[1.5] line-clamp-2 min-h-[39px]">
                        {asmt.instructions || 'Standard general examination instructions.'}
                      </p>

                      {/* Sections breakdown chips */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {asmt.sections_summary?.map((sec) => (
                          <span
                            key={sec.section_id}
                            className="h-6 px-2 inline-flex items-center rounded-[6px] bg-[#FFFBEB] border border-[#FDE68A] text-[11px] font-medium text-[#92400E]"
                          >
                            {sec.name}: {sec.question_count}Q ({sec.subtotal}M)
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={layoutMode === 'list' ? 'lg:w-[280px] w-full shrink-0' : undefined}>
                      {/* Difficulty Distribution Tri-bar */}
                      <div className="pt-3 border-t border-[#F3F4F6] mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8A8F98]">Difficulty Balance</span>
                          <span className="font-mono text-[#6B7280]">
                            {asmt.difficulty_spread?.easy || 30}% E / {asmt.difficulty_spread?.medium || 50}% M / {asmt.difficulty_spread?.hard || 20}% H
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden flex">
                          <div style={{ width: `${asmt.difficulty_spread?.easy || 30}%` }} className="h-full bg-[#86C87E]" title="Easy" />
                          <div style={{ width: `${asmt.difficulty_spread?.medium || 50}%` }} className="h-full bg-[#E8B73D]" title="Medium" />
                          <div style={{ width: `${asmt.difficulty_spread?.hard || 20}%` }} className="h-full bg-[#F87171]" title="Hard" />
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="mt-4 flex items-center justify-between text-xs">
                      {asmt.scheduled_date ? (
                        <div className="flex items-center gap-1.5 font-mono font-medium text-[#11181C]">
                          <Calendar className="w-3.5 h-3.5 text-[#C8A86A]" />
                          <span>{asmt.scheduled_date}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenSchedule(asmt, e)}
                          className="text-[#6B7280] hover:text-[#11181C] hover:underline font-medium flex items-center gap-1.5"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-[#C8A86A]" />
                          Schedule Exam
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleOpenPrint(asmt, e)}
                          className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#11181C] hover:bg-[#F9FAFB] transition-colors"
                          title="Print Question Paper"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete assessment "${asmt.title}"?`)) {
                              void deleteAssessment(asmt.id)
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete assessment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[#6B7280] group-hover:text-[#11181C] flex items-center gap-1 font-medium">
                          Open <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: PAPER BUILDER STUDIO ================= */}
      {viewMode === 'builder' && editingAssessment && (
        <div className="px-8 py-6 space-y-4">
          {/* Builder Actions Bar */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 lg:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col xl:flex-row xl:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative group">
                <input
                  type="text"
                  value={editingAssessment.title}
                  onChange={(e) => setEditingAssessment({ ...editingAssessment, title: e.target.value })}
                  placeholder="Enter assessment name..."
                  className="peer w-full text-[18px] lg:text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-[#11181C] bg-transparent border border-dashed border-transparent rounded-[8px] px-3 py-[7px] -mx-3 outline-none transition-colors hover:border-[#E5E7EB] hover:bg-[#FFFEF8] focus:border-solid focus:border-[#E8B73D] focus:bg-[#FFFEF8] focus:shadow-[0_0_0_3px_rgba(232,183,61,0.15)]"
                />
                <Pencil className="w-[14px] h-[14px] text-[#8A8F98] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 peer-focus:opacity-0 transition-opacity" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[12px] text-[#6B7280]">
                <span><span className="font-medium text-[#374151]">Class:</span> {editingAssessment.class_label} ({editingAssessment.section_name})</span>
                <span className="text-[#D1D5DB]">•</span>
                <span><span className="font-medium text-[#374151]">Subject:</span> {editingAssessment.subject}</span>
                <span className="text-[#D1D5DB]">•</span>
                <span><span className="font-medium text-[#374151]">Time:</span> {editingAssessment.duration_minutes} Minutes</span>
                <span className="text-[#D1D5DB]">•</span>
                <span>
                  <span className="font-medium text-[#374151]">Marks:</span>{' '}
                  <span className="text-[#11181C] font-semibold">{liveTotalMarks} / {editingAssessment.total_marks} Target</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end xl:shrink-0">
              <button
                type="button"
                onClick={() => handleSaveAssessment('draft')}
                className="h-9 px-4 rounded-full bg-white border border-[#E5E7EB] text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveAssessment('ready')}
                className="h-9 px-[18px] rounded-full bg-[#11181C] text-white text-[13px] font-semibold hover:bg-black transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.1)] flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5C542]" />
                Save &amp; Complete Paper
              </button>
              <div className="w-px h-6 bg-[#E5E7EB] mx-1 hidden sm:block" />
              <button
                type="button"
                onClick={() => setViewMode('library')}
                className="h-9 pl-3 pr-4 rounded-full bg-white border border-[#E5E7EB] text-[13px] font-medium text-[#6B7280] hover:text-[#11181C] hover:border-[#D1D5DB] inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Bank
              </button>
            </div>
          </div>

          {/* Section-by-Section Accordions */}
          <div className="space-y-4">
            {editingAssessment.sections?.map((section, secIdx) => {
              const secSubtotal = section.questions.reduce((acc, q) => acc + (q.marks || section.marks_per_q || 1), 0)
              const expanded = expandedSections[section.section_id] ?? true

              return (
                <div
                  key={section.section_id}
                  className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {/* Section Bar */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.section_id)}
                    className="w-full flex items-center justify-between gap-3 px-4 lg:px-5 h-12 text-left hover:bg-[#FFFBF0]/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-[6px] bg-[#11181C] text-white leading-none">
                        {section.name}
                      </span>
                      <span className="text-[12px] text-[#6B7280] truncate">
                        {section.type.toUpperCase()} • {section.marks_per_q} Mark(s) per question
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 text-[12px]">
                        <span className="text-[#6B7280]">{section.questions.length} Questions</span>
                        <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
                        <span className="font-semibold text-[#11181C]">Subtotal: {secSubtotal} Marks</span>
                      </div>
                      <span className="w-7 h-7 rounded-full border border-[#E5E7EB] flex items-center justify-center bg-white group-hover:border-[#D1D5DB] transition-colors">
                        <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${expanded ? '' : '-rotate-90'}`} />
                      </span>
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 lg:px-5 pb-5 pt-1 border-t border-[#F3F4F6] bg-[#FFFEF8]/50 space-y-3">
                  {/* Question Cards */}
                  <div className="space-y-3 pt-4">
                    {section.questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-[12px] border border-[#E5E7EB] bg-white space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[11px] font-bold text-[#374151] shrink-0">
                              Q{qIdx + 1}
                            </span>
                            {/* Difficulty Selector */}
                            <select
                              value={q.difficulty}
                              onChange={(e) => {
                                const updatedSecs = [...editingAssessment.sections]
                                updatedSecs[secIdx].questions[qIdx].difficulty = e.target.value as any
                                setEditingAssessment({ ...editingAssessment, sections: updatedSecs })
                              }}
                              className="h-7 pl-2.5 pr-2 rounded-full border border-[#E5E7EB] bg-white text-[11px] font-medium text-[#374151] outline-none hover:border-[#D1D5DB] focus:border-[#E8B73D]"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>

                            {/* Marks Chip */}
                            <span className="h-7 px-2.5 rounded-full bg-[#F3F1EB] border border-[#E5E0D5] inline-flex items-center text-[11px] font-medium text-[#374151]">
                              {q.marks} Mark(s)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updatedSecs = [...editingAssessment.sections]
                              updatedSecs[secIdx].questions.splice(qIdx, 1)
                              setEditingAssessment({ ...editingAssessment, sections: updatedSecs })
                            }}
                            className="text-[#9CA3AF] hover:text-red-600 p-1"
                            title="Remove question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Question Text */}
                        <textarea
                          rows={3}
                          value={q.text}
                          onChange={(e) => {
                            const updatedSecs = [...editingAssessment.sections]
                            updatedSecs[secIdx].questions[qIdx].text = e.target.value
                            setEditingAssessment({ ...editingAssessment, sections: updatedSecs })
                          }}
                          placeholder="Enter question text or math problem..."
                          className="w-full min-h-[80px] resize-none rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[13px] leading-[1.5] text-[#11181C] placeholder:text-[#9CA3AF] outline-none focus:border-[#E8B73D] focus:shadow-[0_0_0_3px_rgba(232,183,61,0.12)]"
                        />

                        {/* MCQ Options if MCQ */}
                        {section.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={opt.key}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] border text-[13px] ${
                                  opt.correct
                                    ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32] font-medium'
                                    : 'bg-white border-[#E5E7EB] text-[#374151]'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedSecs = [...editingAssessment.sections]
                                    updatedSecs[secIdx].questions[qIdx].options?.forEach((o, i) => {
                                      o.correct = i === optIdx
                                    })
                                    setEditingAssessment({ ...editingAssessment, sections: updatedSecs })
                                  }}
                                  className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 border text-[9px] font-bold ${
                                    opt.correct
                                      ? 'bg-white border-[#4CAF50] text-[#2E7D32]'
                                      : 'bg-white border-[#D1D5DB] text-[#9CA3AF]'
                                  }`}
                                >
                                  {opt.key}
                                </button>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updatedSecs = [...editingAssessment.sections]
                                    updatedSecs[secIdx].questions[qIdx].options![optIdx].text = e.target.value
                                    setEditingAssessment({ ...editingAssessment, sections: updatedSecs })
                                  }}
                                  className="flex-1 bg-transparent border-none outline-none text-[13px]"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Question Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedSecs = [...editingAssessment.sections]
                      updatedSecs[secIdx].questions.push({
                        id: `q-${section.section_id}-${Date.now()}`,
                        text: 'New question prompt...',
                        options: section.type === 'mcq' ? [
                          { key: 'A', text: 'Option A', correct: true },
                          { key: 'B', text: 'Option B', correct: false },
                          { key: 'C', text: 'Option C', correct: false },
                          { key: 'D', text: 'Option D', correct: false },
                        ] : undefined,
                        difficulty: 'Medium',
                        bloom: 'Understand',
                        marks: section.marks_per_q,
                      })
                      setEditingAssessment({ ...editingAssessment, sections: updatedSecs })
                    }}
                    className="w-full h-10 rounded-[8px] border border-dashed border-[#D1D5DB] text-[13px] font-medium text-[#6B7280] hover:bg-[#F8F5EE] hover:border-[#9CA3AF] hover:text-[#374151] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question to {section.name}
                  </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ================= SCHEDULE EXAM MODAL ================= */}
      {scheduleModalOpen && targetAsmt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FCFBF8] border border-cream-border rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-forest/5 text-forest">
                  <Calendar className="w-5 h-5 text-gold" />
                </span>
                <h3 className="font-semibold text-forest text-base">Schedule Examination</h3>
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
              <div className="font-semibold">{targetAsmt.title}</div>
              <div className="text-forest/60">
                Total Marks: {targetAsmt.total_marks} | Duration: {targetAsmt.duration_minutes} mins
              </div>
            </div>

            {scheduleToast ? (
              <div className="p-3.5 rounded-xl bg-[#7FBF7A]/15 border border-[#7FBF7A]/40 text-forest text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                <span>{scheduleToast}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">
                    Examination Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
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
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">
                      Examination Hall
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-forest/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={examHall}
                        onChange={(e) => setExamHall(e.target.value)}
                        placeholder="e.g. Hall A"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-cream-border text-forest/70 text-xs font-semibold hover:bg-[#FAF9F5]"
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

      {/* ================= PRINT / PREVIEW MODAL ================= */}
      {printModalOpen && printAsmt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Printable Examination Question Paper
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-forest text-cream text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-gold" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Paper Header */}
            <div className="text-center space-y-1 pb-4 border-b border-gray-200">
              <div className="font-serif font-bold text-xl uppercase tracking-wide text-gray-900">
                EDOVA ACADEMY • ANNUAL EVALUATION
              </div>
              <div className="font-semibold text-base text-gray-800">{printAsmt.title}</div>
              <div className="flex items-center justify-between text-xs text-gray-600 font-medium pt-2 px-4">
                <span>Class: {printAsmt.class_label} ({printAsmt.section_name})</span>
                <span>Subject: {printAsmt.subject}</span>
                <span>Time Allowed: {Math.round(printAsmt.duration_minutes / 60)} Hours</span>
                <span>Maximum Marks: {printAsmt.total_marks}</span>
              </div>
            </div>

            {/* General Instructions */}
            <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
              <span className="font-bold uppercase tracking-wider">General Instructions:</span>
              <p>{printAsmt.instructions || 'All questions are compulsory. Use of calculators is not permitted.'}</p>
            </div>

            {/* Questions by Section */}
            <div className="space-y-6 text-sm text-gray-800">
              {printAsmt.sections?.map((sec) => (
                <div key={sec.section_id} className="space-y-3">
                  <div className="font-bold uppercase tracking-wider text-xs border-b border-gray-300 pb-1 flex justify-between">
                    <span>{sec.name}</span>
                    <span>{sec.questions.length * sec.marks_per_q} Marks</span>
                  </div>
                  <div className="space-y-4 pl-2">
                    {sec.questions.map((q, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <span className="font-semibold mr-1.5">{idx + 1}.</span>
                            <span>{q.text}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-500 shrink-0">[{q.marks}M]</span>
                        </div>

                        {q.options && (
                          <div className="grid grid-cols-2 gap-2 pl-4 text-xs pt-1">
                            {q.options.map((opt) => (
                              <div key={opt.key}>
                                <span className="font-semibold mr-1.5">({opt.key})</span>
                                <span>{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
