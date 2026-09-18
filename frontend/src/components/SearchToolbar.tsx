import type { ReactNode } from 'react'

/** 44px tall, 12px radius, neutral border — the one search-input look for every page. */
export const searchInputClass =
  'h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-[14px] font-sans text-[#11181C] placeholder:text-[14px] placeholder:text-[#9CA3AF] outline-none focus:border-[#1a2421] transition-colors'

/** 36px tall, fully rounded — for a plain filter <select>. */
export const filterSelectClass =
  'h-9 px-3 rounded-full bg-white border border-[#E5E7EB] text-[12px] font-medium text-[#1A221E] shrink-0 outline-none'

/** 36px tall, fully rounded — for a toggleable filter chip/button. */
export function filterChipClass(active: boolean): string {
  return `h-9 px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all cursor-pointer border ${
    active
      ? 'bg-[#1a2421] text-white border-[#1a2421]'
      : 'bg-white text-[#5a554e] border-[#E5E7EB] hover:border-[#1a2421]'
  }`
}

/**
 * Locked layout: always the row directly below PageHeader, never above it.
 * Container padding 16px 32px (px-8 py-4) — its own top padding is what
 * creates the 16px gap from the header above.
 */
export default function SearchToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="w-full px-8 py-4 flex flex-wrap items-center gap-2.5">
      {children}
    </div>
  )
}
