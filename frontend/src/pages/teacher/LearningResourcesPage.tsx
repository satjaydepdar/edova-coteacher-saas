import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  BookOpen,
  Presentation,
  FileSpreadsheet,
  FileCheck,
  StickyNote,
  Video,
  Search,
  Plus,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Users,
  X,
  Trash2,
  FolderOpen,
  LayoutGrid,
  List,
} from 'lucide-react'
import { useResourceStore, ResourceItem } from '../../store/resourceStore'
import { useApp } from '../../store'
import { api, type Chapter } from '../../lib/api'
import { searchInputClass } from '../../components/SearchToolbar'

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }> = {
  textbook: {
    label: 'NCERT Textbook',
    icon: BookOpen,
    color: 'text-[#0C4A6E]',
    bg: 'bg-[#E0F2FE]',
    border: 'border-[#BAE6FD]',
  },
  slides: {
    label: 'Slides / PPT',
    icon: Presentation,
    color: 'text-[#57534E]',
    bg: 'bg-[#F3F1EB]',
    border: 'border-[#E5E7EB]',
  },
  formula_sheet: {
    label: 'Formula Sheet',
    icon: FileSpreadsheet,
    color: 'text-[#92400E]',
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#FDE68A]',
  },
  worksheet: {
    label: 'Worksheet',
    icon: FileCheck,
    color: 'text-[#166534]',
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
  },
  notes: {
    label: 'Concept Notes',
    icon: StickyNote,
    color: 'text-[#9A3412]',
    bg: 'bg-[#FFF7ED]',
    border: 'border-[#FDBA74]',
  },
  video: {
    label: 'Video Module',
    icon: Video,
    color: 'text-[#9D174D]',
    bg: 'bg-[#FDF2F8]',
    border: 'border-[#FBCFE8]',
  },
}

const TYPE_FILTER_CHOICES = [
  { id: 'ALL', label: 'All Formats' },
  { id: 'textbook', label: 'NCERT Books' },
  { id: 'slides', label: 'Slides (PPT)' },
  { id: 'formula_sheet', label: 'Formula Sheets' },
  { id: 'worksheet', label: 'Worksheets' },
  { id: 'notes', label: 'Notes' },
]

