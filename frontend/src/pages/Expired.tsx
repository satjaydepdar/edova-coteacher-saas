import { AlertTriangle, BookOpen } from 'lucide-react'
import { useApp } from '../store'

/** Shown when the backend rejects the stored device token (requirement §14):
 *  subscription expired, key revoked, or key expired. The client can never
 *  bypass this — every content call is re-validated server-side. */
export default function Expired() {
  const deactivate = useApp((s) => s.deactivate)
  const session = useApp((s) => s.session)

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-cream">
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-card p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-ink flex items-center justify-center mb-4">
          <BookOpen className="w-6 h-6 text-gold" />
        </div>
        <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <h1 className="font-display font-bold text-[18px] text-ink">Subscription Expired</h1>
        <p className="text-[13px] text-ink/60 mt-2 leading-relaxed">
          Please contact your school administrator or service provider to renew the subscription.
        </p>
        {session && (
          <p className="text-[12px] text-ink/45 mt-3">
            {session.tenant.name} — access ended {session.expires_at}
          </p>
        )}
        <button
          onClick={deactivate}
          className="mt-6 h-10 px-5 rounded-xl bg-ink text-white text-[13px] font-semibold"
        >
          Enter a new activation key
        </button>
      </div>
    </div>
  )
}
