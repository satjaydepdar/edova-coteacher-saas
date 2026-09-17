import { useState, type FormEvent } from 'react'
import { BookOpen, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    try {
      const user = await login(email, password)
      // Navigate to dashboard for Teacher and Admin, or lessons for Student
      if (user.role === 'TEACHER' || user.role === 'ADMIN') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Login failed. Please check your credentials.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-4 text-forest">
      <div className="w-full max-w-md bg-white border border-cream-border rounded-2xl p-8 shadow-card">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-forest flex items-center justify-center shadow-xs">
            <BookOpen className="w-6 h-6 text-gold" />
          </div>
          <div>
            <div className="font-display font-bold text-xl tracking-tight text-forest flex items-center gap-1.5">
              EDOVA <span className="w-2 h-2 rounded-full bg-gold inline-block" />
            </div>
            <p className="text-xs text-forest/60">School Co-Teacher & Learning Platform</p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-2.5 text-danger text-sm animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-snug">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-forest/70 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. teacher@tc1school.dev"
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-sm text-forest outline-none focus:border-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-forest/70 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-border bg-[#FAF9F5] text-sm text-forest outline-none focus:border-gold transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-forest hover:bg-forest-raised text-cream text-sm font-semibold shadow-xs disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Helper info */}
        <div className="mt-8 pt-6 border-t border-cream-border text-center text-xs text-forest/60 space-y-2">
          <p className="font-semibold text-forest/80">Available Demo Accounts (Password: <code className="bg-cream-card px-1.5 py-0.5 rounded font-mono text-[11px] text-forest">testpass</code>):</p>
          <div className="flex flex-wrap justify-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => { setEmail('teacher@tc1school.dev'); setPassword('testpass'); }}
              className="px-2 py-1 rounded-md border border-cream-border bg-cream/50 hover:bg-gold/15 transition-colors"
            >
              Teacher (TC1)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('admin@springfield.dev'); setPassword('testpass'); }}
              className="px-2 py-1 rounded-md border border-cream-border bg-cream/50 hover:bg-gold/15 transition-colors"
            >
              School Admin (Springfield)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('admin@edova.dev'); setPassword('testpass'); }}
              className="px-2 py-1 rounded-md border border-cream-border bg-cream/50 hover:bg-gold/15 transition-colors"
            >
              Platform Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
