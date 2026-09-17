import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VideoExplainerModal from '../video/VideoExplainerModal'
import CoordGeoDagGraph from './CoordGeoDagGraph'
import { coordgeoApi, type CoordGeoConceptSummary, type CoordGeoStudentState } from '../../lib/coordgeo/coordgeoApiClient'

interface CoordGeoWorkspaceProps {
  conceptId: string
  onSelectConcept?: (id: string) => void
  availableConcepts?: CoordGeoConceptSummary[]
}

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

  return (
    <div className="relative min-h-full w-full bg-[#fdfaf5] text-[#111814] antialiased">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.32]" />

      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#fdfaf5]/90 border-b border-[#ece8df]">
        <div className="px-5 lg:px-10 h-[68px] flex items-center justify-between">
          <h1 className="font-serif text-[22px] lg:text-[26px] tracking-[-0.02em] font-medium text-[#111814]">
            Practice Questions
          </h1>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#ece8df] text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#f6f1e7] transition cursor-pointer"
          >
            <span className="text-[14px]">←</span> Go back
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 px-5 lg:px-10 py-6 lg:py-8 space-y-5 w-full max-w-[920px] mx-auto min-w-0">
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

        <div className="rounded-[14px] bg-[#FFF8E8] border border-[#EFE0B0] px-4 py-3 text-[12.5px] text-[#6B5A22] flex items-start gap-2">
          <span>ⓘ</span>
          <span>{state?.solving_unavailable_reason || 'Step-by-step interactive solving is coming soon for this chapter.'}</span>
        </div>

        <div className="relative bg-white rounded-[28px] border border-[#ece8df] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.05)] overflow-hidden min-w-0 w-full">
          <div className="p-7 lg:p-9">
            {loading ? (
              <div className="py-10 text-center font-mono text-[13px] text-[#8A8A7A]">Loading…</div>
            ) : error ? (
              <div className="py-10 text-center text-[14px] font-medium">{error}</div>
            ) : (
              <div className="max-w-[720px] space-y-5">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#f6f1e7] text-[10px] font-mono tracking-wide text-[#8a6d2b]">
                  {state?.problem_title || 'PRACTICE PROBLEM'}
                </div>
                <p className="text-[19px] leading-relaxed font-medium text-[#111814]">{state?.problem_text}</p>

                {hintLevel && state?.hints[hintLevel] && (
                  <div className="rounded-[14px] bg-[#F6F1E7] border border-[#ECE6D8] p-4 text-[13.5px] text-[#5a554e]">
                    {state.hints[hintLevel]}
                  </div>
                )}

                {showSolution && state?.worked_solution && (
                  <div className="rounded-[14px] bg-[#FCFBF8] border border-[#EDE8DD] p-4 space-y-2">
                    <div className="font-mono text-[10px] tracking-[0.1em] text-[#8A8F8B] mb-1">WORKED SOLUTION</div>
                    {state.worked_solution.map((step, i) => (
                      <div key={i} className="text-[13.5px] text-[#1A221E]">
                        <span className="font-mono text-[11px] text-[#9AA09B] mr-2">{i + 1}.</span>
                        {step}
                      </div>
                    ))}
                    {state.expected_answer && (
                      <div className="text-[13.5px] font-semibold text-[#1A221E] pt-1">Answer: {state.expected_answer}</div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => load(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1a2421] transition"
                  >
                    New Variant
                  </button>
                  <button
                    type="button"
                    onClick={() => setHintLevel(hintLevel === 'high' ? 'low' : hintLevel === 'low' ? 'mid' : 'high')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f6f1e7] border border-[#ece6d8] text-[13px] font-medium text-[#5a554e] hover:bg-[#efe8d8] transition cursor-pointer"
                  >
                    {hintLevel ? 'Next Hint' : 'Show Hint'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSolution((s) => !s)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f6f1e7] border border-[#ece6d8] text-[13px] font-medium text-[#5a554e] hover:bg-[#efe8d8] transition cursor-pointer"
                  >
                    {showSolution ? 'Hide Solution' : 'Reveal Solution'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVideoModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f6f1e7] border border-[#ece6d8] text-[13px] font-medium text-[#5a554e] hover:bg-[#efe8d8] transition cursor-pointer"
                  >
                    <span className="text-[11px] text-[#8a6d2b]">▶</span>
                    Generate Video Explainer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[14px] bg-[#FCFBF8] border border-[#EDE8DD] p-4 grid grid-cols-2 gap-3 max-w-[400px]">
          <div className="relative rounded-[14px] bg-white border border-[#EDE8DD] p-3.5">
            <div className="font-mono text-[9.5px] tracking-[0.08em] text-[#9AA09B] mb-1.5">MASTERY</div>
            <div className="font-display text-[22px] font-[600] leading-none">{Math.round((state?.mastery_score || 0) * 100)}%</div>
          </div>
          <div className="relative rounded-[14px] bg-white border border-[#EDE8DD] p-3.5">
            <div className="font-mono text-[9.5px] tracking-[0.08em] text-[#9AA09B] mb-1.5">SOLVED</div>
            <div className="font-display text-[22px] font-[600] leading-none">{state?.questions_solved || 0}</div>
          </div>
        </div>
      </div>

      <CoordGeoDagGraph
        isOpen={showDagModal}
        onClose={() => setShowDagModal(false)}
        concepts={availableConcepts}
        activeConceptId={conceptId}
        onSelectConcept={(id) => {
          onSelectConcept && onSelectConcept(id)
          setShowDagModal(false)
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
