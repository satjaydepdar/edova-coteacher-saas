import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { TrigConceptSummary } from '../../lib/trig/trigApiClient'

interface TrigonometryDagModalProps {
  isOpen: boolean
  onClose: () => void
  concepts?: TrigConceptSummary[]
  activeConceptId?: string
  onSelectConcept?: (conceptId: string) => void
}

export interface DagNode {
  id: string
  title: string
  formula: string
  xp: string
  status: 'active' | 'unlocked' | 'locked'
  x: number
  y: number
  difficulty: string
  desc: string
  fullFormula: string
  prereq: string[]
  unlocks: string[]
  chapter: string
}

export interface DagEdge {
  from: string
  to: string
  status: 'active' | 'unlocked' | 'locked'
}

// 10-node CBSE Class 10 Trigonometry Directed Acyclic Graph Layout
// Compact positions for complete 1-frame visibility without horizontal scroll:
// TRIG-101 x60 y340, TRIG-102 x340 y340, TRIG-103 x620 y100, TRIG-104 x620 y230,
// TRIG-105 x620 y450, TRIG-106 x620 y580, TRIG-107 x900 y150, TRIG-108 x900 y280,
// TRIG-109 x900 y450, TRIG-110 x1180 y340
export const INITIAL_DAG_NODES: DagNode[] = [
  {
    id: 'TRIG-101',
    title: 'Right-Angled Triangle Anatomy',
    formula: 'c² = a² + b²',
    xp: '+1.5',
    status: 'active',
    x: 60,
    y: 340,
    difficulty: '1/5.0',
    desc: 'Master the side relationships (Hypotenuse, Opposite, Adjacent) and Pythagorean Theorem in right-angled triangles.',
    fullFormula: 'AC² = AB² + BC² → c² = a² + b²',
    prereq: [],
    unlocks: ['TRIG-102', 'TRIG-105'],
    chapter: 'NCERT Ch 8.1',
  },
  {
    id: 'TRIG-102',
    title: 'Primary Trigonometric Ratios',
    formula: 'sin, cos, tan',
    xp: '+2.0',
    status: 'unlocked',
    x: 340,
    y: 340,
    difficulty: '2/5.0',
    desc: 'Understand sine, cosine, tangent as ratios of sides. Foundation for all trigonometric problem solving.',
    fullFormula: 'sinθ = O/H, cosθ = A/H, tanθ = O/A',
    prereq: ['TRIG-101'],
    unlocks: ['TRIG-103', 'TRIG-105'],
    chapter: 'NCERT Ch 8.2',
  },
  {
    id: 'TRIG-103',
    title: 'Reciprocal Trigonometric Ratios',
    formula: 'cosec, sec, cot',
    xp: '+2.2',
    status: 'unlocked',
    x: 620,
    y: 100,
    difficulty: '2.5/5.0',
    desc: 'Cosecant, secant, cotangent as reciprocals of primary ratios. Inverse relationships and domain.',
    fullFormula: 'cosecθ = 1/sinθ, secθ = 1/cosθ, cotθ = 1/tanθ',
    prereq: ['TRIG-102'],
    unlocks: ['TRIG-104'],
    chapter: 'NCERT Ch 8.3',
  },
  {
    id: 'TRIG-104',
    title: 'Quotient & Product Relations',
    formula: 'tan = sin/cos',
    xp: '+2.5',
    status: 'locked',
    x: 620,
    y: 230,
    difficulty: '3/5.0',
    desc: 'How ratios interrelate through quotient and product rules, simplifying complex expressions.',
    fullFormula: 'tanθ = sinθ/cosθ, cotθ = cosθ/sinθ',
    prereq: ['TRIG-103'],
    unlocks: ['TRIG-107'],
    chapter: 'NCERT Ch 8.3',
  },
  {
    id: 'TRIG-105',
    title: 'Trigonometric Ratios of Standard Angles',
    formula: '0°, 30°, 45°, 60°, 90°',
    xp: '+2.4',
    status: 'unlocked',
    x: 620,
    y: 450,
    difficulty: '2.8/5.0',
    desc: 'Memorize and derive values for standard angles using equilateral and isosceles right triangles.',
    fullFormula: 'sin30=1/2, sin45=√2/2, sin60=√3/2',
    prereq: ['TRIG-102'],
    unlocks: ['TRIG-106'],
    chapter: 'NCERT Ch 8.3',
  },
  {
    id: 'TRIG-106',
    title: 'The Core Pythagorean Identity',
    formula: 'sin²+cos²=1',
    xp: '+3.0',
    status: 'locked',
    x: 620,
    y: 580,
    difficulty: '3.2/5.0',
    desc: 'The fundamental identity sin²θ + cos²θ = 1 and its geometric proof from unit circle.',
    fullFormula: 'sin²θ + cos²θ = 1 → 1 - sin²θ = cos²θ',
    prereq: ['TRIG-105'],
    unlocks: ['TRIG-107', 'TRIG-109'],
    chapter: 'NCERT Ch 8.4',
  },
  {
    id: 'TRIG-107',
    title: 'Derived Pythagorean Identities',
    formula: '1+tan²=sec²',
    xp: '+3.5',
    status: 'locked',
    x: 900,
    y: 150,
    difficulty: '3.8/5.0',
    desc: 'Derive secondary identities by dividing core identity by cos² and sin².',
    fullFormula: '1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ',
    prereq: ['TRIG-104', 'TRIG-106'],
    unlocks: ['TRIG-108', 'TRIG-109'],
    chapter: 'NCERT Ch 8.4',
  },
  {
    id: 'TRIG-108',
    title: 'Complex Trigonometric Proofs',
    formula: 'LHS ≡ RHS',
    xp: '+4.2',
    status: 'locked',
    x: 900,
    y: 280,
    difficulty: '4.5/5.0',
    desc: 'Advanced LHS-RHS proof techniques using identities, substitution and rationalization.',
    fullFormula: '(sinθ+cosθ)² = 1+2sinθcosθ',
    prereq: ['TRIG-107'],
    unlocks: ['TRIG-110'],
    chapter: 'NCERT Ch 8.4',
  },
  {
    id: 'TRIG-109',
    title: 'Applications: Angles of Elevation',
    formula: 'tanθ = h/d',
    xp: '+3.8',
    status: 'locked',
    x: 900,
    y: 450,
    difficulty: '4/5.0',
    desc: 'Real-world height & distance problems using angle of elevation and depression concepts.',
    fullFormula: 'tan(elevation) = Height / Distance',
    prereq: ['TRIG-106', 'TRIG-107'],
    unlocks: ['TRIG-110'],
    chapter: 'NCERT Ch 9.1',
  },
  {
    id: 'TRIG-110',
    title: 'Advanced Multi-Heights & Distances',
    formula: 'multi-triangle',
    xp: '+4.8',
    status: 'locked',
    x: 1180,
    y: 340,
    difficulty: '5/5.0',
    desc: 'Compound problems with two triangles, broken pillars, and moving observers.',
    fullFormula: 'h = d·tanθ₁·tanθ₂/(tanθ₂−tanθ₁)',
    prereq: ['TRIG-108', 'TRIG-109'],
    unlocks: [],
    chapter: 'NCERT Ch 9.2',
  },
]

