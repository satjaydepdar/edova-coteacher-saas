import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CheckCircle2, Copy, KeyRound } from 'lucide-react'
import { usePurchase } from '../store/purchaseStore'

/** Payment verified -> the activation key, shown once, with copy + next steps. */
export default function Success() {
  const { license } = usePurchase()
  const [copied, setCopied] = useState(false)

  if (!license) return <Navigate to="/" replace />

  const copy = async () => {
    await navigator.clipboard.writeText(license.key_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <header className="px-6 h-16 flex items-center">
        <span className="text-[18px] font-semibold tracking-tight">Edova</span>
      </header>
      <main className="flex-1 flex items-start justify-center px-6 pt-10">
        <div className="w-full max-w-[560px]">
          <div className="rounded-[20px] border border-lime/20 bg-ink-card p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-lime mx-auto" />
            <h1 className="mt-4 text-[26px] font-semibold tracking-tight">
              Payment successful — Co-teacher activated
            </h1>
            <p className="mt-2 text-[13px] text-sage">
              {license.school_name} • {license.max_devices} devices •
              valid {license.subscription_start} → {license.subscription_end}
            </p>
            <span className="inline-flex items-center gap-1.5 mt-3 text-[10px] uppercase tracking-wide text-lime bg-lime/15 border border-lime/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-lime" /> LIVE • Payment verified
            </span>

            <div className="mt-8 rounded-[14px] border border-mist/[0.12] bg-mist/[0.03] p-5">
              <p className="text-[11px] uppercase tracking-wide text-sage-dim flex items-center justify-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Activation key
              </p>
              <p className="mt-2 text-[20px] font-semibold tracking-wide break-all">{license.key_code}</p>
              <button onClick={copy}
                className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-lime hover:bg-lime-bright text-ink text-[12px] font-bold shadow-glow transition">
                {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-lime" /> Key Copied!</>
                        : <><Copy className="w-3.5 h-3.5" /> Copy key</>}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[20px] border border-mist/[0.08] bg-ink-card p-6">
            <p className="text-[12px] uppercase tracking-wide text-sage-dim">Next steps:</p>
            <ol className="mt-3 space-y-3 text-[13px] text-mist/70 list-decimal list-inside leading-relaxed">
              <li>Open the Co-teacher classroom app on each device and enter this key on the activation screen.</li>
              <li>School admin login: use your purchase account to manage teachers and students in the CMS.</li>
              <li>Teachers can then teach video lessons, conduct quizzes, and run virtual labs.</li>
            </ol>
            <div className="mt-5 flex flex-col md:flex-row gap-3">
              <a href="http://localhost:5173"
                className="flex-1 h-11 rounded-[12px] bg-moss hover:bg-moss-dark text-white text-[13px] font-medium border border-transparent hover:border-lime/50 shadow-glow transition flex items-center justify-center">
                Go to Co-teacher App
              </a>
              <a href="http://localhost:5173/cms/login"
                className="flex-1 h-11 rounded-[12px] bg-mist/[0.08] hover:bg-mist/[0.12] text-mist text-[13px] font-medium transition flex items-center justify-center">
                Go to CMS /cms/users ↗
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
