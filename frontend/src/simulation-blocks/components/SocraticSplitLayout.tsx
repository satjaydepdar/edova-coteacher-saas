import React, { useState, useMemo, useEffect, useRef } from 'react'
import { HermesAgent, AskResponse } from '../agents/HermesAgent'
import { logEvent } from '../instrument/logger'
import { Pit, LogEvent } from '../types'
import KnowledgeGraphRoadmap from './KnowledgeGraphRoadmap'
import { Sparkles, Send, Eye, BookOpen, Lightbulb, Mic } from 'lucide-react'

export function formatMathText(raw: string): string {
  if (!raw) return ''
  let text = raw
    // Convert LaTeX arrows and symbols
    .replace(/\\longrightarrow/g, '→')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\ne/g, '≠')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    // Remove TeX \text{...}, \mathbf{...}, \mathit{...} wrappers
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    // Convert common superscripts
    .replace(/\^2\b|\^\{2\}/g, '²')
    .replace(/\^3\b|\^\{3\}/g, '³')
    .replace(/\^n\b|\^\{n\}/g, 'ⁿ')
    // Convert common subscripts
    .replace(/_1\b|_\{1\}/g, '₁')
    .replace(/_2\b|_\{2\}/g, '₂')
    .replace(/_n\b|_\{n\}/g, 'ₙ')
    .replace(/_k\b|_\{k\}/g, 'ₖ')
    .replace(/_\{k\+1\}/g, 'ₖ₊₁')
    // Convert inline $...$ wrappers
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\$/g, '')
  return text
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
  topicSubtitle,
  prompt,
  progressPercent = 40,
  points = 75,
  quickQuestions = [
    'Why is this the answer?',
    'How to form the equation?',
    'Why discard negative root?'
  ],
  pits,
  initialHint,
  chapterId,
  conceptId,
  masteredConceptIds = [],
  onEvent,
  onAgentResponse,
  children,
  rightPanelHeaderExtra
}: SocraticSplitLayoutProps) {
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false)
  const [inp, setInp] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const [chat, setChat] = useState<Array<{ who: 'bot' | 'user'; text: string; timestamp: string }>>([])
  const [currentPoints] = useState(points)
  const [celebrationToast] = useState<{ title: string; xp: number; badge: string } | null>(null)

  const resolvedBlockType = blockType || json?.blockType || json?.id || 'algebra-tile'
  const resolvedPrompt = prompt || json?.content?.prompt || 'Explore the interactive simulation model.'

  // Dynamic Socratic Guide mathematical relationship model based on block type
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
    return 'When breadth = x, length is <b>2x + 1</b>. We know Area = L × B, so <b>528 = (2x + 1) · x</b>.'
  }, [initialHint, json?.socratic?.initialHint, resolvedBlockType, blockId])

  // Auto-scroll chat to bottom when new user queries or responses arrive
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
      timestamp: Date.now()
    }
    logEvent(evt)
    onEvent?.(evt)

    try {
      // 1. Primary: Live Backend FastAPI endpoint
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
          chat_history: chat.slice(-6).map((c) => ({ role: c.who, content: c.text }))
        })
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
          nextRecommendedConcept: data.next_recommended_concept
        })
        return
      }
    } catch {
      // Fallback
    }

    // 2. Secondary: Client-Side Fallback
    try {
      const res = await agent.ask({
        query: q,
        blockState: blockState || json?.algebra || {},
        blockType: resolvedBlockType,
        chapterId,
        conceptId,
        masteredConceptIds,
        pits: resolvedPits
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
          timestamp: timeStr
        }
      ])
    }
  }

  const togglePanel = () => {
    setIsRightPanelExpanded((prev) => !prev)
    const evt: LogEvent = {
      blockId: json?.id || blockId,
      type: 'panel-toggle',
      value: !isRightPanelExpanded ? 'expanded' : 'split',
      timestamp: Date.now()
    }
    logEvent(evt)
    onEvent?.(evt)
  }

  return (
    <div className="h-full flex-1 flex flex-col bg-cream text-forest overflow-hidden select-none font-ui leading-relaxed">
      {/* Top Header Bar */}
      <div className="h-[54px] flex items-center px-4 md:px-6 gap-4 border-b border-black/[0.08] bg-white z-20 shrink-0 shadow-xs">
        <div className="flex-1 flex items-center gap-3 max-w-[560px] mx-auto px-4">
          <div className="h-2 bg-cream border border-black/[0.08] rounded-full overflow-hidden flex-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, progressPercent))}%` }}
            />
          </div>
          <div className="flex gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[13px] font-bold bg-cream border border-black/10 px-3.5 py-1 rounded-full text-forest">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>{currentPoints} XP</span>
        </div>
      </div>

      {/* Floating Celebration Toast */}
      {celebrationToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce bg-white border-2 border-gold rounded-2xl px-6 py-3 shadow-card-hover flex items-center gap-3.5 text-forest select-none">
          <span className="text-3xl">👏</span>
          <div>
            <div className="text-[11px] font-bold text-gold uppercase flex items-center gap-1.5">
              <span>{celebrationToast.badge}</span>
              <span>Badge Unlocked: {celebrationToast.title}</span>
            </div>
            <div className="text-[12px] font-bold text-forest mt-0.5">
              +{celebrationToast.xp} XP Earned • Progress +10% ✦
            </div>
          </div>
        </div>
      )}

      {/* Interactive Knowledge Graph Roadmap Strip */}
      {chapterId && (
        <KnowledgeGraphRoadmap
          chapterId={chapterId}
          activeConceptId={conceptId}
          masteredConceptIds={masteredConceptIds}
          onAskHermes={(q) => sendQuery(q)}
        />
      )}

      {/* Main Split-Panel Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Socratic Guide */}
        <div
          className={`h-full bg-cream border-r border-black/[0.08] flex flex-col transition-all duration-300 ease-in-out relative ${
            isRightPanelExpanded
              ? 'w-0 min-w-0 border-r-0 opacity-0 overflow-hidden pointer-events-none'
              : 'w-[400px] min-w-[350px] max-w-[440px] shrink-0 opacity-100'
          }`}
        >
          {/* Welcome Intro Header */}
          <div className="px-5 pt-5 pb-3 shrink-0">
            <h3 className="font-display text-[15px] font-bold text-forest leading-snug">
              Welcome to {topicTitle || 'Linear & Quadratic Equations'}.
            </h3>
          </div>

          {/* Socratic Cards Stream */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
            {/* Card 1: ✦ Active Problem: */}
            <div className="bg-white rounded-[18px] p-4 border border-black/[0.06] shadow-card space-y-2">
              <div className="flex items-center gap-2 text-[12px] font-bold text-forest uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                <span>✦ Active Problem:</span>
              </div>
              <p className="text-[13px] text-forest/85 leading-relaxed">
                {resolvedPrompt}
              </p>
            </div>

            {/* Card 2: ✦ Socratic Guide: */}
            <div className="bg-white rounded-[18px] p-4 border border-black/[0.06] shadow-card space-y-2">
              <div className="flex items-center gap-2 text-[12px] font-bold text-forest uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>✦ Socratic Guide:</span>
              </div>
              <div
                className="text-[13px] text-forest/85 leading-relaxed font-mono"
                dangerouslySetInnerHTML={{ __html: formatMathText(socraticGuideText) }}
              />
            </div>

            {/* Card 3: ✦ 👁 Watching your interaction: */}
            {liveObservation && (
              <div className="bg-white rounded-[18px] p-4 border border-black/[0.06] shadow-card space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-800 uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✦ Watching your interaction:</span>
                </div>
                <div
                  className="text-[13px] text-forest/90 leading-relaxed font-mono bg-cream/70 rounded-xl p-3 border border-black/[0.04]"
                  dangerouslySetInnerHTML={{
                    __html: formatMathText(liveObservation),
                  }}
                />
              </div>
            )}

            {/* Dynamic Chat Messages (When user asks queries) */}
            {chat.map((m, i) => (
              <div
                key={i}
                className={`p-4 rounded-[18px] text-[13px] leading-relaxed shadow-sm ${
                  m.who === 'user'
                    ? 'bg-forest text-white ml-6 rounded-br-none'
                    : 'bg-white border border-black/[0.06] text-forest mr-6 rounded-bl-none shadow-card'
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: formatMathText(m.text) }} />
              </div>
            ))}

            {isTyping && (
              <div className="p-3.5 bg-white border border-black/[0.06] rounded-[18px] text-[12px] text-forest/60 flex items-center gap-2 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-gold animate-spin" />
                <span>Hermes is thinking...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Socratic Quick Prompts */}
          <div className="flex flex-col gap-1.5 px-5 py-2 shrink-0">
            {quickQuestions.slice(0, 2).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendQuery(q)}
                className="rounded-xl bg-white hover:bg-cream-card border border-black/[0.08] px-3.5 py-1.5 text-[12px] font-medium text-forest/80 hover:text-forest transition-all cursor-pointer shadow-xs text-left w-fit"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-4 pt-1 shrink-0 bg-cream">
            <div className="rounded-[16px] border border-black/[0.08] bg-white px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm focus-within:border-gold">
              <input
                value={inp}
                onChange={(e) => setInp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendQuery(inp)}
                placeholder="Ask Hermes a question..."
                className="flex-1 bg-transparent text-[13px] text-forest placeholder:text-forest/40 outline-none"
              />
              <button
                type="button"
                className="text-forest/40 hover:text-forest cursor-pointer p-1"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => sendQuery(inp)}
                disabled={!inp.trim()}
                className="h-7 w-7 rounded-lg bg-forest text-white hover:bg-forest-raised transition-all flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Boundary Collapse / Expand Toggle Button */}
        <button
          onClick={togglePanel}
          aria-label={isRightPanelExpanded ? 'Restore Socratic Chat' : 'Expand problem workspace'}
          title={isRightPanelExpanded ? 'Restore Chat (←)' : 'Expand workspace (→)'}
          className={`absolute top-1/2 -translate-y-1/2 z-40 cursor-pointer flex items-center justify-center w-4 h-16 bg-forest hover:bg-forest-raised text-white shadow-card border border-white/20 transition-all focus:outline-none ${
            isRightPanelExpanded ? 'left-0 rounded-r-full' : 'left-[400px] -translate-x-1/2 rounded-full'
          }`}
        >
          <div className="w-1 h-5 rounded-full bg-white/70" />
        </button>

        {/* Right Panel: Interactive Problem Workspace */}
        <div className="flex-1 min-w-0 bg-cream-card p-6 md:p-8 flex flex-col justify-between overflow-y-auto border-l border-black/[0.06]">
          {/* Goal of the Simulation */}
          {resolvedPrompt && (
            <div className="w-full mb-6 text-left shrink-0">
              <h2 className="font-display text-[18px] md:text-[22px] font-bold text-forest leading-snug tracking-tight">
                {resolvedPrompt}
              </h2>
            </div>
          )}

          {/* Centered Problem Workspace */}
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
