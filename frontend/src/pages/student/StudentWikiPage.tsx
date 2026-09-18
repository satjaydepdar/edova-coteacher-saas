import { useEffect, useMemo, useState } from 'react'
import { NotebookPen, Search, Plus, X, Quote, Sigma, StickyNote } from 'lucide-react'
import { useStudentStore } from '../../store/studentStore'
import PageHeader from '../../components/PageHeader'
import { searchInputClass, filterSelectClass } from '../../components/SearchToolbar'

const TYPE_ICON: Record<string, typeof Quote> = {
  quote: Quote,
  formula: Sigma,
  note: StickyNote,
}

export default function StudentWikiPage() {
  const { wikiNotes, fetchWiki, addWikiNote } = useStudentStore()
  const [search, setSearch] = useState('')
  const [chapterFilter, setChapterFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)

  const [newChapter, setNewChapter] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [newType, setNewType] = useState<'quote' | 'formula' | 'note'>('note')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchWiki()
  }, [fetchWiki])

  const chapters = useMemo(() => ['All', ...Array.from(new Set(wikiNotes.map((n) => n.chapter)))], [wikiNotes])

  const filtered = useMemo(() => {
    return wikiNotes.filter((n) => {
      const matchesChapter = chapterFilter === 'All' || n.chapter === chapterFilter
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || n.content.toLowerCase().includes(q) || n.chapter.toLowerCase().includes(q) || n.topic.toLowerCase().includes(q)
      return matchesChapter && matchesSearch
    })
  }, [wikiNotes, chapterFilter, search])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newChapter.trim() || !newContent.trim()) return
    setSaving(true)
    try {
      await addWikiNote(newChapter.trim(), newTopic.trim(), newType, newContent.trim())
      setModalOpen(false)
      setNewChapter('')
      setNewTopic('')
      setNewContent('')
      setNewType('note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-[#FBF9F3]">
      <PageHeader
        title="My Wiki"
        description="Quotes, formulas, and notes you've saved while studying."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1a2421] hover:bg-black text-white font-medium text-[13px] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#DDB56E]" />
            Add Note
          </button>
        }
      />

      <div className="px-8 pt-6 pb-8 space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your notes..."
            className={`${searchInputClass} pl-10`}
          />
        </div>
        <select
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
          className={filterSelectClass}
        >
          {chapters.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-[#EDE8DD] rounded-2xl p-8">
          <NotebookPen className="w-10 h-10 text-[#111814]/30 mx-auto mb-2" />
          <p className="text-sm text-[#111814]/60">No notes yet. Save a quote or formula while you study.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => {
            const Icon = TYPE_ICON[note.type] ?? StickyNote
            return (
              <div key={note.id} className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F8B]">
                    {note.chapter}
                  </span>
                  <Icon className="w-4 h-4 text-[#DDB56E] shrink-0" />
                </div>
                {note.topic && <div className="text-xs text-[#111814]/50 font-medium">{note.topic}</div>}
                <p className="text-sm text-[#111814] whitespace-pre-line leading-relaxed">{note.content}</p>
                <div className="text-[11px] text-[#111814]/40 pt-1">{note.created_at}</div>
              </div>
            )
          })}
        </div>
      )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2421]/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FCFBF8] border border-[#EDE8DD] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#111814] text-base">Add Wiki Note</h3>
              <button onClick={() => setModalOpen(false)} className="text-[#111814]/40 hover:text-[#111814] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111814]/70 mb-1">Chapter</label>
                  <input
                    type="text"
                    required
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="e.g. Trigonometry"
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE8DD] bg-white text-xs text-[#111814] outline-none focus:border-[#DDB56E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111814]/70 mb-1">Topic (optional)</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Identities"
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE8DD] bg-white text-xs text-[#111814] outline-none focus:border-[#DDB56E]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111814]/70 mb-1">Type</label>
                <div className="flex gap-2">
                  {(['note', 'quote', 'formula'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer ${
                        newType === t ? 'bg-[#1a2421] text-white' : 'bg-[#F5F1E6] text-[#111814]/70'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111814]/70 mb-1">Content</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write the quote, formula, or note to save..."
                  className="w-full p-2.5 rounded-xl border border-[#EDE8DD] bg-white text-xs text-[#111814] outline-none focus:border-[#DDB56E] resize-y"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-full bg-[#1a2421] hover:bg-black text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
