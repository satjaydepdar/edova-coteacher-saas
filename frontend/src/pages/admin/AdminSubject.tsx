import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowDown, ArrowUp, Check, ChevronRight, FileUp, FlaskConical,
  ListChecks, Pencil, Play, Plus, Trash2, X,
} from 'lucide-react'
import {
  AdminApiError, adminContent, swapSequence, uploadVideo,
  type AdminChapter, type AdminModule, type AdminTopic, type AdminTree,
} from '../../lib/adminApi'

const TYPE_ICON = { VIDEO: Play, LAB: FlaskConical, QUIZ: ListChecks } as const

interface UploadState { pct: number; phase: 'uploading' | 'transcoding' | 'done' | 'error'; message?: string }

/** Inline rename: pencil -> input, check commits via PATCH. */
function Rename({ value, onSave, disabled }: { value: string; onSave: (v: string) => Promise<void>; disabled?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  if (disabled) return <span className="truncate">{value}</span>
  if (!editing) {
    return (
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="truncate">{value}</span>
        <button onClick={() => { setDraft(value); setEditing(true) }} className="text-forest/30 hover:text-forest shrink-0">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1">
      <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { void onSave(draft.trim()).then(() => setEditing(false)) }; if (e.key === 'Escape') setEditing(false) }}
        className="px-2 py-1 rounded border border-gold bg-white text-sm outline-none w-48" />
      <button onClick={() => { void onSave(draft.trim()).then(() => setEditing(false)) }} className="text-forest"><Check className="w-4 h-4" /></button>
      <button onClick={() => setEditing(false)} className="text-forest/40"><X className="w-4 h-4" /></button>
    </span>
  )
}

function ReorderButtons({ onUp, onDown, first, last, disabled }: {
  onUp: () => void; onDown: () => void; first: boolean; last: boolean; disabled?: boolean
}) {
  if (disabled) return null
  return (
    <span className="flex flex-col -my-1">
      <button disabled={first} onClick={onUp} className="text-forest/40 hover:text-forest disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
      <button disabled={last} onClick={onDown} className="text-forest/40 hover:text-forest disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
    </span>
  )
}