export default function LearningResourcesPage() {
  const {
    resources,
    loading,
    error,
    selectedSubjectId,
    selectedChapterId,
    selectedType,
    selectedSection,
    searchQuery,
    previewResource,
    assigningResource,
    fetchResources,
    createResource,
    deleteResource,
    assignResource,
    setSelectedSubjectId,
    setSelectedChapterId,
    setSelectedType,
    setSelectedSection,
    setSearchQuery,
    setPreviewResource,
    setAssigningResource,
  } = useResourceStore()

  const { subjects } = useApp()
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId)

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedAssignSections, setSelectedAssignSections] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  // Real chapter list for the currently selected subject (fetched from the curriculum tree)
  const [subjectChapters, setSubjectChapters] = useState<Chapter[]>([])
  useEffect(() => {
    if (!selectedSubjectId || selectedSubjectId === 'ALL') {
      setSubjectChapters([])
      return
    }
    let cancelled = false
    api.tree(selectedSubjectId).then((t) => {
      if (!cancelled) setSubjectChapters(t.chapters)
    }).catch(() => {
      if (!cancelled) setSubjectChapters([])
    })
    return () => { cancelled = true }
  }, [selectedSubjectId])

  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid')
  const [subjectMenuOpen, setSubjectMenuOpen] = useState(false)
  const [chapterMenuOpen, setChapterMenuOpen] = useState(false)
  const subjectMenuRef = useRef<HTMLDivElement>(null)
  const chapterMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (subjectMenuRef.current && !subjectMenuRef.current.contains(e.target as Node)) setSubjectMenuOpen(false)
      if (chapterMenuRef.current && !chapterMenuRef.current.contains(e.target as Node)) setChapterMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Upload Form State
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newType, setNewType] = useState('notes')
  const [newSubject, setNewSubject] = useState('Mathematics')
  const [newChapter, setNewChapter] = useState('Real Numbers')
  const [newFileUrl, setNewFileUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void fetchResources()
  }, [])

  // Sync assignment modal state when opened
  useEffect(() => {
    if (assigningResource) {
      setSelectedAssignSections(assigningResource.assigned_sections || [])
    }
  }, [assigningResource])

  // KPIs
  const totalCount = resources.length
  const textbookCount = resources.filter((r) => r.resource_type === 'textbook').length
  const formulaCount = resources.filter((r) => r.resource_type === 'formula_sheet').length
  const assignedCount = resources.filter((r) => r.assigned_sections && r.assigned_sections.length > 0).length

  // Group by chapter
  const groupedByChapter = useMemo(() => {
    const map = new Map<string, ResourceItem[]>()
    for (const r of resources) {
      const chName = r.chapter_name || 'General Curriculum'
      const list = map.get(chName) || []
      list.push(r)
      map.set(chName, list)
    }
    return Array.from(map.entries())
  }, [resources])

  const handleSaveAssignment = async () => {
    if (!assigningResource) return
    setIsAssigning(true)
    try {
      await assignResource(assigningResource.id, selectedAssignSections, 'assign')
      setAssigningResource(null)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setIsSubmitting(true)
    try {
      await createResource({
        title: newTitle.trim(),
        description: newDescription.trim(),
        resource_type: newType,
        file_url: newFileUrl.trim() || '/assets/docs/sample_doc.pdf',
        meta: { format: 'PDF', author: 'Teacher Upload' },
        assigned_sections: [],
        status: 'ready',
      })
      setIsUploadOpen(false)
      setNewTitle('')
      setNewDescription('')
      setNewFileUrl('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-[#FFFBF0] text-[#11181C] font-[Inter]">
      {/* HEADER */}
      <div className="w-full px-8 pt-6 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1 h-7 rounded shrink-0" style={{ background: '#E8B73D' }} />
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#11181C] leading-none">
              Learning Resources Library
            </h1>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="h-10 px-5 bg-[#11181C] hover:bg-black text-white rounded-[12px] text-[14px] font-medium flex items-center gap-2 shadow-sm shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Resource
          </button>
        </div>
        <p className="mt-2 text-[14px] leading-[1.5] text-[#6B7280] max-w-[640px]">
          Curriculum-aligned NCERT textbooks, classroom slide decks, formula sheets, notes, and handouts.
        </p>
      </div>

      {/* FILTER BAR: Subject + Chapter filters (left), TEACHER pill (right) */}
      <div className="px-8 pt-4 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0" ref={subjectMenuRef}>
            <button
              onClick={() => { setSubjectMenuOpen((v) => !v); setChapterMenuOpen(false) }}
              className="h-9 px-4 rounded-full bg-white border border-[#E5E7EB] text-[13px] font-medium text-[#11181C] hover:border-[#D1D5DB] transition-colors flex items-center gap-2"
            >
              {activeSubject ? activeSubject.name : 'All Subjects'}
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${subjectMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {subjectMenuOpen && (
              <div className="absolute top-[42px] left-0 z-30 bg-white border border-[#E5E7EB] rounded-[12px] shadow-lg py-2 w-[200px]">
                <button
                  onClick={() => { setSelectedSubjectId('ALL'); setSubjectMenuOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#FFFBF0] ${selectedSubjectId === 'ALL' ? 'font-semibold bg-[#FFFBF0]' : 'text-[#374151]'}`}
                >
                  All Subjects
                </button>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSubjectId(s.id); setSubjectMenuOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#FFFBF0] ${selectedSubjectId === s.id ? 'font-semibold bg-[#FFFBF0]' : 'text-[#374151]'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative shrink-0" ref={chapterMenuRef}>
            <button
              onClick={() => { setChapterMenuOpen((v) => !v); setSubjectMenuOpen(false) }}
              disabled={selectedSubjectId === 'ALL'}
              className="h-9 px-4 rounded-full bg-white border border-[#E5E7EB] text-[13px] font-medium text-[#11181C] hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {subjectChapters.find((c) => c.chapter_id === selectedChapterId)?.chapter_name ?? 'All Chapters'}
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${chapterMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {chapterMenuOpen && (
              <div className="absolute top-[42px] left-0 z-30 bg-white border border-[#E5E7EB] rounded-[12px] shadow-lg py-2 w-[200px] max-h-[280px] overflow-y-auto">
                <button
                  onClick={() => { setSelectedChapterId('ALL'); setChapterMenuOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#FFFBF0] ${selectedChapterId === 'ALL' ? 'font-semibold bg-[#FFFBF0]' : 'text-[#374151]'}`}
                >
                  All Chapters
                </button>
                {subjectChapters.map((c) => (
                  <button
                    key={c.chapter_id}
                    onClick={() => { setSelectedChapterId(c.chapter_id); setChapterMenuOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#FFFBF0] ${selectedChapterId === c.chapter_id ? 'font-semibold bg-[#FFFBF0]' : 'text-[#374151]'}`}
                  >
                    {c.chapter_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#E5E0D5] rounded-full shrink-0 pl-1 pr-3 py-1">
          <span className="h-6 px-2 rounded-full bg-[#11181C] text-white text-[10px] font-mono uppercase tracking-wide grid place-items-center">
            TEACHER
          </span>
          <span className="text-[13px] font-medium text-[#11181C]">Rahul Verma</span>
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="px-8 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm px-5 py-4 flex items-start gap-4">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#1E2D24]" />
          <div className="w-10 h-10 rounded-full bg-[#F3F1EB] flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-[#57534E]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.12em] font-semibold uppercase text-[#8A8F98]">Total Resources</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[24px] font-bold leading-none text-[#11181C]">{totalCount}</span>
              <span className="text-[12px] text-[#6B7280]">Across All Chapters</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm px-5 py-4 flex items-start gap-4">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#3B82F6]" />
          <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[#1D4ED8]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.12em] font-semibold uppercase text-[#8A8F98]">NCERT Textbooks</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[24px] font-bold leading-none text-[#11181C]">{textbookCount}</span>
              <span className="text-[12px] text-[#6B7280]">Official E-Books</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm px-5 py-4 flex items-start gap-4">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#F5C542]" />
          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-[#92400E]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.12em] font-semibold uppercase text-[#8A8F98]">Formula Sheets</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[24px] font-bold leading-none text-[#11181C]">{formulaCount}</span>
              <span className="text-[12px] text-[#6B7280]">Quick Revision Cards</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm px-5 py-4 flex items-start gap-4">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#22C55E]" />
          <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#166534]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.12em] font-semibold uppercase text-[#8A8F98]">Assigned to Classes</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[24px] font-bold leading-none text-[#11181C]">{assignedCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-6">
        {/* SEARCH & TOOLBAR */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-3 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void fetchResources()}
                placeholder="Search resources by title, topic, or keyword..."
                className={`${searchInputClass} pl-10`}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="h-10 px-3 rounded-[12px] bg-white border border-[#E5E7EB] text-[13px] font-medium text-[#11181C] outline-none hover:border-[#D1D5DB]"
              >
                <option value="ALL">All Sections</option>
                <option value="10-A">Class 10-A</option>
                <option value="10-B">Class 10-B</option>
                <option value="9-A">Class 9-A</option>
              </select>

              <div className="flex items-center gap-[3px] p-[3px] rounded-[10px] border border-[#E5E7EB] bg-[#F8F5EE]">
                <button
                  aria-label="Grid view"
                  onClick={() => setLayoutMode('grid')}
                  className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                    layoutMode === 'grid' ? 'bg-[#11181C] text-white' : 'text-[#6B7280] hover:text-[#11181C]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  aria-label="List view"
                  onClick={() => setLayoutMode('list')}
                  className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                    layoutMode === 'list' ? 'bg-[#11181C] text-white' : 'text-[#6B7280] hover:text-[#11181C]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* TYPE PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F3F4F6]">
            <span className="text-[10px] font-mono font-semibold tracking-[0.12em] text-[#8A8F98] uppercase mr-1">
              Resource Type:
            </span>
            {TYPE_FILTER_CHOICES.map((t) => {
              const active = selectedType === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`h-7 px-3 rounded-full text-[12px] font-medium border transition-colors ${
                    active
                      ? 'bg-[#11181C] text-white border-[#11181C]'
                      : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#D1D5DB] hover:text-[#11181C]'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* CHAPTER LISTING */}
        <div className="mt-6 space-y-8">
          {loading && (
            <div className="py-16 text-center text-sm text-[#6B7280]">
              <span className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#11181C] rounded-full inline-block animate-spin mr-2 align-middle" />
              Loading curriculum resources...
            </div>
          )}

          {!loading && groupedByChapter.length === 0 && (
            <div className="py-16 text-center bg-[#FFFEF8] border border-dashed border-[#E5DDC8] rounded-[16px] p-8">
              <FolderOpen className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#11181C]">No resources found</p>
              <p className="text-xs text-[#6B7280] mt-1">Try adjusting your search or filters.</p>
            </div>
          )}

          {!loading &&
            groupedByChapter.map(([chapterName, items]) => (
              <div key={chapterName} className="space-y-3">
                {/* CHAPTER HEADER BAR */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <h2 className="text-[16px] font-bold text-[#11181C]">
                      {chapterName}
                    </h2>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-[6px] bg-[#F3F1EB] border border-[#E5E7EB] text-[#57534E]">
                      {items.length} {items.length === 1 ? 'asset' : 'assets'}
                    </span>
                  </div>

                  <span className="text-[12px] text-[#8A8F98] font-medium">
                    CBSE Class 10
                  </span>
                </div>

                {/* RESOURCE CARDS GRID */}
                <div className={layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
                  {items.map((r) => {
                    const cfg = TYPE_CONFIG[r.resource_type] || TYPE_CONFIG.notes
                    const IconComponent = cfg.icon
                    const isAssigned = r.assigned_sections && r.assigned_sections.length > 0

                    return (
                      <div
                        key={r.id}
                        className={`bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm hover:shadow-md hover:border-[#D1D5DB] transition-all group ${
                          layoutMode === 'list' ? 'flex gap-4 items-start' : 'flex flex-col justify-between'
                        }`}
                      >
                        <div className={layoutMode === 'list' ? 'flex-1 min-w-0' : undefined}>
                          {/* TOP CHIP BAR */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                            >
                              <IconComponent className="w-3.5 h-3.5" />
                              <span>{cfg.label}</span>
                            </span>

                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#166534] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Assigned</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono font-medium text-[#9CA3AF] bg-[#F9FAFB] px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                                Ready
                              </span>
                            )}
                          </div>

                          {/* TITLE & DESCRIPTION */}
                          <h3
                            onClick={() => setPreviewResource(r)}
                            className="text-[15px] font-bold leading-[1.3] text-[#11181C] group-hover:text-black transition-colors cursor-pointer"
                          >
                            {r.title}
                          </h3>
                          <p className="text-[13px] text-[#6B7280] mt-1.5 line-clamp-2 leading-[1.5]">
                            {r.description || 'No description provided.'}
                          </p>

                          {/* ASSIGNED SECTIONS PILLS */}
                          {isAssigned && (
                            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#8A8F98]">
                                Assigned to:
                              </span>
                              {r.assigned_sections.map((sec) => (
                                <span
                                  key={sec}
                                  className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-[6px] bg-[#F3F1EB] border border-[#E5E7EB] text-[#57534E]"
                                >
                                  {sec}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="h-px bg-[#F3F4F6] my-4" />

                          {/* BOTTOM ACTION BAR */}
                          <div className="flex items-center justify-between text-xs">
                            <button
                              onClick={() => setAssigningResource(r)}
                              className="font-medium text-[#11181C] hover:text-black transition flex items-center gap-1.5"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Assign Class</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPreviewResource(r)}
                                className="h-7 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[12px] font-medium text-[#374151] hover:border-[#11181C] hover:text-[#11181C] transition-colors"
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => void deleteResource(r.id)}
                                title="Delete resource"
                                className="w-7 h-7 rounded-[8px] border border-[#E5E7EB] bg-white flex items-center justify-center text-[#9CA3AF] hover:text-red-600 hover:border-red-200 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ASSIGN CLASS MODAL */}
      {assigningResource && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E0CC]">
              <div>
                <h3 className="font-[Poppins] text-lg font-bold text-[#13231F]">
                  Assign to Classroom
                </h3>
                <p className="text-xs text-[#13231F]/60 mt-0.5 truncate max-w-xs">
                  {assigningResource.title}
                </p>
              </div>
              <button
                onClick={() => setAssigningResource(null)}
                className="text-[#13231F]/40 hover:text-[#13231F] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <p className="text-xs text-[#13231F]/70">
                Select which sections should receive this learning asset in their classroom syllabus:
              </p>

              {['10-A', '10-B', '9-A'].map((sec) => {
                const checked = selectedAssignSections.includes(sec)
                return (
                  <label
                    key={sec}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] hover:bg-white cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssignSections((prev) => [...prev, sec])
                          } else {
                            setSelectedAssignSections((prev) => prev.filter((s) => s !== sec))
                          }
                        }}
                        className="w-4 h-4 rounded text-[#13231F] focus:ring-[#7FBF7A]"
                      />
                      <div>
                        <div className="text-sm font-semibold text-[#13231F]">Section {sec}</div>
                        <div className="text-[11px] text-[#13231F]/50">
                          {sec.startsWith('10') ? 'Grade 10 • Mathematics' : 'Grade 9 • General'}
                        </div>
                      </div>
                    </div>
                    {checked && (
                      <span className="text-xs font-semibold text-[#1B4D3E] bg-[#EBF5EF] px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            <div className="pt-4 border-t border-[#E8E0CC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningResource(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#13231F]/70 hover:bg-[#FAF9F5] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAssigning}
                onClick={() => void handleSaveAssignment()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#13231F] text-white hover:bg-[#13231F]/90 transition shadow-sm"
              >
                {isAssigning ? 'Saving...' : 'Update Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW RESOURCE MODAL */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E0CC]">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#7FBF7A]">
                  Resource Preview
                </span>
                <h3 className="font-[Poppins] text-lg font-bold text-[#13231F]">
                  {previewResource.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="text-[#13231F]/40 hover:text-[#13231F] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 flex-1 overflow-y-auto space-y-4">
              <div className="bg-[#FAF9F5] border border-[#E8E0CC] rounded-xl p-4">
                <div className="text-xs font-semibold text-[#13231F]/50 uppercase tracking-wider mb-1">
                  Description
                </div>
                <p className="text-sm text-[#13231F] leading-relaxed">
                  {previewResource.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FAF9F5] border border-[#E8E0CC] rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-[#13231F]/50">Format</span>
                  <div className="text-sm font-bold text-[#13231F] mt-0.5 uppercase">
                    {previewResource.meta?.format || 'PDF'}
                  </div>
                </div>
                <div className="bg-[#FAF9F5] border border-[#E8E0CC] rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-[#13231F]/50">Subject</span>
                  <div className="text-sm font-bold text-[#13231F] mt-0.5 truncate">
                    {previewResource.subject_name || 'Mathematics'}
                  </div>
                </div>
                <div className="bg-[#FAF9F5] border border-[#E8E0CC] rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-[#13231F]/50">Chapter</span>
                  <div className="text-sm font-bold text-[#13231F] mt-0.5 truncate">
                    {previewResource.chapter_name || 'Chapter 1'}
                  </div>
                </div>
                <div className="bg-[#FAF9F5] border border-[#E8E0CC] rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-[#13231F]/50">Status</span>
                  <div className="text-sm font-bold text-[#1B4D3E] mt-0.5 capitalize">
                    {previewResource.status}
                  </div>
                </div>
              </div>

              {/* SIMULATED READER EMBED */}
              <div className="border border-[#E8E0CC] rounded-xl bg-[#13231F]/5 p-8 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-[#13231F]/40 mx-auto" />
                <div>
                  <h4 className="font-semibold text-sm text-[#13231F]">Document Ready for Class</h4>
                  <p className="text-xs text-[#13231F]/60 mt-0.5">
                    URL: {previewResource.file_url || 'Direct cloud storage link'}
                  </p>
                </div>
                <a
                  href={previewResource.file_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#13231F] text-white text-xs font-semibold hover:bg-[#13231F]/90 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Resource</span>
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E0CC] flex items-center justify-between">
              <div className="text-xs text-[#13231F]/50">
                Assigned to:{' '}
                {previewResource.assigned_sections?.length
                  ? previewResource.assigned_sections.join(', ')
                  : 'None yet'}
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#13231F] text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD RESOURCE MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E0CC]">
              <div>
                <h3 className="font-[Poppins] text-lg font-bold text-[#13231F]">
                  Upload Learning Resource
                </h3>
                <p className="text-xs text-[#13231F]/60 mt-0.5">
                  Attach custom classroom slides, formula notes, or practice PDFs.
                </p>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-[#13231F]/40 hover:text-[#13231F] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#13231F]/60 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Trigonometry Problem Set with Proofs"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-sm text-[#13231F] focus:outline-none focus:ring-1 focus:ring-[#7FBF7A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#13231F]/60 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-xs font-semibold text-[#13231F] focus:outline-none"
                  >
                    <option value="notes">Concept Notes</option>
                    <option value="slides">Slides (PPT)</option>
                    <option value="formula_sheet">Formula Sheet</option>
                    <option value="worksheet">Worksheet</option>
                    <option value="textbook">Textbook PDF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#13231F]/60 mb-1">
                    Target Subject
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-xs font-semibold text-[#13231F] focus:outline-none"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#13231F]/60 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief summary of what this document covers..."
                  className="w-full p-3 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-sm text-[#13231F] focus:outline-none focus:ring-1 focus:ring-[#7FBF7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#13231F]/60 mb-1">
                  File URL or Document Link
                </label>
                <input
                  type="text"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  placeholder="https://... or /assets/docs/file.pdf"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-sm text-[#13231F] focus:outline-none focus:ring-1 focus:ring-[#7FBF7A]"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E0CC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#13231F]/70 hover:bg-[#FAF9F5] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#13231F] text-white hover:bg-[#13231F]/90 transition shadow-sm"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
