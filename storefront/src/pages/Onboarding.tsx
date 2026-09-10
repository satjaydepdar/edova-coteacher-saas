import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { errorBannerClass, inputClass, primaryButtonClass } from '../lib/ui'
import { usePurchase } from '../store/purchaseStore'

/** School details -> draft tenant. The purchaser's account becomes its ADMIN.
 *  Form matches the wireframe: school name only; the admin email is the signup
 *  identity, and seat count is fixed by the chosen plan. */
export default function Onboarding() {
  const nav = useNavigate()
  const { authed, plan, setSchool } = usePurchase()
  const [school, setSchoolInput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!authed) return <Navigate to="/sign-in" replace />
  if (!plan) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const r = await api.onboard(school.trim())
      setSchool({ tenantId: r.tenant_id, name: r.name })
      nav('/checkout')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Something went wrong')
      setBusy(false)
    }
  }

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
            This name will appear on your invoice and activation key.
          </p>

          <div className="mt-6">
            <label className="block text-[12px] text-sage mb-1.5">School Name *</label>
            <input value={school} onChange={(e) => setSchoolInput(e.target.value)} required
              placeholder="Vani Vidhyasharam High school" className={inputClass} />
            <p className="mt-1.5 text-[11px] text-sage-dim/70">
              {plan.name} covers {plan.included_seats === 1 ? '1 device' : `${plan.included_seats} devices`}.
            </p>
          </div>

          {error && <p className={errorBannerClass}>{error}</p>}

          <button disabled={busy} className={`mt-6 ${primaryButtonClass}`}>
            {busy ? 'Saving…' : 'Save & Continue to Pay →'}
          </button>
        </form>
      </main>
    </div>
  )
}
