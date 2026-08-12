import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { AdminApiError, adminContent, type AdminSubject } from '../../lib/adminApi'
import { useAdmin } from '../../store/adminStore'

export default function AdminContent() {
  const session = useAdmin((s) => s.session)
  const [subjects, setSubjects] = useState<AdminSubject[] | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('10')
  const [global, setGlobal] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = () =>
    adminContent.subjects().then((r) => setSubjects(r.subjects)).catch((e) => setError(String(e)))

  useEffect(() => { void load() }, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const nextSeq = (subjects ?? []).reduce((m, s) => Math.max(m, s.sequence_order), 0) + 1
      await adminContent.createSubject({
        name: name.trim(),
        standard_grade: grade.trim(),
        sequence_order: nextSeq,
        tenant_id: session?.is_platform && !global ? session.tenant_id : null,
      })
      setName('')
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? String(err.detail) : 'create failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-xl font-semibold text-forest mb-4">Content</h1>

      <form onSubmit={create} className="flex flex-wrap items-end gap-2 mb-6 bg-cream-card border border-cream-border rounded-xl p-4">
        <div className="flex-1 min-w-40">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">New subject</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Science"
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        <div className="w-24">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">Grade</label>
          <input value={grade} onChange={(e) => setGrade(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        {session?.is_platform && (
          <label className="flex items-center gap-1.5 text-xs text-forest/70 pb-2.5">
            <input type="checkbox" checked={global} onChange={(e) => setGlobal(e.target.checked)} />
            Global (all schools)
          </label>
        )}
        <button disabled={busy} className="px-4 py-2 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-raised disabled:opacity-50 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      {!subjects && !error && <p className="text-sm text-forest/50">Loading…</p>}

      <div className="space-y-2">
        {subjects?.map((s) => (
          <Link key={s.id} to={`/cms/content/${s.id}`}
            className="flex items-center gap-4 bg-cream-card border border-cream-border rounded-xl px-4 py-3 hover:border-gold transition-colors">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-forest text-sm">{s.name}</div>
              <div className="text-[11px] text-forest/50">
                Grade {s.standard_grade} · {s.chapter_count} chapter{s.chapter_count === 1 ? '' : 's'}
              </div>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              s.scope === 'global' ? 'bg-gold/15 text-gold-dark' : 'bg-forest/10 text-forest'
            }`}>
              {s.scope === 'global' ? 'GLOBAL' : (s.tenant_name ?? 'TENANT')}
            </span>
            {s.read_only && <span className="text-[10px] text-forest/40">read-only</span>}
            <ChevronRight className="w-4 h-4 text-forest/30" />
          </Link>
        ))}
        {subjects?.length === 0 && <p className="text-sm text-forest/50">No subjects yet — create the first one above.</p>}
      </div>
    </div>
  )
}
