import { useEffect, useState, type FormEvent } from 'react'
import { KeyRound, Plus } from 'lucide-react'
import {
  AdminApiError, adminSchools, adminUsers, type AdminTenant, type AdminUser,
} from '../../lib/adminApi'
import { useAdmin } from '../../store/adminStore'

export default function AdminUsers() {
  const session = useAdmin((s) => s.session)
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [tenants, setTenants] = useState<AdminTenant[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [tenantId, setTenantId] = useState('')

  const load = () =>
    adminUsers.list().then((r) => setUsers(r.users)).catch((e) =>
      setError(e instanceof AdminApiError ? String(e.detail) : 'failed to load users'))

  useEffect(() => {
    void load()
    if (session?.is_platform) {
      adminSchools.tenants().then((r) => {
        setTenants(r.tenants)
        if (r.tenants.length) setTenantId((id) => id || r.tenants[0].id)
      }).catch(() => {})
    } else if (session) {
      setTenantId(session.tenant_id)
    }
  }, [session])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setNotice('')
    try {
      await adminUsers.create({ email: email.trim(), password, full_name: fullName.trim(), tenant_id: tenantId, role })
      setEmail(''); setFullName(''); setPassword('')
      setNotice('User created.')
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? String(err.detail) : 'create failed')
    }
  }

  const resetPassword = async (u: AdminUser) => {
    const pw = window.prompt(`New password for ${u.email} (min 8 chars):`)
    if (!pw) return
    setError(''); setNotice('')
    try {
      await adminUsers.resetPassword(u.id, pw)
      setNotice(`Password reset for ${u.email}.`)
    } catch (err) {
      setError(err instanceof AdminApiError ? String(err.detail) : 'reset failed')
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-xl font-semibold text-forest mb-4">Users</h1>

      <form onSubmit={create} className="flex flex-wrap items-end gap-2 mb-6 bg-cream-card border border-cream-border rounded-xl p-4">
        <div className="min-w-44 flex-1">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        <div className="min-w-36 flex-1">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        <div className="min-w-32">
          <label className="block text-[11px] font-medium text-forest/60 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
            className="w-full px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-forest/60 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="px-2 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold">
            <option>STUDENT</option><option>TEACHER</option><option>ADMIN</option>
          </select>
        </div>
        {session?.is_platform && (
          <div>
            <label className="block text-[11px] font-medium text-forest/60 mb-1">School</label>
            <select value={tenantId} onChange={(e) => setTenantId(e.target.value)}
              className="px-2 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold">
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        <button className="px-4 py-2 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-raised flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      {notice && <p className="text-forest text-sm mb-3">{notice}</p>}
      {!users && <p className="text-sm text-forest/50">Loading…</p>}

      <div className="bg-cream-card border border-cream-border rounded-xl overflow-hidden">
        {users?.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-cream-border/60 last:border-0 text-sm">
            <div className="flex-1 min-w-0">
              <div className="text-forest truncate">{u.full_name} <span className="text-forest/40">· {u.email}</span></div>
              <div className="text-[11px] text-forest/50">{u.tenant_name}</div>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              u.role === 'ADMIN' ? 'bg-gold/15 text-gold-dark' : 'bg-forest/10 text-forest'
            }`}>{u.role}</span>
            <button onClick={() => void resetPassword(u)} title="Reset password"
              className="text-forest/40 hover:text-forest"><KeyRound className="w-4 h-4" /></button>
          </div>
        ))}
        {users?.length === 0 && <p className="px-4 py-3 text-sm text-forest/50">No users found.</p>}
      </div>
    </div>
  )
}
