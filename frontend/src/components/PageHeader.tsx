import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** Breadcrumb / eyebrow row — 12px mono, sits 8px above the title */
  eyebrow?: ReactNode
  title: ReactNode
  /** Small pill next to the title, e.g. "7 ITEMS" / "2 CHAPTERS" */
  titlePill?: ReactNode
  /** Description or search row — 14px sans, sits 8px below the title */
  description?: ReactNode
  /** Right-aligned actions (buttons, pills, avatar) on the title row */
  actions?: ReactNode
}

/**
 * Locked layout tokens so every page's H1 sits at the same X/Y position:
 * max-width 1280px, 32px left/right padding, 24px top, 16px bottom.
 * Never put filters/breadcrumb dropdowns here — those belong in a
 * separate top filter bar with its own 32px padding.
 */
export default function PageHeader({ eyebrow, title, titlePill, description, actions }: PageHeaderProps) {
  return (
    <div className="w-full max-w-[1280px] px-8 pt-6 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-2 font-mono text-[12px] uppercase tracking-wide text-[#8A8F8B]">
              {eyebrow}
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-header-h1 text-[24px] lg:text-[28px]">{title}</h1>
            {titlePill}
          </div>
          {description && (
            <div className="mt-2 text-[14px] leading-[1.5] text-[#6B7B6F] max-w-[640px]">
              {description}
            </div>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
