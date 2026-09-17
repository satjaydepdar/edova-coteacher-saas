import React, { useEffect, useState, useMemo } from 'react'
import {
  BookOpen,
  FileText,
  Presentation,
  FileSpreadsheet,
  FileCheck,
  StickyNote,
  Video,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Users,
  X,
  Trash2,
  FolderOpen,
  ArrowRight
} from 'lucide-react'
import { useResourceStore, ResourceItem } from '../../store/resourceStore'

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }> = {
  textbook: {
    label: 'NCERT Textbook',
    icon: BookOpen,
    color: 'text-[#1B4D3E]',
    bg: 'bg-[#EBF5EF]',
    border: 'border-[#C8E6D3]',
  },
  slides: {
    label: 'Slides / PPT',
    icon: Presentation,
    color: 'text-[#8A580C]',
    bg: 'bg-[#FEF5E7]',
    border: 'border-[#FAD7A0]',
  },
  formula_sheet: {
    label: 'Formula Sheet',
    icon: FileSpreadsheet,
    color: 'text-[#1E4D79]',
    bg: 'bg-[#EBF5FB]',
    border: 'border-[#AED6F1]',
  },
  worksheet: {
    label: 'Worksheet',
    icon: FileCheck,
    color: 'text-[#5B2C6F]',
    bg: 'bg-[#F5EEF8]',
    border: 'border-[#D7BDE2]',
  },
  notes: {
    label: 'Concept Notes',
    icon: StickyNote,
    color: 'text-[#115E59]',
    bg: 'bg-[#E6FFFA]',
    border: 'border-[#B2F5EA]',
  },
  video: {
    label: 'Video Module',
    icon: Video,
    color: 'text-[#831843]',
    bg: 'bg-[#FDF2F8]',
    border: 'border-[#FBCFE8]',
  },
}

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

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedAssignSections, setSelectedAssignSections] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

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
    <div className="min-h-screen bg-[#FAF9F5] text-[#13231F] font-[Inter]">
      {/* HEADER */}
      <div className="border-b border-[#E8E0CC] bg-[#FCFBF8] px-6 py-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-6 rounded-full bg-[#7FBF7A]" />
              <h1 className="font-[Poppins] text-2xl lg:text-3xl font-bold tracking-tight text-[#13231F]">
                Learning Resources Library
              </h1>
            </div>
            <p className="text-[13.5px] text-[#13231F]/60">
              Curriculum-aligned NCERT textbooks, classroom slide decks, formula sheets, notes, and handouts.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13231F] text-white text-sm font-semibold hover:bg-[#13231F]/90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Resource</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#13231F]/50">
                Total Resources
              </span>
              <FolderOpen className="w-4 h-4 text-[#7FBF7A]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#13231F]">{totalCount}</div>
            <div className="text-[11.5px] text-[#13231F]/50 mt-0.5">Across All Chapters</div>
          </div>

          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#13231F]/50">
                NCERT Textbooks
              </span>
              <BookOpen className="w-4 h-4 text-[#1B4D3E]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#13231F]">{textbookCount}</div>
            <div className="text-[11.5px] text-[#13231F]/50 mt-0.5">Official E-Books</div>
          </div>

          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#13231F]/50">
                Formula Sheets
              </span>
              <FileSpreadsheet className="w-4 h-4 text-[#D9A94E]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#13231F]">{formulaCount}</div>
            <div className="text-[11.5px] text-[#13231F]/50 mt-0.5">Quick Revision Cards</div>
          </div>

          <div className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#13231F]/50">
                Assigned to Classes
              </span>
              <Users className="w-4 h-4 text-[#7FBF7A]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-[Poppins] text-[#13231F]">{assignedCount}</div>
            <div className="text-[11.5px] text-[#13231F]/50 mt-0.5">Class 10-A, 10-B</div>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="mt-6 bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#13231F]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void fetchResources()}
                placeholder="Search resources by title, topic, or keyword..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-sm text-[#13231F] placeholder-[#13231F]/40 focus:outline-none focus:ring-1 focus:ring-[#7FBF7A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="h-10 px-3 rounded-xl border border-[#E8E0CC] bg-[#FAF9F5] text-xs font-semibold text-[#13231F] focus:outline-none focus:ring-1 focus:ring-[#7FBF7A]"
              >
                <option value="ALL">All Sections</option>
                <option value="10-A">Class 10-A</option>
                <option value="10-B">Class 10-B</option>
                <option value="9-A">Class 9-A</option>
              </select>

              <button
                onClick={() => void fetchResources()}
                className="h-10 px-4 rounded-xl bg-[#13231F] text-white text-xs font-semibold hover:bg-[#13231F]/90 transition"
              >
                Filter
              </button>
            </div>
          </div>

          {/* TYPE PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E8E0CC]/50">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#13231F]/40 mr-1">
              Resource Type:
            </span>
            {[
              { id: 'ALL', label: 'All Formats' },
              { id: 'textbook', label: 'NCERT Books' },
              { id: 'slides', label: 'Slides (PPT)' },
              { id: 'formula_sheet', label: 'Formula Sheets' },
              { id: 'worksheet', label: 'Worksheets' },
              { id: 'notes', label: 'Notes' },
            ].map((t) => {
              const active = selectedType === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    active
                      ? 'bg-[#13231F] text-white'
                      : 'bg-[#FAF9F5] text-[#13231F]/70 border border-[#E8E0CC] hover:bg-white'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* CHAPTER LISTING */}
        <div className="mt-8 space-y-8">
          {loading && (
            <div className="py-16 text-center text-sm text-[#13231F]/50">
              <span className="w-5 h-5 border-2 border-[#13231F]/20 border-t-[#13231F] rounded-full inline-block animate-spin mr-2 align-middle" />
              Loading curriculum resources...
            </div>
          )}

          {!loading && groupedByChapter.length === 0 && (
            <div className="py-16 text-center bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-8">
              <FolderOpen className="w-8 h-8 text-[#13231F]/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#13231F]">No resources found</p>
              <p className="text-xs text-[#13231F]/50 mt-1">Try adjusting your search or filters.</p>
            </div>
          )}

          {!loading &&
            groupedByChapter.map(([chapterName, items]) => (
              <div key={chapterName} className="space-y-3">
                {/* CHAPTER HEADER BAR */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7FBF7A]" />
                    <h2 className="font-[Poppins] text-lg font-bold text-[#13231F]">
                      {chapterName}
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E8E0CC] text-[#13231F]/60">
                      {items.length} {items.length === 1 ? 'asset' : 'assets'}
                    </span>
                  </div>

                  <span className="text-xs text-[#13231F]/50 font-medium">
                    CBSE Class 10
                  </span>
                </div>

                {/* RESOURCE CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((r) => {
                    const cfg = TYPE_CONFIG[r.resource_type] || TYPE_CONFIG.notes
                    const IconComponent = cfg.icon
                    const isAssigned = r.assigned_sections && r.assigned_sections.length > 0

                    return (
                      <div
                        key={r.id}
                        className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
                      >
                        <div>
                          {/* TOP CHIP BAR */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                            >
                              <IconComponent className="w-3.5 h-3.5" />
                              <span>{cfg.label}</span>
                            </span>

                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4D3E] bg-[#EBF5EF] px-2 py-0.5 rounded-md border border-[#C8E6D3]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Assigned</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-[#13231F]/40 bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E8E0CC]">
                                Ready
                              </span>
                            )}
                          </div>

                          {/* TITLE & DESCRIPTION */}
                          <h3
                            onClick={() => setPreviewResource(r)}
                            className="font-semibold text-[15px] leading-snug text-[#13231F] group-hover:text-[#1B4D3E] transition-colors cursor-pointer"
                          >
                            {r.title}
                          </h3>
                          <p className="text-xs text-[#13231F]/60 mt-1.5 line-clamp-2 leading-relaxed">
                            {r.description || 'No description provided.'}
                          </p>

                          {/* ASSIGNED SECTIONS PILLS */}
                          {isAssigned && (
                            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10.5px] uppercase font-bold text-[#13231F]/40">
                                Assigned to:
                              </span>
                              {r.assigned_sections.map((sec) => (
                                <span
                                  key={sec}
                                  className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#13231F]/5 text-[#13231F] border border-[#13231F]/10"
                                >
                                  {sec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* BOTTOM ACTION BAR */}
                        <div className="mt-5 pt-3 border-t border-[#E8E0CC]/60 flex items-center justify-between text-xs">
                          <button
                            onClick={() => setAssigningResource(r)}
                            className="font-semibold text-[#13231F] hover:text-[#7FBF7A] transition flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Assign Class</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewResource(r)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF9F5] border border-[#E8E0CC] hover:bg-[#13231F] hover:text-white transition font-medium text-[#13231F]"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => void deleteResource(r.id)}
                              title="Delete resource"
                              className="p-1 rounded-lg text-[#13231F]/30 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
