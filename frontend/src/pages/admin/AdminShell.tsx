import { useEffect } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { BookCopy, Building2, LogOut, Users } from 'lucide-react'
import { useAdmin } from '../../store/adminStore'

const NAV = [
  { to: '/cms/content', label: 'Content', icon: BookCopy },
  { to: '/cms/schools', label: 'Schools', icon: Building2 },
  { to: '/cms/users', label: 'Users', icon: Users },
]

export default function AdminShell() {
  const { authed, session, loadSession, logout } = useAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    if (authed && !session) void loadSession()
  }, [authed, session, loadSession])

  if (!authed) return <Navigate to="/cms/login" replace />

  return (
    <div className="min-h-screen bg-cream flex">
      <aside className="w-52 shrink-0 bg-forest text-cream flex flex-col">
        <div className="px-5 py-5 border-b border-cream/10">
          <div className="font-display font-semibold">Edova CMS</div>
          <div className="text-[11px] text-cream/50 mt-0.5 truncate">{session?.tenant_name ?? '…'}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-gold/15 text-gold' : 'text-cream/70 hover:bg-cream/5 hover:text-cream'
                }`
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => { logout(); navigate('/cms/login', { replace: true }) }}
          className="m-3 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-cream/60 hover:bg-cream/5 hover:text-cream transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
