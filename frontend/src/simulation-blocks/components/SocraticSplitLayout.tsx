import React, { useState, useMemo, useEffect, useRef } from 'react'
import { HermesAgent, AskResponse } from '../agents/HermesAgent'
import { logEvent } from '../instrument/logger'
import { Pit, LogEvent } from '../types'
import { Sparkles, Send, Eye, BookOpen, Lightbulb, Mic, ChevronLeft, ChevronRight } from 'lucide-react'

export function formatMathText(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/\\longrightarrow/g, '→')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\ne/g, '≠')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    .replace(/\^2\b|\^\{2\}/g, '²')
    .replace(/\^3\b|\^\{3\}/g, '³')
    .replace(/\^n\b|\^\{n\}/g, 'ⁿ')
    .replace(/_1\b|_\{1\}/g, '₁')
    .replace(/_2\b|_\{2\}/g, '₂')
    .replace(/_n\b|_\{n\}/g, 'ₙ')
    .replace(/_k\b|_\{k\}/g, 'ₖ')
    .replace(/_\{k\+1\}/g, 'ₖ₊₁')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\$/g, '')
}

export interface SocraticSplitLayoutProps {
  json?: any
  blockId?: string
  blockType?: string
  blockState?: any
  liveObservation?: string
  topicTitle?: string
  topicSubtitle?: string
  prompt?: string
  progressPercent?: number
  points?: number
  quickQuestions?: string[]
  pits?: Pit[]
  initialHint?: string
  chapterId?: string
  conceptId?: string
  masteredConceptIds?: string[]
  onEvent?: (event: LogEvent) => void
  onAgentResponse?: (res: AskResponse) => void
  children: React.ReactNode
  rightPanelHeaderExtra?: React.ReactNode
}

