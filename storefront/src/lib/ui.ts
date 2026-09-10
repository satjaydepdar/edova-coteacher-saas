/** Shared storefront UI constants — single source for class strings and formatting
 *  that recur across the funnel pages. */

export const inputClass =
  'w-full h-11 px-3.5 rounded-[12px] bg-ink border border-mist/10 text-[14px] text-mist ' +
  'outline-none focus:border-lime/50 focus:ring-4 focus:ring-lime/15 transition placeholder:text-sage-dim/70'

export const primaryButtonClass =
  'w-full h-11 rounded-[12px] bg-moss hover:bg-moss-dark text-white text-[13px] font-medium ' +
  'border border-transparent hover:border-lime/50 shadow-glow transition disabled:opacity-50'

export const errorBannerClass =
  'mt-4 text-[12px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-[8px] px-3 py-2'

/** Whole-rupee INR formatting, e.g. 24000 -> "₹24,000". */
export const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`
