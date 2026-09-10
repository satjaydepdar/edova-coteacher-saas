import { useState } from 'react'
import { adminAuth, AdminApiError, setAdminToken } from '../lib/adminApi'

export default function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { access_token } = await adminAuth.login(email, password)
      setAdminToken(access_token)
      onLoggedIn()
    } catch (err) {
      setAdminToken(null)
      setError(err instanceof AdminApiError ? String(err.message) : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-box" onSubmit={submit}>
        <h1>EDOVA Authoring Studio</h1>
        <div className="muted">Sign in with your admin account.</div>
        {error && <div className="login-error">{error}</div>}
        <div className="field"><label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="field"><label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="primary" type="submit" disabled={busy} style={{ width: '100%', height: 42, borderRadius: 22, border: '1px solid var(--line)' }}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
