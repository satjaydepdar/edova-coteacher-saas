import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, KeyRound, ShieldCheck } from 'lucide-react'
import { useApp } from '../store'
import { ApiError } from '../lib/api'

/** Backend detail codes -> classroom-friendly messages (requirement §2, §8, §14). */
const ERROR_MESSAGES: Record<string, string> = {
  invalid_activation_key: 'That activation key is not valid. Check the key and try again.',
  key_revoked: 'This activation key has been deactivated. Please contact your service provider.',
  key_expired: 'This activation key has expired. Please contact your school administrator to renew.',
  subscription_expired:
    'Subscription expired. Please contact your school administrator or service provider to renew the subscription.',
  school_inactive: 'This school account is inactive. Please contact your service provider.',
  device_limit_reached:
    'This key is already active on the maximum number of devices allowed by your subscription.',
}

/** Auto-formats to EDOVA-XXXX-XXXX-XXXX as the user types. */
function formatKey(raw: string): string {
  let v = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (v.startsWith('EDOVA')) v = v.slice(5)
  v = v.slice(0, 12)
  const groups = v.match(/.{1,4}/g) ?? []
  return 'EDOVA' + (groups.length ? '-' + groups.join('-') : '')
}

export default function Activation() {
  const activate = useApp((s) => s.activate)
  const navigate = useNavigate()
  const [key, setKey] = useState('EDOVA-')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (key.replace(/[^A-Z0-9]/g, '').length !== 17) {
      setError('Please enter the full activation key, e.g. EDOVA-7K4P-92MX-ABCD.')
      return
    }
    setBusy(true)
    try {
      await activate(key)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && typeof err.detail === 'string') {
        setError(ERROR_MESSAGES[err.detail] ?? 'Activation failed. Please try again.')
      } else {
        setError('Could not reach the server. Check your internet connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-cream max-w-[100vw]">
      <div className="absolute -top-32 -left-32 w-[380px] h-[380px] rounded-full opacity-[0.07] blur-3xl pointer-events-none bg-forest" />
      <div className="absolute -bottom-40 -right-32 w-[400px] h-[400px] rounded-full opacity-[0.09] blur-3xl pointer-events-none bg-gold" />

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-forest flex items-center justify-center shadow-card mb-4">
            <BookOpen className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-[32px] font-bold tracking-tight text-forest">
            EDOVA<span className="text-gold">.</span>
          </h1>
          <p className="text-[14px] text-forest/60 mt-1">Interactive Learning for Classrooms</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl border border-black/[0.06] shadow-card p-6 sm:p-8"
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <KeyRound className="w-4 h-4 text-gold" />
            <h2 className="font-display font-semibold text-[16px] text-forest">
              Enter Activation Key
            </h2>
          </div>
          <p className="text-[12.5px] text-forest/55 mb-5 leading-relaxed">
            Your school received this one-time key after purchasing a subscription.
          </p>

          <input
            value={key}
            onChange={(e) => setKey(formatKey(e.target.value))}
            placeholder="EDOVA-7K4P-92MX-ABCD"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="w-full h-12 px-4 rounded-xl border bg-paper text-center text-[16px] font-mono font-semibold tracking-[0.12em] text-forest outline-none transition-all focus:border-gold"
            style={{ borderColor: error ? '#E5484D' : '#13231F14' }}
          />
          {error && <p className="text-[12.5px] text-[#E5484D] mt-2.5 leading-snug">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full h-11 rounded-xl bg-forest text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all hover:bg-black disabled:opacity-60"
          >
            {busy ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Activate <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-black/[0.06] text-[11.5px] text-forest/45">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Already activated on this device? You won't be asked again.
          </div>
        </form>
      </div>
    </div>
  )
}
