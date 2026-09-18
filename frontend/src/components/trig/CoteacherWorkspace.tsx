import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RotateCcw,
  Lightbulb,
  Sparkles,
  X,
  RotateCw,
  Maximize2,
  Minimize2,
  Plus,
  Edit3,
} from 'lucide-react'
import MathDisplay from './MathDisplay'
import MathLiveInput from './MathLiveInput'
import FormattedMathText from './FormattedMathText'
import ConceptDagModal from '../dag/ConceptDagModal'
import VideoExplainerModal from '../video/VideoExplainerModal'
import { trackTelemetryEvent } from '../../lib/trig/tracer'
import {
  trigApi,
  type SubjectApi,
  type TrigConceptSummary,
  type TrigStepHistoryItem,
  type TrigMetrics,
  type TrigRequiredItem,
  type TrigProgressPoint,
  type TrigProfile,
} from '../../lib/trig/trigApiClient'
import PageHeader from '../PageHeader'
import SearchToolbar from '../SearchToolbar'

interface CoteacherWorkspaceProps {
  conceptId: string
  onSelectConcept?: (id: string) => void
  availableConcepts?: TrigConceptSummary[]
  api?: SubjectApi
  telemetryEndpoint?: string
  dagSubjectLabel?: string
  subjectFallbackName?: string
  formulaReferenceTitle?: string
  formulaReferenceItems?: [string, string][]
  customModalTitle?: string
  presetProblems?: { title: string; text: string }[]
  syncBadgeLabel?: string
  /** Class/Subject/Chapter filter row, rendered as a SearchToolbar directly below the header. */
  filterBar?: ReactNode
}

const TRIG_FORMULA_REFERENCE: [string, string][] = [
  ['Pythagoras', 'AB² + BC² = AC²'],
  ['sin θ', 'opp / hyp = AB / AC'],
  ['cos θ', 'adj / hyp = BC / AC'],
  ['tan θ', 'opp / adj = AB / BC'],
  ['sin²+cos²', 'sin²θ + cos²θ = 1'],
  ['Complementary', 'sin(90°-θ) = cos θ'],
]