export default function AdminSubject() {
  const { subjectId = '' } = useParams()
  const [tree, setTree] = useState<AdminTree | null>(null)
  const [error, setError] = useState('')
  const [uploads, setUploads] = useState<Record<string, UploadState>>({})
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const readOnly = tree?.subject.read_only ?? false

  const load = () =>
    adminContent.tree(subjectId).then(setTree).catch((e) =>
      setError(e instanceof AdminApiError ? String(e.detail) : 'failed to load tree'))

  useEffect(() => { void load() }, [subjectId])

  const run = (p: Promise<unknown>) =>
    p.then(load).catch((e) => setError(e instanceof AdminApiError ? String(e.detail) : 'operation failed'))

  const moveChapter = (i: number, dir: -1 | 1) => {
    const cs = tree!.chapters
    void run(swapSequence(adminContent.patchChapter, cs[i], cs[i + dir]))
  }
  const moveTopic = (ch: AdminChapter, i: number, dir: -1 | 1) => {
    void run(swapSequence(adminContent.patchTopic, ch.topics[i], ch.topics[i + dir]))
  }
  const moveModule = (mods: AdminModule[], i: number, dir: -1 | 1) => {
    void run(swapSequence(adminContent.patchModule, mods[i], mods[i + dir]))
  }

  const pickFile = (moduleId: string) => fileInputs.current[moduleId]?.click()
  const startUpload = (mod: AdminModule, file: File) => {
    setUploads((u) => ({ ...u, [mod.id]: { pct: 0, phase: 'uploading' } }))
    uploadVideo(
      mod.id, file,
      (pct) => setUploads((u) => ({ ...u, [mod.id]: { pct, phase: 'uploading' } })),
      (phase) => setUploads((u) => ({ ...u, [mod.id]: { ...u[mod.id], phase } })),
    )
      .then(() => {
        // 202 accepted — ffmpeg runs in a background worker; poll until done.
        setUploads((u) => ({ ...u, [mod.id]: { pct: 100, phase: 'transcoding' } }))
        const poll = setInterval(async () => {
          try {
            const s = await adminContent.videoStatus(mod.id)
            if (s.status === 'READY') {
              clearInterval(poll)
              setUploads((u) => ({ ...u, [mod.id]: { pct: 100, phase: 'done' } }))
              await load()
            } else if (s.status === 'FAILED') {
              clearInterval(poll)
              setUploads((u) => ({ ...u, [mod.id]: { pct: 0, phase: 'error', message: s.error ?? 'transcode failed' } }))
            }
          } catch { /* transient poll failure — next tick retries */ }
        }, 5000)
      })
      .catch((e) => setUploads((u) => ({
        ...u,
        [mod.id]: { pct: 0, phase: 'error', message: e instanceof AdminApiError ? String(e.detail) : 'upload failed' },
      })))
  }

  const ModuleRow = ({ mod, mods, i }: { mod: AdminModule; mods: AdminModule[]; i: number }) => {
    const Icon = TYPE_ICON[mod.module_type]
    const up = uploads[mod.id]
    return (
      <div className="flex items-center gap-2 pl-9 pr-3 py-2 text-sm">
        <ReorderButtons disabled={readOnly} first={i === 0} last={i === mods.length - 1}
          onUp={() => moveModule(mods, i, -1)} onDown={() => moveModule(mods, i, 1)} />
        <Icon className="w-3.5 h-3.5 text-forest/40 shrink-0" />
        <div className="flex-1 min-w-0">
          <Rename disabled={readOnly} value={mod.title}
            onSave={(v) => run(adminContent.patchModule(mod.id, { title: v }))} />
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${mod.content_ready ? 'bg-forest/10 text-forest' : 'bg-gold/15 text-gold-dark'}`}>
          {mod.content_ready ? 'ready' : 'no content'}
        </span>
        {mod.module_type === 'VIDEO' && !readOnly && (
          <>
            <input type="file" accept="video/*,.mp4" className="hidden"
              ref={(el) => { fileInputs.current[mod.id] = el }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) startUpload(mod, f); e.target.value = '' }} />
            <button onClick={() => pickFile(mod.id)} disabled={up?.phase === 'uploading' || up?.phase === 'transcoding'}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-cream-border hover:border-gold text-forest/70 disabled:opacity-40">
              <FileUp className="w-3.5 h-3.5" /> Upload video
            </button>
          </>
        )}
        {!readOnly && (
          <button
            onClick={() => void run(adminContent.patchModule(mod.id, { is_published: !mod.is_published }))}
            className={`text-[11px] font-medium px-2 py-1 rounded-full transition-colors ${
              mod.is_published ? 'bg-forest text-cream' : 'bg-cream-border text-forest/60 hover:bg-gold/30'
            }`}>
            {mod.is_published ? 'Published' : 'Publish'}
          </button>
        )}
        {mod.is_published && readOnly && <span className="text-[11px] text-forest/50">Published</span>}
        {up && up.phase !== 'done' && (
          <div className="w-36 shrink-0">
            {up.phase === 'error'
              ? <span className="text-[10px] text-danger">{up.message}</span>
              : <>
                  <div className="h-1.5 rounded-full bg-cream-border overflow-hidden">
                    <div className="h-full bg-gold transition-all" style={{ width: `${up.phase === 'transcoding' ? 100 : up.pct}%` }} />
                  </div>
                  <span className="text-[10px] text-forest/50">
                    {up.phase === 'uploading' ? `Uploading ${up.pct}%` : 'Transcoding on server…'}
                  </span>
                </>}
          </div>
        )}
      </div>
    )
  }

  const AddRow = ({ placeholder, onAdd, indent }: { placeholder: string; onAdd: (name: string) => Promise<unknown>; indent?: boolean }) => {
    const [v, setV] = useState('')
    const submit = (e: FormEvent) => {
      e.preventDefault()
      if (!v.trim()) return
      void run(onAdd(v.trim())).then(() => setV(''))
    }
    if (readOnly) return null
    return (
      <form onSubmit={submit} className={`flex items-center gap-2 py-1.5 ${indent ? 'pl-9' : 'pl-3'} pr-3`}>
        <Plus className="w-3.5 h-3.5 text-forest/30" />
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
          className="flex-1 max-w-xs px-2 py-1 rounded border border-dashed border-cream-border bg-transparent text-xs outline-none focus:border-gold" />
      </form>
    )
  }

  if (error && !tree) return <p className="text-danger text-sm">{error}</p>
  if (!tree) return <p className="text-sm text-forest/50">Loading…</p>

  return (
    <div className="max-w-4xl">
      <Link to="/cms/content" className="flex items-center gap-1 text-xs text-forest/50 hover:text-forest mb-2">
        <ArrowLeft className="w-3.5 h-3.5" /> All subjects
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-xl font-semibold text-forest">
          <Rename disabled={readOnly} value={tree.subject.name}
            onSave={(v) => run(adminContent.patchSubject(subjectId, { name: v }))} />
        </h1>
        <span className="text-xs text-forest/50">Grade {tree.subject.standard_grade}</span>
        {readOnly && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-border text-forest/50">read-only (global content)</span>}
      </div>
      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      <div className="space-y-3">
        {tree.chapters.map((ch, ci) => (
          <div key={ch.id} className="bg-cream-card border border-cream-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-forest/[0.03] border-b border-cream-border">
              <ReorderButtons disabled={readOnly} first={ci === 0} last={ci === tree.chapters.length - 1}
                onUp={() => moveChapter(ci, -1)} onDown={() => moveChapter(ci, 1)} />
              <ChevronRight className="w-4 h-4 text-gold" />
              <div className="font-medium text-forest text-sm flex-1 min-w-0">
                <Rename disabled={readOnly} value={ch.name}
                  onSave={(v) => run(adminContent.patchChapter(ch.id, { name: v }))} />
              </div>
            </div>

            {ch.topics.map((tp, ti) => (
              <div key={tp.id} className="border-b border-cream-border/60 last:border-0">
                <div className="flex items-center gap-2 pl-6 pr-3 py-2 text-sm">
                  <ReorderButtons disabled={readOnly} first={ti === 0} last={ti === ch.topics.length - 1}
                    onUp={() => moveTopic(ch, ti, -1)} onDown={() => moveTopic(ch, ti, 1)} />
                  <div className="flex-1 min-w-0 text-forest/80">
                    <Rename disabled={readOnly} value={tp.name}
                      onSave={(v) => run(adminContent.patchTopic(tp.id, { name: v }))} />
                  </div>
                  {!readOnly && (
                    <button onClick={() => void run(adminContent.deleteTopic(tp.id))}
                      title="Delete topic (modules move to Ungrouped)"
                      className="text-forest/30 hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                {tp.modules.map((m, mi) => <ModuleRow key={m.id} mod={m} mods={tp.modules} i={mi} />)}
                <AddRow indent placeholder={`Add module to “${tp.name}” (title)`}
                  onAdd={(title) => adminContent.createModule(ch.id, {
                    title, module_type: 'VIDEO', topic_id: tp.id,
                    sequence_order: tp.modules.reduce((m, x) => Math.max(m, x.sequence_order), 0) + 1,
                  })} />
              </div>
            ))}

            {ch.modules.map((m, mi) => <ModuleRow key={m.id} mod={m} mods={ch.modules} i={mi} />)}
            {ch.modules.length > 0 && <div className="pl-6 text-[10px] text-forest/40 pb-1">Ungrouped modules</div>}

            <div className="flex border-t border-cream-border/60">
              <AddRow placeholder="Add topic…"
                onAdd={(name) => adminContent.createTopic(ch.id, {
                  name, sequence_order: ch.topics.reduce((m, t) => Math.max(m, t.sequence_order), 0) + 1,
                })} />
              <AddRow placeholder="Add ungrouped module (title)…"
                onAdd={(title) => adminContent.createModule(ch.id, {
                  title, module_type: 'VIDEO',
                  sequence_order: ch.modules.reduce((m, x) => Math.max(m, x.sequence_order), 0) + 1,
                })} />
            </div>
          </div>
        ))}
      </div>

      <AddRow placeholder="Add chapter…"
        onAdd={(name) => adminContent.createChapter(subjectId, {
          name, sequence_order: tree.chapters.reduce((m, c) => Math.max(m, c.sequence_order), 0) + 1,
        })} />
      <p className="mt-3 text-[11px] text-forest/40">
        New modules are created as VIDEO and unpublished. Publish only after the video upload shows “ready”.
      </p>
    </div>
  )
}
