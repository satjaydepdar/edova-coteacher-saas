import type { ReactNode } from 'react'
import { eyebrowClass, metricClass, subClass } from './typography'

export interface SummaryCardProps {
  eyebrow: string
  /** Bare number/percentage only (e.g. 8, "18%") — never multi-word text, which
   * can wrap inside this fixed-height card and break the shared look. Put any
   * unit word (Marks, Units, Students...) in `sub` instead. */
  metric: ReactNode
  sub: string
  icon: ReactNode
  /** Left accent bar + icon color (e.g. "#3B5B9A") */
  accent: string
  /** Tinted icon-circle background (e.g. "#E8F0FF") */
  iconBg: string
}

/**
 * The one stat-tile frame every teacher page's summary band uses (Edova Fixed
 * Typography System): white card, fixed 80px height, 4px left accent, 36px
 * tinted icon circle, eyebrow above a metric+sub row. No buttons, badges, or
 * progress bars belong inside this card — surface those elsewhere on the page.
 */
export default function SummaryCard({ eyebrow, metric, sub, icon, accent, iconBg }: SummaryCardProps) {
  return (
    <div className="relative flex items-center gap-3 h-[80px] px-4 bg-white rounded-[12px] border border-[#EAE6D9] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent }} />
      <div className="shrink-0 w-9 h-9 ml-1 rounded-full flex items-center justify-center" style={{ background: iconBg, color: accent }}>
        {icon}
      </div>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <span className={eyebrowClass}>{eyebrow}</span>
        <div className="flex items-baseline gap-1.5">
          <span className={`${metricClass} whitespace-nowrap`}>{metric}</span>
          <span className={`${subClass} truncate`}>{sub}</span>
        </div>
      </div>
    </div>
  )
}
