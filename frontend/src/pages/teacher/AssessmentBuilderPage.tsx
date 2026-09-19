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
  CalendarDays,
  MapPin,
  PenLine,
  Library,
} from 'lucide-react'
import {
  useAssessmentStore,
  type AssessmentSummaryItem,
  type AssessmentDetailItem,
  type AssessmentSection,
  type SectionType,
  type QuestionItem,
  type QuestionBankClass,
  type QuestionBankItem,
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

// Blueprint choice only sets the marks/duration target now — section content
// always comes from the palette (see SECTION_META), not a pre-filled shape.
const BLUEPRINT_TEMPLATES = [
  { id: 'cbse_80m', name: 'CBSE 80-Mark Board Exam', duration: 180, marks: 80 },
  { id: 'periodic_40m', name: 'Periodic Assessment (40 Marks)', duration: 90, marks: 40 },
  { id: 'unit_20m', name: 'Unit Diagnostic Quiz (20 Marks)', duration: 40, marks: 20 },
]

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface SectionMetaEntry {
  icon: string
  label: string
  bg: string
  color: string
  hasOptions?: boolean
  singleCorrect?: boolean
  fixed?: boolean
  defaultOptions?: number
  hasPairs?: boolean
  defaultPairs?: number
  hasCorrectAnswer?: boolean
  hasModelAnswer?: boolean
  hasScenarioText?: boolean
  hasSubQuestions?: boolean
  hasRubric?: boolean
}

// One registry entry per section type: palette presentation (icon/label/colors)
// plus the answer-shape metadata that drives the Manage Questions editor and
// the section-card preview. Palette types (9) plus the legacy blueprint types
// (kept so older saved assessments still render sensibly).
const SECTION_META: Record<string, SectionMetaEntry> = {
  mcq: { icon: '☰', label: 'Multiple Choice', bg: '#E0F2FE', color: '#0369A1', hasOptions: true, singleCorrect: true, defaultOptions: 4 },
  multi_select: { icon: '☑', label: 'Multi-Select', bg: '#F3E8FF', color: '#7C3AED', hasOptions: true, singleCorrect: false, defaultOptions: 4 },
  true_false: { icon: '⊘', label: 'True/False', bg: '#DCFCE7', color: '#15803D', hasOptions: true, singleCorrect: true, fixed: true, defaultOptions: 2 },
  matching: { icon: '⇄', label: 'Matching', bg: '#FFEDD5', color: '#C2410C', hasPairs: true, defaultPairs: 4 },
  fill_blank: { icon: '✎', label: 'Fill in the Blank', bg: '#FEF9C3', color: '#A16207', hasCorrectAnswer: true },
  short_answer: { icon: '🔍', label: 'Short Answer', bg: '#E0E7FF', color: '#4338CA', hasModelAnswer: true },
  scenario: { icon: '📄', label: 'Scenario-Based', bg: '#FCE7F3', color: '#BE185D', hasScenarioText: true, hasModelAnswer: true },
  multi_part: { icon: '🧩', label: 'Multi-Part', bg: '#ECFDF5', color: '#047857', hasSubQuestions: true, hasModelAnswer: true },
  essay: { icon: '💬', label: 'Essay', bg: '#F5F3FF', color: '#6D28D9', hasRubric: true },
  // legacy CBSE blueprint types (older saved assessments)
  short_answer_1: { icon: '🔍', label: 'Very Short Answer', bg: '#E0E7FF', color: '#4338CA', hasModelAnswer: true },
  short_answer_2: { icon: '📝', label: 'Short Answer', bg: '#E0E7FF', color: '#4338CA', hasModelAnswer: true },
  long_answer: { icon: '📄', label: 'Long Answer', bg: '#FCE7F3', color: '#BE185D', hasModelAnswer: true },
  case_study: { icon: '🧩', label: 'Case Study', bg: '#ECFDF5', color: '#047857', hasModelAnswer: true },
}
const FALLBACK_META: SectionMetaEntry = { icon: '📝', label: 'Questions', bg: '#F3F4F6', color: '#374151', hasModelAnswer: true }
const metaFor = (type: string): SectionMetaEntry => SECTION_META[type] ?? FALLBACK_META

const PALETTE_TYPES: SectionType[] = [
  'mcq', 'multi_select', 'true_false', 'matching', 'fill_blank',
  'short_answer', 'scenario', 'multi_part', 'essay',
]

interface QuestionDraft {
  text: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  options: { text: string; correct: boolean }[]
  pairs: { left: string; right: string }[]
  correctAnswer: string
  modelAnswer: string
  scenarioText: string
  subQuestions: { text: string; answer: string }[]
  rubric: string
}

function emptyDraftFor(type: string): QuestionDraft {
  const meta = metaFor(type)
  const n = meta.fixed ? 2 : meta.defaultOptions ?? 0
  return {
    text: '',
    difficulty: 'Medium',
    options: meta.hasOptions
      ? Array.from({ length: n }, (_, i) => ({ text: meta.fixed ? (i === 0 ? 'True' : 'False') : '', correct: i === 0 }))
      : [],
    pairs: meta.hasPairs ? Array.from({ length: meta.defaultPairs ?? 4 }, () => ({ left: '', right: '' })) : [],
    correctAnswer: '',
    modelAnswer: '',
    scenarioText: '',
    subQuestions: meta.hasSubQuestions ? [{ text: '', answer: '' }] : [],
    rubric: '',
  }
}

export default function AssessmentBuilderPage() {
  const {
    assessments,
    loading,
    filterStatus,
    filterBlueprint,
    searchQuery,
    fetchAssessments,
    fetchAssessmentDetail,
    fetchQuestionBankChapters,
    fetchQuestionBank,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    scheduleAssessment,
    setFilterStatus,
    setFilterBlueprint,
    setSearchQuery,
  } = useAssessmentStore()

  const { fetchEvents } = useCalendarStore()

  const [viewMode, setViewMode] = useState<'library' | 'builder'>('library')
  const [editingAssessment, setEditingAssessment] = useState<AssessmentDetailItem | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !(prev[sectionId] ?? true) }))
  }

  // Step 1 context chips — Chapter/Topic and the Learning Objective have no
  // backend column yet, so they're local-only until a field exists to persist them.
  const [chapterLabel, setChapterLabel] = useState('')
  const [topicLabel, setTopicLabel] = useState('')
  const [ctxTopicId, setCtxTopicId] = useState('')
  const [objectiveText, setObjectiveText] = useState('')

  // Left palette float in/out
  const [paletteCollapsed, setPaletteCollapsed] = useState(false)

  // Diagnostics
  const [diagOpen, setDiagOpen] = useState(false)

  // Manage Questions modal (opened from a palette click or a section's "Manage
  // Questions" / per-question edit button)
  const [manageOpen, setManageOpen] = useState(false)
  const [manageSectionId, setManageSectionId] = useState<string | null>(null)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [qDraft, setQDraft] = useState<QuestionDraft>(emptyDraftFor('mcq'))

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

  // "Create Assessment" chooser: Build Manually vs Import from Question Bank
  const [chooserOpen, setChooserOpen] = useState(false)

  // Import from Question Bank modal
  const [importOpen, setImportOpen] = useState(false)
  const [importClasses, setImportClasses] = useState<QuestionBankClass[]>([])
  const [importGrade, setImportGrade] = useState('')
  const [importSubjectId, setImportSubjectId] = useState('')
  const [importChapterId, setImportChapterId] = useState('')
  const [importQuestions, setImportQuestions] = useState<QuestionBankItem[]>([])
  const [importSelected, setImportSelected] = useState<Record<string, boolean>>({})
  const [importLoading, setImportLoading] = useState(false)

  // Step 1 Class/Subject/Chapter dropdowns — same DB-backed curriculum tree as
  // the Question Bank import modal (importClasses), selected independently.
  const [ctxSubjectId, setCtxSubjectId] = useState('')
  const [ctxChapterId, setCtxChapterId] = useState('')

  const ensureCurriculumLoaded = async (): Promise<QuestionBankClass[]> => {
    if (importClasses.length > 0) return importClasses
    const classes = await fetchQuestionBankChapters()
    setImportClasses(classes)
    return classes
  }

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

  // Start a new, empty assessment — the blueprint only sets the marks/duration
  // target; every section comes from a palette click (see addPaletteSection).
  // Class/Subject default to the DB's own first entries (not a hardcoded guess)
  // so the Chapter/Topic dropdowns are immediately live, not stuck disabled
  // waiting for a re-pick of a value that already matches what's shown.
  const handleOpenNewFromBlueprint = async (bpId: string = 'cbse_80m') => {
    const bp = BLUEPRINT_TEMPLATES.find((t) => t.id === bpId) || BLUEPRINT_TEMPLATES[0]
    setIsNew(true)
    setChapterLabel('')
    setTopicLabel('')
    setObjectiveText('')
    setCtxChapterId('')
    setCtxTopicId('')
    setPaletteCollapsed(false)

    const classes = await ensureCurriculumLoaded()
    const firstClass = classes[0]
    const firstSubject = firstClass?.subjects[0]
    setCtxSubjectId(firstSubject?.id ?? '')

    const newObj: any = {
      title: `${bp.name}: Term Evaluation`,
      subject: firstSubject?.name ?? 'Mathematics',
      class_label: firstClass?.grade ?? 'Class 10',
      section_name: '10-A',
      blueprint_type: bp.id,
      duration_minutes: bp.duration,
      total_marks: bp.marks,
      instructions: 'All questions are compulsory. Write answers legibly in the booklet.',
      sections: [],
      question_count: 0,
      section_count: 0,
      sections_summary: [],
      difficulty_spread: { easy: 30, medium: 50, hard: 20 },
      status: 'draft',
    }
    setEditingAssessment(newObj)
    setViewMode('builder')
  }

  // "Build New" -> chooser (Build Manually / Import from Question Bank)
  const openChooser = () => setChooserOpen(true)

  const chooseBuildManually = () => {
    setChooserOpen(false)
    handleOpenNewFromBlueprint('cbse_80m')
  }

  const chooseImportFromBank = async () => {
    setChooserOpen(false)
    setImportOpen(true)
    setImportGrade('')
    setImportSubjectId('')
    setImportChapterId('')
    setImportQuestions([])
    setImportSelected({})
    await ensureCurriculumLoaded()
  }

  const importSubjects = importClasses.find((c) => c.grade === importGrade)?.subjects ?? []
  const importChapters = importSubjects.find((s) => s.id === importSubjectId)?.chapters ?? []
  const ctxSubjects = importClasses.find((c) => c.grade === editingAssessment?.class_label)?.subjects ?? []
  const ctxChapters = ctxSubjects.find((s) => s.id === ctxSubjectId)?.chapters ?? []
  const ctxChapter = ctxChapters.find((c) => c.id === ctxChapterId)
  const ctxTopics = ctxChapter?.topics ?? []
  const importSelectedCount = Object.values(importSelected).filter(Boolean).length

  const selectImportChapter = async (chapterId: string) => {
    setImportChapterId(chapterId)
    setImportQuestions([])
    setImportSelected({})
    if (!chapterId) return
    setImportLoading(true)
    try {
      setImportQuestions(await fetchQuestionBank(chapterId))
    } finally {
      setImportLoading(false)
    }
  }

  // Authored question_type -> the builder's section type (drives options display).
  const IMPORT_SECTION_TYPE_FOR: Record<string, SectionType> = {
    MCQ: 'mcq', MCQ_COMBINATION: 'mcq', ASSERTION_REASONING: 'mcq',
    SHORT_ANSWER: 'short_answer', FILL_IN_THE_BLANKS: 'fill_blank', NUMERICAL: 'fill_blank',
    LONG_ANSWER: 'essay', MATCH_THE_FOLLOWING: 'matching',
    CASE_STUDY: 'multi_part',
  }

  const confirmImportFromBank = () => {
    const picked = importQuestions.filter((qb) => importSelected[qb.question_id])
    if (!picked.length) return

    const bySection = new Map<SectionType, QuestionItem[]>()
    for (const qb of picked) {
      const type = IMPORT_SECTION_TYPE_FOR[qb.question_type] ?? 'short_answer'
      const list = bySection.get(type) ?? []
      list.push({
        id: qb.question_id,
        text: qb.question_text,
        options: qb.options?.length ? qb.options : undefined,
        difficulty: (qb.difficulty ? qb.difficulty.charAt(0) + qb.difficulty.slice(1).toLowerCase() : 'Medium') as QuestionItem['difficulty'],
        bloom: 'Understand',
        marks: qb.marks,
      })
      bySection.set(type, list)
    }

    const sections: AssessmentSection[] = Array.from(bySection.entries()).map(([type, questions], i) => ({
      section_id: `sec_${type}_${Date.now()}_${i}`,
      name: `Section ${LETTERS[i]}`,
      type,
      marks_per_q: Math.round(questions[0].marks) || 1,
      instructions: `Questions carrying ${Math.round(questions[0].marks) || 1} marks each.`,
      questions,
    }))

    const chapterName = importChapters.find((c) => c.id === importChapterId)?.name ?? 'Imported'
    const subjectName = importSubjects.find((s) => s.id === importSubjectId)?.name ?? 'Subject'

    setIsNew(true)
    setChapterLabel(chapterName)
    setTopicLabel('')
    setObjectiveText('')
    setCtxSubjectId(importSubjectId)
    setCtxChapterId(importChapterId)
    setCtxTopicId('')
    setPaletteCollapsed(false)
    setEditingAssessment({
      title: `${chapterName}: Question Bank Import`,
      subject: subjectName,
      class_label: importGrade,
      section_name: '10-A',
      blueprint_type: 'custom',
      duration_minutes: sections.length * 30,
      total_marks: sections.reduce((a, s) => a + s.questions.reduce((qa, q) => qa + q.marks, 0), 0),
      instructions: 'All questions are compulsory.',
      sections,
      question_count: picked.length,
      section_count: sections.length,
      sections_summary: [],
      difficulty_spread: { easy: 30, medium: 50, hard: 20 },
      status: 'draft',
    } as any)
    setImportOpen(false)
    setViewMode('builder')
  }

  // Open existing assessment in builder
  const handleEdit = async (asmt: AssessmentSummaryItem) => {
    setIsNew(false)
    const detail = await fetchAssessmentDetail(asmt.id)
    if (detail) {
      setChapterLabel('')
      setTopicLabel('')
      setObjectiveText('')
      setCtxSubjectId('')
      setCtxChapterId('')
      setCtxTopicId('')
      setPaletteCollapsed(false)
      setEditingAssessment(detail)
      setViewMode('builder')
      const classes = await ensureCurriculumLoaded()
      const matchedSubject = classes.find((c) => c.grade === detail.class_label)?.subjects.find((s) => s.name === detail.subject)
      setCtxSubjectId(matchedSubject?.id ?? '')
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

  /* ---- Palette-driven section + question building ---- */

  const nextSectionLetter = (n: number) => LETTERS[n] ?? String(n + 1)

  const addPaletteSection = (type: SectionType) => {
    if (!editingAssessment) return
    const id = `sec_${Date.now()}`
    const newSection: AssessmentSection = {
      section_id: id,
      name: `Section ${nextSectionLetter(editingAssessment.sections.length)}`,
      type,
      marks_per_q: 1,
      instructions: 'Questions carrying 1 mark each.',
      questions: [],
    }
    setEditingAssessment({ ...editingAssessment, sections: [...editingAssessment.sections, newSection] })
    setExpandedSections((prev) => ({ ...prev, [id]: true }))
    setManageSectionId(id)
    setEditingQuestionId(null)
    setQDraft(emptyDraftFor(type))
    setManageOpen(true)
  }

  const removeSection = (sectionId: string) => {
    if (!editingAssessment) return
    setEditingAssessment({ ...editingAssessment, sections: editingAssessment.sections.filter((s) => s.section_id !== sectionId) })
  }

  const changeSectionPoints = (sectionId: string, delta: number) => {
    if (!editingAssessment) return
    setEditingAssessment({
      ...editingAssessment,
      sections: editingAssessment.sections.map((s) =>
        s.section_id === sectionId ? { ...s, marks_per_q: Math.max(1, Math.min(20, s.marks_per_q + delta)) } : s
      ),
    })
  }

  const openManage = (sectionId: string) => {
    const sec = editingAssessment?.sections.find((s) => s.section_id === sectionId)
    setManageSectionId(sectionId)
    setEditingQuestionId(null)
    setQDraft(emptyDraftFor(sec?.type ?? 'mcq'))
    setManageOpen(true)
  }
  const closeManage = () => {
    setManageOpen(false)
    setManageSectionId(null)
    setEditingQuestionId(null)
  }

  const editQuestion = (sectionId: string, qid: string) => {
    const sec = editingAssessment?.sections.find((s) => s.section_id === sectionId)
    const q = sec?.questions.find((x) => x.id === qid)
    if (!sec || !q) return
    const blank = emptyDraftFor(sec.type)
    setManageSectionId(sectionId)
    setManageOpen(true)
    setEditingQuestionId(qid)
    setQDraft({
      text: q.text,
      difficulty: q.difficulty,
      options: q.options ? q.options.map((o) => ({ text: o.text, correct: o.correct })) : blank.options,
      pairs: q.pairs ? q.pairs.map((p) => ({ ...p })) : blank.pairs,
      correctAnswer: q.correctAnswer ?? '',
      modelAnswer: q.modelAnswer ?? '',
      scenarioText: q.scenarioText ?? '',
      subQuestions: q.subQuestions ? q.subQuestions.map((s) => ({ ...s })) : blank.subQuestions,
      rubric: q.rubric ?? '',
    })
  }

  const deleteQuestionFromCard = (sectionId: string, qid: string) => {
    if (!editingAssessment) return
    setEditingAssessment({
      ...editingAssessment,
      sections: editingAssessment.sections.map((s) =>
        s.section_id === sectionId ? { ...s, questions: s.questions.filter((q) => q.id !== qid) } : s
      ),
    })
  }

  const deleteQuestionFromManage = (qid: string) => {
    if (!manageSectionId) return
    deleteQuestionFromCard(manageSectionId, qid)
  }

  const saveDraftQuestion = () => {
    if (!editingAssessment || !manageSectionId || !qDraft.text.trim()) return
    const secIdx = editingAssessment.sections.findIndex((s) => s.section_id === manageSectionId)
    if (secIdx === -1) return
    const sec = editingAssessment.sections[secIdx]
    const meta = metaFor(sec.type)

    const q: QuestionItem = {
      id: editingQuestionId || `q_${Date.now()}`,
      text: qDraft.text.trim(),
      difficulty: qDraft.difficulty,
      bloom: 'Understand',
      marks: sec.marks_per_q,
    }
    if (meta.hasOptions) {
      q.options = qDraft.options
        .filter((o) => o.text.trim() || meta.fixed)
        .map((o, i) => ({ key: LETTERS[i], text: o.text.trim(), correct: o.correct }))
    }
    if (meta.hasPairs) q.pairs = qDraft.pairs.filter((p) => p.left.trim() && p.right.trim())
    if (meta.hasCorrectAnswer) q.correctAnswer = qDraft.correctAnswer.trim()
    if (meta.hasScenarioText) q.scenarioText = qDraft.scenarioText.trim()
    if (meta.hasSubQuestions) q.subQuestions = qDraft.subQuestions.filter((sq) => sq.text.trim())
    if (meta.hasModelAnswer) q.modelAnswer = qDraft.modelAnswer.trim()
    if (meta.hasRubric) q.rubric = qDraft.rubric.trim()

    const questions = editingQuestionId
      ? sec.questions.map((existing) => (existing.id === editingQuestionId ? q : existing))
      : [...sec.questions, q]
    const updatedSections = [...editingAssessment.sections]
    updatedSections[secIdx] = { ...sec, questions }
    setEditingAssessment({ ...editingAssessment, sections: updatedSections })
    setEditingQuestionId(null)
    setQDraft(emptyDraftFor(sec.type))
  }

  const sectionDemand = (sec: AssessmentSection) => {
    const total = sec.questions.length
    if (!total) return { easy: 30, medium: 50, hard: 20 }
    const easy = sec.questions.filter((q) => q.difficulty === 'Easy').length
    const medium = sec.questions.filter((q) => q.difficulty === 'Medium').length
    const hard = sec.questions.filter((q) => q.difficulty === 'Hard').length
    return {
      easy: Math.round((easy / total) * 100),
      medium: Math.round((medium / total) * 100),
      hard: Math.round((hard / total) * 100),
    }
  }

  // Calculate live marks in builder
  const liveTotalMarks = editingAssessment?.sections.reduce((acc, sec) => {
    return acc + sec.questions.reduce((qAcc, q) => qAcc + (q.marks || sec.marks_per_q || 1), 0)
  }, 0) || 0
  const totalItems = editingAssessment?.sections.reduce((a, s) => a + s.questions.length, 0) ?? 0
  const totalMinutes = editingAssessment?.sections.reduce((a, s) => a + Math.ceil(s.questions.length * 2), 0) ?? 0

  const diag = (() => {
    if (!editingAssessment) return { easyPct: 0, mediumPct: 0, hardPct: 0, typeDist: [] as { name: string; count: number; pct: number }[] }
    const secs = editingAssessment.sections
    const total = secs.reduce((a, s) => a + s.questions.length, 0)
    const byDiff = { Easy: 0, Medium: 0, Hard: 0 }
    secs.forEach((s) => s.questions.forEach((q) => { byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1 }))
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
    const typeMap: Record<string, number> = {}
    secs.forEach((s) => { const label = metaFor(s.type).label; typeMap[label] = (typeMap[label] || 0) + s.questions.length })
    return {
      easyPct: pct(byDiff.Easy), mediumPct: pct(byDiff.Medium), hardPct: pct(byDiff.Hard),
      typeDist: Object.entries(typeMap).map(([name, count]) => ({ name, count, pct: pct(count) })),
    }
  })()

  const activeBlueprintLabel = BLUEPRINT_CHOICES.find((b) => b.id === filterBlueprint)?.label ?? 'All Blueprints'
  const activeStatusLabel = STATUS_CHOICES.find((s) => s.id === filterStatus)?.label ?? 'All Papers'

  return (
    <div className="min-h-full bg-[#FFFBF0]">
      {/* ================= HEADER (shared by both views, same layout as every other page) ================= */}
      <PageHeader
        title="Assessment Builder"
        description={
          <>
            Add sections from the palette, tune difficulty mix, and generate a ready-to-use assessment.
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={openChooser}
                className={`h-8 rounded-full px-4 text-[13px] font-medium shadow-sm transition-colors ${
                  viewMode === 'builder' ? 'bg-[#11181C] text-white' : 'bg-white border border-[#E5E7EB] text-[#11181C]'
                }`}
              >
                Build New
              </button>
              <button
                type="button"
                onClick={() => setViewMode('library')}
                className={`h-8 rounded-full px-3 text-[12px] font-medium transition-colors ${
                  viewMode === 'library' ? 'bg-[#11181C] text-white' : 'bg-white border border-[#E5E7EB] text-[#11181C]'
                }`}
              >
                Saved Assessments ({assessments.length})
              </button>
            </div>
          </>
        }
        actions={
          viewMode === 'builder' && editingAssessment ? (
            <button
              type="button"
              onClick={() => setDiagOpen(true)}
              className="hidden h-8 items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white px-3 text-[12px] font-medium text-[#374151] shadow-[0_1px_1px_rgba(0,0,0,0.04)] lg:flex"
            >
              <span className="mr-1.5">⊞</span> Diagnostics
            </button>
          ) : undefined
        }
      />

      {/* ================= VIEW 1: ASSESSMENT BANK / LIBRARY ================= */}
      {viewMode === 'library' && (
        <div>
          {/* Search & Filter Toolbar — pt-4 supplies the gap below PageHeader (which has none itself) */}
          <div className="px-8 pt-4 pb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
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
                  onClick={openChooser}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#11181C] text-white text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Assessment
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
        <div className="relative mt-6 flex flex-1 gap-0 px-4 pb-8 lg:px-6">
          {/* PALETTE (collapsible) */}
          <div
            className={`relative shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${
              paletteCollapsed ? 'w-0 opacity-0 pointer-events-none overflow-hidden' : 'w-[180px] opacity-100'
            }`}
            style={{ overflow: paletteCollapsed ? 'hidden' : 'visible' }}
          >
            <div className="relative w-[180px]" style={{ overflow: 'visible' }}>
              <div className="sticky top-6 w-[180px] rounded-[16px] border border-[#DDD8CF] bg-white p-3 pr-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  onClick={chooseImportFromBank}
                  className="flex h-[32px] w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#DDD8CF] bg-[#F5F1E6] text-[11px] font-semibold text-[#11181C]"
                >
                  <Library className="w-3.5 h-3.5" /> Import from Bank
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {PALETTE_TYPES.map((type) => {
                    const meta = metaFor(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addPaletteSection(type)}
                        className="flex min-h-[68px] flex-col items-center justify-center rounded-[12px] border border-[#DDD8CF] bg-[#F5F1E6] p-2 text-center transition hover:border-[#CFC8B8] hover:bg-[#F1EBD9]"
                      >
                        <span className="text-[14px] leading-none opacity-80" style={{ color: meta.color }}>{meta.icon}</span>
                        <span className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-[1.15] text-[#1F2A22]">{meta.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-3 rounded-[10px] bg-[#FFFBF0] px-2.5 py-2 text-[10px] leading-[1.35] text-[#8A8478]">
                  Click a type to add a section.
                </div>
              </div>

              {!paletteCollapsed && (
                <button
                  type="button"
                  onClick={() => setPaletteCollapsed(true)}
                  title="Collapse palette"
                  aria-label="Collapse palette"
                  className="group absolute z-30 flex flex-col items-center justify-center gap-[4px] border bg-[#1E2D24] hover:bg-[#2A3D2F] transition-colors cursor-col-resize"
                  style={{
                    right: '-4px', top: '58%', transform: 'translateY(-50%)',
                    width: '8px', height: '48px', borderRadius: '4px', borderWidth: '1px',
                    borderColor: '#2A3D2F', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  }}
                >
                  <span className="block rounded-full bg-white/90" style={{ width: '2.5px', height: '2.5px' }} />
                  <span className="block rounded-full bg-white/90" style={{ width: '2.5px', height: '2.5px' }} />
                  <span className="block rounded-full bg-white/90" style={{ width: '2.5px', height: '2.5px' }} />
                </button>
              )}
            </div>
          </div>

          {paletteCollapsed && (
            <button
              type="button"
              onClick={() => setPaletteCollapsed(false)}
              title="Expand palette"
              aria-label="Expand palette"
              className="group absolute z-30 flex flex-col items-center justify-center gap-[4px] border bg-[#1E2D24] hover:bg-[#2A3D2F] transition-colors cursor-col-resize"
              style={{
                left: '12px', top: '285px',
                width: '8px', height: '48px', borderRadius: '4px', borderWidth: '1px',
                borderColor: '#2A3D2F', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }}
            >
              <span className="block rounded-full bg-white/90" style={{ width: '2.5px', height: '2.5px' }} />
              <span className="block rounded-full bg-white/90" style={{ width: '2.5px', height: '2.5px' }} />
              <span className="block rounded-full bg-white/90" style={{ width: '2.5px', height: '2.5px' }} />
            </button>
          )}

          {/* BUILDER CANVAS */}
          <div
            className={`flex flex-1 flex-col gap-4 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${
              paletteCollapsed ? 'ml-6' : 'ml-4'
            }`}
          >
            {/* STEP 1 */}
            <div className="rounded-[16px] border border-[#DDD8CF] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2">
                <span className="rounded-[6px] bg-[#11181C] px-2 py-[2px] text-[10px] font-bold tracking-wide text-white">STEP 1</span>
                <span className="text-[13px] font-semibold text-[#11181C]">Set class context</span>
                <span className="text-[11px] text-[#8A8478]">Choose class and learning objective</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {/* CLASS — vibrant blue */}
                <div
                  className={`relative min-w-[180px] max-w-[220px] h-[68px] overflow-hidden rounded-xl border border-[#A5B4FC] bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-px ${
                    !editingAssessment.class_label ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                >
                  <select
                    value={editingAssessment.class_label}
                    onChange={(e) => {
                      setEditingAssessment({ ...editingAssessment, class_label: e.target.value })
                      setCtxSubjectId('')
                      setCtxChapterId('')
                      setCtxTopicId('')
                      setChapterLabel('')
                      setTopicLabel('')
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  >
                    <option value="">Select class</option>
                    {!importClasses.some((c) => c.grade === editingAssessment.class_label) && editingAssessment.class_label && (
                      <option value={editingAssessment.class_label}>{editingAssessment.class_label}</option>
                    )}
                    {importClasses.map((c) => (
                      <option key={c.grade} value={c.grade}>{c.grade}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#1E40AF]">Class</div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[18px] font-bold leading-none text-[#1E3A8A]">
                        {editingAssessment.class_label.replace(/^Class\s*/i, '') || '—'}
                      </span>
                      {editingAssessment.section_name && (
                        <span className="ml-1 text-[13px] leading-none text-[#60A5FA]">{editingAssessment.section_name}</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#4F46E5] opacity-70" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#93C5FD]" />
                </div>

                {/* SUBJECT — vibrant green */}
                <div
                  className={`relative min-w-[180px] max-w-[220px] h-[68px] overflow-hidden rounded-xl border border-[#86EFAC] bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-px ${
                    !editingAssessment.class_label || ctxSubjects.length === 0 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                >
                  <select
                    value={ctxSubjectId}
                    onChange={(e) => {
                      const s = ctxSubjects.find((x) => x.id === e.target.value)
                      setCtxSubjectId(e.target.value)
                      setEditingAssessment({ ...editingAssessment, subject: s?.name ?? editingAssessment.subject })
                      setCtxChapterId('')
                      setCtxTopicId('')
                      setChapterLabel('')
                      setTopicLabel('')
                    }}
                    disabled={!editingAssessment.class_label || ctxSubjects.length === 0}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  >
                    <option value="">{editingAssessment.subject || 'Select subject'}</option>
                    {ctxSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#065F46]">Subject</div>
                    <div className="mt-1 truncate text-[15px] font-bold leading-none text-[#064E3B]">
                      {editingAssessment.subject || 'Select subject'}
                    </div>
                    <div className="mt-1 text-[12px] leading-none text-[#10B981]">CBSE</div>
                  </div>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#166534] opacity-70" />
                </div>

                {/* CHAPTER — vibrant amber */}
                <div
                  className={`relative min-w-[180px] max-w-[220px] h-[68px] overflow-hidden rounded-xl border border-[#FCD34D] bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-px ${
                    !ctxSubjectId || ctxChapters.length === 0 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                >
                  <select
                    value={ctxChapterId}
                    onChange={(e) => {
                      const c = ctxChapters.find((x) => x.id === e.target.value)
                      setCtxChapterId(e.target.value)
                      setChapterLabel(c?.name ?? '')
                      setCtxTopicId('')
                      setTopicLabel('')
                    }}
                    disabled={!ctxSubjectId || ctxChapters.length === 0}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  >
                    <option value="">{chapterLabel || 'Select chapter'}</option>
                    {ctxChapters.map((c) => (
                      <option key={c.id} value={c.id}>{c.sequence_order != null ? `${c.sequence_order}. ${c.name}` : c.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#92400E]">Chapter</div>
                    <div className="mt-1 truncate text-[14px] font-bold leading-tight text-[#78350F]">
                      {chapterLabel
                        ? (ctxChapter?.sequence_order != null ? `${ctxChapter.sequence_order}. ${chapterLabel}` : chapterLabel)
                        : 'Select chapter'}
                    </div>
                    {ctxChapter && (
                      <div className="mt-0.5 text-[11px] leading-none text-[#92400E]/70">
                        {ctxChapter.topics.length} topic{ctxChapter.topics.length === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#92400E] opacity-70" />
                </div>

                {/* TOPIC — vibrant purple */}
                <div
                  className={`relative min-w-[180px] max-w-[220px] h-[68px] overflow-hidden rounded-xl border border-[#D8B4FE] bg-gradient-to-br from-[#F3E8FF] to-[#E9D5FF] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-px ${
                    !ctxChapterId || ctxTopics.length === 0 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                >
                  <select
                    value={ctxTopicId}
                    onChange={(e) => {
                      const t = ctxTopics.find((x) => x.id === e.target.value)
                      setCtxTopicId(e.target.value)
                      setTopicLabel(t?.name ?? '')
                    }}
                    disabled={!ctxChapterId || ctxTopics.length === 0}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  >
                    <option value="">{topicLabel || 'Select topic'}</option>
                    {ctxTopics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B21A8]">Topic</div>
                    <div className="mt-1 truncate text-[14px] font-bold leading-tight text-[#581C87]">
                      {topicLabel || 'Select topic'}
                    </div>
                  </div>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#7C3AED] opacity-70" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-[10px] font-bold tracking-[0.06em] text-[#8A8478]">LEARNING OBJECTIVE</div>
                <textarea
                  rows={2}
                  value={objectiveText}
                  onChange={(e) => setObjectiveText(e.target.value)}
                  placeholder="What should students demonstrate by the end of this assessment?"
                  className="mt-1.5 w-full rounded-[10px] border border-[#DDD8CF] bg-[#FFFEF8] px-3 py-2.5 text-[12px] leading-[1.45] text-[#2F3A31] outline-none focus:border-[#E8B73D]"
                />
              </div>
            </div>

            {/* STEP 2 */}
            <div className="rounded-[16px] border border-[#DDD8CF] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2">
                <span className="rounded-[6px] bg-[#11181C] px-2 py-[2px] text-[10px] font-bold tracking-wide text-white">STEP 2</span>
                <span className="text-[13px] font-semibold text-[#11181C]">Build your assessment</span>
                <span className="text-[11px] text-[#8A8478]">Click a palette type to add a section</span>
              </div>

              {editingAssessment.sections.length === 0 && (
                <div className="mt-4 rounded-[12px] border-2 border-dashed border-[#DDD8CF] py-10 text-center">
                  <div className="text-[13px] font-semibold text-[#11181C]">Build Your Assessment</div>
                  <div className="mt-1 text-[12px] text-[#8A8478]">Click a question type in the palette to add a section.</div>
                </div>
              )}

              {editingAssessment.sections.map((sec, secIdx) => {
                const meta = metaFor(sec.type)
                const expanded = expandedSections[sec.section_id] ?? true
                const demand = sectionDemand(sec)
                const secMarks = sec.questions.reduce((a, q) => a + (q.marks || sec.marks_per_q), 0)
                const preview = sec.questions.slice(0, 2)
                const more = sec.questions.length - preview.length

                return (
                  <div key={sec.section_id} className="mt-4 rounded-[12px] border border-[#DDD8CF] bg-[#FFFEF8]">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                      <button type="button" onClick={() => toggleSection(sec.section_id)} className="flex items-center gap-3 text-left min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[13px] shrink-0" style={{ background: meta.bg, color: meta.color }}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold leading-tight text-[#11181C] truncate">{sec.name}: {meta.label} Questions</div>
                          <div className="text-[11px] text-[#8A8478]">{secMarks} pts · ~{Math.ceil(sec.questions.length * 2)} min · {sec.questions.length} items</div>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#8A8478] shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
                      </button>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-[#8A8478]">Points / Question</span>
                          <div className="flex items-center rounded-[8px] border border-[#DDD8CF] bg-white">
                            <button type="button" onClick={() => changeSectionPoints(sec.section_id, -1)} className="h-[26px] w-[26px] text-[14px] text-[#374151]">−</button>
                            <span className="w-[22px] text-center text-[12px] font-semibold text-[#11181C]">{sec.marks_per_q}</span>
                            <button type="button" onClick={() => changeSectionPoints(sec.section_id, 1)} className="h-[26px] w-[26px] text-[14px] text-[#374151]">+</button>
                          </div>
                        </div>
                        <div className="hidden items-center gap-2 lg:flex">
                          <span className="text-[10px] font-medium text-[#8A8478]">Cognitive Demand</span>
                          <div className="flex h-[8px] w-[90px] overflow-hidden rounded-full">
                            <div style={{ width: `${demand.easy}%`, background: '#8BCB8E' }} />
                            <div style={{ width: `${demand.medium}%`, background: '#FFD95A' }} />
                            <div style={{ width: `${demand.hard}%`, background: '#FF8A6A' }} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openManage(sec.section_id)}
                          className="rounded-[8px] border border-[#DDD8CF] bg-[#F5F1E6] px-3 py-1 text-[11px] font-semibold text-[#374151]"
                        >
                          Manage Questions
                        </button>
                        <button type="button" onClick={() => removeSection(sec.section_id)} className="text-[#9CA3AF] hover:text-red-600 p-1" title="Remove section">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-[#EEE8DC] bg-white px-4 py-4 space-y-3">
                        {preview.length === 0 ? (
                          <div className="rounded-[12px] border border-dashed border-[#DDD8CF] py-6 text-center text-[12px] text-[#8A8478]">
                            No questions yet — click Manage Questions to add one.
                          </div>
                        ) : (
                          preview.map((q, qi) => (
                            <div key={q.id ?? qi} className="rounded-[12px] border border-[#EEE8DC] p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex gap-2 min-w-0">
                                  <span className="text-[12px] font-bold text-[#11181C] shrink-0">Q{qi + 1}</span>
                                  <div className="min-w-0">
                                    {q.scenarioText && <p className="text-[11px] italic text-[#8A8478] mb-1">{q.scenarioText}</p>}
                                    <p className="max-w-[560px] text-[12px] font-medium leading-[1.45] text-[#11181C]">{q.text}</p>
                                  </div>
                                </div>
                                <div className="ml-3 flex gap-1 shrink-0">
                                  <button type="button" onClick={() => editQuestion(sec.section_id, q.id!)} className="h-6 w-6 rounded-[6px] border border-[#EEE8DC] bg-[#FFFEF8] text-[11px]" title="Edit">✎</button>
                                  <button type="button" onClick={() => deleteQuestionFromCard(sec.section_id, q.id!)} className="h-6 w-6 rounded-[6px] border border-[#EEE8DC] bg-[#FFFEF8] text-[11px]" title="Remove">🗑</button>
                                </div>
                              </div>

                              {q.options && q.options.length > 0 && (
                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {q.options.map((opt) => (
                                    <div key={opt.key} className={`flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[12px] ${opt.correct ? 'border-[#C8E6C9] bg-[#E8F5E9]' : 'border-[#EEE8DC] bg-[#FFFEF8]'}`}>
                                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${opt.correct ? 'border-[#81C784] bg-white text-[#2E7D32]' : 'border-[#DDD8CF] bg-white'}`}>{opt.key}</span>
                                      <span className={opt.correct ? 'font-semibold' : ''}>{opt.text}</span>
                                      {opt.correct && <span className="ml-auto text-[12px] text-[#2E7D32]">✓</span>}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.pairs && q.pairs.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  {q.pairs.map((p, pi) => (
                                    <div key={pi} className="flex items-center gap-2 rounded-[8px] bg-[#FFFEF8] border border-[#EEE8DC] px-3 py-2 text-[12px] text-[#11181C]">
                                      <span>{p.left}</span><span className="text-[#8A8478]">↔</span><span>{p.right}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.correctAnswer && (
                                <div className="mt-2 text-[11px] text-[#2E7D32]"><strong>Answer:</strong> {q.correctAnswer}</div>
                              )}
                              {q.subQuestions && q.subQuestions.length > 0 && (
                                <div className="mt-2 space-y-1 pl-2">
                                  {q.subQuestions.map((sq, si) => (
                                    <div key={si} className="text-[11px] text-[#374151]">{sq.text} <span className="text-[#2E7D32]">→ {sq.answer}</span></div>
                                  ))}
                                </div>
                              )}
                              {q.rubric && <div className="mt-2 text-[11px] text-[#8A8478]"><strong>Rubric:</strong> {q.rubric}</div>}
                              {q.modelAnswer && <div className="mt-2 text-[11px] text-[#8A8478]"><strong>Model answer:</strong> {q.modelAnswer}</div>}

                              <div className="mt-2 flex items-center gap-2">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${q.difficulty === 'Easy' ? 'bg-[#E8F5E9] text-[#2E7D32]' : q.difficulty === 'Hard' ? 'bg-[#FFEBEE] text-[#C0392B]' : 'bg-[#FFF3D6] text-[#8A6A2E]'}`}>{q.difficulty}</span>
                                <span className="text-[10px] text-[#8A8478]">{q.marks} pt(s)</span>
                              </div>
                            </div>
                          ))
                        )}
                        {more > 0 && (
                          <button type="button" onClick={() => openManage(sec.section_id)} className="text-[11px] font-medium text-[#8A8478] hover:text-[#374151]">
                            + {more} more question(s) — manage all
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                <div className="text-[11px] text-[#8A8478]">
                  Total: <span className="font-semibold text-[#11181C]">{liveTotalMarks} pts</span> · ~{totalMinutes} min · {totalItems} items
                  {editingAssessment.total_marks ? <span> · Target {editingAssessment.total_marks} pts</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveAssessment('draft')}
                    className="rounded-full border border-[#DDD8CF] bg-white px-4 py-1.5 text-[12px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAssessment('ready')}
                    className="rounded-full bg-[#11181C] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-black transition-colors"
                  >
                    Generate Assessment →
                  </button>
                </div>
              </div>
            </div>
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

      {/* ================= CREATE ASSESSMENT CHOOSER ================= */}
      {chooserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-[#FCFBF8] border border-cream-border rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-forest text-base">Create Assessment</h3>
              <button type="button" onClick={() => setChooserOpen(false)} className="text-forest/40 hover:text-forest p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={chooseBuildManually}
                className="text-left p-4 rounded-xl border border-cream-border bg-white hover:border-gold hover:shadow-sm transition-all space-y-2"
              >
                <span className="w-9 h-9 rounded-lg bg-forest/5 flex items-center justify-center">
                  <PenLine className="w-4.5 h-4.5 text-forest" />
                </span>
                <div className="font-semibold text-forest text-sm">Build Manually</div>
                <p className="text-xs text-forest/60 leading-relaxed">
                  Start from a CBSE blueprint and add sections from the palette in the Paper Builder.
                </p>
              </button>

              <button
                type="button"
                onClick={chooseImportFromBank}
                className="text-left p-4 rounded-xl border border-cream-border bg-white hover:border-gold hover:shadow-sm transition-all space-y-2"
              >
                <span className="w-9 h-9 rounded-lg bg-forest/5 flex items-center justify-center">
                  <Library className="w-4.5 h-4.5 text-forest" />
                </span>
                <div className="font-semibold text-forest text-sm">Import from Question Bank</div>
                <p className="text-xs text-forest/60 leading-relaxed">
                  Pick published, curriculum-aligned questions by class, subject and chapter.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= IMPORT FROM QUESTION BANK MODAL ================= */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-[#FCFBF8] border border-cream-border rounded-2xl p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-forest/5 text-forest">
                  <Library className="w-5 h-5 text-gold" />
                </span>
                <h3 className="font-semibold text-forest text-base">Import from Question Bank</h3>
              </div>
              <button type="button" onClick={() => setImportOpen(false)} className="text-forest/40 hover:text-forest p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-forest/70 mb-1">Class</label>
                <select
                  value={importGrade}
                  onChange={(e) => { setImportGrade(e.target.value); setImportSubjectId(''); selectImportChapter('') }}
                  className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                >
                  <option value="">Select class</option>
                  {importClasses.map((c) => (
                    <option key={c.grade} value={c.grade}>{c.grade}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-forest/70 mb-1">Subject</label>
                <select
                  value={importSubjectId}
                  onChange={(e) => { setImportSubjectId(e.target.value); selectImportChapter('') }}
                  disabled={!importGrade}
                  className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold disabled:opacity-50"
                >
                  <option value="">Select subject</option>
                  {importSubjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-forest/70 mb-1">Chapter</label>
                <select
                  value={importChapterId}
                  onChange={(e) => selectImportChapter(e.target.value)}
                  disabled={!importSubjectId}
                  className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold disabled:opacity-50"
                >
                  <option value="">Select chapter</option>
                  {importChapters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-cream-border pt-4">
              {importLoading ? (
                <div className="py-8 text-center text-forest/60 text-xs flex flex-col items-center gap-2">
                  <span className="w-5 h-5 border-2 border-cream-border border-t-forest rounded-full animate-spin" />
                  Loading published questions...
                </div>
              ) : !importChapterId ? (
                <div className="py-8 text-center text-forest/50 text-xs">
                  Pick a class, subject and chapter to see its published questions.
                </div>
              ) : importQuestions.length === 0 ? (
                <div className="py-8 text-center text-forest/50 text-xs">
                  No published questions yet for this chapter. Ask an admin to author and publish some in the Question Bank.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {importQuestions.map((qb) => (
                    <label
                      key={qb.question_id}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        importSelected[qb.question_id] ? 'bg-[#E8F5E9] border-[#C8E6C9]' : 'bg-white border-cream-border hover:border-gold'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!importSelected[qb.question_id]}
                        onChange={(e) => setImportSelected((prev) => ({ ...prev, [qb.question_id]: e.target.checked }))}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-[#F3F1EB] border border-[#E5E0D5] text-[10px] font-semibold text-forest">
                            {qb.question_type.replace(/_/g, ' ')}
                          </span>
                          {qb.difficulty && <span className="text-[10px] font-medium text-forest/60">{qb.difficulty}</span>}
                          <span className="text-[10px] font-medium text-forest/60">{qb.marks} Mark(s)</span>
                        </div>
                        <div className="text-forest line-clamp-2">{qb.question_text}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-cream-border">
              <span className="text-xs text-forest/60">{importSelectedCount} question(s) selected</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-cream-border text-forest/70 text-xs font-semibold hover:bg-[#FAF9F5]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmImportFromBank}
                  disabled={importSelectedCount === 0}
                  className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-raised text-cream text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Library className="w-3.5 h-3.5 text-gold" />
                  Import {importSelectedCount || ''} Question(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MANAGE QUESTIONS MODAL ================= */}
      {manageOpen && manageSectionId && editingAssessment && (() => {
        const sec = editingAssessment.sections.find((s) => s.section_id === manageSectionId)
        if (!sec) return null
        const meta = metaFor(sec.type)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
            <div className="w-full max-w-xl bg-[#FCFBF8] border border-cream-border rounded-2xl p-6 shadow-xl space-y-5 max-h-[88vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-forest text-base">Manage Questions</h3>
                  <p className="text-xs text-forest/60 mt-0.5">{sec.name} — {meta.label}</p>
                </div>
                <button type="button" onClick={closeManage} className="text-forest/40 hover:text-forest p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">Question Text</label>
                  <textarea
                    rows={3}
                    value={qDraft.text}
                    onChange={(e) => setQDraft({ ...qDraft, text: e.target.value })}
                    placeholder="Type the question…"
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-xs font-semibold text-forest/70 mb-1">Difficulty</label>
                  <select
                    value={qDraft.difficulty}
                    onChange={(e) => setQDraft({ ...qDraft, difficulty: e.target.value as QuestionDraft['difficulty'] })}
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                {meta.hasOptions && (
                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">
                      Options {meta.singleCorrect ? '(one correct)' : '(one or more correct)'}
                    </label>
                    <div className="space-y-2">
                      {qDraft.options.map((o, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type={meta.singleCorrect ? 'radio' : 'checkbox'}
                            name="qopt-correct"
                            checked={o.correct}
                            onChange={() => {
                              const options = qDraft.options.map((opt, idx) =>
                                meta.singleCorrect ? { ...opt, correct: idx === i } : (idx === i ? { ...opt, correct: !opt.correct } : opt)
                              )
                              setQDraft({ ...qDraft, options })
                            }}
                          />
                          <span className="w-5 text-xs font-semibold text-forest/60">{LETTERS[i]}</span>
                          <input
                            type="text"
                            value={o.text}
                            disabled={!!meta.fixed}
                            onChange={(e) => {
                              const options = qDraft.options.map((opt, idx) => (idx === i ? { ...opt, text: e.target.value } : opt))
                              setQDraft({ ...qDraft, options })
                            }}
                            placeholder={`Option ${LETTERS[i]}`}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-cream-border bg-white text-xs text-forest outline-none focus:border-gold disabled:opacity-60"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {meta.hasPairs && (
                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">Matching Pairs</label>
                    <div className="space-y-2">
                      {qDraft.pairs.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={p.left}
                            onChange={(e) => {
                              const pairs = qDraft.pairs.map((pr, idx) => (idx === i ? { ...pr, left: e.target.value } : pr))
                              setQDraft({ ...qDraft, pairs })
                            }}
                            placeholder={`Left ${i + 1}`}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-cream-border bg-white text-xs text-forest outline-none focus:border-gold"
                          />
                          <span className="text-forest/50 text-xs">↔</span>
                          <input
                            type="text"
                            value={p.right}
                            onChange={(e) => {
                              const pairs = qDraft.pairs.map((pr, idx) => (idx === i ? { ...pr, right: e.target.value } : pr))
                              setQDraft({ ...qDraft, pairs })
                            }}
                            placeholder={`Right ${i + 1}`}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-cream-border bg-white text-xs text-forest outline-none focus:border-gold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {meta.hasCorrectAnswer && (
                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">Correct Answer</label>
                    <input
                      type="text"
                      value={qDraft.correctAnswer}
                      onChange={(e) => setQDraft({ ...qDraft, correctAnswer: e.target.value })}
                      placeholder="e.g. 4"
                      className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                    />
                  </div>
                )}

                {meta.hasScenarioText && (
                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">Scenario</label>
                    <textarea
                      rows={2}
                      value={qDraft.scenarioText}
                      onChange={(e) => setQDraft({ ...qDraft, scenarioText: e.target.value })}
                      placeholder="Set the scenario the question is based on…"
                      className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                    />
                  </div>
                )}

                {meta.hasSubQuestions && (
                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">Sub-Questions</label>
                    <div className="space-y-2">
                      {qDraft.subQuestions.map((sq, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={sq.text}
                            onChange={(e) => {
                              const subQuestions = qDraft.subQuestions.map((s, idx) => (idx === i ? { ...s, text: e.target.value } : s))
                              setQDraft({ ...qDraft, subQuestions })
                            }}
                            placeholder={`Part ${LETTERS[i]} question`}
                            className="px-2.5 py-1.5 rounded-lg border border-cream-border bg-white text-xs text-forest outline-none focus:border-gold"
                          />
                          <input
                            type="text"
                            value={sq.answer}
                            onChange={(e) => {
                              const subQuestions = qDraft.subQuestions.map((s, idx) => (idx === i ? { ...s, answer: e.target.value } : s))
                              setQDraft({ ...qDraft, subQuestions })
                            }}
                            placeholder={`Part ${LETTERS[i]} answer`}
                            className="px-2.5 py-1.5 rounded-lg border border-cream-border bg-white text-xs text-forest outline-none focus:border-gold"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setQDraft({ ...qDraft, subQuestions: [...qDraft.subQuestions, { text: '', answer: '' }] })}
                      className="mt-2 text-xs font-semibold text-forest/70 hover:text-forest"
                    >
                      + Add Part
                    </button>
                  </div>
                )}

                {meta.hasRubric ? (
                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">Rubric / Model Answer</label>
                    <textarea
                      rows={3}
                      value={qDraft.rubric}
                      onChange={(e) => setQDraft({ ...qDraft, rubric: e.target.value })}
                      placeholder="Marking points…"
                      className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                    />
                  </div>
                ) : meta.hasModelAnswer ? (
                  <div>
                    <label className="block text-xs font-semibold text-forest/70 mb-1">Model Answer</label>
                    <textarea
                      rows={3}
                      value={qDraft.modelAnswer}
                      onChange={(e) => setQDraft({ ...qDraft, modelAnswer: e.target.value })}
                      placeholder="What a full-marks answer covers…"
                      className="w-full px-3 py-2 rounded-xl border border-cream-border bg-[#FAF9F5] text-xs text-forest outline-none focus:border-gold"
                    />
                  </div>
                ) : null}
              </div>

              {sec.questions.length > 0 && (
                <div className="border-t border-cream-border pt-3 space-y-1.5">
                  <div className="text-xs font-semibold text-forest/70">{sec.questions.length} question(s) in this section</div>
                  {sec.questions.map((q, i) => (
                    <div key={q.id ?? i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-cream-border text-xs">
                      <span className="truncate text-forest">{i + 1}. {q.text || '(untitled)'}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => editQuestion(sec.section_id, q.id!)} className="text-forest/60 hover:text-forest">Edit</button>
                        <button type="button" onClick={() => deleteQuestionFromManage(q.id!)} className="text-forest/60 hover:text-red-600">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-cream-border">
                <button type="button" onClick={closeManage} className="px-3.5 py-2 rounded-xl border border-cream-border text-forest/70 text-xs font-semibold hover:bg-[#FAF9F5]">
                  Done
                </button>
                <button type="button" onClick={saveDraftQuestion} className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-raised text-cream text-xs font-semibold shadow-xs">
                  {editingQuestionId ? 'Save Changes' : '+ Add Question'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ================= DIAGNOSTICS MODAL ================= */}
      {diagOpen && editingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FCFBF8] border border-cream-border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-forest text-base">Diagnostics</h3>
              <button type="button" onClick={() => setDiagOpen(false)} className="text-forest/40 hover:text-forest p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white border border-cream-border py-2.5">
                <div className="text-lg font-bold text-forest">{totalItems}</div>
                <div className="text-[10px] text-forest/60">Items</div>
              </div>
              <div className="rounded-xl bg-white border border-cream-border py-2.5">
                <div className="text-lg font-bold text-forest">{liveTotalMarks}</div>
                <div className="text-[10px] text-forest/60">Marks</div>
              </div>
              <div className="rounded-xl bg-white border border-cream-border py-2.5">
                <div className="text-lg font-bold text-forest">{editingAssessment.sections.length}</div>
                <div className="text-[10px] text-forest/60">Sections</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-forest/70 mb-1.5">Difficulty Balance</div>
              <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden flex">
                <div style={{ width: `${diag.easyPct}%` }} className="h-full bg-[#86C87E]" />
                <div style={{ width: `${diag.mediumPct}%` }} className="h-full bg-[#E8B73D]" />
                <div style={{ width: `${diag.hardPct}%` }} className="h-full bg-[#F87171]" />
              </div>
              <div className="mt-1 text-[11px] text-forest/60">Easy {diag.easyPct}% · Medium {diag.mediumPct}% · Hard {diag.hardPct}%</div>
            </div>
            {diag.typeDist.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-forest/70 mb-1.5">By Type</div>
                <div className="space-y-1">
                  {diag.typeDist.map((t) => (
                    <div key={t.name} className="flex items-center justify-between text-xs text-forest">
                      <span>{t.name}</span>
                      <span className="text-forest/60">{t.count} ({t.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
