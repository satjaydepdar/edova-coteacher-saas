import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { usePurchase } from '../store/purchaseStore'

/** Sign in or create the purchaser account. This account becomes the school admin
 *  at onboarding — one identity for purchase + CMS. */
export default function SignIn() {
  const nav = useNavigate()
  const { plan, signIn } = usePurchase()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const r = mode === 'signup'
        ? await api.signup(email.trim(), password, name.trim() || email.split('@')[0])
        : await api.login(email.trim(), password)
      signIn(r.access_token)
      nav(plan ? '/onboarding' : '/')
    } catch (err) {
      // 409 on signup means the account exists — flip to sign-in to reduce friction
      if (err instanceof ApiError && err.status === 409) { setMode('signin'); setError('Account exists — sign in below.') }
      else setError(err instanceof ApiError ? err.detail : 'Something went wrong')
    } finally { setBusy(false) }
  }

  const input = 'w-full h-11 px-3.5 rounded-[12px] bg-ink border border-mist/10 text-[14px] text-mist outline-none focus:border-lime/50 focus:ring-4 focus:ring-lime/15 transition placeholder:text-sage-dim/70'

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <header className="px-6 h-16 flex items-center">
        <Link to="/" className="text-[18px] font-semibold tracking-tight">Edova</Link>
      </header>
      <main className="flex-1 flex items-start justify-center px-6 pt-10">
        <form onSubmit={submit} className="w-full max-w-[400px] rounded-[20px] border border-mist/[0.08] bg-ink-card p-8">
          <h1 className="text-[20px] font-semibold tracking-tight">
            {mode === 'signup' ? 'Create your account' : 'Sign in to Edova'}
          </h1>
          <p className="mt-1.5 text-[13px] text-sage-dim">
            {mode === 'signup' ? 'Start building for free.' : 'Welcome back! Please sign in to continue.'}
            {plan && <span className="text-lime"> Selected plan: {plan.name}.</span>}
          </p>

          <div className="mt-6 space-y-4">
            {mode === 'signup' && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={input} />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
              placeholder="Email address" className={input} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
              minLength={8} placeholder="Password (8+ characters)" className={input} />
          </div>

          {error && <p className="mt-4 text-[12px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-[8px] px-3 py-2">{error}</p>}

          <button disabled={busy}
            className="mt-6 w-full h-11 rounded-[12px] bg-moss hover:bg-moss-dark text-white text-[13px] font-medium border border-transparent hover:border-lime/50 shadow-glow transition disabled:opacity-50">
            {busy ? 'One moment…' : 'Continue →'}
          </button>

          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
            className="mt-4 w-full text-center text-[12px] text-sage-dim hover:text-mist/70 transition">
            {mode === 'signup' ? 'Already have an account? Sign in' : "New to Edova? Create an account"}
          </button>

          <p className="mt-6 text-[11px] text-sage-dim/70 text-center leading-relaxed">
            By continuing you agree to Edova's terms. Test environment — no real money involved.
          </p>
        </form>
      </main>
    </div>
  )
}