export default function SocraticSplitLayout({
  json,
  blockId = 'socratic-block',
  blockType,
  blockState,
  liveObservation,
  topicTitle,
  prompt,
  progressPercent = 35,
  points = 75,
  quickQuestions = [
    'Why is this the answer?',
    'How to form the equation?',
  ],
  pits,
  initialHint,
  chapterId,
  conceptId,
  masteredConceptIds = [],
  onEvent,
  onAgentResponse,
  children,
}: SocraticSplitLayoutProps) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [inp, setInp] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const [chat, setChat] = useState<Array<{ who: 'bot' | 'user'; text: string; timestamp: string }>>([])
  const currentPoints = points

  const resolvedBlockType = blockType || json?.blockType || json?.id || 'algebra-tile'
  const resolvedPrompt = prompt || json?.content?.prompt || 'Explore the interactive simulation model.'

  // Dynamic Socratic Guide mathematical relationship model
  const socraticGuideText = useMemo(() => {
    if (initialHint) return initialHint
    if (json?.socratic?.initialHint) return json.socratic.initialHint
    if (resolvedBlockType === 'area-fraction' || blockId?.includes('fraction')) {
      return 'In an area model: <b>Fraction = Shaded Parts / Total Parts = Numerator / Denominator</b>.'
    }
    if (resolvedBlockType === 'angles' || blockId?.includes('angles')) {
      return 'All adjacent angles around a central point always sum to a full circle: <b>θ₁ + θ₂ + θ₃ = 360°</b>.'
    }
    if (resolvedBlockType === 'dataset' || blockId?.includes('stats') || blockId?.includes('dataset')) {
      return 'The arithmetic mean is the balance point: <b>Mean (μ) = (∑ xᵢ) / N</b>.'
    }
    if (resolvedBlockType === 'projectile' || blockId?.includes('projectile')) {
      return 'Horizontal projectile range: <b>R = (v₀² · sin 2θ) / g</b>. Maximum range occurs at <b>θ = 45°</b>.'
    }
    if (resolvedBlockType === 'titration' || blockId?.includes('titration')) {
      return 'At neutral equivalence point: <b>Moles H⁺ = Moles OH⁻ (pH = 7.00)</b>.'
    }
    return "Welcome! Let's visualise the park. Try a breadth value—what length does 2x+1 give? Watch the area tile update."
  }, [initialHint, json?.socratic?.initialHint, resolvedBlockType, blockId])

  useEffect(() => {
    if (chat.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chat, isTyping])

  const agent = useMemo(() => new HermesAgent(), [])
  const resolvedPits = pits || json?.socratic?.pits || []

  const sendQuery = async (queryText: string) => {
    const q = queryText.trim()
    if (!q) return

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setChat((prev) => [...prev, { who: 'user', text: q, timestamp: timeStr }])
    setInp('')
    setIsTyping(true)

    const evt: LogEvent = {
      blockId: json?.id || blockId,
      type: 'chat',
      query: q,
      value: null,
      timestamp: Date.now(),
    }
    logEvent(evt)
    onEvent?.(evt)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)

      const response = await fetch('http://localhost:8000/api/socratic/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: q,
          simulation_id: json?.id || blockId,
          chapter_id: chapterId || 'curriculum-stem',
          concept_id: conceptId || 'STEM-01',
          mastered_concept_ids: masteredConceptIds,
          chat_history: chat.slice(-6).map((c) => ({ role: c.who, content: c.text })),
        }),
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setIsTyping(false)
        setChat((prev) => [...prev, { who: 'bot', text: data.reply, timestamp: timeStr }])
        onAgentResponse?.({
          text: data.reply,
          conceptId: data.concept_id,
          isReady: data.is_ready,
          missingPrerequisites: data.missing_prerequisites,
          nextRecommendedConcept: data.next_recommended_concept,
        })
        return
      }
    } catch {
      // Fallback
    }

    try {
      const res = await agent.ask({
        query: q,
        blockState: blockState || json?.algebra || {},
        blockType: resolvedBlockType,
        chapterId,
        conceptId,
        masteredConceptIds,
        pits: resolvedPits,
      })

      setIsTyping(false)
      setChat((prev) => [...prev, { who: 'bot', text: res.text, timestamp: timeStr }])
      onAgentResponse?.(res)
    } catch {
      setIsTyping(false)
      setChat((prev) => [
        ...prev,
        {
          who: 'bot',
          text: 'I am observing your current exploration! Adjust the interactive controls on the right or ask any specific question.',
          timestamp: timeStr,
        },
      ])
    }
  }

  const roadmapSteps = ['1. Patterns', '2. Linear', '3. Area Model', '4. Factor Pairs', '5. Quadratic', '6. Sum']

  return (
    <div className="h-full flex-1 flex flex-col bg-[#FBF9F3] text-[#111814] overflow-hidden select-none font-sans leading-relaxed">
      {/* 4px Progress Track */}
      <div className="mx-6 mt-3 max-md:mx-4 shrink-0">
        <div className="h-1 rounded-full bg-[#EDE8DD] overflow-hidden">
          <div
            className="h-full bg-[#4A7C59] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(20, progressPercent))}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#6B7280] font-medium">
              {Math.round(progressPercent)}% COMPLETE
            </span>
            <div className="flex items-center gap-[5px]">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-[7px] h-[7px] rounded-full transition-colors ${
                    idx < Math.ceil((progressPercent / 100) * 5)
                      ? 'bg-[#4A7C59]'
                      : 'bg-[#EDE8DD] border border-[#E2DDD1]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="font-mono text-[10px] tracking-[0.12em] text-[#9C7A3A] font-medium">
            REWARD: <span className="text-[#111814]">{currentPoints} XP</span>
          </div>
        </div>
      </div>

      {/* Roadmap Strip */}
      <div className="mx-6 mt-3 max-md:mx-4 rounded-[12px] bg-white border border-[#EDE8DD] shadow-card px-4 py-[10px] flex items-center gap-3 overflow-x-auto scrollbar-none max-w-full shrink-0">
        <span className="font-mono text-[10px] tracking-[0.12em] text-[#9CA3AF] font-medium shrink-0">
          ROADMAP:
        </span>
        <div className="flex items-center gap-2">
          {roadmapSteps.map((step, idx) => {
            const isActive = idx === 2 || (progressPercent > 50 && idx === 3)
            return (
              <div
                key={idx}
                className={`h-[28px] px-3 rounded-full text-[12px] font-medium flex items-center gap-1.5 border shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#1A221E] text-white border-[#1A221E] shadow-sm'
                    : 'bg-[#F6F1E6] text-[#6B7280] border-[#EDE8DD]'
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#DDB56E] mr-0.5" />}
                <span>{step}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Split-Panel Area: 340px Left + Fluid Canvas Right */}
      <div className="flex-1 flex mt-4 mx-6 mb-6 gap-4 max-lg:flex-col max-md:mx-4 overflow-hidden relative">
        {/* Left Panel: Socratic Guide & Feedback (340px) */}
        <div
          className={`shrink-0 flex flex-col gap-3 transition-all duration-300 ${
            isLeftPanelOpen
              ? 'w-[340px] max-lg:w-full opacity-100'
              : 'w-0 max-w-0 opacity-0 overflow-hidden pointer-events-none p-0 m-0'
          }`}
        >
          {/* Card 1: ACTIVE PROBLEM */}
          <div className="rounded-[16px] bg-white border border-[#EDE8DD] shadow-card p-4">
            <div className="font-mono text-[9px] tracking-[0.12em] text-[#9CA3AF] opacity-65 uppercase font-medium mb-2">
              ACTIVE PROBLEM
            </div>
            <div className="mt-1 flex gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#E6F0E8] grid place-items-center shrink-0">
                <BookOpen className="w-4 h-4 text-[#4A7C59]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-[14px] leading-[1.3] text-[#111814] truncate">
                  {topicTitle || 'Consecutive Numbers & Algebra'}
                </div>
                <div className="mt-1.5 text-[12px] leading-[1.5] text-[#6B7280]">
                  {resolvedPrompt}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: SOCRATIC GUIDE (Yellow Token Spec #FFFBEB / #FDE68A) */}
          <div className="rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-4 shadow-sm">
            <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] text-[#92400E] uppercase font-medium mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#92400E]" />
              <span>SOCRATIC GUIDE</span>
            </div>
            <div
              className="text-[12px] leading-[1.55] text-[#78350F]"
              dangerouslySetInnerHTML={{ __html: formatMathText(socraticGuideText) }}
            />
          </div>

          {/* Card 3: WATCHING YOUR INTERACTION (Green Token Spec #F0FDF4 / #BBF7D0) */}
          {liveObservation && (
            <div className="rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-4 shadow-sm">
              <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] text-[#166534] uppercase font-medium mb-2">
                <Eye className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                <span>WATCHING YOUR INTERACTION</span>
              </div>
              <div
                className="text-[12px] leading-[1.55] text-[#14532D]"
                dangerouslySetInnerHTML={{ __html: formatMathText(liveObservation) }}
              />
            </div>
          )}

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendQuery(q)}
                className="h-[28px] px-3 rounded-full bg-white border border-[#EDE8DD] shadow-sm text-[11px] text-[#6B7280] hover:bg-[#FBF9F3] hover:text-[#111814] transition-colors text-left cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Dynamic Chat Messages */}
          {chat.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[160px] pr-1">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-[12px] text-[12px] leading-relaxed ${
                    m.who === 'user'
                      ? 'bg-[#1A221E] text-white ml-4'
                      : 'bg-white border border-[#EDE8DD] text-[#111814] mr-4 shadow-sm'
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatMathText(m.text) }} />
                </div>
              ))}
              {isTyping && (
                <div className="p-2 bg-white border border-[#EDE8DD] rounded-[10px] text-[11px] text-[#6B7280] flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3 h-3 text-[#DDB56E] animate-spin" />
                  <span>Hermes is thinking...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}

          {/* Hermes Chat Input Bar */}
          <div className="mt-auto pt-2">
            <div className="h-[40px] rounded-[12px] bg-white border border-[#EDE8DD] shadow-card flex items-center px-3 gap-2">
              <input
                value={inp}
                onChange={(e) => setInp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendQuery(inp)}
                placeholder="Ask Hermes a question..."
                className="flex-1 h-8 text-[12px] outline-none placeholder:text-[#9CA3AF] text-[#111814] bg-transparent font-sans"
              />
              <button
                type="button"
                className="w-7 h-7 grid place-items-center rounded-full hover:bg-[#FBF9F3] text-[#9CA3AF] hover:text-[#111814] transition-colors cursor-pointer"
                title="Voice input"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => sendQuery(inp)}
                disabled={!inp.trim()}
                className="w-7 h-7 grid place-items-center rounded-full bg-[#1A221E] text-white hover:bg-black transition-colors cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2 font-mono text-[9px] tracking-[0.12em] text-[#9CA3AF] text-center">
              HERMES · SOCRATIC TUTOR
            </div>
          </div>
        </div>

        {/* Panel collapse/expand toggle on desktop */}
        <div className="hidden lg:flex items-center self-center shrink-0 -mx-2 z-20">
          <button
            type="button"
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            title={isLeftPanelOpen ? 'Collapse Socratic guide' : 'Expand Socratic guide'}
            className="w-4 h-10 rounded-full bg-white border border-[#EDE8DD] shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#6B7280] hover:text-[#111814] hover:bg-[#FBF9F3] transition-colors cursor-pointer"
          >
            {isLeftPanelOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {/* Right Panel: Interactive Canvas */}
        <div className="flex-1 relative rounded-[16px] overflow-hidden border border-[#EDE8DD] bg-[#FBF9F3] min-h-[720px] flex flex-col">
          <div
            className="absolute inset-0 dotted-bg opacity-[0.35] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#1A221E 1px, transparent 1.4px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="absolute inset-0 bg-[#FBF9F3]/[0.84] pointer-events-none" />
          <div className="relative z-10 flex flex-col flex-1 w-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
