import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useTeacher } from '../../store/teacherStore'

export default function TeacherLogin() {
  const { login, error } = useTeacher()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch {
      /* error message lives in the store */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-[#FAF9F5] p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-cream-card border border-cream-border rounded-2xl p-8 shadow-login">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-forest text-lg leading-tight">Teacher Analytics</h1>
            <p className="text-xs text-forest/60">Sign in to your classroom dashboard</p>
          </div>
        </div>
        <label className="block text-xs font-medium text-forest/70 mb-1">Email</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold"
          placeholder="teacher@yourschool.dev" autoComplete="username"
        />
        <label className="block text-xs font-medium text-forest/70 mb-1">Password</label>
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-lg border border-cream-border bg-white text-sm outline-none focus:border-gold"
          autoComplete="current-password"
        />
        {error && <p className="text-danger text-xs mb-3">{error}</p>}
        <button
          type="submit" disabled={busy}
          className="w-full py-2.5 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-raised disabled:opacity-50 transition-colors"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
