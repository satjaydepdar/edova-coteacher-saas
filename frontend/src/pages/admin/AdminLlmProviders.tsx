import { useEffect, useState, type FormEvent } from 'react'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { AdminApiError, adminLlmProviders, type AdminLlmProvider } from '../../lib/adminApi'
import { useAdmin } from '../../store/adminStore'

export default function AdminLlmProviders() {
  const session = useAdmin((s) => s.session)
  const [providers, setProviders] = useState<AdminLlmProvider[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // create form state
  const [providerName, setProviderName] = useState('')
  const [modelName, setModelName] = useState('')
  const [apiKey, setApiKey] = useState('')

  // edit form state (per expanded row)
  const [editProviderName, setEditProviderName] = useState('')
  const [editModelName, setEditModelName] = useState('')
  const [editApiKey, setEditApiKey] = useState('')

  const load = () =>
    adminLlmProviders.list().then((r) => setProviders(r.providers)).catch((e) =>
      setError(e instanceof AdminApiError ? String(e.detail) : 'failed to load LLM providers'))

  useEffect(() => { if (session?.is_platform) void load() }, [session])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setNotice('')
    try {
      await adminLlmProviders.create({ provider_name: providerName.trim(), model_name: modelName.trim(), api_key: apiKey.trim() })
      setProviderName(''); setModelName(''); setApiKey('')
      setNotice('Provider added.')
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? String(err.detail) : 'create failed')
    }
  }

  const toggle = (p: AdminLlmProvider) => {
    if (open === p.id) { setOpen(null); return }
    setOpen(p.id)
    setEditProviderName(p.provider_name)
    setEditModelName(p.model_name)
    setEditApiKey('')
  }

  const saveEdit = async (id: string) => {
    setError(''); setNotice('')
    try {
      const body: Partial<{ provider_name: string; model_name: string; api_key: string }> = {
        provider_name: editProviderName.trim(),
        model_name: editModelName.trim(),
      }
      if (editApiKey.trim()) body.api_key = editApiKey.trim()
      await adminLlmProviders.update(id, body)
      setNotice('Provider updated.')
      setOpen(null)
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? String(err.detail) : 'update failed')
    }
  }

  const setDefault = async (id: string) => {
    setError(''); setNotice('')
    try {
      await adminLlmProviders.setDefault(id)
      setNotice('Default model updated.')
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? String(err.detail) : 'failed to set default')
    }
  }

  const setVideoEngine = async (id: string) => {
    setError(''); setNotice('')
    try {
      await adminLlmProviders.setVideoEngine(id)
      setNotice('Video generation model updated.')
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? String(err.detail) : 'failed to set video engine model')
    }
  }

  const remove = async (p: AdminLlmProvider) => {
    const ok = window.confirm(`Delete ${p.provider_name} / ${p.model_name}? This can't be undone.`)
    if (!ok) return
    setError(''); setNotice('')
    try {
      await adminLlmProviders.remove(p.id)
      setNotice('Provider deleted.')
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? String(err.detail) : 'delete failed (default/video-engine models must be reassigned first)')
    }
  }

  if (!session?.is_platform) {
    return <p className="text-sm text-forest/60">LLM providers are managed by platform administrators.</p>
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-xl font-semibold text-forest mb-1">LLM Providers</h1>
      <p className="text-xs text-forest/50 mb-4">
        Sole owner: platform admin. The default model is used by all LLM features; the video generation
        model is used only for on-demand video generation.
      </p>

      <form onSubmit={create} className="flex flex-wrap items-end gap-2 mb-6 bg-cream-card border border-cream-border rounded-xl p-4">
        <div className="min-w-36 flex-1">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">Service provider</label>
          <input value={providerName} onChange={(e) => setProviderName(e.target.value)} required placeholder="e.g. Google, OpenAI"
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        <div className="min-w-36 flex-1">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">Model name</label>
          <input value={modelName} onChange={(e) => setModelName(e.target.value)} required placeholder="e.g. gemini-1.5-flash"
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        <div className="min-w-44 flex-1">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">API key</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        <button className="px-4 py-2 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-raised flex items-center gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      {notice && <p className="text-forest text-sm mb-3">{notice}</p>}
      {!providers && <p className="text-sm text-forest/50">Loading…</p>}

      <div className="space-y-2">
        {providers?.map((p) => (
          <div key={p.id} className="bg-cream-card border border-cream-border rounded-xl overflow-hidden">
            <button onClick={() => toggle(p)} className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-forest/[0.02] cursor-pointer">
              <Sparkles className="w-4 h-4 text-forest/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-forest text-sm">{p.provider_name} <span className="text-forest/40 font-normal">· {p.model_name}</span></div>
                <div className="text-[11px] text-forest/50">API key {p.api_key_masked}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {p.is_default && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-forest/10 text-forest">Default</span>}
                {p.is_video_engine && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gold/15 text-gold-dark">Video Generation</span>}
              </div>
            </button>

            {open === p.id && (
              <div className="border-t border-cream-border px-4 py-3 space-y-4">
                <div>
                  <div className="text-[11px] font-medium text-forest/60 mb-1.5">Edit</div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-36 flex-1">
                      <input value={editProviderName} onChange={(e) => setEditProviderName(e.target.value)} placeholder="Service provider"
                        className="w-full px-2 py-1.5 rounded-lg border border-cream-border bg-white text-xs outline-none focus:border-gold" />
                    </div>
                    <div className="min-w-36 flex-1">
                      <input value={editModelName} onChange={(e) => setEditModelName(e.target.value)} placeholder="Model name"
                        className="w-full px-2 py-1.5 rounded-lg border border-cream-border bg-white text-xs outline-none focus:border-gold" />
                    </div>
                    <div className="min-w-44 flex-1">
                      <input type="password" value={editApiKey} onChange={(e) => setEditApiKey(e.target.value)} placeholder="New API key (leave blank to keep current)"
                        className="w-full px-2 py-1.5 rounded-lg border border-cream-border bg-white text-xs outline-none focus:border-gold" />
                    </div>
                    <button onClick={() => void saveEdit(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-forest text-cream text-xs font-medium hover:bg-forest-raised cursor-pointer">
                      Save
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => void setDefault(p.id)} disabled={p.is_default}
                    className="px-3 py-1.5 rounded-lg bg-forest/10 text-forest text-xs font-medium hover:bg-forest/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    Set as Default
                  </button>
                  <button onClick={() => void setVideoEngine(p.id)} disabled={p.is_video_engine}
                    className="px-3 py-1.5 rounded-lg bg-gold/20 text-gold-dark text-xs font-medium hover:bg-gold/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    Set as Video Generation Model
                  </button>
                  <button onClick={() => void remove(p)} disabled={p.is_default || p.is_video_engine}
                    title={p.is_default || p.is_video_engine ? 'Reassign default/video-generation to another model first' : 'Delete'}
                    className="ml-auto p-1.5 rounded text-danger/60 hover:text-danger hover:bg-danger/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {providers?.length === 0 && <p className="text-sm text-forest/50">No LLM providers configured yet. Add one above.</p>}
      </div>
    </div>
  )
}