export const DAG_EDGES: DagEdge[] = [
  { from: 'TRIG-101', to: 'TRIG-102', status: 'active' },
  { from: 'TRIG-102', to: 'TRIG-103', status: 'unlocked' },
  { from: 'TRIG-102', to: 'TRIG-105', status: 'unlocked' },
  { from: 'TRIG-103', to: 'TRIG-104', status: 'locked' },
  { from: 'TRIG-105', to: 'TRIG-106', status: 'unlocked' },
  { from: 'TRIG-104', to: 'TRIG-107', status: 'locked' },
  { from: 'TRIG-106', to: 'TRIG-107', status: 'locked' },
  { from: 'TRIG-106', to: 'TRIG-109', status: 'locked' },
  { from: 'TRIG-107', to: 'TRIG-108', status: 'locked' },
  { from: 'TRIG-107', to: 'TRIG-109', status: 'locked' },
  { from: 'TRIG-108', to: 'TRIG-110', status: 'locked' },
  { from: 'TRIG-109', to: 'TRIG-110', status: 'locked' },
]

const CANVAS_WIDTH = 1500
const CANVAS_HEIGHT = 760

export default function TrigonometryDagModal({
  isOpen,
  onClose,
  activeConceptId = 'TRIG-101',
  onSelectConcept,
}: TrigonometryDagModalProps) {
  // Normalize selected concept
  const normalizedInitial = useMemo(() => {
    if (!activeConceptId) return 'TRIG-101'
    const match = INITIAL_DAG_NODES.find(
      (n) => n.id.toLowerCase() === activeConceptId.toLowerCase(),
    )
    return match ? match.id : 'TRIG-101'
  }, [activeConceptId])

  // Interactive state
  const [nodes, setNodes] = useState<DagNode[]>(INITIAL_DAG_NODES)
  const [selectedId, setSelectedId] = useState<string>(normalizedInitial)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocusView, setIsFocusView] = useState(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Camera viewport: pan and zoom (default 0.88 fits 10 nodes centered)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.88)
  const [isPanning, setIsPanning] = useState(false)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const toastTimeoutRef = useRef<number | null>(null)

  // Individual node drag refs
  const dragNodeRef = useRef<{
    nodeId: string
    startPointer: { x: number; y: number }
    startNodePos: { x: number; y: number }
    hasMoved: boolean
  } | null>(null)

  // Synchronize initial node selection with active prop
  useEffect(() => {
    setSelectedId(normalizedInitial)
  }, [normalizedInitial])

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(msg)
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2500)
  }

  // Keyboard shortcut: Escape closes inspector first, or closes modal if inspector closed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isInspectorOpen) {
          setIsInspectorOpen(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isInspectorOpen, onClose])

  // Mouse wheel zoom (0.6x to 1.6x, smooth clamping, no visible UI cluster)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05
      setZoom((prev) => Math.min(1.6, Math.max(0.6, Number((prev + zoomDelta).toFixed(2)))))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Reset / Fit all 10 nodes in view
  const handleFitNodes = () => {
    setPan({ x: 0, y: 0 })
    setZoom(0.88)
    showToast('Reset view: all 10 nodes fitted')
  }

  // Selected node object
  const activeNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) || nodes[0],
    [nodes, selectedId],
  )

  // Dependency chain highlighting
  const highlightedChain = useMemo(() => {
    const currentId = hoveredId || selectedId
    if (!currentId) return new Set<string>()

    const chain = new Set<string>()
    chain.add(currentId)

    // Trace prerequisites upwards
    const addPrereqs = (id: string) => {
      const node = nodes.find((n) => n.id === id)
      if (!node) return
      node.prereq.forEach((pId) => {
        if (!chain.has(pId)) {
          chain.add(pId)
          addPrereqs(pId)
        }
      })
    }

    // Trace unlocks downwards
    const addUnlocks = (id: string) => {
      const node = nodes.find((n) => n.id === id)
      if (!node) return
      node.unlocks.forEach((uId) => {
        if (!chain.has(uId)) {
          chain.add(uId)
          addUnlocks(uId)
        }
      })
    }

    addPrereqs(currentId)
    addUnlocks(currentId)
    return chain
  }, [hoveredId, selectedId, nodes])

  // Filtered nodes based on search query
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set(nodes.map((n) => n.id))
    const q = searchQuery.toLowerCase()
    return new Set(
      nodes
        .filter(
          (n) =>
            n.id.toLowerCase().includes(q) ||
            n.title.toLowerCase().includes(q) ||
            n.formula.toLowerCase().includes(q) ||
            n.desc.toLowerCase().includes(q),
        )
        .map((n) => n.id),
    )
  }, [searchQuery, nodes])

  // Focus View set: active node + direct prereqs + direct unlocks
  const focusSet = useMemo(() => {
    if (!isFocusView) return null
    const baseNode = nodes.find((n) => n.id === selectedId)
    if (!baseNode) return null
    const s = new Set<string>([selectedId, ...baseNode.prereq, ...baseNode.unlocks])
    return s
  }, [isFocusView, selectedId, nodes])

  // --- INDIVIDUAL NODE DRAG HANDLERS ---
  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    if (e.button !== 0) return
    e.stopPropagation() // Stop canvas from starting pan!

    const targetNode = nodes.find((n) => n.id === nodeId)
    if (!targetNode) return

    dragNodeRef.current = {
      nodeId,
      startPointer: { x: e.clientX, y: e.clientY },
      startNodePos: { x: targetNode.x, y: targetNode.y },
      hasMoved: false,
    }

    setDraggingNodeId(nodeId)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  // Canvas background panning handlers
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-node="true"]')) return

    isPanningRef.current = true
    panStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    }
    setIsPanning(true)
    containerRef.current?.setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. If dragging an individual node
    if (dragNodeRef.current) {
      const drag = dragNodeRef.current
      const dx = (e.clientX - drag.startPointer.x) / zoom
      const dy = (e.clientY - drag.startPointer.y) / zoom

      if (!drag.hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        drag.hasMoved = true
      }

      if (drag.hasMoved) {
        const rawX = drag.startNodePos.x + dx
        const rawY = drag.startNodePos.y + dy

        // Clamp inside canvas coordinates (10 to CANVAS_WIDTH - 230, 10 to CANVAS_HEIGHT - 110)
        const clampedX = Math.max(10, Math.min(CANVAS_WIDTH - 230, Math.round(rawX)))
        const clampedY = Math.max(10, Math.min(CANVAS_HEIGHT - 110, Math.round(rawY)))

        setNodes((prev) =>
          prev.map((n) => (n.id === drag.nodeId ? { ...n, x: clampedX, y: clampedY } : n)),
        )
      }
      return
    }

    // 2. If panning canvas
    if (isPanningRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    // 1. Release individual node drag
    if (dragNodeRef.current) {
      const drag = dragNodeRef.current
      if (!drag.hasMoved) {
        // Was a clean click -> select node and open inspector
        setSelectedId(drag.nodeId)
        setIsInspectorOpen(true)
      }
      dragNodeRef.current = null
      setDraggingNodeId(null)
    }

    // 2. Release canvas pan
    if (isPanningRef.current) {
      isPanningRef.current = false
      setIsPanning(false)
    }
  }

  const handleCopyFormula = (formula: string) => {
    navigator.clipboard?.writeText(formula).catch(() => {})
    showToast(`Copied: ${formula}`)
  }

  const handlePracticeSelect = (nodeId: string) => {
    showToast(`Launching practice: ${nodeId}`)
    onSelectConcept?.(nodeId)
    onClose()
  }

  // Smooth cubic Bezier edge path with 80px control offset
  const getBezierPath = (fromNode: DagNode, toNode: DagNode) => {
    const x1 = fromNode.x + 220
    const y1 = fromNode.y + 48
    const x2 = toNode.x
    const y2 = toNode.y + 48
    const dx = x2 - x1
    const offset = dx > 0 ? Math.max(60, dx * 0.45) : 80
    return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF9F3] text-[#111814] flex flex-col h-screen w-screen overflow-hidden font-sans select-none antialiased">
      {/* HEADER (64px white border-b 1px #EDE8DD sticky z20) */}
      <header className="sticky top-0 z-20 h-[64px] bg-white border-b border-[#EDE8DD] flex items-center justify-between px-4 md:px-6 shrink-0 shadow-xs">
        {/* Left: Go back pill black #1A221E white 12px 500 h32 radius 999 + Practice Questions Newsreader 20px 600 #111814 + CBSE CLASS 10 DAG pill */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onClose}
            className="h-[32px] px-3.5 rounded-full bg-[#1A221E] text-white text-[12px] font-medium tracking-tight flex items-center gap-1.5 hover:bg-black transition-colors cursor-pointer shadow-xs"
          >
            <span>←</span> Go back
          </button>
          <div className="hidden sm:flex items-center gap-3">
            <span
              className="font-semibold text-[20px] tracking-tight text-[#111814]"
              style={{ fontFamily: 'Newsreader, Georgia, serif' }}
            >
              Practice Questions
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full bg-[#1A221E] text-white font-mono text-[10px] tracking-widest uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DDB56E]" /> CBSE CLASS 10 DAG
            </span>
          </div>
          <div
            className="sm:hidden text-[18px] font-semibold"
            style={{ fontFamily: 'Newsreader, Georgia, serif' }}
          >
            Practice Questions
          </div>
        </div>

        {/* Right: Mastery mono 10px #9CA3AF + progress track w140 h6 bg #EDE8DD fill #4A7C59 + 0% mono 11px 600 + Fullscreen pill + X circle 32px */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#9CA3AF]">
                MASTERY: 0/10 TOPICS
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-[140px] h-[6px] rounded-full bg-[#EDE8DD] overflow-hidden">
                  <div className="h-full bg-[#4A7C59] rounded-full" style={{ width: '8%' }} />
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#111814]">0%</span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="hidden md:inline-flex h-[28px] px-3 rounded-full bg-white border border-[#E2DDD1] text-[12px] text-[#6B7280] items-center gap-1.5 hover:border-[#1A221E] hover:text-[#1A221E] transition-colors cursor-pointer shadow-xs"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3 h-3" /> Exit
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" /> Fullscreen
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-[32px] h-[32px] rounded-full bg-white border border-[#EDE8DD] grid place-items-center text-[#6B7280] hover:text-[#111814] hover:border-[#1A221E] transition-colors cursor-pointer shadow-xs"
            title="Close DAG view (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* LEGEND BAR (white card radius12 border #EDE8DD margin 16 24 padding 10 16 flex between) */}
      <div className="mx-4 md:mx-6 my-3 md:my-3 bg-white border border-[#EDE8DD] rounded-[12px] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] shrink-0 z-20">
        {/* Left: ROADMAP LEGEND mono 10px #9CA3AF + dots 8px: Mastered black #111814 / Active Practice gold #DDB56E / Unlocked Ready green #4A7C59 / Locked grey #D6D0C2 + labels 11px 500 */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-mono text-[10px] tracking-widest text-[#9CA3AF] uppercase font-semibold">
            ROADMAP LEGEND
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#111814] inline-block" />
            <span className="text-[#111814]">Mastered</span>
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#DDB56E] inline-block shadow-[0_0_0_2px_rgba(221,181,110,0.25)]" />
            <span className="text-[#111814]">Active Practice</span>
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#4A7C59] inline-block" />
            <span className="text-[#111814]">Unlocked Ready</span>
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#D6D0C2] inline-block" />
            <span className="text-[#6B7280]">Locked</span>
          </span>
        </div>

        {/* Right: Focus View toggle pill h32 beige #F6F1E6 + Filter nodes input white #FFF border #E2DDD1 h32 radius 999 w200 placeholder Inter 12px + 10 NODES • 12 EDGES pill + Fit 10 nodes */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsFocusView((prev) => !prev)}
            className={`h-[32px] px-3 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
              isFocusView
                ? 'bg-[#1A221E] text-white border-[#1A221E] shadow-xs'
                : 'bg-[#F6F1E6] text-[#111814] border-[#EDE8DD] hover:border-[#1A221E]'
            }`}
            title="Focus only on active node and direct dependencies"
          >
            {isFocusView ? (
              <EyeOff className="w-3.5 h-3.5 text-[#DDB56E]" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            Focus View
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[32px] pl-8 pr-7 w-[180px] md:w-[200px] rounded-full bg-white border border-[#E2DDD1] text-[12px] placeholder-[#9CA3AF] text-[#111814] focus:outline-none focus:border-[#1A221E] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111814]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="h-[32px] px-3 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] flex items-center gap-1.5 font-mono text-[10px] font-semibold text-[#6B7280]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
            10 NODES • 12 EDGES
          </div>

          <button
            onClick={handleFitNodes}
            className="h-[32px] px-3.5 rounded-full bg-white border border-[#E2DDD1] text-[11px] font-medium text-[#111814] hover:border-[#1A221E] hover:bg-[#F6F1E6] transition-all cursor-pointer shadow-xs"
            title="Reset camera and fit all 10 nodes centered"
          >
            Fit 10 nodes
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT flex row h calc(100vh - 140px) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Graph Canvas flex1 bg #FBF9F3 relative overflow hidden */}
        <div
          ref={containerRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`flex-1 bg-[#FBF9F3] relative overflow-hidden select-none ${
            isPanning || draggingNodeId ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            backgroundImage: 'radial-gradient(#D6D0C2 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Zoomable & Pannable Virtual Stage */}
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            }}
          >
            {/* SVG Connectors Layer (z1 behind nodes) */}
            <svg
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="absolute left-0 top-0 pointer-events-none"
              style={{ zIndex: 1, overflow: 'visible' }}
            >
              <defs>
                {/* Always visible 8px triangle marker matching stroke color */}
                <marker
                  id="arrow-locked"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#C2C2C2" />
                </marker>
                <marker
                  id="arrow-unlocked"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#6B8F75" />
                </marker>
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#DDB56E" />
                </marker>
              </defs>

              {DAG_EDGES.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.from)
                const toNode = nodes.find((n) => n.id === edge.to)
                if (!fromNode || !toNode) return null

                const isPathActive =
                  highlightedChain.has(edge.from) &&
                  highlightedChain.has(edge.to) &&
                  (hoveredId || selectedId)

                const isDirectEdge =
                  (selectedId === edge.from ||
                    selectedId === edge.to ||
                    hoveredId === edge.from ||
                    hoveredId === edge.to) &&
                  isPathActive

                const isFiltered = filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to)
                const isFocused = !focusSet || (focusSet.has(edge.from) && focusSet.has(edge.to))
                const opacity = !isFiltered ? 0.15 : !isFocused ? 0.15 : isDirectEdge ? 1 : 0.8

                // Connector styling per v5 tokens
                let strokeColor = '#C2C2C2'
                let strokeWidth = 1.25
                let strokeDash: string | undefined = '6 4'
                let markerEnd = 'url(#arrow-locked)'

                if (isDirectEdge || edge.status === 'active') {
                  strokeColor = '#DDB56E'
                  strokeWidth = 2
                  strokeDash = undefined
                  markerEnd = 'url(#arrow-active)'
                } else if (edge.status === 'unlocked') {
                  strokeColor = '#6B8F75'
                  strokeWidth = 1.5
                  strokeDash = undefined
                  markerEnd = 'url(#arrow-unlocked)'
                }

                return (
                  <path
                    key={`${edge.from}->${edge.to}`}
                    d={getBezierPath(fromNode, toNode)}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={markerEnd}
                    opacity={opacity}
                    style={{ transition: 'opacity 0.2s ease, stroke 0.2s ease' }}
                  />
                )
              })}
            </svg>

            {/* 10 Nodes - Individual Node Drag + High Legibility 220px Cards */}
            {nodes.map((node) => {
              const isSelected = selectedId === node.id
              const isHovered = hoveredId === node.id
              const isDragging = draggingNodeId === node.id
              const isDimmedByFilter = !filteredNodeIds.has(node.id)
              const isDimmedByFocus = Boolean(focusSet && !focusSet.has(node.id))
              const isHighlighted = highlightedChain.has(node.id)

              const zIndex = isDragging ? 30 : isSelected ? 20 : isHovered ? 10 : 2
              const opacity = isDimmedByFilter ? 0.25 : isDimmedByFocus ? 0.2 : 1
              const scale = isDragging ? 1.02 : isDimmedByFocus ? 0.9 : 1
              const isLongTitle = node.title.length > 28

              return (
                <div
                  key={node.id}
                  data-node="true"
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                  onPointerEnter={() => setHoveredId(node.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  className={`absolute w-[220px] min-h-[96px] h-auto rounded-[16px] flex flex-col justify-between select-none cursor-pointer transition-shadow ${
                    node.status === 'active'
                      ? 'bg-[#1A221E] text-white border-[2px] border-[#DDB56E] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.12)]'
                      : node.status === 'locked'
                      ? 'bg-[#FFFFFF] border border-[#E2DDD1] text-[#9CA3AF]'
                      : 'bg-[#FFFFFF] border border-[#EDE8DD] text-[#111814] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]'
                  } ${
                    isDragging
                      ? 'shadow-[0_12px_32px_rgba(0,0,0,0.22)] cursor-grabbing'
                      : isSelected
                      ? 'translate-y-[-2px] shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                      : isHovered && !isDimmedByFocus
                      ? 'translate-y-[-2px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
                      : ''
                  }`}
                  style={{
                    left: node.x,
                    top: node.y,
                    zIndex,
                    opacity,
                    padding: '14px 16px',
                    transform: `scale(${scale}) ${
                      !isDragging && (isSelected || (isHovered && !isDimmedByFocus))
                        ? 'translateY(-2px)'
                        : 'translateY(0)'
                    }`,
                    filter: isHighlighted ? 'none' : 'saturate(0.95)',
                    touchAction: 'none',
                  }}
                >
                  {/* Top Row: ID mono 10px #9CA3AF + status dot 8px / lock 12px */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-[10px] tracking-wide leading-none font-semibold ${
                        node.status === 'active' ? 'text-[#EDE8DD]' : 'text-[#9CA3AF]'
                      }`}
                    >
                      {node.id}
                    </span>
                    <span className="flex items-center">
                      {node.status === 'active' ? (
                        <span className="w-2 h-2 rounded-full bg-[#DDB56E] shadow-[0_0_0_3px_rgba(221,181,110,0.25)]" />
                      ) : node.status === 'locked' ? (
                        <Lock className="w-3 h-3 text-[#9CA3AF]" style={{ width: 12, height: 12 }} />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#4A7C59]" />
                      )}
                    </span>
                  </div>

                  {/* Title: Inter 12px 600 -webkit-line-clamp 2 NO ellipsis NO truncation */}
                  <div
                    className="font-semibold"
                    style={{
                      fontSize: isLongTitle ? '11px' : '12px',
                      lineHeight: '1.3',
                      color:
                        node.status === 'active'
                          ? '#FFFFFF'
                          : node.status === 'locked'
                          ? '#9CA3AF'
                          : '#111814',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      whiteSpace: 'normal',
                      overflow: 'visible',
                      wordBreak: 'break-word',
                      marginTop: '6px',
                    }}
                  >
                    {node.title}
                  </div>

                  {/* Formula Row: flex-wrap wrap gap 6px with fully visible formula pill & XP badge */}
                  <div className="flex flex-wrap gap-[6px] items-center justify-between mt-2.5">
                    <span
                      className={`font-mono text-[11px] px-[10px] py-[4px] rounded-[999px] border whitespace-nowrap overflow-visible ${
                        node.status === 'active'
                          ? 'bg-[#2A332F] text-[#EDE8DD] border-[#3A4A3E]'
                          : node.status === 'locked'
                          ? 'bg-[#F6F1E6] text-[#9CA3AF] border-[#EDE8DD]'
                          : 'bg-[#F6F1E6] text-[#6B7280] border-[#EDE8DD]'
                      }`}
                      style={{ lineHeight: '1.2' }}
                    >
                      {node.formula}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-[8px] py-[3px] rounded-[999px] border flex items-center gap-0.5 whitespace-nowrap overflow-visible font-medium ${
                        node.status === 'active'
                          ? 'bg-[#DDB56E] text-[#1A221E] border-[#DDB56E] font-semibold'
                          : 'bg-[#F6F1E6] text-[#9CA3AF] border-[#EDE8DD]'
                      }`}
                      style={{ lineHeight: '1.2' }}
                    >
                      ★{node.xp}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* MINIMAP bottom-right 140x90: position bottom 24 right 364 when open, right 24 when closed */}
          <div
            className="hidden sm:block absolute bottom-6 z-10 bg-white border border-[#EDE8DD] rounded-[12px] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)] pointer-events-none transition-all duration-300 ease-out"
            style={{
              right: isInspectorOpen ? '364px' : '24px',
              width: 140,
              height: 90,
            }}
          >
            <div className="w-full h-full relative bg-[#FBF9F3] rounded-[8px] overflow-hidden border border-[#EDE8DD]/60">
              {/* Node dots */}
              {nodes.map((n) => {
                const mx = (n.x / CANVAS_WIDTH) * 120 + 2
                const my = (n.y / CANVAS_HEIGHT) * 72 + 2
                return (
                  <div
                    key={n.id}
                    className="absolute w-[4px] h-[4px] rounded-full"
                    style={{
                      left: mx,
                      top: my,
                      backgroundColor:
                        n.id === selectedId
                          ? '#1A221E'
                          : n.status === 'active'
                          ? '#DDB56E'
                          : n.status === 'unlocked'
                          ? '#4A7C59'
                          : '#D6D0C2',
                    }}
                  />
                )
              })}

              {/* Viewport gold 1px rect */}
              <div
                className="absolute border border-[#DDB56E] bg-[#DDB56E]/10 rounded-[2px]"
                style={{
                  left: Math.max(0, (-pan.x / zoom / CANVAS_WIDTH) * 124),
                  top: Math.max(0, (-pan.y / zoom / CANVAS_HEIGHT) * 74),
                  width: Math.min(124, Math.max(16, (800 / zoom / CANVAS_WIDTH) * 124)),
                  height: Math.min(74, Math.max(12, (500 / zoom / CANVAS_HEIGHT) * 74)),
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR 340px white border-l 1px #EDE8DD z10 transform transition 300ms */}
        <aside
          className={`w-[340px] bg-white border-l border-[#EDE8DD] z-20 flex flex-col shrink-0 transition-transform duration-300 ease-out absolute lg:relative right-0 top-0 bottom-0 ${
            isInspectorOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            boxShadow: isInspectorOpen ? '-4px 0 24px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          {/* Handle: absolute left -24px top 50% translateY -50% w24 h48 bg #FFFFFF border 1px #EDE8DD border-r 0 radius 8px 0 0 8px */}
          <button
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-[#EDE8DD] border-r-0 rounded-l-[8px] shadow-[-4px_0_12px_rgba(0,0,0,0.08)] flex items-center justify-center cursor-pointer text-[#6B7280] hover:text-[#111814] z-30 transition-colors"
            title={isInspectorOpen ? 'Collapse inspector (Esc)' : 'Open inspector'}
            aria-label={isInspectorOpen ? 'Collapse inspector' : 'Open inspector'}
          >
            {isInspectorOpen ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Inspector Header */}
          <div className="p-5 border-b border-[#EDE8DD] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#9CA3AF] tracking-widest uppercase font-semibold">
                {activeNode.id}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F6F1E6] text-[#6B7280] font-mono text-[10px] border border-[#EDE8DD]">
                Diff {activeNode.difficulty}
              </span>
            </div>
            <div>
              {activeNode.status === 'active' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#1A221E] text-[#DDB56E] text-[10px] font-mono font-medium border border-[#3A4A3E]">
                  Active Practice
                </span>
              ) : activeNode.status === 'unlocked' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#E6F0E8] text-[#4A7C59] text-[10px] font-mono font-medium border border-[#BBF7D0]">
                  Ready to Practice
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-[#F6F1E6] text-[#9CA3AF] text-[10px] font-mono font-medium border border-[#EDE8DD] flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </span>
              )}
            </div>
          </div>

          {/* Inspector Body Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <div>
              <h3
                className="text-[18px] font-bold text-[#111814] leading-snug"
                style={{ fontFamily: 'Newsreader, Georgia, serif' }}
              >
                {activeNode.title}
              </h3>
              <p className="mt-1.5 text-[12px] text-[#6B7280] leading-[1.5]">
                {activeNode.desc}
              </p>
            </div>

            {/* Formula Card: mono 12px bg #F6F1E6 border #EDE8DD radius 8px padding 10 12 with copy icon */}
            <div className="bg-[#F6F1E6] border border-[#EDE8DD] rounded-[8px] p-3">
              <div className="flex items-center justify-between text-[#9CA3AF] text-[10px] font-mono uppercase tracking-widest font-semibold mb-1.5">
                <span>Core Formula / Identity</span>
                <button
                  onClick={() => handleCopyFormula(activeNode.fullFormula)}
                  className="hover:text-[#111814] transition-colors cursor-pointer"
                  title="Copy formula"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="font-mono text-[12px] text-[#111814] font-medium break-all select-text">
                {activeNode.fullFormula}
              </div>
            </div>

            {/* Prerequisites & Unlocks */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-[8px] bg-[#FBF9F3] border border-[#EDE8DD]">
                <div className="font-mono text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">
                  Prerequisites
                </div>
                {activeNode.prereq.length === 0 ? (
                  <span className="text-[#9CA3AF] italic">None (Root)</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {activeNode.prereq.map((p) => (
                      <span
                        key={p}
                        onClick={() => setSelectedId(p)}
                        className="px-1.5 py-0.5 rounded bg-white border border-[#EDE8DD] font-mono text-[10px] text-[#111814] hover:border-[#1A221E] cursor-pointer"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#FBF9F3] border border-[#EDE8DD]">
                <div className="font-mono text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">
                  Unlocks
                </div>
                {activeNode.unlocks.length === 0 ? (
                  <span className="text-[#9CA3AF] italic">Final convergence</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {activeNode.unlocks.map((u) => (
                      <span
                        key={u}
                        onClick={() => setSelectedId(u)}
                        className="px-1.5 py-0.5 rounded bg-white border border-[#EDE8DD] font-mono text-[10px] text-[#111814] hover:border-[#1A221E] cursor-pointer"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chapter Reference */}
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] py-1 border-t border-[#EDE8DD]">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#9CA3AF]" /> {activeNode.chapter}
              </span>
              <span className="font-mono text-[10px] text-[#9CA3AF]">
                XP Reward: ★{activeNode.xp}
              </span>
            </div>

            {/* CTA Button: if unlocked black #1A221E white h44 radius12 Practice →, if locked beige disabled */}
            <div className="pt-2">
              {activeNode.status === 'locked' ? (
                <button
                  disabled
                  className="w-full h-[44px] rounded-[12px] bg-[#F6F1E6] border border-[#EDE8DD] text-[#9CA3AF] text-[12px] font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" /> Complete prerequisites
                </button>
              ) : (
                <button
                  onClick={() => handlePracticeSelect(activeNode.id)}
                  className="w-full h-[44px] rounded-[12px] bg-[#1A221E] hover:bg-black text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:gap-3"
                >
                  <span>Practice {activeNode.id}</span>
                  <ArrowRight className="w-4 h-4 text-[#DDB56E]" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Footer */}
          <div className="mt-auto p-4 bg-[#FBF9F3] border-t border-[#EDE8DD] shrink-0">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#9CA3AF] uppercase tracking-widest font-semibold">
              <span>Class Progress</span>
              <span className="text-[#111814]">0 / 10 Topics</span>
            </div>
            <div className="mt-2 h-[6px] w-full bg-[#EDE8DD] rounded-full overflow-hidden">
              <div className="h-full bg-[#1A221E] rounded-full" style={{ width: '10%' }} />
            </div>
          </div>
        </aside>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A221E] text-white text-[12px] font-medium px-4 py-2 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.24)] border border-[#2A332F] max-w-[90vw] truncate pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
