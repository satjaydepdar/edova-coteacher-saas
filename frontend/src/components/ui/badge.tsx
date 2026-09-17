import * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'danger' | 'warning' | 'okf' | 'outline'
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  let variantClasses = 'bg-forest text-white'
  if (variant === 'secondary') {
    variantClasses = 'bg-white/80 text-[#13231F] border border-[#E5E1D2]'
  } else if (variant === 'danger') {
    variantClasses = 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 font-semibold'
  } else if (variant === 'warning') {
    variantClasses = 'bg-[#D9A94E]/15 text-[#8A6A2E] border border-[#D9A94E]/30 font-semibold'
  } else if (variant === 'okf') {
    variantClasses = 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 font-semibold'
  } else if (variant === 'outline') {
    variantClasses = 'border border-[#E5E1D2] text-[#13231F]'
  }

  return (
    <div
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${variantClasses} ${className}`}
      {...props}
    />
  )
}
