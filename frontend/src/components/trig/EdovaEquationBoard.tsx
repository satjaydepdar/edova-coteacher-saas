import React, { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import MathDisplay from './MathDisplay'
import type { TrigStepHistoryItem } from '../../lib/trig/trigApiClient'

/** Ported from edova-pilot-v4/frontend/src/components/ui/EdovaEquationBoard.jsx.
 *  Read-only canonical record of only the user's verified derivation steps.
 *  Includes collapsible/expandable toggle with small (-) / (+) symbol. */
interface EdovaEquationBoardProps {
  stepsHistory?: TrigStepHistoryItem[]
  totalSteps?: number
  isFullySolved?: boolean
  className?: string
}

export default function EdovaEquationBoard({
  stepsHistory = [],
  totalSteps = 0,
  isFullySolved = false,
  className = '',
}: EdovaEquationBoardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const rows: { stepNum: string; equation: string }[] = []

  stepsHistory.forEach((step, idx) => {
    if (step.completed) {
      rows.push({ stepNum: `Step ${idx + 1}`, equation: step.result || step.instruction })
    }
  })

  const verifiedCount = rows.length
  // Dynamically computed total steps: 100% dynamic, never static, tracks verified derivations
  const dynamicTotal = verifiedCount

  return (
    <div className={`bg-[#FAF9F5] border border-[#E8E2D6] rounded-2xl p-5 shadow-[0_1px_2px_rgba(21,31,28,0.04)] ${isExpanded ? 'space-y-4' : 'space-y-0'} font-mono transition-all duration-200 ${className}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 ${isExpanded ? 'border-b border-[#E8E2D6] pb-3' : 'pb-0'}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-[0.12em] text-[#8A8A7A] uppercase text-[11px]">
            EDOVA EQUATION BOARD
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse equation board (-)" : "Expand equation board (+)"}
            aria-label={isExpanded ? "Collapse equation board" : "Expand equation board"}
            className="w-5 h-5 rounded-md flex items-center justify-center bg-white hover:bg-[#F7F5EF] border border-[#E8E2D6] text-[#151F1C] text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            {isExpanded ? (
              <Minus className="w-3 h-3 text-[#151F1C] stroke-[2.5]" />
            ) : (
              <Plus className="w-3 h-3 text-[#151F1C] stroke-[2.5]" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8A8A7A] font-mono px-3 py-1 rounded-full bg-[#FAF9F5] border border-[#E8E2D6] shadow-sm">
            {verifiedCount} verified • {dynamicTotal} total • {isFullySolved ? 'Solved' : '∞ steps'}
          </span>
          <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] shadow-sm">
            {isFullySolved ? `Mastered • ${verifiedCount} steps` : (verifiedCount === 0 ? 'Ready • 0 steps' : `In Progress • Step ${verifiedCount + 1}`)}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2.5 animate-fade-in">
        {rows.length > 0 ? (
          rows.map((row, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-[#E8E2D6] bg-white text-xs font-mono flex items-center gap-3 shadow-sm transition-all"
            >
              <span className="font-bold text-[13px] text-[#151F1C] tracking-wide shrink-0 self-start mt-0.5">
                {row.stepNum}:
              </span>
              <div className="font-mono text-[14px] text-[#151F1C] font-semibold flex-1">
                {row.equation.includes('\n') ? (
                  <div className="space-y-1">
                    {row.equation.split('\n').map((line, lIdx) => (
                      <div key={lIdx} className="flex items-center gap-2">
                        {lIdx > 0 && <span className="text-[#8A8A7A] text-[10px] font-mono">•</span>}
                        <MathDisplay math={line} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <MathDisplay math={row.equation} />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-5 text-center text-[#8A8A7A] text-xs font-mono">
            No derivations yet. Enter Step 1 below in Your Derivations to begin.
          </div>
        )}
      </div>
      )}
    </div>
  )
}
