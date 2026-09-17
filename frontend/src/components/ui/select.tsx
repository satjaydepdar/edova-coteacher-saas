import * as React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectContextType {
  value: string
  onValueChange: (val: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

export function Select({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (val: string) => void
  children: React.ReactNode
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = (val: string) => {
    if (!isControlled) setUncontrolledValue(val)
    onValueChange?.(val)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(SelectContext)
  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen(!ctx.open)}
      className={`inline-flex items-center justify-between px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-[13px] font-medium text-[#13231F] shadow-2xs hover:bg-[#FDFDFD] focus:outline-none cursor-pointer ${className}`}
    >
      {children}
      <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50 shrink-0" />
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext)
  return <span>{ctx?.value ? (ctx.value === 'all' ? 'All Classes' : ctx.value) : placeholder}</span>
}

export function SelectContent({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(SelectContext)
  if (!ctx?.open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => ctx.setOpen(false)} />
      <div
        className={`absolute left-0 mt-1.5 w-full min-w-[140px] rounded-xl bg-white p-1 shadow-lg border border-[#E5E1D2] z-50 text-[13px] ${className}`}
      >
        {children}
      </div>
    </>
  )
}

export function SelectItem({
  value,
  children,
  className = '',
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(SelectContext)
  const isSelected = ctx?.value === value

  return (
    <div
      onClick={() => ctx?.onValueChange(value)}
      className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[#F5F1E6] font-semibold text-[#13231F]'
          : 'text-forest/80 hover:bg-[#F5F1E6]/60 hover:text-[#13231F]'
      } ${className}`}
    >
      {children}
    </div>
  )
}
