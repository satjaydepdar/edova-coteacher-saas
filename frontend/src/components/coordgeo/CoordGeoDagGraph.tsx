import { useMemo } from 'react'
import type { CoordGeoConceptSummary } from '../../lib/coordgeo/coordgeoApiClient'

interface CoordGeoDagGraphProps {
  isOpen: boolean
  onClose: () => void
  concepts: CoordGeoConceptSummary[]
  activeConceptId: string
  onSelectConcept: (conceptId: string) => void
}

const COL_WIDTH = 260
const ROW_HEIGHT = 110
const NODE_WIDTH = 220
const NODE_HEIGHT = 76
const PADDING = 60

/** Genuinely data-driven: depth = longest path from any root, columns by depth,
 * rows spread within a column. (TrigonometryDagModal, by contrast, ignores its
 * `concepts` prop entirely and renders a hardcoded 10-node layout -- confirmed by
 * reading it -- so it isn't reusable as a template here.) */
function useLayout(concepts: CoordGeoConceptSummary[]) {
  return useMemo(() => {
    const byId = new Map(concepts.map((c) => [c.id, c]))
    const depthCache = new Map<string, number>()

    function depthOf(id: string, seen: Set<string> = new Set()): number {
      if (depthCache.has(id)) return depthCache.get(id)!
      if (seen.has(id)) return 0 // guard against a cyclic prerequisites bug in the data
      const c = byId.get(id)
      if (!c || c.prerequisites.length === 0) {
        depthCache.set(id, 0)
        return 0
      }
      const d = 1 + Math.max(...c.prerequisites.map((p) => depthOf(p, new Set([...seen, id]))))
      depthCache.set(id, d)
      return d
    }

    const columns = new Map<number, CoordGeoConceptSummary[]>()
    for (const c of concepts) {
      const d = depthOf(c.id)
      if (!columns.has(d)) columns.set(d, [])
      columns.get(d)!.push(c)
    }

    const positions = new Map<string, { x: number; y: number }>()
    const maxRows = Math.max(1, ...Array.from(columns.values()).map((v) => v.length))
    for (const [depth, nodes] of columns) {
      const colHeight = nodes.length * ROW_HEIGHT
      const totalHeight = maxRows * ROW_HEIGHT
      const startY = PADDING + (totalHeight - colHeight) / 2
      nodes.forEach((c, i) => {
        positions.set(c.id, { x: PADDING + depth * COL_WIDTH, y: startY + i * ROW_HEIGHT })
      })
    }

    const width = PADDING * 2 + (columns.size - 1) * COL_WIDTH + NODE_WIDTH
    const height = PADDING * 2 + maxRows * ROW_HEIGHT

    return { positions, width, height }
  }, [concepts])
}

export default function CoordGeoDagGraph({ isOpen, onClose, concepts, activeConceptId, onSelectConcept }: CoordGeoDagGraphProps) {
  const { positions, width, height } = useLayout(concepts)

  if (!isOpen) return null

  const edges: { from: string; to: string }[] = []
  for (const c of concepts) {
    for (const prereqId of c.prerequisites) {
      edges.push({ from: prereqId, to: c.id })
    }
  }

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
          <span
            className="font-semibold text-[18px] tracking-tight text-[#111814]"
            style={{ fontFamily: 'Newsreader, Georgia, serif' }}
          >
            Coordinate Geometry DAG
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full bg-[#1A221E] text-white font-mono text-[10px] tracking-widest uppercase shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DDB56E]" /> CBSE Class 10
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-[#6B7280]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1A221E]" /> Mastered</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#DDB56E]" /> Unlocked</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D9D2C2]" /> Locked</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <svg width={width} height={height} className="block">
          {edges.map((e, i) => {
            const from = positions.get(e.from)
            const to = positions.get(e.to)
            if (!from || !to) return null
            const x1 = from.x + NODE_WIDTH
            const y1 = from.y + NODE_HEIGHT / 2
            const x2 = to.x
            const y2 = to.y + NODE_HEIGHT / 2
            const offset = Math.max(40, (x2 - x1) * 0.4)
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#D9D2C2"
                strokeWidth={1.5}
              />
            )
          })}

          {concepts.map((c) => {
            const pos = positions.get(c.id)
            if (!pos) return null
            const isActive = c.id === activeConceptId
            const bg = isActive ? '#1A221E' : c.is_completed ? '#1A221E' : c.is_unlocked ? '#FFFFFF' : '#F6F1E7'
            const textColor = isActive || c.is_completed ? '#FDFAF5' : '#111814'
            const dotColor = c.is_completed ? '#DDB56E' : c.is_unlocked ? '#4a7c59' : '#B8B0A0'
            return (
              <g
                key={c.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectConcept(c.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={14}
                  fill={bg}
                  stroke={isActive ? '#DDB56E' : '#EDE8DD'}
                  strokeWidth={isActive ? 2 : 1}
                />
                <circle cx={16} cy={16} r={4} fill={dotColor} />
                <text x={16} y={20} fontSize={10} fontFamily="monospace" fill={textColor} opacity={0.6}>
                  {c.id.toUpperCase()}
                </text>
                <foreignObject x={12} y={26} width={NODE_WIDTH - 24} height={NODE_HEIGHT - 32}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.3, color: textColor, fontWeight: 500 }}>
                    {c.title}
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