const TRIG_PRESET_PROBLEMS = [
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

export default function CoteacherWorkspace({
  conceptId,
  onSelectConcept,
  availableConcepts = [],
  api = trigApi,
  telemetryEndpoint = '/api/trig/telemetry/event',
  dagSubjectLabel = 'CBSE CLASS 10 DAG',
  subjectFallbackName = 'Trigonometry',
  formulaReferenceTitle = 'CBSE Trigonometry Formulas Reference',
  formulaReferenceItems = TRIG_FORMULA_REFERENCE,
  customModalTitle = 'Custom CBSE Trigonometry Problem',
  presetProblems = TRIG_PRESET_PROBLEMS,
  syncBadgeLabel = 'SYNC RIGHT-ANGLED • LIVE',
  filterBar,
}: CoteacherWorkspaceProps) {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [hasStartedProblem, setHasStartedProblem] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [enteredSteps, setEnteredSteps] = useState<string[]>([])

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
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Generic Neuro-Symbolic Reasoning Engine states
  const [isGenericSession, setIsGenericSession] = useState(false)
  const [genericSessionId, setGenericSessionId] = useState<string | null>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customProblemInput, setCustomProblemInput] = useState('')
  const [customLoading, setCustomLoading] = useState(false)

  const handleStartCustomProblem = async (customText?: string) => {
    const textToUse = customText || customProblemInput
    if (!textToUse.trim()) return

    setCustomLoading(true)
    setSystemError(null)
    setFeedback(null)
    try {
      const res = await api.initSession(textToUse.trim())
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
    setUserAnswer('')
    setFeedback(null)
    setSystemError(null)
    setIsFullySolved(false)
    setEditingStepIndex(null)

    try {
      const data = await api.state(conceptId, { fresh, generateNew })
      setGenericSessionId(data.session_id || null)
      setIsGenericSession(true)
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
      setMetrics(data.metrics || { assistance_sal: data.sal, concept_mastery: data.mastery_score, active_attempts: 0, accuracy_rate: 0, questions_solved: data.questions_solved || 0 })
      setHasStartedProblem(true)
    } catch {
      setSystemError('Could not reach the workspace backend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      setProfile(await api.profile())
    } catch {
      // Ignore -- non-critical sidebar widget
    }
  }

  useEffect(() => {
    setHasStartedProblem(false)
    setUserAnswer('')
    setFeedback(null)
    setSystemError(null)
    setRequiredItems([])
    setStepsHistory([])
    setTimeline(startTimelineSeed())
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId])

  const handleNextProblem = () => {
    trackTelemetryEvent(conceptId, activeStepIndex, 'next_problem_click', { concept_id: conceptId }, telemetryEndpoint)
    setEnteredSteps([])
    fetchState(false, true)
    setFeedback(null)
  }

  const handleStepSubmit = async (answerValue?: string) => {
    const finalAnswer = answerValue || userAnswer
    if (!finalAnswer || isSubmitting || !conceptId) return

    const trimmed = finalAnswer.trim()
    const isEditingPastStep = editingStepIndex !== null
    const stepIdx = isEditingPastStep ? editingStepIndex : activeStepIndex

    if (isEditingPastStep) {
      setEnteredSteps((prev) => {
        const next = [...prev]
        if (editingStepIndex !== null && editingStepIndex < next.length) {
          next[editingStepIndex] = trimmed
        }
        return next
      })
      setEditingStepIndex(null)
    } else {
      setEnteredSteps((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
    }
    setUserAnswer('')

    if (!genericSessionId) {
      setFeedback('✓ Step recorded on Equation Board')
      return
    }

    setIsSubmitting(true)
    setSystemError(null)

    try {
      const res = await api.submitStep(genericSessionId, stepIdx, trimmed)
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
  }

  const handleReset = async () => {
    if (!conceptId) return
    setEnteredSteps([])
    try {
      await api.reset(conceptId)
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

  const allStudentSteps = useMemo(() => {
    const backendSteps = completedSteps.map((s) => s.result || s.instruction).filter(Boolean)
    const combined: string[] = []
    const seen = new Set<string>()

    for (const step of enteredSteps) {
      const clean = step.trim()
      if (clean && !seen.has(clean)) {
        seen.add(clean)
        combined.push(clean)
      }
    }
    for (const step of backendSteps) {
      const clean = step.trim()
      if (clean && !seen.has(clean)) {
        seen.add(clean)
        combined.push(clean)
      }
    }
    return combined
  }, [completedSteps, enteredSteps])

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

  return (
    <div className="relative min-h-full w-full bg-[#fdfaf5] text-[#1a2421] selection:bg-[#ddb56e]/30 flex flex-col font-sans">
      {/* Background Dotted Grid Texture */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.32]" />

      {/* Top Bar — Editorial Polished */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#fdfaf5]/90 border-b border-[#ece8df]">
        <PageHeader
          title="Practice Questions"
          actions={
            <>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#ece8df] text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#f6f1e7] transition cursor-pointer"
              >
                <span className="text-[14px]">←</span> Go back
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#eef6ec] border border-[#d6ecd2] text-[11px] font-mono text-[#2a5a28]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{syncBadgeLabel}</span>
              </div>
            </>
          }
        />
        {filterBar && <SearchToolbar>{filterBar}</SearchToolbar>}
      </div>

      {/* Workspace Area: Main Content Column + Collapsible Telemetry Sidebar */}
      <div className="flex flex-1 min-w-0 relative overflow-hidden">
        <main className="flex-1 min-w-0 max-w-full flex flex-col relative overflow-hidden bg-[#fdfaf5]">
          <div
            className={`relative z-10 flex-1 px-5 lg:px-10 py-6 lg:py-8 space-y-5 w-full mx-auto min-w-0 transition-all duration-300 ${
              isRightPanelOpen ? 'max-w-[840px]' : 'max-w-[920px]'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
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
                  <span className="font-medium text-[#1a2421]">{conceptTitle || 'Right-Angled Triangle'}</span>
                  <span className="text-[#9a958c]">⌄</span>
                </button>

                {showConceptDropdown && (
                  <div className="absolute top-[44px] left-0 w-[300px] max-w-[calc(100vw-32px)] rounded-2xl bg-white border border-[#ece8df] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-2 z-30 space-y-1">
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
                            setEnteredSteps([])
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
                  {availableConcepts.length || 10}
                </span>
                <span>CONCEPT VARIANTS IN BANK</span>
              </div>
            </div>

            {/* CARD 1: QUESTION CARD */}
            <div className="relative bg-[#FEFEFB] rounded-[28px] border border-[#ece8df] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden min-w-0 w-full">
              <div className="absolute top-0 left-0 right-0 h-[6px]" style={{ background: '#8BA888' }} />
              <div className="p-7 lg:p-9">
                <div className="max-w-[720px]">
                  {!hasStartedProblem ? (
                    <>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#f6f1e7] border border-[#ece6d8] font-mono text-[10px] tracking-[0.12em] text-[#7a756c]">
                        READY STATE • INSTANCE 01
                      </div>
                      <h2 className="font-serif text-[28px] lg:text-[32px] leading-[1.05] tracking-[-0.03em] mt-4 text-[#111814]">
                        Ready to practice<br className="hidden sm:inline" /> this concept?
                      </h2>
                      <p className="mt-4 text-[14px] leading-[1.6] text-[#6b6760] max-w-[460px]">
                        You're viewing <span className="font-medium text-[#1a2421]">{conceptTitle || subjectFallbackName}</span>. Click Next Problem to load a randomized instance with verified derivations and adaptive hints.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#eef6ec] border border-[#d6ecd2] font-mono text-[10px] tracking-[0.12em] text-[#2a5a28]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {isGenericSession ? 'DYNAMIC ENGINE • LIVE' : `RANDOMIZED • SEED ${Math.floor(Math.random() * 9000) + 1000}`}
                      </div>
                      <h2 className="font-serif text-[22px] lg:text-[26px] leading-[1.25] tracking-[-0.02em] mt-4 text-[#111814]">
                        <FormattedMathText text={problemContext} />
                      </h2>
                      <p className="mt-3 text-[13px] leading-[1.6] text-[#6b6760] max-w-[500px]">
                        Focus on the rigorous derivation sequence. Add each algebraic step in the derivation editor below.
                      </p>
                    </>
                  )}

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleNextProblem}
                      disabled={loading}
                      className="group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#111111] text-white text-[13px] font-medium shadow-xs hover:bg-black transition cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Loading…</span>
                        </>
                      ) : (
                        <>
                          <span>{hasStartedProblem ? 'New Variant' : 'Next Problem'}</span>
                          <span className="w-5 h-5 rounded-full bg-white text-black grid place-items-center text-[11px] font-bold group-hover:translate-x-0.5 transition">
                            →
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowVideoModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f6f1e7] border border-[#ece6d8] text-[13px] font-medium text-[#5a554e] hover:bg-[#efe8d8] transition cursor-pointer shadow-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-white border border-[#ece6d8] grid place-items-center text-[11px] text-[#8a6d2b]">
                        ▶
                      </span>
                      <span>Generate Video Explainer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCustomModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f6f1e7] border border-[#ece6d8] text-[13px] font-medium text-[#5a554e] hover:bg-[#efe8d8] transition cursor-pointer shadow-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-white border border-[#ece6d8] grid place-items-center text-[12px] text-[#4a7c59]">
                        ✦
                      </span>
                      <span>Custom Problem</span>
                    </button>

                    {hasStartedProblem && (
                      <button
                        type="button"
                        onClick={handleReset}
                        title="Reset steps"
                        className="w-11 h-11 rounded-full bg-white border border-[#ece8df] grid place-items-center text-[#8a8f8b] hover:text-[#1a2421] transition shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[10px] text-[#9a958c]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-[#ddd8cc] grid place-items-center text-[8px] font-bold text-[#4a7c59]">
                        ✓
                      </span>
                      CBSE ALIGNED
                    </span>
                    <span>•</span>
                    <span>NO TIMER</span>
                    <span>•</span>
                    <span>DERIVATION FIRST</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: EDOVA EQUATION BOARD */}
            <div className="relative bg-[#FEFEFB] rounded-[28px] border border-[#ece8df] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden min-w-0">
              <div className="absolute top-0 left-0 right-0 h-[6px]" style={{ background: '#7A9DB8' }} />
              <div className="px-7 lg:px-8 h-[52px] flex items-center justify-between border-b border-[#ece8df] bg-[#fbfaf7]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-[#1a2421] font-medium uppercase">
                    EDOVA EQUATION BOARD
                  </span>
                  <span className="hidden md:inline-flex items-center gap-2 font-mono text-[10px] text-[#9a958c]">
                    <span className="w-1 h-1 rounded-full bg-[#d8d2c3]" />
                    {allStudentSteps.length} verified • {allStudentSteps.length} total • steps • {hasStartedProblem ? (isFullySolved ? 'Solved' : 'Active') : 'Ready'} • {allStudentSteps.length} steps
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    title="Add Derivation Step"
                    className="w-6 h-6 rounded-full bg-[#f6f1e7] border border-[#ece6d8] grid place-items-center text-[12px] text-[#1a2421] select-none"
                  >
                    ⊕
                  </div>
                  <div
                    title="Derivation View"
                    className="w-6 h-6 rounded-full bg-[#f6f1e7] border border-[#ece6d8] grid place-items-center text-[10px] text-[#1a2421] select-none"
                  >
                    ⤢
                  </div>

                  {/* Expand / Collapse Button with green dash indicator */}
                  <button
                    type="button"
                    title={isExpanded ? 'Collapse board' : 'Expand board'}
                    aria-label={isExpanded ? 'Collapse board' : 'Expand board'}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="relative w-7 h-7 rounded-full bg-white border border-[#ece6d8] grid place-items-center text-[#1a2421] hover:bg-[#1a2421] hover:text-white hover:border-[#1a2421] transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    <span className="absolute -top-[5px] -right-[2px] w-[12px] h-[3px] rounded-full bg-emerald-400 shadow-[0_0_0_2px_#fbfaf7]" />
                    {isExpanded ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 14 10 14 10 20" />
                        <polyline points="20 10 14 10 14 4" />
                        <line x1="14" y1="10" x2="21" y2="3" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Board Body: 180px collapsed vs 500px expanded with smooth transition and dot-grid */}
              <div
                className={`dot-grid relative p-6 lg:p-8 overflow-hidden transition-all duration-500 ease-[cubic-bezier(.25,.8,.25,1)] ${
                  isExpanded ? 'overflow-y-auto' : ''
                }`}
                style={{ height: isExpanded ? 500 : 180 }}
              >
                <div className="max-w-[560px]">
                  {/* Ghost Example Box */}
                  <div className="rounded-xl border border-dashed border-[#C48A7A]/50 bg-[#F0D5C8]/40 p-4">
                    <div className="font-mono text-[10px] tracking-[0.12em] text-[#C48A7A] mb-2 font-medium">
                      GHOST EXAMPLE • REFERENCE ONLY
                    </div>
                    <div className="font-mono text-[13px] text-[#6b6760] leading-relaxed">
                      Ex: <span className="text-[#1a2421] font-medium">Step 1:</span> In ΔABC, ∠B = 90° → AB² + BC² = AC²
                    </div>
                    <div className="mt-2 font-mono text-[11px] text-[#7a756c]">
                      Ex: Step 2: Let AB = 3, BC = 4 → AC = √(9+16) = 5
                    </div>
                  </div>

                  {/* Empty state when no derivations entered */}
                  {allStudentSteps.length === 0 && (
                    <div className="mt-6 flex items-center gap-3 text-[#9a958c]">
                      <div className="w-8 h-8 rounded-full bg-white border border-[#ece8df] grid place-items-center shadow-sm">
                        <span className="text-[14px] text-[#8a8f8b]">＋</span>
                      </div>
                      <div className="font-mono text-[11px]">
                        No derivations yet. Enter Step 1 below
                      </div>
                    </div>
                  )}

                  {/* ALL STUDENT ENTERED STEPS - Always shown here */}
                  {allStudentSteps.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {allStudentSteps.map((stepText, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-[#1a2421] text-[#e8e2d6] px-4 py-3 font-mono text-[13px] flex items-center gap-3 shadow-sm animate-fadeIn"
                        >
                          <span className="text-[#a8e6a0] font-semibold shrink-0">
                            Step {idx + 1}:
                          </span>
                          <span className="flex-1 overflow-x-auto">
                            <MathDisplay math={stepText} />
                          </span>
                          <span className="text-[#8be78a] text-xs shrink-0 font-sans flex items-center gap-1">
                            <span>✓</span> Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ambient watermark circle in bottom right */}
                <div className="absolute right-8 bottom-8 w-16 h-16 rounded-full bg-[#f6f1e7] border border-[#ece6d8] grid place-items-center opacity-60 pointer-events-none">
                  <span className="text-[22px] text-[#c2bdb0]">＋</span>
                </div>

                {/* Bottom gradient fade when collapsed */}
                {!isExpanded && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#fbfaf7]/90 to-transparent" />
                )}
              </div>
            </div>

            {/* CARD 3: YOUR DERIVATIONS */}
            <div className="relative bg-[#E6EDE6] rounded-[28px] border border-[#ece8df] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden p-7 lg:p-8 min-w-0">
              <div className="absolute top-0 left-0 right-0 h-[6px]" style={{ background: 'linear-gradient(90deg, #8BA888, #9B8FB4)' }} />
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-[18px] text-[#1a2421] font-semibold">
                  Your Derivations
                </h3>
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#9a958c]">
                  {allStudentSteps.length} STEPS • {hasStartedProblem ? (isFullySolved ? 'COMPLETED' : 'IN PROGRESS') : 'WAITING'}
                </span>
              </div>

              {allStudentSteps.length === 0 && !hasStartedProblem ? (
                <div className="mt-8 rounded-[20px] bg-white border border-[#ece6d8] p-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-white border border-[#ece8df] grid place-items-center shadow-sm">
                    <span className="text-[18px] opacity-60">◐</span>
                  </div>
                  <div className="mt-4 font-serif text-[16px] text-[#1a2421]">No steps yet</div>
                  <div className="mt-1 font-mono text-[11px] text-[#9a958c]">
                    Start with Next Problem to unlock the derivation editor
                  </div>
                  <button
                    type="button"
                    onClick={handleNextProblem}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] text-white text-[13px] font-medium hover:bg-black transition cursor-pointer"
                  >
                    <span>Start Step 1 with Next Problem</span>
                    <span className="w-5 h-5 rounded-full bg-white text-black grid place-items-center text-[12px]">→</span>
                  </button>
                </div>
              ) : isFullySolved ? (
                <div className="mt-6 p-6 rounded-[20px] text-center space-y-3 bg-[#eef6ec] border border-[#d6ecd2]">
                  <div className="w-10 h-10 rounded-full bg-[#c9f0c2] text-[#1a2421] flex items-center justify-center mx-auto text-base font-bold">
                    ✓
                  </div>
                  <h3 className="font-serif text-[18px] font-semibold text-[#1a2421]">
                    Concept Mastered Successfully!
                  </h3>
                  <p className="text-[13px] text-[#5a554e]">
                    You have solved all derivation steps with high autonomy.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleNextProblem}
                      className="h-9 px-5 rounded-full bg-[#111111] text-white text-[12.5px] font-medium hover:bg-black flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Next Problem</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="h-9 px-4 rounded-full bg-white border border-[#ece8df] text-[#1a2421] text-[12.5px] font-medium hover:bg-[#fbf8f1] transition-colors cursor-pointer"
                    >
                      Practice Again
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {allStudentSteps.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {allStudentSteps.map((stepText, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 items-center justify-between p-3.5 rounded-xl bg-white border border-[#ece6d8]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#1a2421] text-white grid place-items-center font-mono text-[10px] shrink-0 font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-[13px] text-[#1a2421] truncate">
                              <MathDisplay math={stepText} />
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[#2a5a28] text-xs font-mono font-semibold">✓</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStepIndex(idx)
                                setUserAnswer(stepText)
                              }}
                              className="px-2.5 py-1 rounded-lg border border-[#ece6d8] bg-white text-[11px] font-sans text-[#1a2421] hover:bg-[#f6f1e7] transition shadow-xs cursor-pointer font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Scaffold Options if available */}
                  {quickOptions.length > 0 && metrics.assistance_sal >= 0.7 && metrics.active_attempts > 0 && (
                    <div className="mt-5 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono text-[#2a5a28] tracking-wider font-semibold">
                        Quick Scaffold Options:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {quickOptions.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              trackTelemetryEvent(conceptId, activeStepIndex, 'quick_option_click', { option: opt }, telemetryEndpoint)
                              handleStepSubmit(opt)
                            }}
                            className="bg-[#eef6ec] hover:bg-[#d6ecd2] border border-[#d6ecd2] text-[#2a5a28] text-xs px-3.5 py-1.5 rounded-full font-mono transition shadow-xs active:scale-95 font-semibold cursor-pointer"
                          >
                            <MathDisplay math={opt} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input container */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-[#9a958c] mb-2">
                      <span>DERIVATION INPUT</span>
                      <span className="w-1 h-1 rounded-full bg-[#d8d2c3]" />
                      <span className={hasStartedProblem ? "text-emerald-700 font-semibold" : ""}>
                        {hasStartedProblem ? "READY" : "LOCKED"}
                      </span>
                      {editingStepIndex !== null && (
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-amber-800 font-medium">
                            Editing Step {editingStepIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStepIndex(null)
                              setUserAnswer('')
                            }}
                            className="text-xs text-[#9a958c] hover:text-[#1a2421] underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && userAnswer.trim() && !isSubmitting) {
                            handleStepSubmit()
                          }
                        }}
                        placeholder="e.g. sin(θ) = opposite / hypotenuse"
                        disabled={!hasStartedProblem}
                        className="w-full h-[48px] rounded-full bg-white border border-[#ece6d8] px-5 pr-[130px] font-mono text-[13px] text-[#1a2421] placeholder:text-[#b8b2a5] focus:outline-none focus:border-[#1a2421]/30 focus:bg-white disabled:opacity-60 transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleStepSubmit()}
                        disabled={!hasStartedProblem || !userAnswer.trim() || isSubmitting}
                        className="absolute right-1.5 top-1.5 h-[36px] px-4 rounded-full bg-[#1a2421] text-white font-mono text-[11px] tracking-[0.08em] disabled:opacity-30 hover:bg-black transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>VERIFYING…</span>
                          </>
                        ) : editingStepIndex !== null ? (
                          'UPDATE STEP ↵'
                        ) : (
                          'ADD STEP ↵'
                        )}
                      </button>
                    </div>

                    {/* KaTeX live preview below input */}
                    {userAnswer.trim() && (
                      <div className="mt-2.5 px-4 py-2 bg-[#fdfaf5] border border-[#ece6d8] rounded-full flex items-center justify-between text-xs animate-fadeIn">
                        <div className="flex items-center gap-2 font-mono text-[#1a2421] overflow-x-auto">
                          <span className="text-[10px] text-[#9a958c] uppercase shrink-0 font-medium">
                            Preview:
                          </span>
                          <MathDisplay math={userAnswer} />
                        </div>
                        <span className="text-[10px] font-mono text-[#9a958c] shrink-0 ml-2 hidden sm:inline">
                          Press Enter ↵ to submit
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feedback and Guided Clues */}
                  {feedback && (
                    <div
                      className={`mt-4 p-3 rounded-xl border text-xs font-mono transition-all ${
                        feedback.startsWith('✓')
                          ? 'bg-[#eef6ec] border-[#d6ecd2] text-[#2a5a28]'
                          : feedback.startsWith('?')
                          ? 'bg-[#eaf2fb] border-[#a9c6e8] text-[#1d4e89]'
                          : 'bg-[#fef3c7] border-[#fcd34d] text-[#92400e]'
                      }`}
                    >
                      {feedback}
                    </div>
                  )}

                  {systemError && (
                    <div className="mt-3 p-3 rounded-xl border bg-[#fbf8f1] border-[#ece6d8] text-xs font-mono text-[#7a756c]">
                      {systemError}
                    </div>
                  )}

                  {socraticScaffold && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setIsHintOpen(!isHintOpen)}
                        className={`h-8 px-3 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isHintOpen
                            ? 'bg-[#f6f1e7] text-[#1a2421] border-[#ece6d8]'
                            : 'bg-white border-[#ece8df] text-[#8a8f8b] hover:bg-[#fbf8f1]'
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-[#ddb56e]" />
                        <span>{isHintOpen ? 'Hide Clue' : 'Guided Clue'}</span>
                      </button>

                      {isHintOpen && (
                        <div className="mt-2.5 p-4 rounded-xl bg-[#f6f1e7] border border-[#ece6d8] space-y-2 text-[#1a2421]">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7a756c] flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-[#ddb56e]" />
                              Socratic Guided Clue
                            </span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#ece6d8] text-[#7a756c]">
                              SAL: {Math.round(metrics.assistance_sal * 100)}%
                            </span>
                          </div>
                          <div className="text-[13px] leading-relaxed font-sans text-[#1a2421]">
                            <FormattedMathText text={socraticScaffold} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* CARD 4: CBSE TRIGONOMETRY FORMULAS REFERENCE */}
            <div className="bg-white rounded-[28px] border border-[#ece8df] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.05)] overflow-hidden min-w-0">
              <button
                type="button"
                onClick={() => setShowFormulaDrawer(!showFormulaDrawer)}
                className="w-full px-7 lg:px-8 h-[56px] flex items-center justify-between cursor-pointer hover:bg-[#fbfaf7]/60 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#f6f1e7] border border-[#ece6d8] grid place-items-center text-[13px] font-serif font-bold text-[#1a2421]">
                    ƒ
                  </span>
                  <span className="font-serif text-[15px] font-semibold text-[#1a2421]">
                    {formulaReferenceTitle}
                  </span>
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-[#E0DAE8] border border-[#D4C8E0] text-[10px] font-mono text-[#5A4E7A]">
                    {formulaReferenceItems.length} FORMULAS
                  </span>
                </div>
                <span
                  className={`w-7 h-7 rounded-full bg-[#fbf8f1] border border-[#ece6d8] grid place-items-center text-[12px] text-[#6b6760] transition-transform duration-200 ${
                    showFormulaDrawer ? 'rotate-180' : ''
                  }`}
                >
                  ⌄
                </span>
              </button>

              {showFormulaDrawer && (
                <div className="px-7 lg:px-8 pb-7 pt-2 grid md:grid-cols-2 gap-3 animate-fadeIn">
                  {formulaReferenceItems.map(([name, formula]) => (
                    <div
                      key={name}
                      className="rounded-xl bg-[#fbf8f1] border border-[#ece6d8] px-4 py-3 flex justify-between items-center"
                    >
                      <span className="font-mono text-[11px] text-[#7a756c] font-medium">{name}</span>
                      <span className="font-mono text-[12px] text-[#1a2421] font-medium">
                        <MathDisplay math={formula} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pedagogical Footer Tagline */}
            <div className="pb-10 font-mono text-[10px] text-[#7a756c] text-center">
              Edova Practice OS • Enterprise Polished v2 • CBSE Aligned • Derivation-first pedagogy
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
                  color: '#2E4D3A',
                  bg: '#D4E4D1',
                  text: '#2E4D3A',
                  progress: Math.round(metrics.concept_mastery * 100),
                },
                {
                  label: 'Assistance SAL',
                  value: `${Math.round(metrics.assistance_sal * 100)}%`,
                  sub: metrics.assistance_sal >= 0.7 ? 'Adaptive' : 'Low assist',
                  color: '#7A4D3E',
                  bg: '#F0D5C8',
                  text: '#7A4D3E',
                  progress: Math.round(metrics.assistance_sal * 100),
                },
                {
                  label: 'Active Attempts',
                  value: `${metrics.active_attempts}`,
                  sub: 'This session',
                  color: '#3A4E68',
                  bg: '#D6E2EB',
                  text: '#3A4E68',
                  progress: Math.min(100, metrics.active_attempts * 25),
                },
                {
                  label: 'Accuracy Rate',
                  value: `${Math.round(metrics.accuracy_rate * 100)}%`,
                  sub: 'Verified',
                  color: '#5A4E7A',
                  bg: '#E0DAE8',
                  text: '#5A4E7A',
                  progress: Math.round(metrics.accuracy_rate * 100),
                },
              ].map((z) => (
                <div
                  key={z.label}
                  className="relative rounded-[14px] border border-black/5 p-3.5 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                  style={{ background: z.bg }}
                >
                  <div className="font-mono text-[9.5px] tracking-[0.08em] leading-tight mb-1.5 opacity-70" style={{ color: z.text }}>
                    {z.label.toUpperCase()}
                  </div>
                  <div className="font-display text-[22px] font-[600] leading-none tracking-[-0.02em] mb-1" style={{ color: z.text }}>
                    {z.value}
                  </div>
                  <div className="font-mono text-[10px] opacity-70" style={{ color: z.text }}>{z.sub}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10">
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{ width: `${z.progress}%`, background: z.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* LEARNING TRAJECTORY DYNAMICS */}
            <div className="rounded-[14px] bg-[#FFFFFF] border border-[#8BA888]/40 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4">
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

            {/* ARCHETYPE MASTERY Card */}
            <div
              className="rounded-[14px] bg-[#F5DDD1] p-4 border border-[#F0D5C8] relative overflow-hidden"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
            >
              <div className="absolute right-[-20px] top-[-20px] w-28 h-28 rounded-full bg-[#C48A7A]/[0.12] blur-[1px]" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[9px] tracking-[0.14em] text-[#7A4D3E] uppercase opacity-90">
                    ARCHETYPE MASTERY
                  </span>
                  <span className="font-mono text-[9px] px-2 py-1 rounded-full bg-white/70 border border-[#F0D5C8] text-[#7A4D3E] font-semibold">
                    {metrics.questions_solved || 0}/5 Solved
                  </span>
                </div>

                <div className="flex items-end gap-3 mb-4">
                  <div className="font-display text-[28px] font-[700] leading-none text-[#121A16] tracking-[-0.02em]">
                    {`${Math.round((metrics.concept_mastery || 0) * 100)}%`}
                  </div>
                  <div className="font-mono text-[11px] text-[#7A4D3E] mb-0.5 opacity-90">
                    {(metrics.questions_solved || 0) >= 5 ? '★ Mastered' : `${5 - (metrics.questions_solved || 0)} more to master`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-[8px] bg-white/60 border border-[#F0D5C8] p-2.5">
                    <div className="font-mono text-[9px] tracking-[0.08em] text-[#7A4D3E] uppercase">
                      Accuracy Rate
                    </div>
                    <div className="font-medium text-[14px] text-[#121A16] mt-1">
                      {hasStartedProblem && completedSteps.length > 0 ? `${Math.round(metrics.accuracy_rate * 100)}%` : '—'}
                    </div>
                  </div>
                  <div className="rounded-[8px] bg-white/60 border border-[#F0D5C8] p-2.5">
                    <div className="font-mono text-[9px] tracking-[0.08em] text-[#7A4D3E] uppercase">
                      Current SAL
                    </div>
                    <div className="font-medium text-[14px] text-[#C48A7A] mt-1 font-mono">
                      {metrics.assistance_sal.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* 5 Archetype Question Milestones */}
                <div className="h-[28px] flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, qIdx) => {
                    const isSolved = (metrics.questions_solved || 0) > qIdx
                    return (
                      <div
                        key={qIdx}
                        className="flex-1 h-3 rounded-[4px] transition-all duration-500 border"
                        style={{
                          background: isSolved ? '#C48A7A' : 'rgba(255,255,255,0.5)',
                          borderColor: isSolved ? '#C48A7A' : '#F0D5C8',
                          opacity: isSolved ? 1 : 0.6,
                        }}
                        title={`Question ${qIdx + 1}: ${isSolved ? 'Solved' : 'Pending'}`}
                      />
                    )
                  })}
                </div>

                <div className="mt-3 font-mono text-[10px] text-[#7A4D3E] opacity-80">
                  No time pressure • Focus on derivation quality
                </div>
              </div>
            </div>

            {/* SESSION CONTEXT Card */}
            <div className="rounded-[14px] border border-[#D6E2EB] bg-[#E6EEF5] p-4">
              <div className="font-mono text-[10px] tracking-[0.08em] text-[#3A4E68] mb-3">
                SESSION CONTEXT
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#3A4E68]/70">Concept</span>
                  <span className="text-[#3A4E68] font-medium max-w-[150px] truncate">
                    {conceptTitle || subjectFallbackName}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#3A4E68]/70">Variant</span>
                  <span className="text-[#3A4E68]">
                    {hasStartedProblem ? (isGenericSession ? 'Engine • Dynamic' : '#1847 • Fresh') : '— • Ready'}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#3A4E68]/70">Mode</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/70 border border-[#D6E2EB] text-[10px] text-[#3A4E68]">
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
                  <h3 className="font-display text-lg font-bold text-[#1A221E]">{customModalTitle}</h3>
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
                {presetProblems.map((preset, idx) => (
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
      <ConceptDagModal
        isOpen={showDagModal}
        onClose={() => setShowDagModal(false)}
        subjectLabel={dagSubjectLabel}
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

      {/* On-Demand Video Explainer Modal */}
      <VideoExplainerModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        conceptId={conceptId}
        conceptTitle={conceptTitle}
        questionText={problemContext}
        telemetryEndpoint={telemetryEndpoint}
      />
    </div>
  )
}
