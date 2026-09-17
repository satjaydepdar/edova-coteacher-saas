import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Maximize2,
  Minimize2,
  Search,
  X,
} from 'lucide-react'

/** Shared DAG explorer for every subject's concept graph -- Trigonometry and
 * Coordinate Geometry both render through this, so the layout/interaction model
 * (pan, zoom, drag, focus view, search, minimap, inspector) stays identical by
 * construction instead of by two hand-kept-in-sync copies. Node positions are
 * computed from the real prerequisite graph (longest-path depth layout), not
 * hand-placed -- the previous per-subject modal hardcoded pixel positions
 * per node, which doesn't scale to more subjects and is what caused
 * Trigonometry and Coordinate Geometry to look different in the first place. */

export interface DagConceptLike {
  id: string
  title: string
  chapter: string
  difficulty: number
  description: string | null
  formula_reference: string | null
  prerequisites: string[]
  is_unlocked: boolean
  is_completed: boolean
  mastery_score: number
}

interface ConceptDagModalProps {
  isOpen: boolean
  onClose: () => void
  subjectLabel: string // e.g. "CBSE CLASS 10 DAG"
  concepts: DagConceptLike[]
  activeConceptId: string
  onSelectConcept: (conceptId: string) => void
}

type NodeStatus = 'active' | 'mastered' | 'unlocked' | 'locked'

interface LaidOutNode extends DagConceptLike {
  x: number
  y: number
  unlocks: string[]
  status: NodeStatus
}

const COL_WIDTH = 280
const ROW_HEIGHT = 130
const NODE_WIDTH = 220
const NODE_HEIGHT = 96
const CANVAS_PADDING = 60

function useLayout(concepts: DagConceptLike[], activeConceptId: string) {
  return useMemo(() => {
    const byId = new Map(concepts.map((c) => [c.id, c]))
    const depthCache = new Map<string, number>()

    function depthOf(id: string, seen: Set<string> = new Set()): number {
      if (depthCache.has(id)) return depthCache.get(id)!
      if (seen.has(id)) return 0
      const c = byId.get(id)
      if (!c || c.prerequisites.length === 0) {
        depthCache.set(id, 0)
        return 0
      }
      const d = 1 + Math.max(...c.prerequisites.map((p) => depthOf(p, new Set([...seen, id]))))
      depthCache.set(id, d)
      return d
    }

    const unlocksById = new Map<string, string[]>()
    for (const c of concepts) {
      for (const prereqId of c.prerequisites) {
        unlocksById.set(prereqId, [...(unlocksById.get(prereqId) || []), c.id])
      }
    }

    const columns = new Map<number, DagConceptLike[]>()
    for (const c of concepts) {
      const d = depthOf(c.id)
      if (!columns.has(d)) columns.set(d, [])
      columns.get(d)!.push(c)
    }

    const maxRows = Math.max(1, ...Array.from(columns.values()).map((v) => v.length))
    const nodes: LaidOutNode[] = []
    for (const [depth, colConcepts] of columns) {
      const colHeight = colConcepts.length * ROW_HEIGHT
      const totalHeight = maxRows * ROW_HEIGHT
      const startY = CANVAS_PADDING + (totalHeight - colHeight) / 2
      colConcepts.forEach((c, i) => {
        const status: NodeStatus =
          c.id === activeConceptId ? 'active' : c.is_completed ? 'mastered' : c.is_unlocked ? 'unlocked' : 'locked'
        nodes.push({
          ...c,
          x: CANVAS_PADDING + depth * COL_WIDTH,
          y: startY + i * ROW_HEIGHT,
          unlocks: unlocksById.get(c.id) || [],
          status,
        })
      })
    }

    const width = CANVAS_PADDING * 2 + Math.max(0, columns.size - 1) * COL_WIDTH + NODE_WIDTH
    const height = CANVAS_PADDING * 2 + maxRows * ROW_HEIGHT
    return { nodes, width, height }
  }, [concepts, activeConceptId])
}

