import MathDisplay from './MathDisplay'

/** Ported from edova-pilot-v4/frontend/src/components/ui/FormattedMathText.jsx, unchanged.
 *  Tokenizes mixed prose+math text and renders math segments through KaTeX. */
interface FormattedMathTextProps {
  text: string
  className?: string
}

export default function FormattedMathText({ text, className = '' }: FormattedMathTextProps) {
  if (!text) return null

  let processed = String(text)

  processed = processed.replace(/\(([A-Za-z0-9_]+\s*=\s*(?:\\sqrt|sqrt|\d|\^|\+|-|\*|\/|\(|\)|\w)+)\)/g, '($$$1$$)')
  processed = processed.replace(/(?<!\$)\b(sqrt\([^)]+\)|\\sqrt\{[^}]+\})(?!\$)/g, '$$$1$$')
  processed = processed.replace(/(?<!\$)\b([A-Za-z0-9_]+\^2\s*=\s*[A-Za-z0-9_]+\^2\s*\+\s*[A-Za-z0-9_]+\^2)(?!\$)/g, '$$$1$$')

  const regex = /(\$[^$]+\$|\\sqrt\{[^}]+\}|sqrt\([^)]+\)|\\frac\{[^}]+\}\{[^}]+\}|\\sin\([^)]+\)|\\cos\([^)]+\)|\\tan\([^)]+\)|\\cot\([^)]+\)|\\sec\([^)]+\)|\\csc\([^)]+\)|\\theta|\\alpha|\\beta|\\pi|\b\d+\^\\circ|\b\d+°)/g

  const tokens: { type: 'text' | 'math'; content: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(processed)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: processed.substring(lastIndex, match.index) })
    }

    let mathContent = match[0]
    if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
      mathContent = mathContent.slice(1, -1)
    }
    mathContent = mathContent.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')

    tokens.push({ type: 'math', content: mathContent })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < processed.length) {
    tokens.push({ type: 'text', content: processed.substring(lastIndex) })
  }

  return (
    <span className={className}>
      {tokens.map((token, idx) =>
        token.type === 'math' ? (
          <MathDisplay key={idx} math={token.content} className="mx-0.5 font-bold text-[#151F1C]" />
        ) : (
          <span key={idx}>{token.content}</span>
        ),
      )}
    </span>
  )
}
