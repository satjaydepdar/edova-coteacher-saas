import { useEffect, useMemo, useState } from 'react'
import { NotebookPen, Search, Plus, X, Quote, Sigma, StickyNote } from 'lucide-react'
import { useStudentStore } from '../../store/studentStore'

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-forest flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-forest/5 text-forest border border-cream-border">
              <NotebookPen className="w-6 h-6 text-gold" />
            </span>
            My Wiki
          </h1>
          <p className="text-sm text-forest/65 mt-1">Quotes, formulas, and notes you've saved while studying.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-raised text-cream font-medium text-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-gold" />
          Add Note
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your notes..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-cream-border/70 bg-[#FAF9F5] text-forest placeholder:text-forest/40 focus:outline-none focus:border-gold"
          />
        </div>
        <select
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
          className="text-xs py-2 px-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-forest outline-none focus:border-gold shrink-0"
        >
          {chapters.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-cream-border rounded-2xl p-8">
          <NotebookPen className="w-10 h-10 text-forest/30 mx-auto mb-2" />
          <p className="text-sm text-forest/60">No notes yet. Save a quote or formula while you study.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => {
            const Icon = TYPE_ICON[note.type] ?? StickyNote
            return (
              <div key={note.id} className="p-4 rounded-2xl bg-[#FCFBF8] border border-cream-border shadow-card space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest/5 text-forest border border-cream-border">
                    {note.chapter}
                  </span>
                  <Icon className="w-4 h-4 text-gold shrink-0" />
                </div>
                {note.topic && <div className="text-xs text-forest/50 font-medium">{note.topic}</div>}
                <p className="text-sm text-forest whitespace-pre-line leading-relaxed">{note.content}</p>
                <div className="text-[11px] text-forest/40 pt-1">{note.created_at}</div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FCFBF8] border border-cream-border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-forest text-base">Add Wiki Note</h3>
              <button onClick={() => setModalOpen(false)} className="text-forest/40 hover:text-forest p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">Chapter</label>
                  <input
                    type="text"
                    required
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="e.g. Trigonometry"
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-white text-xs text-forest outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest/70 mb-1">Topic (optional)</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Identities"
                    className="w-full px-3 py-2 rounded-xl border border-cream-border bg-white text-xs text-forest outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-forest/70 mb-1">Type</label>
                <div className="flex gap-2">
                  {(['note', 'quote', 'formula'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                        newType === t ? 'bg-forest text-cream' : 'bg-[#F5F1E6] text-forest/70'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-forest/70 mb-1">Content</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write the quote, formula, or note to save..."
                  className="w-full p-2.5 rounded-xl border border-cream-border bg-white text-xs text-forest outline-none focus:border-gold resize-y"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-raised text-cream text-sm font-semibold cursor-pointer disabled:opacity-50"
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
