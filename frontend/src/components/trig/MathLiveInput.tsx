import { useEffect, useRef } from 'react'
import type { MathfieldElement } from 'mathlive'

interface MathLiveInputProps {
  value: string
  onChange: (latex: string) => void
  onSubmit?: () => void
  placeholder?: string
  className?: string
}

/** Wraps the <math-field> web component (registered globally via the
 * `import 'mathlive'` side-effect in main.tsx) for React, since it isn't a
 * real React component -- events and value reads go through the DOM node
 * directly rather than props. */
export default function MathLiveInput({ value, onChange, onSubmit, placeholder, className }: MathLiveInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mfRef = useRef<MathfieldElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const mf = document.createElement('math-field') as MathfieldElement
    mf.setAttribute('virtual-keyboard-mode', 'onfocus')
    mf.className = 'w-full bg-transparent outline-none'
    container.appendChild(mf)
    mfRef.current = mf

    const handleInput = () => onChange(mf.getValue('latex'))
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onSubmit?.()
      }
    }
    mf.addEventListener('input', handleInput)
    mf.addEventListener('keydown', handleKeydown)

    return () => {
      mf.removeEventListener('input', handleInput)
      mf.removeEventListener('keydown', handleKeydown)
      container.removeChild(mf)
      mfRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const mf = mfRef.current
    if (mf && mf.getValue('latex') !== value) mf.setValue(value)
  }, [value])

  useEffect(() => {
    if (mfRef.current) mfRef.current.setAttribute('placeholder', placeholder ?? '')
  }, [placeholder])

  return <div ref={containerRef} className={className} />
}
