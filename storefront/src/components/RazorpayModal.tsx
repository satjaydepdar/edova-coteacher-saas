import { X } from 'lucide-react'
import type { Order } from '../lib/api'

/** Simulated Razorpay checkout modal. Mirrors the wireframe's test-mode dialog:
 *  explicit "no real money" framing, success/failure simulation buttons. */
export default function RazorpayModal({ order, schoolName, onSuccess, onFailure, onClose }: {
  order: Order
  schoolName: string
  onSuccess: () => void
  onFailure: () => void
  onClose: () => void
}) {
  const inr = (order.amount_paise / 100).toLocaleString('en-IN')
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[8px] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] rounded-[16px] bg-white text-zinc-900 shadow-modal overflow-hidden">
        <div className="bg-[#0a84ff] text-white px-5 py-4 flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold">Edova Pvt Ltd</p>
            <p className="text-[11px] opacity-80 mt-0.5">Razorpay Secure • UPI / Cards / Netbanking</p>
          </div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 border-b border-zinc-100">
          <div className="flex justify-between text-[13px]">
            <span className="text-sage-dim">{order.plan_name} — {schoolName}</span>
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-[12px] text-sage">Order {order.order_id.slice(-12)}</span>
            <span className="text-[20px] font-semibold">₹{inr}</span>
          </div>
        </div>

        <div className="px-5 py-3 bg-amber-500/10 text-amber-700 text-[11px] font-medium">
          Razorpay Test Mode — TEST • No real money will be charged
        </div>

        <div className="px-5 py-5 flex gap-3">
          <button onClick={onSuccess}
            className="flex-1 h-11 rounded-[10px] bg-lime hover:bg-lime-bright text-ink text-[13px] font-bold shadow-glow transition">
            Simulate Success
          </button>
          <button onClick={onFailure}
            className="flex-1 h-11 rounded-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[13px] font-medium transition">
            Simulate Failure
          </button>
        </div>
        <p className="px-5 pb-4 text-[10px] text-sage text-center">Secured by Razorpay (simulated)</p>
      </div>
    </div>
  )
}
