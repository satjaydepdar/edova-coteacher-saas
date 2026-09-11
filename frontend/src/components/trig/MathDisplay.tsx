import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/** Ported from edova-pilot-v4/frontend/src/components/ui/MathDisplay.jsx.
 *  Translates plain math, ASCII radicals, powers, and geometry/algebra
 *  notations into compliant LaTeX, then renders with KaTeX. */
export function normalizeToLatex(mathStr: string): string {
  if (!mathStr) return ''
  let s = String(mathStr).trim()

  s = s.replace(/\btheta\b/g, '\\theta')
  s = s.replace(/\balpha\b/g, '\\alpha')
  s = s.replace(/\bbeta\b/g, '\\beta')
  s = s.replace(/\bpi\b/g, '\\pi')
  s = s.replace(/θ/g, '\\theta')
  s = s.replace(/α/g, '\\alpha')
  s = s.replace(/β/g, '\\beta')
  s = s.replace(/π/g, '\\pi')
  s = s.replace(/°|\bdeg\b/g, '^\\circ')
  s = s.replace(/\bangle\s*([A-Za-z])/g, '\\angle $1')
  s = s.replace(/\bDelta\s*([A-Za-z]+)/g, '\\Delta $1')

  s = s.replace(/\\sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
  s = s.replace(/\bsqrt\(([^)]+)\)/g, '\\sqrt{$1}')
  s = s.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
  s = s.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}')

  s = s.replace(/(?<!\\)(sin|cos|tan|cot|sec|csc|cosec)/g, '\\$1')
  s = s.replace(/\\cosec/g, '\\csc')

  s = s.replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4')

  s = s.replace(/ \* /g, ' \\times ')

  s = s.replace(/(?<!\\) /g, '\\ ')

  const openBraces = (s.match(/\{/g) || []).length
  const closeBraces = (s.match(/\}/g) || []).length
  if (openBraces > closeBraces) {
    s += '}'.repeat(openBraces - closeBraces)
  }

  return s
}

function isMixedProse(str: string): boolean {
  if (!str) return false
  const words = str.trim().split(/\s+/)
  if (words.length >= 3) {
    const commonProseWords = /\b(the|to|find|length|of|hypotenuse|we|use|pythagorean|theorem|right|angle|is|at|so|given|that|triangle|in|with|respect|calculate|substitute)\b/i
    return commonProseWords.test(str)
  }
  return false
}

interface MathDisplayProps {
  math: string
  className?: string
  displayMode?: boolean
}

export default function MathDisplay({ math, className = '', displayMode = false }: MathDisplayProps) {
  const mixedHtml = useMemo(() => {
    if (!math || !isMixedProse(math)) return null
    const parts = math.split(/(:\s*|\s*=\s*|\s*\+\s*)/g)
    return parts.map((part, pIdx) => {
      if (!part.trim()) return null
      if (isMixedProse(part) || /^[A-Za-z\s,:]+$/.test(part.trim())) {
        return { key: pIdx, kind: 'text' as const, content: part }
      }
      const latex = normalizeToLatex(part)
      let html = ''
      try {
        html = katex.renderToString(latex, { throwOnError: false, displayMode: false, output: 'htmlAndMathml' })
      } catch {
        html = `<span class="font-mono">${part}</span>`
      }
      return { key: pIdx, kind: 'math' as const, html }
    })
  }, [math])

  if (!math) return null

  if (mixedHtml) {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1.5 align-middle ${className}`}>
        {mixedHtml.map((part) => {
          if (!part) return null
          if (part.kind === 'text') {
            return (
              <span key={part.key} className="font-sans text-[#151F1C] font-normal leading-normal">
                {part.content}
              </span>
            )
          }
          return (
            <span
              key={part.key}
              className="inline-block text-[#151F1C] font-semibold"
              dangerouslySetInnerHTML={{ __html: part.html }}
            />
          )
        })}
      </span>
    )
  }

  const latex = normalizeToLatex(math)
  let html = ''
  try {
    html = katex.renderToString(latex, { throwOnError: false, displayMode, output: 'htmlAndMathml' })
  } catch {
    html = `<span class="font-mono">${math}</span>`
  }

  return (
    <span
      className={`inline-block align-middle text-[#151F1C] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
