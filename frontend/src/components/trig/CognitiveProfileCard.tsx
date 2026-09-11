import { BrainCircuit, Zap, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import type { TrigProfile } from '../../lib/trig/trigApiClient'

/** Ported from edova-pilot-v4/frontend/src/features/dashboard/CognitiveProfileCard.jsx, unchanged. */
interface CognitiveProfileCardProps {
  profile: TrigProfile | null
}

export default function CognitiveProfileCard({ profile }: CognitiveProfileCardProps) {
  if (!profile) return null

  const {
    overall_accuracy = 0,
    total_attempts = 0,
    strengths = [],
    struggles = [],
  } = profile

  return (
    <div className="bg-[#FAF9F5] border border-[#E8E2D6] p-4 rounded-2xl shadow-[0_1px_2px_rgba(21,31,28,0.04)] space-y-3.5">
      <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-2.5">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[#151F1C]" />
          <h4 className="text-[#8A8A7A] font-semibold text-[11px] tracking-[0.12em] uppercase font-mono">
            Cognitive Diagnostics & Fluency
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8E2D6]/50 text-[#151F1C] font-semibold">
          Attempts: {total_attempts}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-[#E8E2D6] shadow-sm">
          <div className="flex items-center gap-1.5 text-[#8A8A7A] text-[10px] uppercase font-mono font-medium mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Accuracy Rate</span>
          </div>
          <span className="text-xl font-bold font-mono text-[#151F1C]">{Math.round(overall_accuracy)}%</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E8E2D6] shadow-sm">
          <div className="flex items-center gap-1.5 text-[#8A8A7A] text-[10px] uppercase font-mono font-medium mb-1">
            <Clock className="w-3.5 h-3.5 text-[#151F1C]" />
            <span>Mastered Concepts</span>
          </div>
          <span className="text-xl font-bold font-mono text-[#151F1C]">{profile.mastered_concepts}/{profile.total_concepts}</span>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#2D6A4F] font-bold flex items-center gap-1 mb-1.5">
            <Zap className="w-3 h-3" /> Cognitive Strengths
          </span>
          <div className="flex flex-wrap gap-1.5">
            {strengths.length > 0 ? (
              strengths.map((str, idx) => (
                <span key={idx} className="text-[11px] bg-[#E6F4EA] border border-[#A7D4B5] text-[#2D6A4F] font-medium px-2.5 py-0.5 rounded-full shadow-sm">
                  ✓ {str}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#8A8A7A] italic">Building mastery baseline...</span>
            )}
          </div>
        </div>

        {struggles.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#92400E] font-bold flex items-center gap-1 mb-1.5">
              <AlertTriangle className="w-3 h-3" /> Reinforcement Areas
            </span>
            <div className="flex flex-wrap gap-1.5">
              {struggles.map((st, idx) => (
                <span key={idx} className="text-[11px] bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] font-medium px-2.5 py-0.5 rounded-full shadow-sm">
                  ! {st}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
