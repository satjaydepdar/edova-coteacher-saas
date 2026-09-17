import * as React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gold' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    let variantClasses = 'bg-forest text-white hover:bg-forest-raised'
    if (variant === 'gold') {
      variantClasses = 'bg-[#D9A94E] hover:bg-[#C9993E] text-[#13231F] font-bold shadow-xs'
    } else if (variant === 'outline') {
      variantClasses = 'border border-[#E5E1D2] bg-white hover:bg-[#F5F1E6] text-[#13231F]'
    } else if (variant === 'ghost') {
      variantClasses = 'hover:bg-black/5 text-[#13231F]'
    } else if (variant === 'secondary') {
      variantClasses = 'bg-[#F5F1E6] hover:bg-[#EAE4D5] text-[#13231F]'
    }

    let sizeClasses = 'h-9 px-4 py-2 text-[13px] rounded-xl'
    if (size === 'sm') sizeClasses = 'h-8 px-3 text-xs rounded-lg'
    if (size === 'lg') sizeClasses = 'h-11 px-6 text-base rounded-2xl'

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