export default function ConceptDagModal({
  isOpen,
  onClose,
  subjectLabel,
  concepts,
  activeConceptId,
  onSelectConcept,
}: ConceptDagModalProps) {
  const { nodes, width: canvasWidth, height: canvasHeight } = useLayout(concepts, activeConceptId)

  const [selectedId, setSelectedId] = useState<string>(activeConceptId)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocusView, setIsFocusView] = useState(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.88)
  const [isPanning, setIsPanning] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const toastTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    setSelectedId(activeConceptId)
  }, [activeConceptId])

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(msg)
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2500)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isInspectorOpen) setIsInspectorOpen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isInspectorOpen, onClose])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05
      setZoom((prev) => Math.min(1.6, Math.max(0.5, Number((prev + zoomDelta).toFixed(2)))))
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const handleFitNodes = () => {
    setPan({ x: 0, y: 0 })
    setZoom(0.88)
    showToast(`Reset view: all ${nodes.length} nodes fitted`)
  }

  const activeNode = useMemo(() => nodes.find((n) => n.id === selectedId) || nodes[0], [nodes, selectedId])

  const highlightedChain = useMemo(() => {
    const currentId = hoveredId || selectedId
    if (!currentId) return new Set<string>()
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const chain = new Set<string>([currentId])
    const addPrereqs = (id: string) => {
      byId.get(id)?.prerequisites.forEach((pId) => {
        if (!chain.has(pId)) {
          chain.add(pId)
          addPrereqs(pId)
        }
      })
    }
    const addUnlocks = (id: string) => {
      byId.get(id)?.unlocks.forEach((uId) => {
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

  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set(nodes.map((n) => n.id))
    const q = searchQuery.toLowerCase()
    return new Set(
      nodes
        .filter(
          (n) =>
            n.id.toLowerCase().includes(q) ||
            n.title.toLowerCase().includes(q) ||
            (n.formula_reference || '').toLowerCase().includes(q) ||
            (n.description || '').toLowerCase().includes(q),
        )
        .map((n) => n.id),
    )
  }, [searchQuery, nodes])

  const focusSet = useMemo(() => {
    if (!isFocusView) return null
    const baseNode = nodes.find((n) => n.id === selectedId)
    if (!baseNode) return null
    return new Set<string>([selectedId, ...baseNode.prerequisites, ...baseNode.unlocks])
  }, [isFocusView, selectedId, nodes])

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-node="true"]')) return
    isPanningRef.current = true
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    setIsPanning(true)
    containerRef.current?.setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y })
    }
  }

  const handlePointerUp = () => {
    isPanningRef.current = false
    setIsPanning(false)
  }

  const handleCopyFormula = (formula: string) => {
    navigator.clipboard?.writeText(formula).catch(() => {})
    showToast(`Copied: ${formula}`)
  }

  const handlePracticeSelect = (nodeId: string) => {
    showToast(`Launching practice: ${nodeId}`)
    onSelectConcept(nodeId)
    onClose()
  }

  const getBezierPath = (fromNode: LaidOutNode, toNode: LaidOutNode) => {
    const x1 = fromNode.x + NODE_WIDTH
    const y1 = fromNode.y + NODE_HEIGHT / 2
    const x2 = toNode.x
    const y2 = toNode.y + NODE_HEIGHT / 2
    const dx = x2 - x1
    const offset = dx > 0 ? Math.max(60, dx * 0.45) : 80
    return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`
  }

  if (!isOpen) return null

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const edges: { from: LaidOutNode; to: LaidOutNode }[] = []
  for (const n of nodes) {
    for (const prereqId of n.prerequisites) {
      const from = byId.get(prereqId)
      if (from) edges.push({ from, to: n })
    }
  }

  const masteredCount = concepts.filter((c) => c.is_completed).length
  const masteryPct = concepts.length ? Math.round((masteredCount / concepts.length) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF9F3] text-[#111814] flex flex-col h-screen w-screen overflow-hidden font-sans select-none antialiased">
      <header className="sticky top-0 z-20 h-[64px] bg-white border-b border-[#EDE8DD] flex items-center justify-between px-4 md:px-6 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onClose}
            className="h-[32px] px-3.5 rounded-full bg-[#1A221E] text-white text-[12px] font-medium tracking-tight flex items-center gap-1.5 hover:bg-black transition-colors cursor-pointer shadow-xs"
          >
            <span>←</span> Go back
          </button>
          <div className="hidden sm:flex items-center gap-3">
            <span className="font-semibold text-[20px] tracking-tight text-[#111814]" style={{ fontFamily: 'Newsreader, Georgia, serif' }}>
              Practice Questions
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full bg-[#1A221E] text-white font-mono text-[10px] tracking-widest uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DDB56E]" /> {subjectLabel}
            </span>
          </div>
          <div className="sm:hidden text-[18px] font-semibold" style={{ fontFamily: 'Newsreader, Georgia, serif' }}>
            Practice Questions
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#9CA3AF]">
                MASTERY: {masteredCount}/{concepts.length} TOPICS
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-[140px] h-[6px] rounded-full bg-[#EDE8DD] overflow-hidden">
                  <div className="h-full bg-[#4A7C59] rounded-full" style={{ width: `${masteryPct}%` }} />
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#111814]">{masteryPct}%</span>
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

      <div className="mx-4 md:mx-6 my-3 md:my-3 bg-white border border-[#EDE8DD] rounded-[12px] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] shrink-0 z-20">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-mono text-[10px] tracking-widest text-[#9CA3AF] uppercase font-semibold">ROADMAP LEGEND</span>
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

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsFocusView((prev) => !prev)}
            className={`h-[32px] px-3 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
              isFocusView ? 'bg-[#1A221E] text-white border-[#1A221E] shadow-xs' : 'bg-[#F6F1E6] text-[#111814] border-[#EDE8DD] hover:border-[#1A221E]'
            }`}
            title="Focus only on active node and direct dependencies"
          >
            {isFocusView ? <EyeOff className="w-3.5 h-3.5 text-[#DDB56E]" /> : <Eye className="w-3.5 h-3.5" />}
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
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111814]">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="h-[32px] px-3 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] flex items-center gap-1.5 font-mono text-[10px] font-semibold text-[#6B7280]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
            {nodes.length} NODES • {edges.length} EDGES
          </div>

          <button
            onClick={handleFitNodes}
            className="h-[32px] px-3.5 rounded-full bg-white border border-[#E2DDD1] text-[11px] font-medium text-[#111814] hover:border-[#1A221E] hover:bg-[#F6F1E6] transition-all cursor-pointer shadow-xs"
            title={`Reset camera and fit all ${nodes.length} nodes centered`}
          >
            Fit {nodes.length} nodes
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div
          ref={containerRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`flex-1 bg-[#FBF9F3] relative overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ backgroundImage: 'radial-gradient(#D6D0C2 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: canvasWidth, height: canvasHeight }}
          >
            <svg width={canvasWidth} height={canvasHeight} className="absolute left-0 top-0 pointer-events-none" style={{ zIndex: 1, overflow: 'visible' }}>
              <defs>
                <marker id="arrow-locked" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#C2C2C2" />
                </marker>
                <marker id="arrow-unlocked" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#6B8F75" />
                </marker>
                <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#DDB56E" />
                </marker>
              </defs>

              {edges.map((edge, i) => {
                const isPathActive = highlightedChain.has(edge.from.id) && highlightedChain.has(edge.to.id) && Boolean(hoveredId || selectedId)
                const isDirectEdge =
                  (selectedId === edge.from.id || selectedId === edge.to.id || hoveredId === edge.from.id || hoveredId === edge.to.id) && isPathActive
                const isFiltered = filteredNodeIds.has(edge.from.id) && filteredNodeIds.has(edge.to.id)
                const isFocused = !focusSet || (focusSet.has(edge.from.id) && focusSet.has(edge.to.id))
                const opacity = !isFiltered ? 0.15 : !isFocused ? 0.15 : isDirectEdge ? 1 : 0.8

                let strokeColor = '#C2C2C2'
                let strokeWidth = 1.25
                let strokeDash: string | undefined = '6 4'
                let markerEnd = 'url(#arrow-locked)'
                if (isDirectEdge || edge.to.status === 'active') {
                  strokeColor = '#DDB56E'
                  strokeWidth = 2
                  strokeDash = undefined
                  markerEnd = 'url(#arrow-active)'
                } else if (edge.to.is_unlocked) {
                  strokeColor = '#6B8F75'
                  strokeWidth = 1.5
                  strokeDash = undefined
                  markerEnd = 'url(#arrow-unlocked)'
                }

                return (
                  <path
                    key={i}
                    d={getBezierPath(edge.from, edge.to)}
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

            {nodes.map((node) => {
              const isSelected = selectedId === node.id
              const isHovered = hoveredId === node.id
              const isDimmedByFilter = !filteredNodeIds.has(node.id)
              const isDimmedByFocus = Boolean(focusSet && !focusSet.has(node.id))
              const isLongTitle = node.title.length > 28
              const zIndex = isSelected ? 20 : isHovered ? 10 : 2
              const opacity = isDimmedByFilter ? 0.25 : isDimmedByFocus ? 0.2 : 1
              const scale = isDimmedByFocus ? 0.9 : 1

              return (
                <div
                  key={node.id}
                  data-node="true"
                  onClick={() => {
                    setSelectedId(node.id)
                    setIsInspectorOpen(true)
                  }}
                  onPointerEnter={() => setHoveredId(node.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  className={`absolute w-[220px] min-h-[96px] h-auto rounded-[16px] flex flex-col justify-between select-none cursor-pointer transition-shadow ${
                    node.status === 'active'
                      ? 'bg-[#1A221E] text-white border-[2px] border-[#DDB56E] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.12)]'
                      : node.status === 'locked'
                      ? 'bg-[#FFFFFF] border border-[#E2DDD1] text-[#9CA3AF]'
                      : 'bg-[#FFFFFF] border border-[#EDE8DD] text-[#111814] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]'
                  } ${isSelected ? 'translate-y-[-2px] shadow-[0_4px_16px_rgba(0,0,0,0.12)]' : isHovered && !isDimmedByFocus ? 'translate-y-[-2px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]' : ''}`}
                  style={{
                    left: node.x,
                    top: node.y,
                    zIndex,
                    opacity,
                    padding: '14px 16px',
                    transform: `scale(${scale})`,
                    touchAction: 'none',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-[10px] tracking-wide leading-none font-semibold ${node.status === 'active' ? 'text-[#EDE8DD]' : 'text-[#9CA3AF]'}`}>
                      {node.id.toUpperCase()}
                    </span>
                    <span className="flex items-center">
                      {node.status === 'active' ? (
                        <span className="w-2 h-2 rounded-full bg-[#DDB56E] shadow-[0_0_0_3px_rgba(221,181,110,0.25)]" />
                      ) : node.status === 'locked' ? (
                        <Lock className="w-3 h-3 text-[#9CA3AF]" style={{ width: 12, height: 12 }} />
                      ) : node.status === 'mastered' ? (
                        <span className="w-2 h-2 rounded-full bg-[#111814]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#4A7C59]" />
                      )}
                    </span>
                  </div>

                  <div
                    className="font-semibold"
                    style={{
                      fontSize: isLongTitle ? '11px' : '12px',
                      lineHeight: '1.3',
                      color: node.status === 'active' ? '#FFFFFF' : node.status === 'locked' ? '#9CA3AF' : '#111814',
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

                  <div className="flex flex-wrap gap-[6px] items-center justify-between mt-2.5">
                    <span
                      className={`font-mono text-[10.5px] px-[10px] py-[4px] rounded-[999px] border whitespace-nowrap overflow-visible truncate max-w-[150px] ${
                        node.status === 'active' ? 'bg-[#2A332F] text-[#EDE8DD] border-[#3A4A3E]' : node.status === 'locked' ? 'bg-[#F6F1E6] text-[#9CA3AF] border-[#EDE8DD]' : 'bg-[#F6F1E6] text-[#6B7280] border-[#EDE8DD]'
                      }`}
                      style={{ lineHeight: '1.2' }}
                      title={node.formula_reference || ''}
                    >
                      {node.formula_reference || '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div
            className="hidden sm:block absolute bottom-6 z-10 bg-white border border-[#EDE8DD] rounded-[12px] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)] pointer-events-none transition-all duration-300 ease-out"
            style={{ right: isInspectorOpen ? '364px' : '24px', width: 140, height: 90 }}
          >
            <div className="w-full h-full relative bg-[#FBF9F3] rounded-[8px] overflow-hidden border border-[#EDE8DD]/60">
              {nodes.map((n) => {
                const mx = (n.x / canvasWidth) * 120 + 2
                const my = (n.y / canvasHeight) * 72 + 2
                return (
                  <div
                    key={n.id}
                    className="absolute w-[4px] h-[4px] rounded-full"
                    style={{
                      left: mx,
                      top: my,
                      backgroundColor: n.id === selectedId ? '#1A221E' : n.status === 'active' ? '#DDB56E' : n.status === 'unlocked' ? '#4A7C59' : n.status === 'mastered' ? '#111814' : '#D6D0C2',
                    }}
                  />
                )
              })}
              <div
                className="absolute border border-[#DDB56E] bg-[#DDB56E]/10 rounded-[2px]"
                style={{
                  left: Math.max(0, (-pan.x / zoom / canvasWidth) * 124),
                  top: Math.max(0, (-pan.y / zoom / canvasHeight) * 74),
                  width: Math.min(124, Math.max(16, (800 / zoom / canvasWidth) * 124)),
                  height: Math.min(74, Math.max(12, (500 / zoom / canvasHeight) * 74)),
                }}
              />
            </div>
          </div>
        </div>

        <aside
          className={`w-[340px] bg-white border-l border-[#EDE8DD] z-20 flex flex-col shrink-0 transition-transform duration-300 ease-out absolute lg:relative right-0 top-0 bottom-0 ${
            isInspectorOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ boxShadow: isInspectorOpen ? '-4px 0 24px rgba(0,0,0,0.06)' : 'none' }}
        >
          <button
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-[#EDE8DD] border-r-0 rounded-l-[8px] shadow-[-4px_0_12px_rgba(0,0,0,0.08)] flex items-center justify-center cursor-pointer text-[#6B7280] hover:text-[#111814] z-30 transition-colors"
            title={isInspectorOpen ? 'Collapse inspector (Esc)' : 'Open inspector'}
          >
            {isInspectorOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {activeNode && (
            <>
              <div className="p-5 border-b border-[#EDE8DD] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#9CA3AF] tracking-widest uppercase font-semibold">{activeNode.id.toUpperCase()}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F6F1E6] text-[#6B7280] font-mono text-[10px] border border-[#EDE8DD]">
                    Diff {activeNode.difficulty.toFixed(1)}/5.0
                  </span>
                </div>
                <div>
                  {activeNode.status === 'active' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1A221E] text-[#DDB56E] text-[10px] font-mono font-medium border border-[#3A4A3E]">Active Practice</span>
                  ) : activeNode.status === 'mastered' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#111814] text-white text-[10px] font-mono font-medium border border-[#111814]">Mastered</span>
                  ) : activeNode.status === 'unlocked' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E6F0E8] text-[#4A7C59] text-[10px] font-mono font-medium border border-[#BBF7D0]">Ready to Practice</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F6F1E6] text-[#9CA3AF] text-[10px] font-mono font-medium border border-[#EDE8DD] flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <div>
                  <h3 className="text-[18px] font-bold text-[#111814] leading-snug" style={{ fontFamily: 'Newsreader, Georgia, serif' }}>
                    {activeNode.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] text-[#6B7280] leading-[1.5]">{activeNode.description}</p>
                </div>

                <div className="bg-[#F6F1E6] border border-[#EDE8DD] rounded-[8px] p-3">
                  <div className="flex items-center justify-between text-[#9CA3AF] text-[10px] font-mono uppercase tracking-widest font-semibold mb-1.5">
                    <span>Core Formula / Identity</span>
                    <button onClick={() => handleCopyFormula(activeNode.formula_reference || '')} className="hover:text-[#111814] transition-colors cursor-pointer" title="Copy formula">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="font-mono text-[12px] text-[#111814] font-medium break-all select-text">{activeNode.formula_reference || '—'}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-[8px] bg-[#FBF9F3] border border-[#EDE8DD]">
                    <div className="font-mono text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Prerequisites</div>
                    {activeNode.prerequisites.length === 0 ? (
                      <span className="text-[#9CA3AF] italic">None (Root)</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {activeNode.prerequisites.map((p) => (
                          <span key={p} onClick={() => setSelectedId(p)} className="px-1.5 py-0.5 rounded bg-white border border-[#EDE8DD] font-mono text-[10px] text-[#111814] hover:border-[#1A221E] cursor-pointer">
                            {p.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-[8px] bg-[#FBF9F3] border border-[#EDE8DD]">
                    <div className="font-mono text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">Unlocks</div>
                    {activeNode.unlocks.length === 0 ? (
                      <span className="text-[#9CA3AF] italic">Final convergence</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {activeNode.unlocks.map((u) => (
                          <span key={u} onClick={() => setSelectedId(u)} className="px-1.5 py-0.5 rounded bg-white border border-[#EDE8DD] font-mono text-[10px] text-[#111814] hover:border-[#1A221E] cursor-pointer">
                            {u.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] py-1 border-t border-[#EDE8DD]">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#9CA3AF]" /> {activeNode.chapter}
                  </span>
                  <span className="font-mono text-[10px] text-[#9CA3AF]">Mastery: {Math.round(activeNode.mastery_score * 100)}%</span>
                </div>

                <div className="pt-2">
                  {activeNode.status === 'locked' ? (
                    <button disabled className="w-full h-[44px] rounded-[12px] bg-[#F6F1E6] border border-[#EDE8DD] text-[#9CA3AF] text-[12px] font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                      <Lock className="w-3.5 h-3.5" /> Complete prerequisites
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePracticeSelect(activeNode.id)}
                      className="w-full h-[44px] rounded-[12px] bg-[#1A221E] hover:bg-black text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:gap-3"
                    >
                      <span>Practice {activeNode.id.toUpperCase()}</span>
                      <ArrowRight className="w-4 h-4 text-[#DDB56E]" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-auto p-4 bg-[#FBF9F3] border-t border-[#EDE8DD] shrink-0">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#9CA3AF] uppercase tracking-widest font-semibold">
                  <span>Class Progress</span>
                  <span className="text-[#111814]">
                    {masteredCount} / {concepts.length} Topics
                  </span>
                </div>
                <div className="mt-2 h-[6px] w-full bg-[#EDE8DD] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A221E] rounded-full" style={{ width: `${masteryPct}%` }} />
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A221E] text-white text-[12px] font-medium px-4 py-2 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.24)] border border-[#2A332F] max-w-[90vw] truncate pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
