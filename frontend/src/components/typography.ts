/**
 * Locked typography tokens for the teacher module — the Edova Fixed
 * Typography System. One class string per role; every page's summary cards,
 * resource/assignment cards, and status pills should read from these instead
 * of inventing their own font-size/weight/color combination.
 */

// TOTAL RESOURCES, NCERT TEXTBOOKS, ASSIGNED TO:, DUE ON:, etc.
export const eyebrowClass = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8880]'

// The big number in a summary card — 8, 1, 2, 4, 8%, 87.5%. Summary cards only.
export const metricClass = 'text-[22px] font-bold text-[#111111] leading-none tracking-[-0.02em]'

// Across All Chapters, Official E-Books, Across Sections — sits beside metric.
export const subClass = 'text-[11px] font-normal text-[#6B6B6B] leading-[1.4]'

// Resource / assignment titles.
export const titleClass = 'text-[14px] font-[650] text-[#121212] leading-[1.4] tracking-[-0.01em]'

// Descriptions.
export const bodyClass = 'text-[12.5px] font-normal text-[#6B6B6B] leading-[1.5]'

// Small category/format tags (e.g. "NCERT Textbook", "Formula Sheet").
export const tagClass = 'text-[11px] font-medium'

// Status pills (e.g. "ASSIGNED", "READY").
export const statusClass = 'text-[10px] font-medium uppercase tracking-[0.05em]'

// Monospace class-code pills (e.g. "10-A").
export const monoPillClass = 'text-[11px] font-medium font-mono'
