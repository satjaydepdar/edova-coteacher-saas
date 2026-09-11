/**
 * Mathematical Clipboard Paste & Typing Normalizer.
 * Ported from edova-pilot-v4/frontend/src/utils/mathPasteNormalizer.js, unchanged.
 */

export function toMathematicalDisplay(text: string): string {
  if (!text) return ''
  return String(text)
    .replace(/\^2\b|\^{2}/g, '²')
    .replace(/\^3\b|\^{3}/g, '³')
    .replace(/\^4\b|\^{4}/g, '⁴')
    .replace(/\^n\b|\^{n}/g, 'ⁿ')
    .replace(/\btheta\b/g, 'θ')
    .replace(/\balpha\b/g, 'α')
    .replace(/\bbeta\b/g, 'β')
    .replace(/\bpi\b/g, 'π')
}

function repairCopyArtifacts(text: string): string {
  if (!text) return ''
  let s = text
  s = s.replace(/\b([a-zA-Z])\s*\n\s*\1\b/g, '$1')
  s = s.replace(/\b([A-Z])\s+([A-Z])\s*\n\s*\1\2\b/g, '$1$2')
  s = s.replace(/\b([A-Z])\s+([A-Z])\s+\1\2\b/g, '$1$2')
  s = s.replace(/(\(|\b)([A-Z])\s+([A-Z])(\)|\b)/g, '$1$2$3$4')
  return s
}

export function cleanPastedMathText(rawText: string): string {
  if (!rawText) return ''
  let text = String(rawText).replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  text = repairCopyArtifacts(text)

  text = toMathematicalDisplay(text)
    .replace(/√\s*(\d+|[A-Za-z]+|\([^)]+\))/g, '√($1)')
    .replace(/×/g, ' × ')
    .replace(/÷/g, ' ÷ ')
    .replace(/±/g, ' ± ')
    .replace(/≠/g, ' ≠ ')

  const rawLines = text.split('\n')
  const processedLines: string[] = []
  let mathBuffer: string[] = []

  const isFragmentedMathLine = (line: string): boolean => {
    const trimmed = line.trim()
    if (!trimmed) return false
    if (trimmed.length <= 6 && !trimmed.includes(' ')) {
      return /^[a-zA-Z0-9+\-*/=^(){}\\_,.<>≤≥±≠πθαβ²³⁴ⁿ√]+$/.test(trimmed)
    }
    return false
  }

  const flushMathBuffer = () => {
    if (mathBuffer.length === 0) return
    if (mathBuffer.length === 1) {
      processedLines.push(mathBuffer[0])
      mathBuffer = []
      return
    }

    let merged = ''
    for (let i = 0; i < mathBuffer.length; i++) {
      const token = mathBuffer[i].trim()
      const prevToken = i > 0 ? mathBuffer[i - 1].trim() : ''
      const opSet = ['+', '-', '=', '*', '/', '×', '÷', '±', '≠']

      if (token === '2' && /^[a-zA-Z]+$|^\d+$/.test(prevToken) && !opSet.includes(prevToken)) {
        merged += '²'
      } else if (token === '3' && /^[a-zA-Z]+$|^\d+$/.test(prevToken) && !opSet.includes(prevToken)) {
        merged += '³'
      } else if (/^\d+$/.test(token) && /^[a-zA-Z]+$|^\d+$/.test(prevToken) && !opSet.includes(prevToken)) {
        merged += `^${token}`
      } else if (opSet.includes(token)) {
        merged += ` ${token} `
      } else {
        if (merged && !merged.endsWith(' ') && !merged.endsWith('²') && !merged.endsWith('³') && !merged.endsWith('^')) {
          merged += ' '
        }
        merged += token
      }
    }

    merged = merged.replace(/\s+/g, ' ').trim()
    processedLines.push(merged)
    mathBuffer = []
  }

  for (const line of rawLines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushMathBuffer()
      continue
    }

    if (isFragmentedMathLine(trimmed)) {
      mathBuffer.push(trimmed)
    } else {
      flushMathBuffer()
      processedLines.push(trimmed)
    }
  }

  flushMathBuffer()

  const finalLines: string[] = []
  for (let i = 0; i < processedLines.length; i++) {
    const curr = processedLines[i].trim()
    if (!curr) continue

    if (finalLines.length > 0) {
      const prev = finalLines[finalLines.length - 1]
      const prevEndsSentence = /[.!?:]\s*$/.test(prev)
      const currIsContinuation = /^[a-z(,]|\b(and|or|where|are|is|of|to|in|with|for|which|the|a)\b/i.test(curr)

      if (!prevEndsSentence && (currIsContinuation || prev.endsWith('(') || prev.endsWith(','))) {
        finalLines[finalLines.length - 1] = `${prev} ${curr}`.replace(/\s+/g, ' ')
        continue
      }
    }

    finalLines.push(curr)
  }

  return finalLines.join('\n')
}

/** Extracts and cleans clipboard data using HTML DOM if available, falling back to plain text. */
export function extractCleanClipboardText(clipboardData: DataTransfer | null): string {
  if (!clipboardData) return ''

  try {
    const html = clipboardData.getData('text/html')
    if (html && typeof DOMParser !== 'undefined') {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      const toRemove = doc.querySelectorAll('.katex-mathml, .sr-only, annotation, math')
      toRemove.forEach((el) => el.remove())

      const rawText = doc.body.innerText || doc.body.textContent || ''
      if (rawText.trim()) {
        return cleanPastedMathText(rawText)
      }
    }
  } catch {
    // Fallback to plain text
  }

  const plainText = clipboardData.getData('text/plain') || ''
  return cleanPastedMathText(plainText)
}
