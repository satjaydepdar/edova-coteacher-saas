import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError, api, type Order } from '../lib/api'
import { usePurchase } from '../store/purchaseStore'
import RazorpayModal from '../components/RazorpayModal'

/** Order summary -> create order -> Razorpay (simulated) -> verify -> license. */
export default function Checkout() {
  const nav = useNavigate()
  const { authed, plan, tenantId, schoolName, seats, order, setOrder, setLicense } = usePurchase()
  const [error, setError] = useState('')
  const [failed, setFailed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)

  // Create the order once on arrival; a fresh one is created after a simulated failure
  useEffect(() => {
    if (!authed || !plan || !tenantId || order) return
    api.createOrder(plan.id, tenantId, seats)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError ? e.detail : 'Could not create order'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, plan, tenantId])

  if (!authed) return <Navigate to="/sign-in" replace />
  if (!plan || !tenantId) return <Navigate to="/" replace />

  const pay = async () => {
    if (!order) return
    setBusy(true); setError('')
    try {
      const license = await api.verify(order.order_id, `pay_sim_${Date.now()}`)
      setLicense(license)
      nav('/success')
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : 'Verification failed')
      setBusy(false)
    }
  }

  const retryAfterFailure = async () => {
    setShowModal(false); setFailed(true); setOrder(null as unknown as Order)
    const o = await api.createOrder(plan.id, tenantId, seats)
    setOrder(o)
  }

  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
  const price = plan.price_inr
  const base = Math.round((price / 1.18) * 100) / 100
  const gst = Math.round((price - base) * 100) / 100

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between">
        <span className="text-[18px] font-semibold tracking-tight">Edova</span>
        <span className="text-[12px] text-sage-dim">Step 3 of 3 — Payment</span>
      </header>
      <main className="flex-1 flex items-start justify-center px-6 pt-10">
        <div className="w-full max-w-[420px] rounded-[20px] border border-mist/[0.08] bg-ink-card p-8">
          <h1 className="text-[20px] font-semibold tracking-tight">Order summary</h1>

          <div className="mt-6 rounded-[12px] border border-lime/20 bg-moss/15 p-4">
            <p className="text-[11px] uppercase tracking-wide text-lime">Selected plan</p>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-[15px] font-medium">{plan.name}</span>
              <span className="text-[15px] font-semibold">{inr(price)}/yr</span>
            </div>
            <p className="mt-1 text-[12px] text-sage">{schoolName} • {seats} devices</p>
          </div>

          <div className="mt-5 space-y-2.5 text-[13px]">
            <div className="flex justify-between text-sage">
              <span>Subscription (annual)</span><span>{inr(base)}</span>
            </div>
            <div className="flex justify-between text-sage">
              <span>GST (18% inclusive)</span><span>{inr(gst)}</span>
            </div>
            <div className="h-[1px] bg-mist/[0.08] my-2" />
            <div className="flex justify-between text-[15px] font-semibold">
              <span>Total due today</span><span>{inr(price)}</span>
            </div>
          </div>

          {error && <p className="mt-4 text-[12px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-[8px] px-3 py-2">{error}</p>}
          {failed && !error && (
            <p className="mt-4 text-[12px] text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-[8px] px-3 py-2">
              Payment failed or cancelled. You can retry. No amount was charged in test mode.
            </p>
          )}

          <button onClick={() => setShowModal(true)} disabled={!order || busy}
            className="mt-6 w-full h-11 rounded-[12px] bg-moss hover:bg-moss-dark text-white text-[13px] font-medium border border-transparent hover:border-lime/50 shadow-glow transition disabled:opacity-50">
            {busy ? 'Verifying payment…' : order ? 'Pay with Razorpay' : 'Preparing order…'}
          </button>
          <p className="mt-3 text-center text-[11px] text-sage-dim/70">Razorpay Test Mode — no real money will be charged</p>
        </div>
      </main>

      {showModal && order && (
        <RazorpayModal order={order} schoolName={schoolName}
          onSuccess={() => { setShowModal(false); void pay() }}
          onFailure={() => void retryAfterFailure()}
          onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
