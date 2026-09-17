import React, { useState } from 'react'
import { Maximize2, Minimize2, Plus, Edit3 } from 'lucide-react'
import MathDisplay from './MathDisplay'
import type { TrigStepHistoryItem } from '../../lib/trig/trigApiClient'

/** Read-only canonical record of user's verified derivation steps.
 *  Includes collapsible/expandable toggle with 180px collapsed vs 500px expanded height. */
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
  const [isExpanded, setIsExpanded] = useState(false)

  const rows: { stepNum: string; equation: string }[] = []

  stepsHistory.forEach((step, idx) => {
    if (step.completed) {
      rows.push({ stepNum: `Step ${idx + 1}`, equation: step.result || step.instruction })
    }
  })

  const verifiedCount = rows.length
  const dynamicTotal = verifiedCount

  return (
    <div className={`bg-white border border-[#EDE8DD] rounded-2xl shadow-[0_1px_3px_rgba(21,31,28,0.05)] overflow-hidden font-mono transition-all duration-300 ease-in-out ${className}`}>
      <div className="h-[48px] px-5 flex items-center justify-between border-b border-[#EDE8DD] bg-[#FCFBF8]">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-[0.12em] text-[#8A8F8B] uppercase text-[10px]">
            EDOVA EQUATION BOARD
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px]">
            <span className="px-2.5 py-1 rounded-full bg-white border border-[#EDE8DD] text-[#6A7570] shadow-xs">
              {verifiedCount} verified • {dynamicTotal} total • {isFullySolved ? 'Solved' : '∞ steps'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#1A221E] text-white shadow-xs">
              {isFullySolved ? `Mastered • ${verifiedCount} steps` : (verifiedCount === 0 ? 'Ready • 0 steps' : `In Progress • Step ${verifiedCount + 1}`)}
            </span>
          </div>

          {/* Action buttons: ⊕, ✎, and Expand/Collapse with Green Dash Indicator */}
          <div className="flex items-center gap-1.5 border-l border-[#EDE8DD] pl-2.5">
            <button
              type="button"
              title="Add Derivation Step"
              className="w-[28px] h-[28px] rounded-full bg-[#F5F1E8] hover:bg-[#EAE4D8] border border-[#EDE8DD] text-[#1A221E] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#1A221E] stroke-[2]" />
            </button>
            <button
              type="button"
              title="Edit Derivation"
              className="w-[28px] h-[28px] rounded-full bg-[#F5F1E8] hover:bg-[#EAE4D8] border border-[#EDE8DD] text-[#1A221E] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#1A221E] stroke-[2]" />
            </button>

            {/* Expand / Collapse Circular Button with Green Dash Indicator */}
            <div className="flex flex-col items-center">
              <span className="w-4 h-[2px] bg-[#4A7C59] rounded-full mb-0.5" />
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse board" : "Expand board"}
                aria-label={isExpanded ? "Collapse board" : "Expand board"}
                className="w-[28px] h-[28px] rounded-full bg-[#F5F1E8] hover:bg-[#EAE4D8] border border-[#EDE8DD] text-[#1A221E] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5 text-[#1A221E] stroke-[2]" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-[#1A221E] stroke-[2]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Body: 180px Collapsed vs 500px Expanded */}
      <div
        className={`relative w-full dotted-grid-strong bg-[#FFFEFD] transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'h-[500px] overflow-y-auto' : 'h-[180px]'
        }`}
      >
        {!isExpanded ? (
          /* Collapsed: 180px height, shows only ghost example */
          <div className="h-full w-full flex flex-col items-center justify-center p-5 text-center animate-fadeIn">
            <div className="w-full max-w-[560px] p-4 rounded-[14px] bg-[#FBF9F3] border border-dashed border-[#DDB56E]/60 shadow-xs flex items-center gap-3">
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded bg-[#EDE8DD] text-[#7A6E59] shrink-0">
                Ghost Example
              </span>
              <span className="font-mono text-[12.5px] text-[#1A221E] font-medium text-left truncate flex-1">
                Ex: Step 1: In ΔABC, ∠B = 90° → AB² + BC² = AC²
              </span>
            </div>
          </div>
        ) : (
          /* Expanded: 500px height, shows full derivation area with dot-grid */
          <div className="h-full w-full p-6 md:p-8 animate-fadeIn">
            {rows.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                {/* Ghost example box */}
                <div className="w-full max-w-[560px] p-4 rounded-[14px] bg-[#FBF9F3] border border-dashed border-[#DDB56E]/60 shadow-xs flex items-center gap-3">
                  <span className="font-mono text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded bg-[#EDE8DD] text-[#7A6E59] shrink-0">
                    Ghost Example
                  </span>
                  <span className="font-mono text-[12.5px] text-[#1A221E] font-medium text-left truncate flex-1">
                    Ex: Step 1: In ΔABC, ∠B = 90° → AB² + BC² = AC²
                  </span>
                </div>

                {/* Empty State */}
                <div className="flex flex-col items-center justify-center max-w-[340px]">
                  <div className="w-12 h-12 rounded-[14px] bg-[#F6F1E6] border border-[#EDE8DD] flex items-center justify-center mb-3 shadow-xs">
                    <span className="font-mono text-[18px] text-[#B8A88E]">∅</span>
                  </div>
                  <p className="font-mono text-[12px] tracking-[0.02em] text-[#9AA09B] leading-[1.6]">
                    No derivations yet. Enter Step 1 below in <span className="text-[#1A221E] font-medium">Your Derivations</span> to begin.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full max-w-[680px] p-3 rounded-[12px] bg-[#FBF9F3]/90 border border-dashed border-[#DDB56E]/50 flex items-center gap-2.5 text-[#5A645E]">
                  <span className="font-mono text-[9.5px] uppercase px-2 py-0.5 rounded bg-[#EDE8DD] text-[#7A6E59] font-medium shrink-0">
                    Ghost Example
                  </span>
                  <span className="font-mono text-[12px] text-[#1A221E] truncate">
                    Ex: Step 1: In ΔABC, ∠B = 90° → AB² + BC² = AC²
                  </span>
                </div>

                <div className="max-w-[680px] space-y-3 pt-1">
                  {rows.map((row, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-[#EDE8DD] bg-white text-xs font-mono flex items-center gap-3 shadow-xs transition-all"
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
