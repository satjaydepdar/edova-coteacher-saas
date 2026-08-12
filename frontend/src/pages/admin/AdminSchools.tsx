import { useEffect, useState, type FormEvent } from 'react'
import { Building2, KeyRound, Plus } from 'lucide-react'
import {
  AdminApiError, adminSchools, type AdminKey, type AdminPlan, type AdminTenant,
} from '../../lib/adminApi'
import { useAdmin } from '../../store/adminStore'

export default function AdminSchools() {
  const session = useAdmin((s) => s.session)
  const [tenants, setTenants] = useState<AdminTenant[] | null>(null)
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [keys, setKeys] = useState<Record<string, AdminKey[]>>({})
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [schoolName, setSchoolName] = useState('')
  // subscription form state
  const [planId, setPlanId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [seats, setSeats] = useState(5)
  const [maxDevices, setMaxDevices] = useState(1)

  const load = () =>
    adminSchools.tenants().then((r) => setTenants(r.tenants)).catch((e) =>
      setError(e instanceof AdminApiError ? String(e.detail) : 'failed to load schools'))

  useEffect(() => {
    void load()
    adminSchools.plans().then((r) => {
      setPlans(r.plans)
      if (r.plans.length) setPlanId(r.plans[0].id)
    }).catch(() => {})
  }, [])

  const toggle = async (id: string) => {
    if (open === id) { setOpen(null); return }
    setOpen(id)
    if (!keys[id]) {
      try {
        const r = await adminSchools.keys(id)
        setKeys((k) => ({ ...k, [id]: r.keys }))
      } catch { setKeys((k) => ({ ...k, [id]: [] })) }
    }
  }

  const createSchool = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await adminSchools.createTenant(schoolName.trim())
      setSchoolName('')
      await load()
    } catch (err) { setError(err instanceof AdminApiError ? String(err.detail) : 'create failed') }
  }

  const addSubscription = async (tenantId: string) => {
    try {
      await adminSchools.createSubscription(tenantId, { plan_id: planId, start_date: start, end_date: end, seat_count: seats })
      await load()
    } catch (err) { setError(err instanceof AdminApiError ? String(err.detail) : 'subscription failed') }
  }

  const generateKey = async (tenantId: string) => {
    try {
      await adminSchools.createKey(tenantId, maxDevices)
      const r = await adminSchools.keys(tenantId)
      setKeys((k) => ({ ...k, [tenantId]: r.keys }))
      await load()
    } catch (err) { setError(err instanceof AdminApiError ? String(err.detail) : 'key generation failed') }
  }

  const revoke = async (tenantId: string, keyId: string) => {
    try {
      await adminSchools.revokeKey(keyId)
      const r = await adminSchools.keys(tenantId)
      setKeys((k) => ({ ...k, [tenantId]: r.keys }))
    } catch (err) { setError(err instanceof AdminApiError ? String(err.detail) : 'revoke failed') }
  }

  if (!session?.is_platform) {
    return <p className="text-sm text-forest/60">Schools are managed by platform administrators.</p>
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-xl font-semibold text-forest mb-4">Schools</h1>

      <form onSubmit={createSchool} className="flex items-end gap-2 mb-6 bg-cream-card border border-cream-border rounded-xl p-4">
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">New school</label>
          <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required placeholder="School name"
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        <button className="px-4 py-2 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-raised flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      {!tenants && <p className="text-sm text-forest/50">Loading…</p>}

      <div className="space-y-2">
        {tenants?.map((t) => (
          <div key={t.id} className="bg-cream-card border border-cream-border rounded-xl overflow-hidden">
            <button onClick={() => void toggle(t.id)} className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-forest/[0.02]">
              <Building2 className="w-4 h-4 text-forest/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-forest text-sm">{t.name}</div>
                <div className="text-[11px] text-forest/50">
                  {t.active_plan ? `${t.active_plan} · ends ${t.subscription_ends} · ${t.seat_count} seats` : 'no active subscription'}
                  {' · '}{t.active_keys} active key{t.active_keys === 1 ? '' : 's'} · {t.user_count} user{t.user_count === 1 ? '' : 's'}
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-forest/10 text-forest' : 'bg-danger/10 text-danger'}`}>{t.status}</span>
            </button>

            {open === t.id && (
              <div className="border-t border-cream-border px-4 py-3 space-y-4">
                <div>
                  <div className="text-[11px] font-medium text-forest/60 mb-1.5">Add subscription</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <select value={planId} onChange={(e) => setPlanId(e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-cream-border bg-white text-xs outline-none focus:border-gold">
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name} (tier {p.tier_level})</option>)}
                    </select>
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required
                      className="px-2 py-1.5 rounded-lg border border-cream-border bg-white text-xs outline-none focus:border-gold" />
                    <span className="text-forest/40 text-xs">to</span>
                    <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required
                      className="px-2 py-1.5 rounded-lg border border-cream-border bg-white text-xs outline-none focus:border-gold" />
                    <input type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} title="Seats"
                      className="w-16 px-2 py-1.5 rounded-lg border border-cream-border bg-white text-xs outline-none focus:border-gold" />
                    <button onClick={() => void addSubscription(t.id)} disabled={!start || !end || !planId}
                      className="px-3 py-1.5 rounded-lg bg-forest text-cream text-xs font-medium hover:bg-forest-raised disabled:opacity-40">
                      Assign
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-forest/50" />
                    <span className="text-[11px] font-medium text-forest/60">Activation keys</span>
                    <input type="number" min={1} value={maxDevices} onChange={(e) => setMaxDevices(Number(e.target.value))} title="Max devices"
                      className="w-16 px-2 py-1 rounded-lg border border-cream-border bg-white text-xs outline-none focus:border-gold" />
                    <button onClick={() => void generateKey(t.id)}
                      className="px-3 py-1 rounded-lg bg-gold/20 text-gold-dark text-xs font-medium hover:bg-gold/30">
                      Generate key
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(keys[t.id] ?? []).map((k) => (
                      <div key={k.id} className="flex items-center gap-3 text-xs bg-white border border-cream-border rounded-lg px-3 py-1.5">
                        <code className="font-mono text-forest">{k.key_code}</code>
                        <span className="text-forest/50">{k.devices_used}/{k.max_devices} devices</span>
                        <span className="text-forest/50">expires {k.expires_at}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          k.status === 'ACTIVE' ? 'bg-forest/10 text-forest'
                          : k.status === 'UNUSED' ? 'bg-gold/15 text-gold-dark'
                          : 'bg-danger/10 text-danger'
                        }`}>{k.status}</span>
                        {k.status !== 'REVOKED' && (
                          <button onClick={() => void revoke(t.id, k.id)} className="ml-auto text-danger/70 hover:text-danger text-[11px]">
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                    {(keys[t.id] ?? []).length === 0 && <p className="text-[11px] text-forest/40">No keys yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {tenants?.length === 0 && <p className="text-sm text-forest/50">No schools yet.</p>}
      </div>
    </div>
  )
}
