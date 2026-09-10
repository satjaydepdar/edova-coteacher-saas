import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { errorBannerClass, inputClass, primaryButtonClass } from '../lib/ui'
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

  const input = inputClass

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

          {error && <p className={errorBannerClass}>{error}</p>}

          <button disabled={busy} className={`mt-6 ${primaryButtonClass}`}>
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
