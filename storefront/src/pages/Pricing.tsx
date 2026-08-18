import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FlaskConical, ListChecks, Play } from 'lucide-react'
import { api, type Plan } from '../lib/api'
import { usePurchase } from '../store/purchaseStore'

const FEATURES: { key: 'allow_video' | 'allow_lab' | 'allow_quiz'; label: string; Icon: typeof Play }[] = [
  { key: 'allow_video', label: 'Video lessons', Icon: Play },
  { key: 'allow_quiz', label: 'Quiz engine', Icon: ListChecks },
  { key: 'allow_lab', label: 'Virtual labs', Icon: FlaskConical },
]

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function Pricing() {
  const nav = useNavigate()
  const { authed, plan, selectPlan } = usePurchase()
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.plans().then((r) => setPlans(r.plans)).catch(() => setError('Could not load plans — is the API running?'))
  }, [])

  const proceed = () => nav(authed ? '/onboarding' : '/sign-in')

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 bg-ink/80 backdrop-blur-[10px] border-b border-mist/[0.08]">
        <div className="max-w-[1080px] mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-[18px] font-semibold tracking-tight">Edova</span>
          <button onClick={() => nav('/sign-in')}
            className="text-[13px] text-sage hover:text-white transition">Sign in</button>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6 py-14">
        <div className="text-center mb-12">
          <p className="text-[12px] uppercase tracking-wide text-lime mb-3">Trusted by 400+ schools</p>
          <h1 className="text-[32px] md:text-[48px] font-semibold tracking-[-0.03em] leading-[0.95]">
            Plans for every stage
          </h1>
          <p className="mt-4 text-[15px] text-sage leading-relaxed max-w-[560px] mx-auto">
            Video lessons, quizzes, and interactive virtual labs — one co-teacher for every classroom.
            No credit card required for trial.
          </p>
        </div>

        {error && <p className="text-center text-red-300 text-sm mb-6">{error}</p>}
        {!plans && !error && <p className="text-center text-sage-dim text-sm animate-pulse">Loading plans…</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans?.map((p) => {
            const popular = p.tier_level === 4      // static marketing badge only
            const selected = plan?.id === p.id      // lime glow follows the user's pick
            return (
              <div key={p.id} onClick={() => selectPlan(p)}
                className={`relative rounded-[20px] p-[1px] cursor-pointer transition ${
                  selected ? 'bg-gradient-to-b from-lime/50 to-transparent shadow-glow-lg'
                           : 'bg-mist/[0.08] hover:bg-mist/[0.16]'}`}>
                {popular && (
                  <span className="absolute -top-3 left-6 text-[10px] uppercase tracking-wide bg-lime text-ink font-bold px-2.5 py-0.5 rounded-full shadow-glow">
                    Most popular
                  </span>
                )}
                <div className="h-full rounded-[19px] bg-ink-card p-6 flex flex-col">
                  <h3 className="text-[15px] font-semibold">{p.name}</h3>
                  <p className="mt-1 text-[12px] text-sage-dim">{p.blurb}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-[28px] font-semibold tracking-tight">{inr(p.price_inr)}</span>
                    <span className="text-[12px] text-sage-dim">/ year</span>
                  </div>
                  <ul className="mt-5 space-y-3 flex-1">
                    {FEATURES.map(({ key, label, Icon }) => (
                      <li key={key} className={`flex items-center gap-2 text-[13px] ${p[key] ? 'text-mist/85' : 'text-sage-dim/70'}`}>
                        {p[key]
                          ? <Check className="w-3.5 h-3.5 text-lime shrink-0" />
                          : <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center"><span className="w-1 h-[1px] bg-sage-dim" /></span>}
                        <Icon className="w-3.5 h-3.5 opacity-60" /> {label}
                      </li>
                    ))}
                  </ul>
                  <button onClick={(e) => { e.stopPropagation(); selected ? proceed() : selectPlan(p) }}
                    className={`mt-6 w-full h-11 rounded-[12px] text-[13px] font-medium transition ${
                      selected ? 'bg-moss hover:bg-moss-dark text-white border border-lime/60 shadow-glow'
                               : 'bg-mist/[0.08] hover:bg-mist/[0.12] text-mist'}`}>
                    {selected ? 'Continue →' : `Get Tier ${p.tier_level}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-16 text-center text-[13px] text-sage-dim">
          Need 100+ seats?{' '}
          <a href="mailto:sales@edova.dev" className="text-lime underline underline-offset-4 hover:text-white transition">
            Talk to sales
          </a>
        </p>
      </main>
    </div>
  )
}
