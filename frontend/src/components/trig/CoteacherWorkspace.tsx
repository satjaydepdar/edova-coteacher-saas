import { useState, useEffect } from 'react'
import {
  RotateCcw, BookOpen, ChevronDown, ChevronUp, BrainCircuit, BookMarked,
  Dices, Lock, Lightbulb, Check, Play, Sparkles, X,
} from 'lucide-react'
import MathDisplay from './MathDisplay'
import FormattedMathText from './FormattedMathText'
import LatexMathEditor from './LatexMathEditor'
import EdovaEquationBoard from './EdovaEquationBoard'
import ProgressChart from './ProgressChart'
import CognitiveProfileCard from './CognitiveProfileCard'
import { trackTelemetryEvent } from '../../lib/trig/tracer'
import { createCoTeacherSession, submitCoTeacherStep, CoTeacherApiError } from '../../lib/trig/coTeacherApiClient'
import {
  trigApi,
  type TrigConceptSummary,
  type TrigStepHistoryItem,
  type TrigMetrics,
  type TrigRequiredItem,
  type TrigProgressPoint,
  type TrigProfile,
} from '../../lib/trig/trigApiClient'

/** Ported from edova-pilot-v4/frontend/src/features/workspace/CoteacherWorkspace.jsx.
 *
 * Adapted:
 * - No studentId prop -- the backend derives identity from the auth token
 *   already attached by trigApiClient/coTeacherApiClient.
 * - State/reset calls go through trigApiClient (this app's own backend)
 *   instead of a hardcoded http://localhost:8000.
 * - Step submission still talks directly to the CoTeacher API (a separate
 *   local service, unauthenticated) -- unchanged from the pilot. See the
 *   port's scope notes: this is the "minimal slice", the reasoning engine
 *   itself was not touched or re-implemented.
 * - Known gap carried over, not introduced here: because submission bypasses
 *   this app's backend, SAL/mastery/step progress lives in this component's
 *   state + the CoTeacher session only, and does not survive a page refresh. */
interface CoteacherWorkspaceProps {
  conceptId: string
  onSelectConcept?: (id: string) => void
  availableConcepts?: TrigConceptSummary[]
}

