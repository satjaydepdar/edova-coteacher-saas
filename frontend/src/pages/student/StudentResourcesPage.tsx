import { useEffect, useMemo, useState } from 'react'
import { FolderOpen, Search, BookOpen, FileText, Presentation, FileSpreadsheet, FileCheck, StickyNote, Video, ExternalLink } from 'lucide-react'
import { useStudentStore, type ResourceItem } from '../../store/studentStore'
import PageHeader from '../../components/PageHeader'
import { searchInputClass, filterSelectClass } from '../../components/SearchToolbar'
import PdfViewerWithNotes from '../../components/learning/PdfViewerWithNotes'

const TYPE_CONFIG: Record<string, { label: string; icon: typeof BookOpen }> = {
  textbook: { label: 'Textbook', icon: BookOpen },
  slides: { label: 'Slides', icon: Presentation },
  formula_sheet: { label: 'Formula Sheet', icon: FileSpreadsheet },
  worksheet: { label: 'Worksheet', icon: FileCheck },
  notes: { label: 'Notes', icon: StickyNote },
  video: { label: 'Video', icon: Video },
}

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

function isPdf(r: ResourceItem) {
  return r.file_url.toLowerCase().includes('.pdf')
}

function resolveViewUrl(r: ResourceItem) {
  if (r.file_url.startsWith('http://') || r.file_url.startsWith('https://')) {
    return `${BASE}/api/student/resources/${r.id}/file`
  }
  return r.file_url
}

export default function StudentResourcesPage() {
  const { resources, fetchResources } = useStudentStore()
  const [search, setSearch] = useState('')
  const [chapterFilter, setChapterFilter] = useState('All')
  const [viewing, setViewing] = useState<ResourceItem | null>(null)

  useEffect(() => {
    void fetchResources()
  }, [fetchResources])

  const chapters = useMemo(
    () => ['All', ...Array.from(new Set(resources.map((r) => r.chapter_name)))],
    [resources]
  )

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchesChapter = chapterFilter === 'All' || r.chapter_name === chapterFilter
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.chapter_name.toLowerCase().includes(q)
      return matchesChapter && matchesSearch
    })
  }, [resources, chapterFilter, search])

  return (
    <div className="min-h-full bg-[#FBF9F3]">
      <PageHeader title="My Resources" description="Textbooks, notes, and materials shared by your teacher." />

      <div className="px-8 pt-6 pb-8 space-y-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources..."
              className={`${searchInputClass} pl-10`}
            />
          </div>
          <select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)} className={filterSelectClass}>
            {chapters.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-[#EDE8DD] rounded-2xl p-8">
            <FolderOpen className="w-10 h-10 text-[#111814]/30 mx-auto mb-2" />
            <p className="text-sm text-[#111814]/60">No resources shared yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => {
              const cfg = TYPE_CONFIG[r.resource_type] || TYPE_CONFIG.notes
              const Icon = cfg.icon
              return (
                <div key={r.id} className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F8B]">{r.chapter_name}</span>
                    <Icon className="w-4 h-4 text-[#DDB56E] shrink-0" />
                  </div>
                  <p className="text-sm font-medium text-[#111814]">{r.title}</p>
                  {r.description && <p className="text-xs text-[#111814]/50 line-clamp-2">{r.description}</p>}
                  {isPdf(r) ? (
                    <button
                      onClick={() => setViewing(r)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a2421] cursor-pointer pt-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Open & take notes
                    </button>
                  ) : (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a2421] pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open resource
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {viewing && (
        <PdfViewerWithNotes
          fileUrl={resolveViewUrl(viewing)}
          title={viewing.title}
          chapter={viewing.chapter_name}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  )
}
