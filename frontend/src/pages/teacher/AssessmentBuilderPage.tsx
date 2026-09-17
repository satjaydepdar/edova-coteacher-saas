import React, { useEffect, useState } from 'react'
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
  Layers,
  Award,
  Sparkles,
  BookOpen,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Check,
} from 'lucide-react'
import {
  useAssessmentStore,
  type AssessmentSummaryItem,
  type AssessmentDetailItem,
  type AssessmentSection,
  type QuestionItem,
} from '../../store/assessmentStore'
import { useCalendarStore } from '../../store/calendarStore'

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-forest flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-forest/5 text-forest border border-cream-border">
              <FileQuestion className="w-6 h-6 text-forest" />
            </span>
            Assessment Builder
          </h1>
          <p className="text-sm text-forest/65 mt-1">
            Author CBSE blueprint-aligned question papers, verify cognitive balance, and schedule hall examinations.
          </p>
        </div>

        {viewMode === 'library' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenNewFromBlueprint('cbse_80m')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-raised text-cream font-medium text-sm transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-gold" />
              Create Assessment
            </button>
          </div>
        ) : (
          <button
            onClick={() => setViewMode('library')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cream-border bg-[#FCFBF8] text-forest/80 hover:text-forest text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bank
          </button>
        )}
      </div>

      {/* ================= VIEW 1: ASSESSMENT BANK / LIBRARY ================= */}
      {viewMode === 'library' && (
        <div className="space-y-5">
          {/* Controls Bar: Search & Blueprint Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card">
            <div className="flex flex-1 items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assessments by title, subject..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-cream-border/70 bg-[#FAF9F5] text-forest placeholder:text-forest/40 focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              {/* Blueprint Selector */}
              <select
                value={filterBlueprint}
                onChange={(e) => setFilterBlueprint(e.target.value)}
                className="text-xs py-2 px-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold hidden sm:inline"
              >
                <option value="all">All Blueprints</option>
                <option value="cbse_80m">CBSE 80M Board Paper</option>
                <option value="periodic_40m">Periodic Test (40M)</option>
                <option value="unit_20m">Unit Diagnostic (20M)</option>
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All Papers' },
                { id: 'ready', label: 'Ready' },
                { id: 'scheduled', label: 'Scheduled' },
                { id: 'draft', label: 'Drafts' },
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

          {/* Assessment Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-forest/50 flex flex-col items-center gap-2">
              <span className="w-6 h-6 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
              <span className="text-sm">Loading assessments...</span>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-cream-border rounded-2xl p-8 space-y-3">
              <FileQuestion className="w-10 h-10 text-forest/30 mx-auto" />
              <div className="font-semibold text-forest">No assessments found</div>
              <p className="text-xs text-forest/60 max-w-sm mx-auto">
                Author your first CBSE blueprint-grounded examination or change filter parameters.
              </p>
              <button
                onClick={() => handleOpenNewFromBlueprint('cbse_80m')}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest text-cream text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-gold" />
                CBSE 80M Blueprint
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssessments.map((asmt) => {
                const isScheduled = asmt.status === 'scheduled'
                const isReady = asmt.status === 'ready'
                const bpLabel =
                  asmt.blueprint_type === 'cbse_80m'
                    ? 'CBSE 80M'
                    : asmt.blueprint_type === 'periodic_40m'
                    ? 'Periodic 40M'
                    : 'Unit 20M'

                return (
                  <div
                    key={asmt.id}
                    onClick={() => handleEdit(asmt)}
                    className="bg-[#FCFBF8] hover:bg-white border border-cream-border hover:border-gold/60 rounded-2xl p-5 shadow-card hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest/5 text-forest border border-cream-border">
                            {bpLabel}
                          </span>
                          <span className="text-[11px] text-forest/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {asmt.duration_minutes}m
                          </span>
                          <span className="text-[11px] font-bold text-forest">
                            {asmt.total_marks} Marks
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                            isScheduled
                              ? 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-forest'
                              : isReady
                              ? 'bg-gold/15 border-gold/40 text-[#8C6D23]'
                              : 'bg-cream/70 border-cream-border text-forest/60'
                          }`}
                        >
                          {asmt.status.charAt(0).toUpperCase() + asmt.status.slice(1)}
                        </span>
                      </div>

                      {/* Title & Instructions */}
                      <h3 className="font-semibold text-base text-forest group-hover:text-forest leading-snug line-clamp-2 mb-1.5">
                        {asmt.title}
                      </h3>
                      <p className="text-xs text-forest/65 line-clamp-2 leading-relaxed mb-4">
                        {asmt.instructions || 'Standard general examination instructions.'}
                      </p>

                      {/* Sections breakdown chips */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {asmt.sections_summary?.map((sec) => (
                          <span
                            key={sec.section_id}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#F5F1E6] text-forest/80 border border-cream-border font-medium"
                          >
                            {sec.name}: {sec.question_count}Q ({sec.subtotal}M)
                          </span>
                        ))}
                      </div>

                      {/* Difficulty Distribution Tri-bar */}
                      <div className="mb-4 pt-3 border-t border-cream-border/60 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-forest/60">
                          <span>Difficulty Balance</span>
                          <span>
                            {asmt.difficulty_spread?.easy || 30}% E / {asmt.difficulty_spread?.medium || 50}% M / {asmt.difficulty_spread?.hard || 20}% H
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#E8E0CC] overflow-hidden flex">
                          <div style={{ width: `${asmt.difficulty_spread?.easy || 30}%` }} className="bg-[#7FBF7A]" title="Easy" />
                          <div style={{ width: `${asmt.difficulty_spread?.medium || 50}%` }} className="bg-[#D9A94E]" title="Medium" />
                          <div style={{ width: `${asmt.difficulty_spread?.hard || 20}%` }} className="bg-[#E5484D]" title="Hard" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-cream-border/60 flex items-center justify-between text-xs">
                      {asmt.scheduled_date ? (
                        <div className="flex items-center gap-1 text-forest/75 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gold" />
                          <span>{asmt.scheduled_date}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenSchedule(asmt, e)}
                          className="text-forest/70 hover:text-forest hover:underline font-medium flex items-center gap-1"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-gold" />
                          Schedule Exam
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleOpenPrint(asmt, e)}
                          className="p-1.5 rounded-lg text-forest/50 hover:text-forest hover:bg-cream transition-colors"
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
                          className="p-1.5 rounded-lg text-forest/40 hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete assessment"
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

      {/* ================= VIEW 2: PAPER BUILDER STUDIO ================= */}
      {viewMode === 'builder' && editingAssessment && (
        <div className="space-y-6">
          {/* Builder Actions Bar */}
          <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={editingAssessment.title}
                onChange={(e) => setEditingAssessment({ ...editingAssessment, title: e.target.value })}
                placeholder="Assessment Title (e.g. CBSE Mathematics Board Exam Model Paper)..."
                className="w-full text-lg font-bold text-forest bg-transparent border-b border-cream-border focus:border-gold outline-none pb-1 font-display"
              />
              <div className="flex items-center gap-2.5 mt-2 text-xs text-forest/65">
                <span>Class: {editingAssessment.class_label} ({editingAssessment.section_name})</span>
                <span>•</span>
                <span>Subject: {editingAssessment.subject}</span>
                <span>•</span>
                <span>Time: {editingAssessment.duration_minutes} Minutes</span>
                <span>•</span>
                <span className="font-bold text-forest">
                  Marks: {liveTotalMarks} / {editingAssessment.total_marks} Target
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('library')}
                className="px-3 py-2 rounded-xl border border-cream-border text-forest/70 text-xs font-semibold bg-[#FAF9F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveAssessment('draft')}
                className="px-3.5 py-2 rounded-xl border border-cream-border text-forest text-xs font-semibold bg-[#FCFBF8] hover:bg-forest/5"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveAssessment('ready')}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-raised text-cream text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                Save &amp; Complete Paper
              </button>
            </div>
          </div>

          {/* Section-by-Section Accordions */}
          <div className="space-y-4">
            {editingAssessment.sections?.map((section, secIdx) => {
              const secSubtotal = section.questions.reduce((acc, q) => acc + (q.marks || section.marks_per_q || 1), 0)

              return (
                <div
                  key={section.section_id}
                  className="rounded-2xl bg-[#FCFBF8] border border-cream-border p-5 shadow-card space-y-4"
                >
                  {/* Section Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cream-border">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-forest text-cream">
                        {section.name}
                      </span>
                      <span className="text-xs text-forest/70 font-medium">
                        {section.type.toUpperCase()} • {section.marks_per_q} Mark(s) per question
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-forest">
                      <span>{section.questions.length} Questions</span>
                      <span>Subtotal: {secSubtotal} Marks</span>
                    </div>
                  </div>

                  {/* Question Cards */}
                  <div className="space-y-3">
                    {section.questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-xl border border-cream-border bg-[#FAF9F5] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-forest">
                              Q{qIdx + 1}.
                            </span>
                            {/* Difficulty Selector */}
                            <select
                              value={q.difficulty}
                              onChange={(e) => {
                                const updatedSecs = [...editingAssessment.sections]
                                updatedSecs[secIdx].questions[qIdx].difficulty = e.target.value as any
                                setEditingAssessment({ ...editingAssessment, sections: updatedSecs })
                              }}
                              className="text-[11px] font-semibold py-0.5 px-2 rounded-md border border-cream-border bg-white text-forest outline-none"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>

                            {/* Marks Chip */}
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-forest/5 text-forest border border-cream-border">
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
                            className="text-forest/40 hover:text-danger p-1"
                            title="Remove question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Question Text */}
                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => {
                            const updatedSecs = [...editingAssessment.sections]
                            updatedSecs[secIdx].questions[qIdx].text = e.target.value
                            setEditingAssessment({ ...editingAssessment, sections: updatedSecs })
                          }}
                          placeholder="Enter question text or math problem..."
                          className="w-full text-xs p-2.5 rounded-lg border border-cream-border/80 bg-white text-forest outline-none focus:border-gold"
                        />

                        {/* MCQ Options if MCQ */}
                        {section.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={opt.key}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                                  opt.correct
                                    ? 'bg-[#7FBF7A]/15 border-[#7FBF7A]/50 text-forest font-semibold'
                                    : 'bg-white border-cream-border text-forest/70'
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
                                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                                    opt.correct
                                      ? 'bg-forest text-cream border-forest'
                                      : 'bg-[#F5F1E6] text-forest/70 border-cream-border'
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
                                  className="flex-1 bg-transparent border-none outline-none text-xs"
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
                    className="w-full py-2 rounded-xl border border-dashed border-cream-border hover:border-gold/60 text-xs font-semibold text-forest/70 hover:text-forest flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    Add Question to {section.name}
                  </button>
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
