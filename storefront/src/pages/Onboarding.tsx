import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { usePurchase } from '../store/purchaseStore'

/** School details -> draft tenant. The purchaser's account becomes its ADMIN. */
export default function Onboarding() {
  const nav = useNavigate()
  const { authed, plan, setSchool } = usePurchase()
  const [school, setSchoolInput] = useState('')
  const [address, setAddress] = useState('')
  const [seats, setSeats] = useState(25)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!authed) return <Navigate to="/sign-in" replace />
  if (!plan) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const r = await api.onboard(school.trim(), address.trim(), seats)
      setSchool(r.tenant_id, r.name, seats)
      nav('/checkout')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Something went wrong')
      setBusy(false)
    }
  }

  const input = 'w-full h-11 px-3.5 rounded-[12px] bg-ink border border-mist/10 text-[14px] text-mist outline-none focus:border-lime/50 focus:ring-4 focus:ring-lime/15 transition placeholder:text-sage-dim/70'

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between">
        <span className="text-[18px] font-semibold tracking-tight">Edova</span>
        <span className="text-[12px] text-sage-dim">Step 2 of 3 — School details</span>
      </header>
      <main className="flex-1 flex items-start justify-center px-6 pt-10">
        <form onSubmit={submit} className="w-full max-w-[420px] rounded-[20px] border border-mist/[0.08] bg-ink-card p-8">
          <h1 className="text-[20px] font-semibold tracking-tight">Tell us about your school</h1>
          <p className="mt-1.5 text-[13px] text-sage-dim leading-relaxed">
            This will appear on your invoice and activation key.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-[12px] text-sage mb-1.5">School Name *</label>
              <input value={school} onChange={(e) => setSchoolInput(e.target.value)} required
                placeholder="Vani Vidhyasharam High school" className={input} />
            </div>
            <div>
              <label className="block text-[12px] text-sage mb-1.5">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="No. 12, GST Road, Chromepet" className={input} />
            </div>
            <div>
              <label className="block text-[12px] text-sage mb-1.5">Classroom devices (seats)</label>
              <input value={seats} onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
                type="number" min={1} className={input} />
              <p className="mt-1.5 text-[11px] text-sage-dim/70">One activation key covers this many devices.</p>
            </div>
          </div>

          {error && <p className="mt-4 text-[12px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-[8px] px-3 py-2">{error}</p>}

          <button disabled={busy}
            className="mt-6 w-full h-11 rounded-[12px] bg-moss hover:bg-moss-dark text-white text-[13px] font-medium border border-transparent hover:border-lime/50 shadow-glow transition disabled:opacity-50">
            {busy ? 'Saving…' : 'Save & Continue to Pay →'}
          </button>
        </form>
      </main>
    </div>
  )
}