export default function CoteacherWorkspace({
  conceptId,
  onSelectConcept,
  availableConcepts = [],
}: CoteacherWorkspaceProps) {
  const [loading, setLoading] = useState(false)
  const [hasStartedProblem, setHasStartedProblem] = useState(false)

  const [conceptTitle, setConceptTitle] = useState('')
  const [problemContext, setProblemContext] = useState('')

  const [stepsHistory, setStepsHistory] = useState<TrigStepHistoryItem[]>([])
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [isFullySolved, setIsFullySolved] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')

  const [socraticScaffold, setSocraticScaffold] = useState('')
  const [quickOptions, setQuickOptions] = useState<string[]>([])
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [reasoningSessionId, setReasoningSessionId] = useState<string | null>(null)
  const [systemError, setSystemError] = useState<string | null>(null)
  const [requiredItems, setRequiredItems] = useState<TrigRequiredItem[]>([])

  const [isHintOpen, setIsHintOpen] = useState(false)
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)

  const [metrics, setMetrics] = useState<TrigMetrics>({
    assistance_sal: 1.0,
    concept_mastery: 0.0,
    active_attempts: 0,
    accuracy_rate: 0.0,
  })

  const [timeline, setTimeline] = useState<TrigProgressPoint[]>([])
  const [profile, setProfile] = useState<TrigProfile | null>(null)
  const [formulaReference, setFormulaReference] = useState('')

  const [showFormulaDrawer, setShowFormulaDrawer] = useState(false)
  const [showConceptDropdown, setShowConceptDropdown] = useState(false)

  // Generic Neuro-Symbolic Reasoning Engine states
  const [isGenericSession, setIsGenericSession] = useState(false)
  const [genericSessionId, setGenericSessionId] = useState<string | null>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customProblemInput, setCustomProblemInput] = useState('')
  const [customLoading, setCustomLoading] = useState(false)

  const PRESET_PROBLEMS = [
    {
      title: "Oswaal Shadow Altitude",
      text: "a tower AB is 20 m high and BC, its shadow on the ground, is 20 sqaureroot 3 m long. Find the Sun’s altitude."
    },
    {
      title: "NCERT 8.2 Q3 Angle System",
      text: "If sin(A - B) = 1/2, cos(A + B) = 1/2, 0 < A + B <= 90, A > B, find A and B."
    },
    {
      title: "NCERT 8.1 Q1 Triangle Ratios",
      text: "In triangle ABC, right-angled at B, AB = 24 cm, BC = 7 cm. Determine: (i) sin A, cos A (ii) sin C, cos C"
    },
    {
      title: "NCERT 8.2 Q1 Compound Evaluation",
      text: "Evaluate: 2 tan^2 45 + cos^2 30 - sin^2 60"
    },
    {
      title: "Tower Elevation Height",
      text: "A tower stands vertically on the ground. From a point on the ground, which is 15 m away from the foot of the tower, the angle of elevation of the top of the tower is found to be 60. Find the height of the tower."
    }
  ]

  const handleStartCustomProblem = async (customText?: string) => {
    const textToUse = customText || customProblemInput
    if (!textToUse.trim()) return

    setCustomLoading(true)
    setSystemError(null)
    setFeedback(null)
    try {
      const res = await trigApi.initSession(textToUse.trim())
      setIsGenericSession(true)
      setGenericSessionId(res.session_id)
      setConceptTitle(`Reasoning Engine: ${res.problem_type}`)
      setProblemContext(res.context)
      setActiveStepIndex(res.active_step_index)
      setTotalSteps(res.total_steps)
      setIsFullySolved(false)
      setCurrentPrompt(res.active_step.prompt)
      setSocraticScaffold(res.active_step.hint)
      setQuickOptions(res.active_step.quick_options || [])
      setStepsHistory(res.steps_history || [])
      setMetrics(res.metrics)
      setHasStartedProblem(true)
      setShowCustomModal(false)
      setUserAnswer('')
    } catch (err: any) {
      setSystemError(err?.message || 'Failed to initialize reasoning session from engine.')
    } finally {
      setCustomLoading(false)
    }
  }

  useEffect(() => {
    const match = availableConcepts.find((c) => c.id === conceptId)
    if (match) setConceptTitle(match.title)
  }, [conceptId, availableConcepts])

  const startTimelineSeed = (): TrigProgressPoint[] => [
    { timestamp: 'Start', raw_score: 0.0, estimated_mastery: 0.0, assistance_level: 1.0, step_index: 0 },
  ]

  const fetchState = async (fresh = true, generateNew = true) => {
    setLoading(true)
    setIsGenericSession(false)
    setGenericSessionId(null)
    setUserAnswer('')
    setFeedback(null)
    setSystemError(null)
    setIsFullySolved(false)
    setEditingStepIndex(null)
    setReasoningSessionId(null)

    try {
      const data = await trigApi.state(conceptId, { fresh, generateNew })
      setConceptTitle(data.concept_title)
      setProblemContext(data.problem_context || '')
      setActiveStepIndex(data.active_step_index ?? 0)
      setTotalSteps(data.total_steps ?? 0)
      setIsFullySolved(data.is_fully_solved || false)
      setSocraticScaffold(data.scaffold || '')
      setQuickOptions(data.quick_options || [])
      setStepsHistory(data.steps_history || [])
      setCurrentPrompt(data.current_step?.prompt || '')
      setFormulaReference(data.formula_reference || '')
      setRequiredItems(data.required_items || [])
      setMetrics(data.metrics || { assistance_sal: data.sal, concept_mastery: data.mastery_score, active_attempts: 0, accuracy_rate: 0 })
      setHasStartedProblem(true)
    } catch {
      setSystemError('Could not reach the workspace backend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      setProfile(await trigApi.profile())
    } catch {
      // Ignore -- non-critical sidebar widget
    }
  }

  useEffect(() => {
    setHasStartedProblem(false)
    setUserAnswer('')
    setFeedback(null)
    setSystemError(null)
    setReasoningSessionId(null)
    setRequiredItems([])
    setStepsHistory([])
    setTimeline(startTimelineSeed())
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId])

  const handleNextProblem = () => {
    trackTelemetryEvent(conceptId, activeStepIndex, 'next_problem_click', { concept_id: conceptId })
    fetchState(true, true)
    setTimeline(startTimelineSeed())
    setFeedback(null)
  }

  // Step submission -- mathematical correctness AND the grounded pedagogical
  // response (hint wording, hint-ladder escalation) come entirely from the
  // CoTeacher API, never decided here. Hint-escalation state lives
  // server-side, so a repeated wrong attempt naturally escalates.
  const handleStepSubmit = async (answerValue?: string) => {
    const finalAnswer = answerValue || userAnswer
    if (!finalAnswer || isSubmitting || !conceptId) return

    setIsSubmitting(true)
    setSystemError(null)
    const isEditingPastStep = editingStepIndex !== null
    const stepIdx = isEditingPastStep ? editingStepIndex : activeStepIndex

    // Dedicated Generic Reasoning Engine submission
    if (isGenericSession && genericSessionId) {
      try {
        const res = await trigApi.submitStep(genericSessionId, stepIdx, finalAnswer.trim())
        if (res.is_correct) {
          setStepsHistory(res.steps_history)
          if (!isEditingPastStep) {
            setActiveStepIndex(res.active_step_index)
            if (res.total_steps) {
              setTotalSteps(res.total_steps)
            } else if (res.steps_history && res.steps_history.length > totalSteps) {
              setTotalSteps(res.steps_history.length)
            }
          }
          setEditingStepIndex(null)
          setUserAnswer('')
          setMetrics(res.metrics)
          if (res.is_fully_solved) {
            setIsFullySolved(true)
            setFeedback(`✓ ${res.socratic_scaffold}`)
          } else {
            setFeedback(`✓ ${res.socratic_scaffold}`)
            setCurrentPrompt(res.active_step?.prompt || '')
            setQuickOptions(res.quick_options || [])
            setSocraticScaffold(res.active_step?.hint || res.socratic_scaffold)
            setIsHintOpen(false)
          }
        } else {
          setFeedback(`✕ ${res.socratic_scaffold}`)
          setSocraticScaffold(res.socratic_scaffold)
          setMetrics(res.metrics)
          setIsHintOpen(true)
        }
      } catch (err: any) {
        setSystemError(err?.message || 'Error communicating with Reasoning Engine.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    try {
      let sessionId = reasoningSessionId
      if (!sessionId) {
        const session = await createCoTeacherSession({
          subject: 'mathematics',
          topic: 'trigonometry',
          problem: problemContext,
          context: requiredItems.length > 0 ? { requiredItems } : undefined,
        })
        sessionId = session.sessionId
        setReasoningSessionId(sessionId)
      }

      const requestId = crypto.randomUUID()
      const { coach } = await submitCoTeacherStep(sessionId, finalAnswer.trim(), requestId)

      switch (coach.responseType) {
        case 'ENCOURAGE':
          setStepsHistory((prev) => {
            const next = [...prev]
            next[stepIdx] = { ...next[stepIdx], completed: true, result: finalAnswer.trim() }
            return next
          })
          if (!isEditingPastStep) setActiveStepIndex(stepIdx + 1)
          setEditingStepIndex(null)
          setUserAnswer('')
          setFeedback(`✓ ${coach.message}`)
          setIsHintOpen(false)
          break
        case 'TARGETED_HINT':
          setFeedback('✕ Not quite equivalent.')
          setSocraticScaffold(coach.message)
          setIsHintOpen(true)
          break
        case 'CLARIFY':
          setFeedback("? Let's clarify that step.")
          setSocraticScaffold(coach.message)
          setIsHintOpen(true)
          break
        case 'COMPLETION':
          setIsFullySolved(true)
          setFeedback(`✓ ${coach.message}`)
          break
        case 'SYSTEM_ERROR':
          setSystemError(coach.message)
          break
        default:
          break
      }
    } catch (err) {
      if (err instanceof CoTeacherApiError) {
        setSystemError('Unable to check this step right now. Please try again.')
      } else {
        throw err
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!conceptId) return
    try {
      await trigApi.reset(conceptId)
    } finally {
      fetchState(true, false)
      setTimeline(startTimelineSeed())
      setFeedback(null)
    }
  }

  const handleEditPastStep = (step: TrigStepHistoryItem, idx: number) => {
    setEditingStepIndex(idx)
    setUserAnswer(step.result || step.instruction || '')
  }

  if (loading) {
    return <div className="p-12 text-center text-[#8A8A7A] font-mono text-sm">Generating fresh randomized problem...</div>
  }

  const completedSteps = stepsHistory.filter((s) => s.completed)
  const isLastStep = activeStepIndex >= totalSteps - 1

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[#8A8A7A] font-sans">Concept:</span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowConceptDropdown(!showConceptDropdown)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#F7F5EF] text-[#151F1C] border border-[#E8E2D6] transition-all shadow-sm"
            >
              <span>{conceptTitle || 'Select a concept'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8A7A]" />
            </button>

            {showConceptDropdown && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-[#FAF9F5] border border-[#E8E2D6] rounded-2xl shadow-xl p-2 z-50 space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#8A8A7A] px-2 py-1 block">Select Topic from DAG</span>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {availableConcepts.map((c) => {
                    const isLocked = c.is_unlocked === false
                    const isCurrent = c.id === conceptId
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          onSelectConcept && onSelectConcept(c.id)
                          setConceptTitle(c.title)
                          setHasStartedProblem(false)
                          setShowConceptDropdown(false)
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-sans flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-[#151F1C] text-[#FAF9F5] font-bold'
                            : isLocked
                            ? 'text-[#8A8A7A] opacity-50 cursor-not-allowed'
                            : 'text-[#151F1C] hover:bg-[#F7F5EF]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-mono text-[10px] block opacity-70">{c.id}</span>
                          <span className="truncate block font-semibold">{c.title}</span>
                        </div>
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-[#8A8A7A] shrink-0" />
                        ) : c.mastery_score >= 0.8 ? (
                          <Check className="w-3.5 h-3.5 text-[#2D6A4F] stroke-[3] shrink-0" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            title="Solve any CBSE Class 10 Trigonometry problem dynamically"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold bg-[#2D6A4F] hover:bg-[#1E4835] text-[#FAF9F5] transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Custom Problem</span>
          </button>

          <button
            type="button"
            onClick={handleNextProblem}
            title="Pick a randomized problem covering the selected concept"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold bg-[#151F1C] hover:bg-[#2A3A32] text-[#FAF9F5] transition-all active:scale-95 shadow-sm"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Next Problem</span>
          </button>

          {hasStartedProblem && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset Practice Steps"
              className="p-2 rounded-full text-[#8A8A7A] hover:text-[#151F1C] hover:bg-[#E8E2D6]/50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-4 transition-all duration-300 relative">
        <div className={`space-y-4 transition-all duration-300 w-full ${isRightPanelOpen ? 'lg:flex-1 lg:max-w-4xl' : 'lg:flex-1 lg:max-w-5xl mx-auto'}`}>
          <div className="bg-[#FAF9F5] border border-[#E8E2D6] rounded-2xl p-5 shadow-[0_1px_2px_rgba(21,31,28,0.04)] space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E2D6]/60 pb-2">
              <span className="font-semibold text-[11px] tracking-[0.12em] uppercase font-mono text-[#8A8A7A]">QUESTION</span>
              <span className="text-[10px] font-sans px-3 py-1 rounded-full bg-white border border-[#E8E2D6] text-[#6B6B5F] flex items-center gap-1.5 shadow-sm">
                <BookOpen className="w-3 h-3 text-[#8A8A7A]" />
                <span>{conceptTitle || 'Trigonometry'} • Bank</span>
              </span>
            </div>

            {hasStartedProblem ? (
              <p className="text-[16px] font-[500] text-[#151F1C] leading-[24px] font-sans">
                <FormattedMathText text={problemContext} />
              </p>
            ) : (
              <div className="py-2 space-y-1">
                <p className="text-[15px] font-[500] text-[#151F1C] font-sans">
                  Ready to practice <strong>{conceptTitle}</strong>?
                </p>
                <p className="text-xs text-[#8A8A7A] font-sans">
                  Click the <strong>Next Problem</strong> button on the top right to load a randomized problem instance with clean slate steps.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {Array.from({ length: Math.max(3, isFullySolved ? activeStepIndex : activeStepIndex + 1) }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    hasStartedProblem && idx <= activeStepIndex ? 'w-10 bg-[#151F1C]' : 'w-10 bg-[#E8E2D6]'
                  }`}
                />
              ))}
            </div>
          </div>

          <EdovaEquationBoard
            stepsHistory={hasStartedProblem ? stepsHistory : []}
            totalSteps={totalSteps}
            isFullySolved={isFullySolved}
          />

          <div className="bg-[#FAF9F5] border border-[#E8E2D6] rounded-2xl p-5 shadow-[0_1px_2px_rgba(21,31,28,0.04)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <span className="font-semibold text-[11px] tracking-[0.12em] uppercase font-mono text-[#8A8A7A]">YOUR DERIVATIONS</span>
              {hasStartedProblem && !isFullySolved && (
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#F7F5EF] border border-[#E8E2D6] text-[#8A8A7A]">
                  Next: Step {activeStepIndex + 1}
                </span>
              )}
            </div>

            {hasStartedProblem && completedSteps.length > 0 && (
              <div className="space-y-2">
                {completedSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E8E2D6] text-xs font-mono shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-[#151F1C]">Step {idx + 1}:</span>
                      <span className="text-[#151F1C] font-semibold">
                        <MathDisplay math={step.result || step.instruction} />
                      </span>
                      <span className="text-[#2D6A4F] font-bold">✓</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditPastStep(step, idx)}
                      className="px-3.5 py-1 rounded-lg border border-[#E8E2D6] bg-white text-xs font-sans text-[#151F1C] hover:bg-[#F7F5EF] transition-colors shadow-sm font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}

            {hasStartedProblem ? (
              !isFullySolved ? (
                <div className="space-y-3 pt-1">
                  {quickOptions.length > 0 && metrics.assistance_sal >= 0.7 && metrics.active_attempts > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono text-[#2D6A4F] tracking-wider font-semibold">Quick Scaffold Options:</span>
                      <div className="flex flex-wrap gap-2">
                        {quickOptions.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              trackTelemetryEvent(conceptId, activeStepIndex, 'quick_option_click', { option: opt })
                              handleStepSubmit(opt)
                            }}
                            className="bg-[#E6F4EA] hover:bg-[#D1EBD9] border border-[#A7D4B5] text-[#2D6A4F] text-xs px-3.5 py-1.5 rounded-full font-mono transition-all shadow-sm active:scale-95 font-semibold"
                          >
                            <MathDisplay math={opt} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <LatexMathEditor
                    value={userAnswer}
                    onChange={setUserAnswer}
                    onSubmit={() => handleStepSubmit()}
                    placeholder="Type...  e.g.  QR = 12"
                    isSubmitting={isSubmitting}
                    stepLabel={`Step ${editingStepIndex !== null ? editingStepIndex + 1 : activeStepIndex + 1}:`}
                    isEditMode={editingStepIndex !== null}
                    isLastStep={isLastStep}
                    onCancelEdit={() => {
                      setEditingStepIndex(null)
                      setUserAnswer('')
                    }}
                    showLightbulb
                    isHintOpen={isHintOpen}
                    onToggleHint={() => setIsHintOpen(!isHintOpen)}
                    conceptId={conceptId}
                    activeStepIndex={activeStepIndex}
                  />

                  <p className="text-[11px] text-[#8A8A7A] font-sans pl-1">
                    • Entry appears in Equation Board above. After {isLastStep ? 'submit' : 'next'}, new Step {activeStepIndex + 2} field appears.
                  </p>

                  {feedback && (
                    <p
                      className={`text-xs font-mono text-center animate-fade-in font-medium p-2.5 rounded-xl border ${
                        feedback.startsWith('✓')
                          ? 'bg-[#E6F4EA] text-[#2D6A4F] border-[#A7D4B5]'
                          : feedback.startsWith('?')
                          ? 'bg-[#EAF2FB] text-[#1D4E89] border-[#A9C6E8]'
                          : 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
                      }`}
                    >
                      {feedback}
                    </p>
                  )}

                  {systemError && (
                    <p className="text-xs font-mono text-center animate-fade-in font-medium p-2.5 rounded-xl border bg-[#F3F3EE] text-[#5B5B4F] border-[#D8D3C4]">
                      {systemError}
                    </p>
                  )}

                  {isHintOpen && socraticScaffold && (
                    <div className="bg-[#F6EFE6] border border-[#C19A6B] rounded-2xl p-4 animate-fade-in space-y-2.5 shadow-sm mt-2 text-[#151F1C]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#151F1C] flex items-center gap-1.5 font-mono">
                          <Lightbulb className="w-3.5 h-3.5 fill-[#151F1C]/20 text-[#151F1C]" />
                          Socratic Guided Clue
                        </span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#EEDBC5] text-[#151F1C] border border-[#C19A6B] font-bold">
                          SAL: {Math.round(metrics.assistance_sal * 100)}%
                        </span>
                      </div>

                      <p className="text-xs text-[#151F1C] leading-relaxed font-sans font-medium">
                        <FormattedMathText text={socraticScaffold} className="text-[#151F1C]" />
                      </p>

                      {currentPrompt && (
                        <div className="pt-2 border-t border-[#C19A6B]/40 flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#151F1C] text-[#FAF9F5] text-[10px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            {activeStepIndex + 1}
                          </span>
                          <p className="text-xs font-semibold text-[#151F1C] font-sans">
                            <FormattedMathText text={currentPrompt} className="text-[#151F1C]" />
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 bg-[#E6F4EA] border border-[#A7D4B5] rounded-2xl text-center space-y-2.5">
                  <Check className="w-8 h-8 text-[#2D6A4F] mx-auto stroke-[3]" />
                  <h4 className="text-sm font-bold text-[#151F1C]">Concept Mastered Successfully!</h4>
                  <p className="text-xs text-[#2D6A4F]">You have solved all derivation steps with high autonomy.</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleNextProblem}
                      className="px-4 py-2 rounded-full bg-[#151F1C] hover:bg-[#2A3A32] text-[#FAF9F5] text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Next Problem</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 rounded-full bg-white hover:bg-[#F7F5EF] border border-[#E8E2D6] text-[#151F1C] text-xs font-mono font-semibold transition-all"
                    >
                      Practice Again
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-[#8A8A7A] font-mono">No active derivation in progress.</p>
                <button
                  type="button"
                  onClick={handleNextProblem}
                  className="px-4 py-2 rounded-full bg-[#151F1C] hover:bg-[#2A3A32] text-[#FAF9F5] text-xs font-mono font-bold transition-all inline-flex items-center gap-2 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Step 1 with Next Problem</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#FAF9F5] border border-[#E8E2D6] rounded-2xl p-4 shadow-[0_1px_2px_rgba(21,31,28,0.04)]">
            <button
              type="button"
              onClick={() => setShowFormulaDrawer(!showFormulaDrawer)}
              className="flex items-center justify-between w-full text-xs text-[#8A8A7A] hover:text-[#151F1C] transition-colors py-1"
            >
              <span className="font-semibold text-[11px] tracking-[0.12em] uppercase font-mono flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5" />
                CBSE TRIGONOMETRY FORMULAS REFERENCE
              </span>
              {showFormulaDrawer ? <ChevronUp className="w-4 h-4 text-[#8A8A7A]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A7A]" />}
            </button>

            {showFormulaDrawer && (
              <div className="mt-3 p-3.5 bg-white rounded-xl border border-[#E8E2D6] text-xs font-mono text-[#151F1C] shadow-sm">
                <MathDisplay math={formulaReference || 'AC^2 = AB^2 + BC^2 | \\sin(A) = \\frac{BC}{AC} | \\cos(A) = \\frac{AB}{AC}'} />
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex items-center self-center px-0.5 shrink-0 select-none my-auto">
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            title={isRightPanelOpen ? 'Click to collapse telemetry panel' : 'Click to expand telemetry panel'}
            className="group py-2 px-1 focus:outline-none cursor-ew-resize flex items-center justify-center transition-transform active:scale-95"
          >
            <div className={`w-1 rounded-full transition-all duration-300 flex items-center justify-center ${
              isRightPanelOpen ? 'h-20 bg-[#E8E2D6] group-hover:bg-[#151F1C]' : 'h-24 bg-[#151F1C] shadow-sm'
            }`}>
              <span className="text-[10px] text-[#8A8A7A] group-hover:text-white font-mono select-none">||</span>
            </div>
          </button>
        </div>

        <div className={`transition-all duration-300 ease-in-out shrink-0 ${
          isRightPanelOpen ? 'w-full lg:w-[360px] opacity-100 translate-x-0 space-y-4' : 'w-0 opacity-0 translate-x-12 overflow-hidden pointer-events-none space-y-0 h-0 lg:h-auto'
        }`}>
          <div className="bg-[#FAF9F5] border border-[#E8E2D6] rounded-2xl p-4 shadow-[0_1px_2px_rgba(21,31,28,0.04)] space-y-3">
            <h3 className="text-[11px] font-semibold tracking-[0.12em] text-[#8A8A7A] uppercase font-mono flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-[#151F1C]" />
              Cognitive Diagnostics & Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-xl border border-[#E8E2D6] shadow-sm">
                <span className="text-[10px] text-[#8A8A7A] uppercase font-mono font-medium block mb-1">Concept Mastery</span>
                <span className="text-xl font-bold text-[#151F1C] font-mono">{(metrics.concept_mastery * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E8E2D6] shadow-sm">
                <span className="text-[10px] text-[#8A8A7A] uppercase font-mono font-medium block mb-1">Assistance SAL</span>
                <span className="text-xl font-bold text-[#2D6A4F] font-mono">{(metrics.assistance_sal * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E8E2D6] shadow-sm">
                <span className="text-[10px] text-[#8A8A7A] uppercase font-mono font-medium block mb-1">Active Attempts</span>
                <span className={`text-xl font-bold font-mono ${metrics.active_attempts > 1 ? 'text-[#92400E]' : 'text-[#151F1C]'}`}>
                  {metrics.active_attempts}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E8E2D6] shadow-sm">
                <span className="text-[10px] text-[#8A8A7A] uppercase font-mono font-medium block mb-1">Accuracy Rate</span>
                <span className="text-xl font-bold text-[#151F1C] font-mono">{(metrics.accuracy_rate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <ProgressChart data={timeline} />
          <CognitiveProfileCard profile={profile} />
        </div>
      </div>

      {/* Custom Problem Reasoning Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#FAF9F5] border border-[#E8E2D6] rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
                  <Sparkles className="w-5 h-5 text-[#2D6A4F]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#151F1C]">Custom CBSE Trigonometry Problem</h3>
                  <p className="text-xs text-[#8A8A7A]">
                    Template-free Neuro-Symbolic reasoning for NCERT, Oswaal, RD Sharma, and Board Exams
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-2 rounded-full text-[#8A8A7A] hover:text-[#151F1C] hover:bg-[#E8E2D6]/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider font-mono text-[#8A8A7A] block">
                Paste Question Text
              </label>
              <textarea
                value={customProblemInput}
                onChange={(e) => setCustomProblemInput(e.target.value)}
                placeholder="e.g. In triangle ABC, right-angled at B, AB = 24 cm, BC = 7 cm. Determine: (i) sin A, cos A&#10;or: a tower AB is 20 m high and BC, its shadow on the ground, is 20 sqaureroot 3 m long. Find the Sun’s altitude."
                rows={4}
                className="w-full p-3.5 rounded-xl border border-[#E8E2D6] bg-white text-sm font-sans text-[#151F1C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] shadow-sm resize-none"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-[#8A8A7A] block">
                Quick Sample Archetypes:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROBLEMS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCustomProblemInput(preset.text)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#E8E2D6] bg-white hover:bg-[#F7F5EF] text-[#151F1C] transition-colors shadow-sm font-medium text-left"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D6]">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A8A7A] hover:text-[#151F1C] hover:bg-[#E8E2D6]/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={customLoading || !customProblemInput.trim()}
                onClick={() => handleStartCustomProblem()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono bg-[#2D6A4F] hover:bg-[#1E4835] text-white disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                {customLoading ? (
                  <span>Analyzing & Chunking Math...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Solve With Reasoning Engine</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
