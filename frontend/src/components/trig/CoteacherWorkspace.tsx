import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RotateCcw,
  Lightbulb,
  Sparkles,
  X,
  RotateCw,
} from 'lucide-react'
import MathDisplay from './MathDisplay'
import FormattedMathText from './FormattedMathText'
import TrigonometryDagModal from './TrigonometryDagModal'
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
import { useApp } from '../../store'

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
  const navigate = useNavigate()
  const { session } = useApp()

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
  const [showDagModal, setShowDagModal] = useState(false)

  // Generic Neuro-Symbolic Reasoning Engine states
  const [isGenericSession, setIsGenericSession] = useState(false)
  const [genericSessionId, setGenericSessionId] = useState<string | null>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customProblemInput, setCustomProblemInput] = useState('')
  const [customLoading, setCustomLoading] = useState(false)

  const PRESET_PROBLEMS = [
    {
      title: 'Oswaal Shadow Altitude',
      text: 'a tower AB is 20 m high and BC, its shadow on the ground, is 20 sqaureroot 3 m long. Find the Sun’s altitude.',
    },
    {
      title: 'NCERT 8.2 Q3 Angle System',
      text: 'If sin(A - B) = 1/2, cos(A + B) = 1/2, 0 < A + B <= 90, A > B, find A and B.',
    },
    {
      title: 'NCERT 8.1 Q1 Triangle Ratios',
      text: 'In triangle ABC, right-angled at B, AB = 24 cm, BC = 7 cm. Determine: (i) sin A, cos A (ii) sin C, cos C',
    },
    {
      title: 'NCERT 8.2 Q1 Compound Evaluation',
      text: 'Evaluate: 2 tan^2 45 + cos^2 30 - sin^2 60',
    },
    {
      title: 'Tower Elevation Height',
      text: 'A tower stands vertically on the ground. From a point on the ground, which is 15 m away from the foot of the tower, the angle of elevation of the top of the tower is found to be 60. Find the height of the tower.',
    },
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
        const sessionRes = await createCoTeacherSession({
          subject: 'mathematics',
          topic: 'trigonometry',
          problem: problemContext,
          context: requiredItems.length > 0 ? { requiredItems } : undefined,
        })
        sessionId = sessionRes.sessionId
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

  const completedSteps = stepsHistory.filter((s) => s.completed)

  const defaultFormulas = [
    '\\sin(\\theta) = \\frac{\\text{Opposite}}{\\text{Hypotenuse}}',
    '\\cos(\\theta) = \\frac{\\text{Adjacent}}{\\text{Hypotenuse}}',
    '\\tan(\\theta) = \\frac{\\text{Opposite}}{\\text{Adjacent}}',
    '\\csc(\\theta) = \\frac{1}{\\sin(\\theta)}',
    '\\sec(\\theta) = \\frac{1}{\\cos(\\theta)}',
    '\\cot(\\theta) = \\frac{1}{\\tan(\\theta)}',
    '\\sin^2(\\theta) + \\cos^2(\\theta) = 1',
    '1 + \\tan^2(\\theta) = \\sec^2(\\theta)',
    '1 + \\cot^2(\\theta) = \\csc^2(\\theta)',
  ]

  const formulaList = formulaReference
    ? formulaReference.split('|').map((s) => s.trim()).filter(Boolean)
    : defaultFormulas

  const initials = session?.tenant?.name
    ? session.tenant.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'AK'

  return (
    <div className="relative min-h-full w-full bg-[#FBF9F3] text-[#1A221E] selection:bg-[#DDB56E]/30 flex flex-col font-sans">
      {/* Background Dotted Grid Texture */}
      <div className="pointer-events-none absolute inset-0 dotted-grid opacity-[0.32]" />

      {/* Top Bar — Exact Mockup Specifications */}
      <header className="relative z-10 h-[72px] px-6 lg:px-6 flex items-center justify-between border-b border-[#EDE8DD] bg-[#FBF9F3]/80 backdrop-blur-[8px] sticky top-0 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="h-8 px-3.5 rounded-full bg-white border border-[#EDE8DD] text-[12.5px] font-medium text-[#1A221E] card-shadow flex items-center gap-1.5 btn-secondary cursor-pointer"
          >
            <span className="text-[13px]">←</span> Go back
          </button>
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#1A221E] flex items-center justify-center">
              <span className="text-[#DDB56E] text-[14px]">◫</span>
            </div>
            <h1 className="font-display text-[24px] font-[550] tracking-[-0.02em] leading-none">
              Practice Questions
            </h1>
            <span className="ml-2 font-mono text-[10px] px-2 py-1 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[#8A7D67]">
              CBSE Class 10
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-[#8A8F8B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] animate-pulse" />
            <span>Sync • {conceptTitle.split(' ')[0] || 'Trigonometry'}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1A221E] text-white flex items-center justify-center text-[11px] font-medium">
            {initials}
          </div>
        </div>
      </header>

      {/* Workspace Area: Main Content Column + Collapsible Telemetry Sidebar */}
      <div className="flex flex-1 min-w-0 relative overflow-hidden">
        <main className="flex-1 min-w-0 max-w-full flex flex-col relative overflow-hidden">
          <div
            className={`relative z-10 flex-1 px-5 lg:px-6 py-7 flex flex-col gap-4 w-full mx-auto min-w-0 transition-all duration-300 ${
              isRightPanelOpen ? 'max-w-[760px]' : 'max-w-[960px]'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Concept Selection Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B]">CONCEPT</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowConceptDropdown(!showConceptDropdown)}
                    className="h-9 pl-3 pr-8 rounded-full bg-white border border-[#EDE8DD] card-shadow text-[13px] font-medium flex items-center gap-2 min-w-[220px] max-w-[280px] btn-secondary cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] flex items-center justify-center text-[10px]">
                      ◍
                    </span>
                    <span className="truncate">{conceptTitle || 'Select a concept'}</span>
                    <span className="ml-auto text-[11px] text-[#9AA09B]">
                      {showConceptDropdown ? '⌃' : '⌄'}
                    </span>
                  </button>

                  {showConceptDropdown && (
                    <div className="absolute top-[44px] left-0 w-[300px] max-w-[calc(100vw-32px)] rounded-[14px] bg-white border border-[#EDE8DD] card-shadow overflow-hidden z-20 p-1.5 space-y-0.5">
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
                              setConceptTitle(c.title)
                              setHasStartedProblem(false)
                              setShowConceptDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-[10px] text-[13px] flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-[#1A221E] text-white'
                                : isLocked
                                ? 'opacity-40 cursor-not-allowed text-[#8A8F8B]'
                                : 'hover:bg-[#FBF9F3] text-[#1A221E]'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono text-[10px] block opacity-70">{c.id}</span>
                              <span className="font-medium truncate block">{c.title}</span>
                            </div>
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#DDB56E] shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* View DAG Map button with the exact 3-node network SVG icon */}
                <button
                  type="button"
                  onClick={() => setShowDagModal(true)}
                  className="h-7 px-3 rounded-full bg-[#FFFFFF] border border-[#E2DDD1] text-[#6B7280] text-[12px] font-[500] flex items-center gap-1.5 hover:bg-[#FBF9F3] transition-colors card-shadow cursor-pointer"
                  style={{ height: '28px', borderRadius: '999px' }}
                >
                  <span className="text-[#A0A090] flex items-center">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="4" cy="4" r="1.6" stroke="#A0A090" strokeWidth="1.1" fill="none" />
                      <circle cx="12" cy="4" r="1.6" stroke="#A0A090" strokeWidth="1.1" fill="none" />
                      <circle cx="8" cy="12" r="1.6" stroke="#A0A090" strokeWidth="1.1" fill="none" />
                      <path d="M5.2 5.1L6.8 10.1M10.8 5.1L9.2 10.1M5.6 4H10.4" stroke="#A0A090" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
                    </svg>
                  </span>
                  <span>View DAG Map</span>
                </button>
              </div>

              <div className="ml-auto hidden md:flex items-center gap-2 font-mono text-[10px] text-[#A0A7A2]">
                <span>Bank • {availableConcepts.length || 10} concepts</span>
                <span className="w-px h-3 bg-[#EDE8DD]" />
                <span>∞ variants</span>
              </div>
            </div>

            {/* CARD 1: QUESTION CARD */}
            <div className="relative rounded-[16px] bg-white border border-[#EDE8DD] card-shadow overflow-hidden min-w-0">
              {/* Subtle SVG right-triangle watermark in top-right */}
              <svg
                className="pointer-events-none absolute right-[-10px] top-[-20px] w-[320px] h-[200px] opacity-[0.06] max-w-[60%]"
                viewBox="0 0 300 200"
              >
                <path d="M 40 160 L 240 160 L 40 30 Z" fill="none" stroke="#1A221E" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M 40 30 L 40 160" strokeDasharray="4 6" stroke="#1A221E" strokeWidth="0.8" />
                <circle cx="40" cy="30" r="3" fill="#1A221E" />
                <text x="18" y="100" fontFamily="Newsreader" fontSize="14" fill="#1A221E">A</text>
                <text x="35" y="18" fontFamily="Newsreader" fontSize="14" fill="#1A221E">B</text>
                <text x="250" y="172" fontFamily="Newsreader" fontSize="14" fill="#1A221E">C</text>
              </svg>

              <div className="relative p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] font-mono text-[10px] tracking-[0.02em] text-[#8A7D67] max-w-full truncate">
                    <span className="w-1 h-1 rounded-full bg-[#DDB56E]" />
                    <span className="truncate">{conceptTitle || 'Trigonometry'} • Bank</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {[0, 1, 2, 3, 4].map((z) => (
                      <div
                        key={z}
                        className={`h-1.5 rounded-full transition-all ${
                          (hasStartedProblem && z <= activeStepIndex) || z === 0
                            ? 'w-6 bg-[#1A221E]'
                            : 'w-1.5 bg-[#EDE8DD]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {!hasStartedProblem ? (
                  <>
                    <h2 className="font-display text-[26px] md:text-[30px] font-[550] tracking-[-0.02em] leading-[1.1] mb-3 max-w-[520px]">
                      Ready to practice this concept?
                    </h2>
                    <p className="text-[13.5px] leading-[1.6] text-[#5A645E] max-w-[560px]">
                      You're viewing <span className="font-medium text-[#1A221E] bg-[#F6F1E6] px-1.5 py-0.5 rounded-[6px] border border-[#EDE8DD]">{conceptTitle || 'Trigonometry'}</span>. Click <span className="font-medium text-[#1A221E]">Next Problem</span> to load a randomized instance with a clean slate.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-[20px] md:text-[24px] font-[550] tracking-[-0.02em] leading-[1.25] mb-4 max-w-[620px]">
                      <FormattedMathText text={problemContext} />
                    </h2>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[#8A8F8B]">
                      <span className="px-2 py-1 rounded-full bg-[#E6F0E8] text-[#2E5A3A] border border-[#CFE0D3]">
                        {isGenericSession ? 'Engine • Dynamic' : 'Randomized • Seed ' + (Math.floor(Math.random() * 9000) + 1000)}
                      </span>
                      <span>•</span>
                      <span>Focus: derivation</span>
                    </div>
                  </>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    className="h-10 px-4 rounded-full bg-[#E6F0E8] border border-[#CFE0D3] text-[#2E5A3A] text-[13px] font-[600] btn-secondary flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-[12px]">✦</span> Custom Problem
                  </button>

                  <button
                    type="button"
                    onClick={handleNextProblem}
                    disabled={loading}
                    className="h-10 px-5 rounded-full bg-[#1A221E] text-white text-[13px] font-[600] btn-primary flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-[2px] border-white/30 border-t-white rounded-full animate-spin" />
                        Loading…
                      </>
                    ) : hasStartedProblem ? (
                      <>
                        <span>↻</span> New Variant
                      </>
                    ) : (
                      <>
                        Next Problem <span className="opacity-70">→</span>
                      </>
                    )}
                  </button>

                  {hasStartedProblem && (
                    <button
                      type="button"
                      onClick={handleReset}
                      title="Reset Practice Steps"
                      className="h-10 w-10 rounded-full border border-[#EDE8DD] bg-white text-[#8A8F8B] hover:text-[#1A221E] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  <span className="font-mono text-[10px] text-[#9AA09B] ml-2 hidden md:inline">
                    {hasStartedProblem ? 'Press to re-randomize' : 'Space ↵ to start'}
                  </span>
                </div>
              </div>

              {/* Bottom Gold Gradient Line */}
              <div className="h-px w-full bg-gradient-to-r from-[#EDE8DD] via-[#DDB56E]/40 to-[#EDE8DD]" />
            </div>

            {/* CARD 2: EDOVA EQUATION BOARD */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow overflow-hidden min-w-0">
              <div className="h-[44px] px-5 flex items-center justify-between border-b border-[#EDE8DD] bg-[#FCFBF8]">
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F8B]">
                  EDOVA EQUATION BOARD
                </span>
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 font-mono text-[10px]">
                    <span className="px-2 py-1 rounded-full bg-white border border-[#EDE8DD] text-[#6A7570] flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-[#4A7C59] mr-1.5 animate-pulse" />
                      {completedSteps.length} verified • 0 total • ∞ steps
                    </span>
                    <span className="px-2 py-1 rounded-full bg-[#1A221E] text-white flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#DDB56E] animate-pulse" />
                      {hasStartedProblem ? (isFullySolved ? 'Solved' : 'Active') : 'Ready'} • {completedSteps.length} steps
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[160px] dotted-grid-strong bg-[#FFFEFD]">
                {!hasStartedProblem || completedSteps.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-8">
                    <div className="w-10 h-10 rounded-[12px] bg-[#F6F1E6] border border-[#EDE8DD] flex items-center justify-center mb-3">
                      <span className="font-mono text-[16px] text-[#B8A88E]">∅</span>
                    </div>
                    <p className="font-mono text-[11px] tracking-[0.02em] text-[#9AA09B] max-w-[320px] leading-[1.6]">
                      No derivations yet. Enter Step 1 below in <span className="text-[#1A221E] font-medium">Your Derivations</span> to begin.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 md:p-6 space-y-3">
                    <div className="max-w-[680px] space-y-3">
                      {completedSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#1A221E] text-white flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-mono text-[12.5px] leading-[1.7] text-[#1A221E] bg-[#F6F1E6] border border-[#EDE8DD] rounded-[10px] px-3.5 py-2.5">
                              <MathDisplay math={step.result || step.instruction} />
                            </div>
                            <div className="mt-1 font-mono text-[11px] text-[#4A7C59] px-1 flex items-center gap-1">
                              <span>✓</span> Verified by symbolic checker
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 border border-[#1A221E]/[0.02] rounded-b-[16px]" />
              </div>
            </div>

            {/* CARD 3: YOUR DERIVATIONS */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow overflow-hidden min-w-0">
              <div className="h-[44px] px-5 flex items-center justify-between border-b border-[#EDE8DD]">
                <span className="font-display text-[14px] font-[550] tracking-[-0.01em]">
                  Your Derivations
                </span>
                <span className="font-mono text-[10px] text-[#9AA09B]">
                  {hasStartedProblem ? '⌘+Enter to verify' : 'Idle'}
                </span>
              </div>

              {!hasStartedProblem ? (
                <div className="p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-[14px] bg-[#FBF9F3] border border-[#EDE8DD] flex items-center justify-center mb-4">
                    <span className="text-[18px] opacity-60">⟁</span>
                  </div>
                  <p className="font-mono text-[11px] text-[#8A8F8B] mb-5">
                    No active derivation in progress.
                  </p>
                  <button
                    type="button"
                    onClick={handleNextProblem}
                    className="h-9 px-4 rounded-full bg-[#1A221E] text-white text-[12.5px] font-[600] btn-primary flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-[10px]">▶</span> Start Step 1 with Next Problem
                  </button>
                </div>
              ) : isFullySolved ? (
                <div className="p-6 text-center space-y-3 bg-[#E6F0E8]/40">
                  <div className="w-10 h-10 rounded-full bg-[#E6F0E8] border border-[#CFE0D3] text-[#2E5A3A] flex items-center justify-center mx-auto text-base font-bold">
                    ✓
                  </div>
                  <h3 className="font-display text-[18px] font-semibold text-[#1A221E]">
                    Concept Mastered Successfully!
                  </h3>
                  <p className="text-[13px] text-[#5A645E]">
                    You have solved all derivation steps with high autonomy.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleNextProblem}
                      className="h-9 px-5 rounded-full bg-[#1A221E] text-white text-[12.5px] font-[600] btn-primary flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Next Problem</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="h-9 px-4 rounded-full bg-white border border-[#EDE8DD] text-[#1A221E] text-[12.5px] font-medium card-shadow hover:bg-[#FBF9F3] transition-colors cursor-pointer"
                    >
                      Practice Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {/* Past steps edit list */}
                  {completedSteps.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {completedSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FCFBF8] border border-[#EDE8DD] text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-[#1A221E]">Step {idx + 1}:</span>
                            <span className="text-[#1A221E]">
                              <MathDisplay math={step.result || step.instruction} />
                            </span>
                            <span className="text-[#2E5A3A] font-bold">✓</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditPastStep(step, idx)}
                            className="px-3 py-1 rounded-lg border border-[#EDE8DD] bg-white text-xs font-sans text-[#1A221E] hover:bg-[#F7F5EF] transition-colors shadow-xs font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Scaffold Options */}
                  {quickOptions.length > 0 && metrics.assistance_sal >= 0.7 && metrics.active_attempts > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono text-[#2E5A3A] tracking-wider font-semibold">
                        Quick Scaffold Options:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {quickOptions.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              trackTelemetryEvent(conceptId, activeStepIndex, 'quick_option_click', { option: opt })
                              handleStepSubmit(opt)
                            }}
                            className="bg-[#E6F0E8] hover:bg-[#D6E6D9] border border-[#CFE0D3] text-[#2E5A3A] text-xs px-3.5 py-1.5 rounded-full font-mono transition-all shadow-xs active:scale-95 font-semibold cursor-pointer"
                          >
                            <MathDisplay math={opt} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input container */}
                  <div className="rounded-[12px] border border-[#EDE8DD] bg-[#FCFBF8] overflow-hidden focus-within:border-[#DDB56E] focus-within:ring-[3px] focus-within:ring-[#DDB56E]/20 transition-all">
                    <div className="px-4 py-2.5 border-b border-[#EDE8DD] flex items-center justify-between bg-white">
                      <span className="font-mono text-[10px] tracking-[0.08em] text-[#8A8F8B]">
                        STEP {editingStepIndex !== null ? editingStepIndex + 1 : activeStepIndex + 1} • LaTeX supported
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#9AA09B]">{userAnswer.length} chars</span>
                      </div>
                    </div>

                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault()
                          if (userAnswer.trim() && !isSubmitting) handleStepSubmit()
                        }
                      }}
                      placeholder="Type your derivation here... e.g., AC² = 3²+4² = 9+16 = 25 → AC=5"
                      rows={3}
                      className="w-full min-h-[96px] p-4 bg-transparent outline-none resize-none font-mono text-[13px] leading-[1.7] placeholder:text-[#B8BFB9] text-[#1A221E]"
                    />

                    {/* Live KaTeX preview inside input box if non-empty */}
                    {userAnswer.trim() && (
                      <div className="px-4 py-2 bg-[#F6F1E6]/50 border-t border-[#EDE8DD] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono text-[#1A221E] overflow-x-auto">
                          <span className="text-[10px] text-[#8A8F8B] uppercase shrink-0">Preview:</span>
                          <MathDisplay math={userAnswer} />
                        </div>
                        <span className="text-[10px] font-mono text-[#8A8F8B] shrink-0 ml-2 hidden sm:inline">
                          ⌘+Enter to verify
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStepSubmit()}
                        disabled={!userAnswer.trim() || isSubmitting}
                        className="h-8 px-4 rounded-full bg-[#1A221E] text-white text-[12px] font-[600] btn-primary disabled:opacity-40 disabled:transform-none flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          'Verify Step'
                        )}
                      </button>
                      <span className="font-mono text-[10px] text-[#9AA09B]">
                        AI checks algebra • no penalty
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {socraticScaffold && (
                        <button
                          type="button"
                          onClick={() => setIsHintOpen(!isHintOpen)}
                          className={`h-8 px-3 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isHintOpen
                              ? 'bg-[#DDB56E]/20 text-[#8A7D67] border-[#DDB56E]'
                              : 'bg-white border-[#EDE8DD] text-[#8A8F8B] hover:bg-[#FBF9F3]'
                          }`}
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-[#DDB56E]" />
                          <span>{isHintOpen ? 'Hide Clue' : 'Guided Clue'}</span>
                        </button>
                      )}

                      {editingStepIndex !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStepIndex(null)
                            setUserAnswer('')
                          }}
                          className="text-xs font-mono text-[#8A8F8B] hover:text-[#1A221E] px-2 cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {feedback && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                        feedback.startsWith('✓')
                          ? 'bg-[#E6F0E8] border-[#CFE0D3] text-[#2E5A3A]'
                          : feedback.startsWith('?')
                          ? 'bg-[#EAF2FB] border-[#A9C6E8] text-[#1D4E89]'
                          : 'bg-[#FEF3C7] border-[#FCD34D] text-[#92400E]'
                      }`}
                    >
                      {feedback}
                    </div>
                  )}

                  {systemError && (
                    <div className="p-3 rounded-xl border bg-[#FBF9F3] border-[#EDE8DD] text-xs font-mono text-[#8A8F8B]">
                      {systemError}
                    </div>
                  )}

                  {/* Socratic Guided Clue */}
                  {isHintOpen && socraticScaffold && (
                    <div className="p-4 rounded-xl bg-[#F6F1E6] border border-[#DDB56E]/50 space-y-2 text-[#1A221E]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8A7D67] flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-[#DDB56E]" />
                          Socratic Guided Clue
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#EDE8DD] text-[#8A7D67]">
                          SAL: {Math.round(metrics.assistance_sal * 100)}%
                        </span>
                      </div>
                      <div className="text-[13px] leading-relaxed font-sans text-[#1A221E]">
                        <FormattedMathText text={socraticScaffold} />
                      </div>
                      {currentPrompt && (
                        <div className="pt-2 border-t border-[#EDE8DD] text-xs font-semibold text-[#1A221E] flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#1A221E] text-white text-[10px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                            {activeStepIndex + 1}
                          </span>
                          <FormattedMathText text={currentPrompt} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CARD 4: CBSE TRIGONOMETRY FORMULAS REFERENCE ACCORDION */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] card-shadow overflow-hidden min-w-0">
              <button
                type="button"
                onClick={() => setShowFormulaDrawer(!showFormulaDrawer)}
                className="w-full h-[52px] px-5 flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[8px] bg-[#F6F1E6] border border-[#EDE8DD] flex items-center justify-center font-mono text-[11px]">
                    ≋
                  </div>
                  <span className="font-display text-[14.5px] font-[550]">
                    CBSE Trigonometry Formulas Reference
                  </span>
                  <span className="hidden md:inline font-mono text-[10px] px-2 py-1 rounded-full bg-[#FBF9F3] border border-[#EDE8DD] text-[#9AA09B]">
                    {formulaList.length} formulas
                  </span>
                </div>
                <span
                  className={`w-6 h-6 rounded-full border border-[#EDE8DD] flex items-center justify-center text-[12px] transition-transform ${
                    showFormulaDrawer
                      ? 'rotate-180 bg-[#1A221E] text-white border-[#1A221E]'
                      : 'bg-white'
                  }`}
                >
                  ⌄
                </span>
              </button>

              {showFormulaDrawer && (
                <div className="px-5 pb-5 border-t border-[#EDE8DD] bg-[#FCFBF8]">
                  <div className="pt-4 grid md:grid-cols-3 gap-3">
                    {formulaList.map((formula, idx) => (
                      <div
                        key={idx}
                        className="px-3.5 py-3 rounded-[10px] bg-white border border-[#EDE8DD] font-mono text-[11.5px] leading-[1.5] text-[#2E3A32]"
                      >
                        <MathDisplay math={formula} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6" />
          </div>
        </main>

        {/* Collapsible Slider Tab Button on Vertical Border */}
        <div
          className="hidden lg:flex absolute top-0 bottom-0 z-20 items-center justify-center"
          style={{
            width: '24px',
            right: isRightPanelOpen ? '320px' : '0px',
            transition: 'right 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            title={isRightPanelOpen ? 'Collapse telemetry' : 'Expand telemetry'}
            className="w-4 h-10 rounded-full bg-[#FFFFFF] border border-[#EDE8DD] shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#6B7280] hover:bg-[#FBF9F3] hover:text-[#1A221E] transition-colors cursor-pointer"
            style={{ width: '16px', height: '40px' }}
          >
            <span className="font-mono text-[11px] leading-none select-none">
              {isRightPanelOpen ? '>' : '<'}
            </span>
          </button>
        </div>

        {/* Telemetry Sidebar */}
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
            {/* 2x2 Diagnostics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Concept Mastery',
                  value: `${Math.round(metrics.concept_mastery * 100)}%`,
                  sub: 'Baseline',
                  color: '#1A221E',
                  progress: Math.round(metrics.concept_mastery * 100),
                },
                {
                  label: 'Assistance SAL',
                  value: `${Math.round(metrics.assistance_sal * 100)}%`,
                  sub: metrics.assistance_sal >= 0.7 ? 'Adaptive' : 'Low assist',
                  color: '#4A7C59',
                  progress: Math.round(metrics.assistance_sal * 100),
                },
                {
                  label: 'Active Attempts',
                  value: `${metrics.active_attempts}`,
                  sub: 'This session',
                  color: metrics.active_attempts > 1 ? '#DDB56E' : '#1A221E',
                  progress: Math.min(100, metrics.active_attempts * 25),
                },
                {
                  label: 'Accuracy Rate',
                  value: `${Math.round(metrics.accuracy_rate * 100)}%`,
                  sub: 'Verified',
                  color: '#1A221E',
                  progress: Math.round(metrics.accuracy_rate * 100),
                },
              ].map((z) => (
                <div key={z.label} className="relative rounded-[14px] bg-[#FCFBF8] border border-[#EDE8DD] p-3.5 overflow-hidden">
                  <div className="font-mono text-[9.5px] tracking-[0.08em] text-[#9AA09B] leading-tight mb-1.5">
                    {z.label.toUpperCase()}
                  </div>
                  <div className="font-display text-[22px] font-[600] leading-none tracking-[-0.02em] mb-1">
                    {z.value}
                  </div>
                  <div className="font-mono text-[10px] text-[#8A8F8B]">{z.sub}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EDE8DD]">
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{ width: `${z.progress}%`, background: z.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* LEARNING TRAJECTORY DYNAMICS */}
            <div className="rounded-[14px] bg-[#FCFBF8] border border-[#EDE8DD] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] tracking-[0.08em] text-[#8A8F8B]">
                  LEARNING TRAJECTORY DYNAMICS
                </span>
                <span className="font-mono text-[9px] px-1.5 py-1 rounded-full bg-white border border-[#EDE8DD] text-[#9AA09B]">
                  SAL • Mastery
                </span>
              </div>

              <div className="relative h-[112px] w-full rounded-[10px] bg-white border border-[#EDE8DD] overflow-hidden dotted-grid">
                <svg viewBox="0 0 280 112" className="absolute inset-0 w-full h-full">
                  <line x1="0" y1="28" x2="280" y2="28" stroke="#EDE8DD" strokeWidth="0.8" strokeDasharray="4 6" />
                  <line x1="0" y1="56" x2="280" y2="56" stroke="#EDE8DD" strokeWidth="0.8" strokeDasharray="4 6" />
                  <line x1="0" y1="84" x2="280" y2="84" stroke="#EDE8DD" strokeWidth="0.8" strokeDasharray="4 6" />
                  <path
                    d={
                      hasStartedProblem
                        ? 'M 14 92 C 60 88, 90 68, 130 62 S 190 48, 262 22'
                        : 'M 14 92 C 50 90, 90 88, 130 88 S 200 86, 262 84'
                    }
                    fill="none"
                    stroke="#1A221E"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d={
                      hasStartedProblem
                        ? 'M 14 92 C 70 70, 120 54, 160 44 S 220 18, 262 12'
                        : 'M 14 96 C 80 84, 150 60, 262 28'
                    }
                    fill="none"
                    stroke="#4A7C59"
                    strokeWidth="1.4"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <g>
                    <circle cx="14" cy={hasStartedProblem ? 92 : 96} r="4" fill="#1A221E" />
                    <circle cx="14" cy={hasStartedProblem ? 92 : 96} r="8" fill="none" stroke="#1A221E" strokeWidth="0.8" opacity="0.18" />
                  </g>
                  {hasStartedProblem && (
                    <>
                      <circle cx="262" cy="22" r="3" fill="#1A221E" />
                      <circle cx="262" cy="12" r="3" fill="#4A7C59" />
                    </>
                  )}
                </svg>

                <div className="absolute left-3 bottom-2 font-mono text-[9px] text-[#8A8F8B] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A221E]" /> Start
                  <span className="ml-2 w-3 h-[1.5px] bg-[#1A221E] inline-block" /> Mastery
                  <span
                    className="ml-2 w-3 h-[1.5px] bg-[#4A7C59] inline-block"
                    style={{ background: 'repeating-linear-gradient(90deg,#4A7C59 0 3px, transparent 3px 6px)' }}
                  />
                  SAL
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-[#9AA09B]">
                <span>Trajectory updates after verification</span>
                <span className="ml-auto w-1 h-1 rounded-full bg-[#4A7C59] animate-pulse" />
              </div>
            </div>

            {/* FLUENCY • SPEED Dark Card */}
            <div
              className="rounded-[14px] bg-[#1A221E] p-4 border border-[#2A332F] relative overflow-hidden"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.18)' }}
            >
              <div className="absolute right-[-20px] top-[-20px] w-28 h-28 rounded-full bg-[#DDB56E]/[0.08] blur-[1px]" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[9px] tracking-[0.14em] text-[#9CA3AF] uppercase opacity-90">
                    FLUENCY • SPEED
                  </span>
                  <span className="font-mono text-[9px] px-2 py-1 rounded-full bg-[#232E27] border border-[#2A332F] text-[#C7D0C9]">
                    10 max
                  </span>
                </div>

                <div className="flex items-end gap-3 mb-4">
                  <div className="font-display text-[28px] font-[700] leading-none text-[#FFFFFF] tracking-[-0.02em]">
                    {hasStartedProblem && completedSteps.length > 0
                      ? `${Math.min(100, completedSteps.length * 20 + 2)}%`
                      : '0%'}
                  </div>
                  <div className="font-mono text-[11px] text-[#EDE8DD] mb-0.5 opacity-90">
                    {completedSteps.length}/10 steps • avg 18s
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-[8px] bg-[#232E27] border border-[#2A332F] p-2.5">
                    <div className="font-mono text-[9px] tracking-[0.08em] text-[#9CA3AF] uppercase">
                      Accuracy Rate
                    </div>
                    <div className="font-medium text-[14px] text-[#FFFFFF] mt-1">
                      {hasStartedProblem && completedSteps.length > 0 ? `${Math.round(metrics.accuracy_rate * 100)}%` : '—'}
                    </div>
                  </div>
                  <div className="rounded-[8px] bg-[#232E27] border border-[#2A332F] p-2.5">
                    <div className="font-mono text-[9px] tracking-[0.08em] text-[#9CA3AF] uppercase">
                      Mastered Steps
                    </div>
                    <div className="font-medium text-[14px] text-[#FFFFFF] mt-1">
                      {completedSteps.length}
                    </div>
                  </div>
                </div>

                {/* 10 Equalizer Bars */}
                <div className="h-[36px] flex items-end gap-[3px]">
                  {Array.from({ length: 10 }).map((_, yn) => {
                    const isFilled = hasStartedProblem && yn < completedSteps.length
                    return (
                      <div
                        key={yn}
                        className="flex-1 rounded-[4px] transition-all duration-500"
                        style={{
                          height: isFilled ? `${34 + yn * 6}%` : '18%',
                          background: isFilled ? '#DDB56E' : '#2A332F',
                          opacity: isFilled ? 1 : 0.9,
                        }}
                      />
                    )
                  })}
                </div>

                <div className="mt-3 font-mono text-[10px] text-[#EDE8DD] opacity-80">
                  No time pressure • Focus on derivation quality
                </div>
              </div>
            </div>

            {/* SESSION CONTEXT Card */}
            <div className="rounded-[14px] border border-[#EDE8DD] bg-white p-4">
              <div className="font-mono text-[10px] tracking-[0.08em] text-[#8A8F8B] mb-3">
                SESSION CONTEXT
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#8A8F8B]">Concept</span>
                  <span className="text-[#1A221E] font-medium max-w-[150px] truncate">
                    {conceptTitle || 'Trigonometry'}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#8A8F8B]">Variant</span>
                  <span className="text-[#1A221E]">
                    {hasStartedProblem ? (isGenericSession ? 'Engine • Dynamic' : '#1847 • Fresh') : '— • Ready'}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#8A8F8B]">Mode</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[10px]">
                    Practice • ∞ steps
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#EDE8DD]">
            <div className="font-mono text-[10px] text-[#9AA09B] leading-[1.5]">
              Edova verifies each step symbolically. No final answer without derivation.
            </div>
          </div>
        </aside>
      </div>

      {/* Custom Problem Reasoning Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#FAF9F5] border border-[#EDE8DD] rounded-[20px] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto card-shadow">
            <div className="flex items-center justify-between border-b border-[#EDE8DD] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#E6F0E8] text-[#2E5A3A]">
                  <Sparkles className="w-5 h-5 text-[#2E5A3A]" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A221E]">Custom CBSE Trigonometry Problem</h3>
                  <p className="text-xs text-[#8A8F8B]">
                    Template-free Neuro-Symbolic reasoning for NCERT, Oswaal, RD Sharma, and Board Exams
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-2 rounded-full text-[#8A8F8B] hover:text-[#1A221E] hover:bg-[#EDE8DD]/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider font-mono text-[#8A8F8B] block">
                Paste Question Text
              </label>
              <textarea
                value={customProblemInput}
                onChange={(e) => setCustomProblemInput(e.target.value)}
                placeholder="e.g. In triangle ABC, right-angled at B, AB = 24 cm, BC = 7 cm. Determine: (i) sin A, cos A&#10;or: a tower AB is 20 m high and BC, its shadow on the ground, is 20 sqaureroot 3 m long. Find the Sun’s altitude."
                rows={4}
                className="w-full p-3.5 rounded-xl border border-[#EDE8DD] bg-white text-sm font-sans text-[#1A221E] focus:outline-none focus:border-[#DDB56E] focus:ring-2 focus:ring-[#DDB56E]/20 shadow-xs resize-none"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-[#8A8F8B] block">
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
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#EDE8DD] bg-white hover:bg-[#FBF9F3] text-[#1A221E] transition-colors shadow-xs font-medium text-left cursor-pointer"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EDE8DD]">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A8F8B] hover:text-[#1A221E] hover:bg-[#EDE8DD]/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={customLoading || !customProblemInput.trim()}
                onClick={() => handleStartCustomProblem()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono bg-[#1A221E] hover:bg-[#232E27] text-white disabled:opacity-50 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {customLoading ? (
                  <span>Analyzing & Chunking Math...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#DDB56E]" />
                    <span>Solve With Reasoning Engine</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Trigonometry DAG Modal */}
      <TrigonometryDagModal
        isOpen={showDagModal}
        onClose={() => setShowDagModal(false)}
        concepts={availableConcepts}
        activeConceptId={conceptId}
        onSelectConcept={(selectedId) => {
          const found = availableConcepts.find(
            (c) => c.id.toLowerCase() === selectedId.toLowerCase(),
          )
          const targetId = found ? found.id : selectedId
          onSelectConcept && onSelectConcept(targetId)
          if (found) setConceptTitle(found.title)
          setHasStartedProblem(false)
        }}
      />
    </div>
  )
}
