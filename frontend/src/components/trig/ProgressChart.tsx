import { TrendingUp } from 'lucide-react'
import type { TrigProgressPoint } from '../../lib/trig/trigApiClient'

/** Ported from edova-pilot-v4/frontend/src/features/dashboard/ProgressChart.jsx, unchanged. */
interface ProgressChartProps {
  data: TrigProgressPoint[]
}

export default function ProgressChart({ data }: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#FAF9F5] border border-[#E8E2D6] p-6 rounded-2xl text-[#8A8A7A] text-center text-xs py-10 shadow-[0_1px_2px_rgba(21,31,28,0.04)]">
        Submit step answers in the workspace to plot your real-time learning trajectory.
      </div>
    )
  }

  const width = 340
  const height = 130
  const paddingX = 30
  const paddingY = 20

  const points = data.map((d, index) => {
    const x = paddingX + (index / Math.max(1, data.length - 1)) * (width - paddingX * 2)
    const yMastery = height - paddingY - d.estimated_mastery * (height - paddingY * 2)
    const yAssistance = height - paddingY - d.assistance_level * (height - paddingY * 2)
    return { x, yMastery, yAssistance, ...d }
  })

  const masteryPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yMastery}`).join(' ')
  const assistancePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yAssistance}`).join(' ')

  return (
    <div className="bg-[#FAF9F5] border border-[#E8E2D6] p-4 rounded-2xl shadow-[0_1px_2px_rgba(21,31,28,0.04)] font-sans space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-[#151F1C]" />
          <h4 className="text-[#8A8A7A] font-semibold text-[11px] tracking-[0.12em] uppercase font-mono">
            Learning Trajectory Dynamics
          </h4>
        </div>

        <div className="flex gap-3 text-[10px] font-medium font-mono">
          <span className="flex items-center gap-1.5 text-[#151F1C]">
            <span className="w-2 h-2 rounded-full bg-[#151F1C]" />
            Mastery (↑)
          </span>
          <span className="flex items-center gap-1.5 text-[#2D6A4F]">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
            SAL (↓)
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#E8E2D6" strokeDasharray="3 3" />
        <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#E8E2D6" strokeDasharray="3 3" />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#E8E2D6" />

        <text x={paddingX - 6} y={paddingY + 3} fill="#8A8A7A" fontSize="8" textAnchor="end" fontFamily="monospace">1.0</text>
        <text x={paddingX - 6} y={height / 2 + 3} fill="#8A8A7A" fontSize="8" textAnchor="end" fontFamily="monospace">0.5</text>
        <text x={paddingX - 6} y={height - paddingY + 3} fill="#8A8A7A" fontSize="8" textAnchor="end" fontFamily="monospace">0.0</text>

        {points.length > 1 && (
          <>
            <path d={masteryPath} fill="none" stroke="#151F1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={assistancePath} fill="none" stroke="#2D6A4F" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={p.x} cy={p.yMastery} r="3.5" className="fill-[#151F1C] stroke-white stroke-2 transition-all" />
            <circle cx={p.x} cy={p.yAssistance} r="3" className="fill-[#2D6A4F] stroke-white stroke-2 transition-all" />
            <text x={p.x} y={height - paddingY + 12} fill="#8A8A7A" fontSize="7.5" textAnchor="middle" fontFamily="monospace">
              {p.timestamp}
            </text>
            <title>
              {`Step ${i + 1} (${p.timestamp})\nMastery: ${Math.round(p.estimated_mastery * 100)}%\nAssistance SAL: ${Math.round(p.assistance_level * 100)}%`}
            </title>
          </g>
        ))}
      </svg>
    </div>
  )
}
