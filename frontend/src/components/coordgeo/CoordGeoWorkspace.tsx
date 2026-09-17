import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VideoExplainerModal from '../video/VideoExplainerModal'
import ConceptDagModal from '../dag/ConceptDagModal'
import { coordgeoApi, type CoordGeoConceptSummary, type CoordGeoStudentState } from '../../lib/coordgeo/coordgeoApiClient'

interface CoordGeoWorkspaceProps {
  conceptId: string
  onSelectConcept?: (id: string) => void
  availableConcepts?: CoordGeoConceptSummary[]
}

/** Structurally mirrors CoteacherWorkspace.tsx's layout (top bar, concept
 * selector, question card, board card, derivations-shaped card, right
 * telemetry rail) so every subject's practice page looks and behaves the
 * same. Content in the board/derivations/telemetry regions is adapted
 * honestly, not faked: there's no reasoner session behind this concept yet
 * (see routers/student.py), so metrics that would require one -- SAL, active
 * attempts, accuracy, a real trajectory history -- show as "coming soon"
 * rather than a fabricated number. */
export default function CoordGeoWorkspace({ conceptId, onSelectConcept, availableConcepts = [] }: CoordGeoWorkspaceProps) {
  const navigate = useNavigate()
  const [state, setState] = useState<CoordGeoStudentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConceptDropdown, setShowConceptDropdown] = useState(false)
  const [showDagModal, setShowDagModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [hintLevel, setHintLevel] = useState<'high' | 'mid' | 'low' | null>(null)
  const [hintsRevealedCount, setHintsRevealedCount] = useState(0)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [isBoardExpanded, setIsBoardExpanded] = useState(false)

  const conceptTitle = availableConcepts.find((c) => c.id === conceptId)?.title || state?.concept_title || ''

  const load = (generateNew = false) => {
    setLoading(true)
    setError(null)
    setShowSolution(false)
    setHintLevel(null)
    coordgeoApi
      .state(conceptId, { generateNew })
      .then(setState)
      .catch(() => setError('Could not load this concept.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId])

  const revealNextHint = () => {
    setHintLevel((prev) => (prev === 'high' ? 'low' : prev === 'low' ? 'mid' : 'high'))
    setHintsRevealedCount((n) => n + 1)
  }

  return (
    <div className="relative min-h-full w-full bg-[#fdfaf5] text-[#111814] antialiased">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.32]" />

      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#fdfaf5]/90 border-b border-[#ece8df]">
        <div className="px-5 lg:px-10 h-[68px] flex items-center justify-between">
          <h1 className="font-serif text-[22px] lg:text-[26px] tracking-[-0.02em] font-medium text-[#111814]">
            Practice Questions
          </h1>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#ece8df] text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#f6f1e7] transition cursor-pointer"
            >
              <span className="text-[14px]">←</span> Go back
            </button>
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] font-mono text-[10px] text-[#6B7280]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DDB56E]" /> STEP-BY-STEP SOLVING • SOON
            </span>
          </div>
        </div>
      </div>

      <div className="flex">
        <main className="flex-1 min-w-0 max-w-full flex flex-col relative overflow-hidden">
          <div
            className={`relative z-10 flex-1 px-5 lg:px-10 py-6 lg:py-8 space-y-5 w-full mx-auto min-w-0 transition-all duration-300 ${
              isRightPanelOpen ? 'max-w-[840px]' : 'max-w-[920px]'
            }`}
          >
            {/* Concept Selection Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowConceptDropdown(!showConceptDropdown)}
                  className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-white border border-[#ece8df] shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-[13px] cursor-pointer"
                >
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#9a958c]">CONCEPT</span>
                  <span className="font-medium text-[#1a2421]">{conceptTitle || 'Cartesian Basics'}</span>
                  <span className="text-[#9a958c]">⌄</span>
                </button>

                {showConceptDropdown && (
                  <div className="absolute top-[44px] left-0 w-[300px] max-w-[calc(100vw-32px)] rounded-2xl bg-white border border-[#ece8df] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-2 z-30 space-y-1 max-h-[380px] overflow-y-auto">
                    {availableConcepts.map((c) => {
                      const isCurrent = c.id === conceptId
                      const isLocked = c.is_unlocked === false
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={isLocked}
                          onClick={() => {
                            onSelectConcept && onSelectConcept(c.id)
                            setShowConceptDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-[#1a2421] text-white'
                              : isLocked
                              ? 'opacity-40 cursor-not-allowed text-[#8a8f8b]'
                              : 'hover:bg-[#f6f1e7] text-[#5a554e]'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono text-[10px] block opacity-70">{c.id}</span>
                            <span className="font-medium truncate block">{c.title}</span>
                          </div>
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#8be78a] shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowDagModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1a2421] text-white text-[12px] font-medium hover:bg-black transition cursor-pointer shadow-xs"
              >
                <span>◈</span>
                <span>View DAG Map</span>
              </button>

              <div className="ml-auto flex items-center gap-2 font-mono text-[11px] text-[#9a958c]">
                <span className="w-7 h-7 rounded-full bg-white border border-[#ece8df] grid place-items-center text-[#1a2421] font-medium shadow-xs">
                  {availableConcepts.length || 12}
                </span>
                <span>CONCEPTS IN DAG</span>
              </div>
            </div>

            {/* CARD 1: QUESTION CARD */}
            <div className="relative bg-white rounded-[28px] border border-[#ece8df] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.05)] overflow-hidden min-w-0 w-full">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ece8df] to-transparent" />
              <div className="p-7 lg:p-9">
                {loading ? (
                  <div className="py-10 text-center font-mono text-[13px] text-[#8A8A7A]">Loading…</div>
                ) : error ? (
                  <div className="py-10 text-center text-[14px] font-medium">{error}</div>
                ) : (
                  <div className="max-w-[720px] space-y-1">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#f6f1e7] text-[10px] font-mono tracking-wide text-[#8a6d2b]">
                      {state?.problem_title || 'PRACTICE PROBLEM'}
                    </div>
                    <p className="text-[19px] leading-relaxed font-medium text-[#111814] pt-2">{state?.problem_text}</p>
                    <p className="text-[13px] text-[#8A8A7A] pt-1">
                      You're viewing <strong>{conceptTitle}</strong>. Click New Variant for another curated problem for this concept.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => load(true)}
                        className="group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1a2421] transition"
                      >
                        <span>New Variant</span>
                        <span className="w-5 h-5 rounded-full bg-white text-black grid place-items-center text-[11px] font-bold group-hover:translate-x-0.5 transition">→</span>
                      </button>
                      <button
                        type="button"
                        onClick={revealNextHint}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f6f1e7] border border-[#ece6d8] text-[13px] font-medium text-[#5a554e] hover:bg-[#efe8d8] transition cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full bg-white border border-[#ece6d8] grid place-items-center text-[11px] text-[#8a6d2b]">💡</span>
                        {hintLevel ? 'Next Hint' : 'Show Hint'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowVideoModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f6f1e7] border border-[#ece6d8] text-[13px] font-medium text-[#5a554e] hover:bg-[#efe8d8] transition cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full bg-white border border-[#ece6d8] grid place-items-center text-[11px] text-[#8a6d2b]">▶</span>
                        Generate Video Explainer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSolution((s) => !s)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f6f1e7] border border-[#ece6d8] text-[13px] font-medium text-[#5a554e] hover:bg-[#efe8d8] transition cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full bg-white border border-[#ece6d8] grid place-items-center text-[11px] text-[#4a7c59]">✦</span>
                        {showSolution ? 'Hide Solution' : 'Reveal Solution'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-4 font-mono text-[10.5px] text-[#9a958c]">
                      <span>✓ CBSE ALIGNED</span>
                      <span>•</span>
                      <span>NO TIMER</span>
                      <span>•</span>
                      <span>SELF-PACED REVIEW</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 2: WORKED SOLUTION BOARD (same chrome as Trig's Equation Board;
                content is the answer-key solution, not a live verified derivation --
                there's no session here to verify against) */}
            <div className="bg-white rounded-[28px] border border-[#ece8df] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.05)] overflow-hidden min-w-0">
              <div className="px-7 lg:px-8 h-[52px] flex items-center justify-between border-b border-[#ece8df] bg-[#fbfaf7]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-[#1a2421] font-medium uppercase">
                    WORKED SOLUTION BOARD
                  </span>
                  <span className="hidden md:inline-flex items-center gap-2 font-mono text-[10px] text-[#9a958c]">
                    <span className="w-1 h-1 rounded-full bg-[#d8d2c3]" />
                    {state?.worked_solution.length || 0} steps • reference
                  </span>
                </div>
                <button
                  type="button"
                  title={isBoardExpanded ? 'Collapse board' : 'Expand board'}
                  onClick={() => setIsBoardExpanded(!isBoardExpanded)}
                  className="w-7 h-7 rounded-full bg-white border border-[#ece6d8] grid place-items-center text-[#1a2421] hover:bg-[#1a2421] hover:text-white hover:border-[#1a2421] transition-all duration-200 cursor-pointer shadow-xs"
                >
                  {isBoardExpanded ? '⤡' : '⤢'}
                </button>
              </div>

              <div
                className="dot-grid relative p-6 lg:p-8 overflow-hidden transition-all duration-500 ease-[cubic-bezier(.25,.8,.25,1)]"
                style={{ height: isBoardExpanded ? 420 : 180, overflowY: isBoardExpanded ? 'auto' : 'hidden' }}
              >
                <div className="max-w-[560px]">
                  {!showSolution ? (
                    <div className="rounded-xl border border-dashed border-[#ddd8cc] bg-[#fdfaf5]/80 p-4">
                      <div className="font-mono text-[10px] tracking-[0.12em] text-[#7a756c] mb-2 font-medium">
                        HIDDEN • CLICK "REVEAL SOLUTION" ABOVE
                      </div>
                      <div className="font-mono text-[13px] text-[#6b6760] leading-relaxed">
                        The worked solution appears here once revealed, so you can attempt the problem first.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(state?.worked_solution || []).map((step, idx) => (
                        <div key={idx} className="rounded-xl bg-[#1a2421] text-[#e8e2d6] px-4 py-3 font-mono text-[13px] flex items-center gap-3 shadow-sm">
                          <span className="text-[#a8e6a0] font-semibold shrink-0">Step {idx + 1}:</span>
                          <span className="flex-1">{step}</span>
                        </div>
                      ))}
                      {state?.expected_answer && (
                        <div className="rounded-xl bg-[#F6F1E6] border border-[#ECE6D8] px-4 py-3 font-mono text-[13px] text-[#1a2421] font-semibold">
                          Answer: {state.expected_answer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!isBoardExpanded && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#fbfaf7]/90 to-transparent" />
                )}
              </div>
            </div>

            {/* CARD 3: HINTS & GUIDANCE (same chrome as Trig's "Your Derivations") */}
            <div className="bg-white rounded-[28px] border border-[#ece8df] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.05)] p-7 lg:p-8 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-[18px] text-[#1a2421] font-semibold">Hints &amp; Guidance</h3>
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#9a958c]">
                  {hintsRevealedCount} REVEALED
                </span>
              </div>

              {!hintLevel ? (
                <div className="mt-5 flex items-center gap-3 text-[#9a958c]">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#ece8df] grid place-items-center shadow-sm">
                    <span className="text-[14px]">💡</span>
                  </div>
                  <div className="font-mono text-[11px]">No hints revealed yet. Click Show Hint above.</div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-[#F6F1E7] border border-[#ECE6D8] p-4 text-[13.5px] text-[#5a554e]">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-[#8a6d2b] block mb-1.5">
                    {hintLevel === 'high' ? 'Direct Hint' : hintLevel === 'mid' ? 'Guiding Hint' : 'Nudge'}
                  </span>
                  {state?.hints[hintLevel]}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Collapsible Slider Tab Button on Vertical Border */}
        <div
          className="hidden lg:flex absolute top-0 bottom-0 z-20 items-center justify-center"
          style={{ width: '24px', right: isRightPanelOpen ? '320px' : '0px', transition: 'right 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            title={isRightPanelOpen ? 'Collapse telemetry' : 'Expand telemetry'}
            className="w-4 h-10 rounded-full bg-[#FFFFFF] border border-[#EDE8DD] shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#6B7280] hover:bg-[#FBF9F3] hover:text-[#1A221E] transition-colors cursor-pointer"
            style={{ width: '16px', height: '40px' }}
          >
            <span className="font-mono text-[11px] leading-none select-none">{isRightPanelOpen ? '>' : '<'}</span>
          </button>
        </div>

        {/* Telemetry Sidebar -- same regions as Trig's, honest content: metrics
            that need a live reasoner session (SAL, active attempts, accuracy,
            real trajectory history) show as "coming soon" rather than fabricated. */}
        <aside
          className="w-full lg:w-[320px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-[#EDE8DD] flex flex-col overflow-hidden"
          style={{
            minWidth: isRightPanelOpen ? '320px' : '0px',
            maxWidth: isRightPanelOpen ? '320px' : '0px',
            transform: isRightPanelOpen ? 'translateX(0)' : 'translateX(100%)',
            opacity: isRightPanelOpen ? 1 : 0,
            transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
            <div className="h-[72px] px-6 flex items-center border-b border-[#EDE8DD] shrink-0">
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B]">TELEMETRY</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar min-w-0">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Concept Mastery',
                    value: `${Math.round((state?.mastery_score || 0) * 100)}%`,
                    sub: 'Baseline',
                    color: '#1A221E',
                    progress: Math.round((state?.mastery_score || 0) * 100),
                  },
                  {
                    label: 'Questions Solved',
                    value: `${state?.questions_solved || 0}`,
                    sub: 'This concept',
                    color: '#4A7C59',
                    progress: Math.min(100, (state?.questions_solved || 0) * 20),
                  },
                  {
                    label: 'Hints Revealed',
                    value: `${hintsRevealedCount}`,
                    sub: 'This session',
                    color: hintsRevealedCount > 1 ? '#DDB56E' : '#1A221E',
                    progress: Math.min(100, hintsRevealedCount * 25),
                  },
                  {
                    label: 'Assistance SAL',
                    value: '—',
                    sub: 'Needs live solving',
                    color: '#D6D0C2',
                    progress: 0,
                  },
                ].map((z) => (
                  <div key={z.label} className="relative rounded-[14px] bg-[#FCFBF8] border border-[#EDE8DD] p-3.5 overflow-hidden">
                    <div className="font-mono text-[9.5px] tracking-[0.08em] text-[#9AA09B] leading-tight mb-1.5">{z.label.toUpperCase()}</div>
                    <div className="font-display text-[22px] font-[600] leading-none tracking-[-0.02em] mb-1">{z.value}</div>
                    <div className="font-mono text-[10px] text-[#8A8F8B]">{z.sub}</div>
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EDE8DD]">
                      <div className="h-full transition-all duration-700 ease-out" style={{ width: `${z.progress}%`, background: z.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[14px] bg-[#FCFBF8] border border-[#EDE8DD] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.08em] text-[#8A8F8B]">LEARNING TRAJECTORY DYNAMICS</span>
                  <span className="font-mono text-[9px] px-1.5 py-1 rounded-full bg-white border border-[#EDE8DD] text-[#9AA09B]">Mastery</span>
                </div>
                <div className="relative h-[112px] w-full rounded-[10px] bg-white border border-[#EDE8DD] overflow-hidden dotted-grid flex items-center justify-center">
                  <span className="font-mono text-[10.5px] text-[#B8B0A0] text-center px-6">
                    Trajectory tracking arrives with step-by-step solving
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-[#9AA09B]">
                  <span>No history yet for this concept</span>
                </div>
              </div>

              <div
                className="rounded-[14px] bg-[#1A221E] p-4 border border-[#2A332F] relative overflow-hidden"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.18)' }}
              >
                <div className="absolute right-[-20px] top-[-20px] w-28 h-28 rounded-full bg-[#DDB56E]/[0.08] blur-[1px]" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[9px] tracking-[0.14em] text-[#9CA3AF] uppercase opacity-90">PRACTICE STATUS</span>
                    <span className="font-mono text-[9px] px-2 py-1 rounded-full bg-[#232E27] border border-[#2A332F] text-[#DDB56E] font-semibold">
                      Review Mode
                    </span>
                  </div>
                  <div className="flex items-end gap-3 mb-4">
                    <div className="font-display text-[28px] font-[700] leading-none text-[#FFFFFF] tracking-[-0.02em]">
                      {`${Math.round((state?.mastery_score || 0) * 100)}%`}
                    </div>
                    <div className="font-mono text-[11px] text-[#EDE8DD] mb-0.5 opacity-90">Concept mastery</div>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[#EDE8DD] opacity-80">
                    Verified step-by-step solving isn't wired up yet for this chapter, so mastery only tracks concept review for now.
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#EDE8DD] bg-white p-4">
                <div className="font-mono text-[10px] tracking-[0.08em] text-[#8A8F8B] mb-3">SESSION CONTEXT</div>
                <div className="space-y-2.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8A8F8B]">Concept</span>
                    <span className="text-[#1A221E] font-medium max-w-[150px] truncate">{conceptTitle || 'Coordinate Geometry'}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8A8F8B]">Variant</span>
                    <span className="text-[#1A221E]">{state?.problem_title || '— • Ready'}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8A8F8B]">Mode</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[10px]">Self-paced • Review</span>
                  </div>
                </div>
              </div>
            </div>
        </aside>
      </div>

      <ConceptDagModal
        isOpen={showDagModal}
        onClose={() => setShowDagModal(false)}
        subjectLabel="CBSE CLASS 10 DAG"
        concepts={availableConcepts}
        activeConceptId={conceptId}
        onSelectConcept={(id) => {
          onSelectConcept && onSelectConcept(id)
        }}
      />

      <VideoExplainerModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        conceptId={conceptId}
        conceptTitle={conceptTitle}
        questionText={state?.problem_text || undefined}
        telemetryEndpoint="/api/coordgeo/telemetry/event"
      />
    </div>
  )
}
