import { useState, useRef, useEffect } from 'react'
import { Calculator, Trash2, Lightbulb, ArrowRight, Eye, CornerDownLeft } from 'lucide-react'
import MathDisplay from './MathDisplay'
import { trackTelemetryEvent } from '../../lib/trig/tracer'
import { toMathematicalDisplay, extractCleanClipboardText } from '../../lib/trig/mathPasteNormalizer'

/** Ported from edova-pilot-v4/frontend/src/components/ui/LatexMathEditor.jsx.
 *  Adapted: telemetry calls no longer take studentId (derived server-side). */
interface LatexMathEditorProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  isSubmitting?: boolean
  stepLabel?: string
  isEditMode?: boolean
  isLastStep?: boolean
  onCancelEdit?: (() => void) | null
  showLightbulb?: boolean
  isHintOpen?: boolean
  onToggleHint?: (() => void) | null
  conceptId?: string
  activeStepIndex?: number
}

interface CalcItem {
  label: string
  insert: string
  highlight?: boolean
}

export default function LatexMathEditor({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type hypothesis, formulas, or steps... e.g. XZ² = 21² + 20² (Press Shift+Enter for new line)',
  isSubmitting = false,
  stepLabel = 'Step 1:',
  isEditMode = false,
  isLastStep = false,
  onCancelEdit = null,
  showLightbulb = true,
  isHintOpen = false,
  onToggleHint = null,
  conceptId = 'trig-101',
  activeStepIndex = 0,
}: LatexMathEditorProps) {
  const [showCalculator, setShowCalculator] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'algebra' | 'trig' | 'radians' | 'equations'>('algebra')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 46), 180)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [value])

  const insertNotationAtCaret = (notation: string, tokenLabel = '') => {
    const textarea = textareaRef.current

    if (tokenLabel !== 'Paste Normalized') {
      trackTelemetryEvent(conceptId, activeStepIndex, 'calculator_button_click', {
        label: tokenLabel || notation,
        token: notation,
        category: activeCategory,
      })
    }

    if (!textarea) {
      onChange(toMathematicalDisplay(value + notation))
      return
    }

    const start = textarea.selectionStart ?? value.length
    const end = textarea.selectionEnd ?? value.length
    const selectedText = value.substring(start, end)
    const before = value.substring(0, start)
    const after = value.substring(end)

    let insertText = notation
    let newCursorPos = start + notation.length

    if (notation === '__SQRT__') {
      if (selectedText) {
        insertText = `√(${selectedText})`
        newCursorPos = start + insertText.length
      } else {
        insertText = '√('
        newCursorPos = start + insertText.length
      }
    } else if (notation === '__FRAC__') {
      if (selectedText) {
        insertText = `(${selectedText}/)`
        newCursorPos = start + insertText.length - 1
      } else {
        insertText = '( / )'
        newCursorPos = start + 1
      }
    } else if (notation === '__POW_N__') {
      insertText = 'ⁿ'
      newCursorPos = start + 1
    }

    const newValue = toMathematicalDisplay(before + insertText + after)
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 10)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    if (!e.clipboardData) return

    const cleaned = extractCleanClipboardText(e.clipboardData)
    if (!cleaned) return

    insertNotationAtCaret(cleaned, 'Paste Normalized')
    trackTelemetryEvent(conceptId, activeStepIndex, 'paste_normalized', { cleaned_length: cleaned.length })
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(toMathematicalDisplay(e.target.value))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey || (!e.shiftKey && !value.includes('\n'))) {
        e.preventDefault()
        if (value.trim() && !isSubmitting && onSubmit) {
          onSubmit()
        }
      }
    }
    if (e.key === 'Escape') {
      onChange('')
    }
  }

  const categories: Record<string, { label: string; items: CalcItem[] }> = {
    algebra: {
      label: '🔢 Algebra & Radicals',
      items: [
        { label: '√x', insert: '__SQRT__', highlight: true },
        { label: 'x²', insert: '²', highlight: true },
        { label: 'x³', insert: '³' },
        { label: 'xⁿ', insert: '__POW_N__' },
        { label: 'a/b', insert: '/' },
        { label: '+', insert: ' + ' },
        { label: '-', insert: ' - ' },
        { label: '×', insert: ' × ' },
        { label: '÷', insert: ' ÷ ' },
        { label: '=', insert: ' = ' },
        { label: '≠', insert: ' ≠ ' },
        { label: '±', insert: ' ± ' },
        { label: '(', insert: '(' },
        { label: ')', insert: ')' },
        { label: '␣ Space', insert: ' ' },
      ],
    },
    trig: {
      label: '📐 Trigonometry & Greek',
      items: [
        { label: 'sin(θ)', insert: 'sin(θ)' },
        { label: 'cos(θ)', insert: 'cos(θ)' },
        { label: 'tan(θ)', insert: 'tan(θ)' },
        { label: 'cot(θ)', insert: 'cot(θ)' },
        { label: 'sec(θ)', insert: 'sec(θ)' },
        { label: 'csc(θ)', insert: 'csc(θ)' },
        { label: 'θ', insert: 'θ' },
        { label: 'α', insert: 'α' },
        { label: 'β', insert: 'β' },
        { label: 'sin²(θ)', insert: 'sin²(θ)' },
        { label: 'cos²(θ)', insert: 'cos²(θ)' },
        { label: 'tan²(θ)', insert: 'tan²(θ)' },
      ],
    },
    radians: {
      label: '🎯 Angles & Radians',
      items: [
        { label: '90°', insert: '90°' },
        { label: '60°', insert: '60°' },
        { label: '45°', insert: '45°' },
        { label: '30°', insert: '30°' },
        { label: '0°', insert: '0°' },
        { label: 'π', insert: 'π' },
        { label: 'π/2 (90°)', insert: 'π/2' },
        { label: 'π/3 (60°)', insert: 'π/3' },
        { label: 'π/4 (45°)', insert: 'π/4' },
        { label: 'π/6 (30°)', insert: 'π/6' },
        { label: '2π (360°)', insert: '2π' },
        { label: '∠B', insert: '∠B' },
        { label: 'ΔABC', insert: 'ΔABC' },
      ],
    },
    equations: {
      label: '⚡ Common Formulas',
      items: [
        { label: 'XZ² = 21² + 20²', insert: 'XZ² = 21² + 20²' },
        { label: 'XZ = √(841) = 29', insert: 'XZ = √(841) = 29' },
        { label: 'XZ = 29 cm', insert: 'XZ = 29 cm' },
        { label: 'sin(X) = 20/29', insert: 'sin(X) = 20/29' },
        { label: 'cos(X) = 21/29', insert: 'cos(X) = 21/29' },
        { label: 'tan(X) = 20/21', insert: 'tan(X) = 20/21' },
        { label: 'AC² = AB² + BC²', insert: 'AC² = AB² + BC²' },
        { label: 'a² + b² = c²', insert: 'a² + b² = c²' },
        { label: 'sin²(θ) + cos²(θ) = 1', insert: 'sin²(θ) + cos²(θ) = 1' },
      ],
    },
  }

  const numpadButtons = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '(', ')'],
  ]

  const buttonLabel = isEditMode ? 'Update' : isLastStep ? 'Submit' : 'Next'

  return (
    <div className="space-y-3 font-mono">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5">
        <div className="bg-white border border-[#E8E2D6] rounded-xl px-4 py-3 flex items-center justify-center shrink-0 shadow-sm self-start">
          <span className="font-bold text-[13px] text-[#151F1C] font-mono whitespace-nowrap">{stepLabel}</span>
        </div>

        <div className="flex-1 relative bg-white border border-[#E8E2D6] rounded-xl shadow-sm focus-within:border-[#151F1C] focus-within:ring-4 focus-within:ring-[#151F1C]/5 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-transparent px-4 py-3 text-[14px] text-[#151F1C] font-mono outline-none resize-none placeholder:text-[#8A8A7A] placeholder:text-xs leading-relaxed"
            style={{ minHeight: '46px' }}
          />

          {value && (
            <button
              type="button"
              onClick={() => {
                trackTelemetryEvent(conceptId, activeStepIndex, 'clear_click', {})
                onChange('')
              }}
              className="absolute right-2 top-2 p-1.5 rounded-md text-[#8A8A7A] hover:text-[#151F1C] hover:bg-[#F7F5EF] transition-colors"
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start">
          <button
            type="button"
            onClick={() => {
              const nextState = !showCalculator
              setShowCalculator(nextState)
              trackTelemetryEvent(conceptId, activeStepIndex, 'calculator_toggle', { isOpen: nextState })
            }}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border shadow-sm ${
              showCalculator ? 'bg-[#151F1C] text-[#FAF9F5] border-[#151F1C]' : 'bg-white text-[#151F1C] border-[#E8E2D6] hover:bg-[#F7F5EF]'
            }`}
            title={showCalculator ? 'Hide Calculator' : 'Show Calculator'}
          >
            <Calculator className="w-4 h-4" />
          </button>

          {showLightbulb && onToggleHint && (
            <button
              type="button"
              onClick={() => {
                onToggleHint()
                trackTelemetryEvent(conceptId, activeStepIndex, 'hint_toggle', { isOpen: !isHintOpen })
              }}
              title="Toggle Socratic Guided Clue"
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm border border-[#C19A6B] ${
                isHintOpen ? 'bg-[#EEDBC5] ring-2 ring-[#C19A6B]/30 text-[#5C3C17]' : 'bg-[#F6EFE6] hover:bg-[#EEDBC5] text-[#745228]'
              }`}
            >
              <Lightbulb className="w-4 h-4 fill-[#C19A6B]/30 text-[#745228]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onSubmit && onSubmit()}
            disabled={isSubmitting || !value.trim()}
            className="bg-[#151F1C] hover:bg-[#2A3A32] disabled:opacity-40 text-[#FAF9F5] font-semibold text-xs font-mono px-5 h-11 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <span>{buttonLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {isEditMode && onCancelEdit && (
            <button type="button" onClick={onCancelEdit} className="px-3 py-2 text-xs font-sans text-[#8A8A7A] hover:text-[#151F1C]">
              Cancel
            </button>
          )}
        </div>
      </div>

      {value.trim() && (
        <div className="p-3 bg-[#FAF9F5] border border-[#E8E2D6] rounded-xl flex items-start justify-between gap-2 text-xs animate-fade-in shadow-sm">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-mono text-[#8A8A7A] uppercase font-semibold block flex items-center gap-1">
              <Eye className="w-3 h-3 text-[#151F1C]" />
              Live KaTeX Rendered Preview:
            </span>
            <div className="font-mono text-[14px] text-[#151F1C] font-semibold">
              {value.includes('\n') ? (
                <div className="space-y-1.5">
                  {value.split('\n').map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#8A8A7A] text-[11px] font-mono mt-0.5">•</span>
                      <div className="flex-1">
                        <MathDisplay math={line} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <MathDisplay math={value} />
              )}
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#8A8A7A] shrink-0 self-center hidden md:inline">
            Press Shift+Enter for new line
          </span>
        </div>
      )}

      {showCalculator && (
        <div className="bg-[#FAF9F5] border border-[#E8E2D6] rounded-2xl p-4 shadow-sm animate-fade-in space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D6] pb-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(key as typeof activeCategory)
                    trackTelemetryEvent(conceptId, activeStepIndex, 'calculator_tab_switch', { category: key })
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all font-semibold ${
                    activeCategory === key ? 'bg-[#151F1C] text-[#FAF9F5] shadow-sm' : 'bg-[#F7F5EF] text-[#6B6B5F] hover:text-[#151F1C] border border-[#E8E2D6]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  trackTelemetryEvent(conceptId, activeStepIndex, 'line_break_click', {})
                  insertNotationAtCaret('\n', 'Line Break')
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#F7F5EF] text-[#6B6B5F] hover:text-[#151F1C] border border-[#E8E2D6] text-xs font-semibold transition-colors flex items-center gap-1"
                title="New Line (Shift+Enter)"
              >
                <CornerDownLeft className="w-3.5 h-3.5" /> Line Break
              </button>

              <button
                type="button"
                onClick={() => {
                  trackTelemetryEvent(conceptId, activeStepIndex, 'clear_click', {})
                  onChange('')
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#F7F5EF] text-[#6B6B5F] hover:text-red-600 border border-[#E8E2D6] text-xs font-semibold transition-colors flex items-center gap-1"
                title="Clear"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            <div className="md:col-span-8 flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-[#E8E2D6] min-h-[130px] content-start">
              {categories[activeCategory].items.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertNotationAtCaret(item.insert, item.label)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm border ${
                    item.highlight
                      ? 'bg-[#E6F4EA] border-[#A7D4B5] text-[#2D6A4F] font-bold hover:bg-[#D1EBD9]'
                      : 'bg-[#FAF9F5] hover:bg-[#F7F5EF] border-[#E8E2D6] text-[#151F1C]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="md:col-span-4 bg-white p-2.5 rounded-xl border border-[#E8E2D6] space-y-1.5">
              {numpadButtons.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-4 gap-1.5">
                  {row.map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => insertNotationAtCaret(btn, btn)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm ${
                        ['+', '-', '×', '/'].includes(btn)
                          ? 'bg-[#E6F4EA] text-[#2D6A4F] border border-[#A7D4B5] hover:bg-[#D1EBD9]'
                          : 'bg-[#FAF9F5] text-[#151F1C] border border-[#E8E2D6] hover:bg-[#F7F5EF]'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8A8A7A] font-sans px-1">
            <span>💡 Tip: Click anywhere to move caret, use Left/Right arrows, or select text to wrap with <strong>√x</strong>.</span>
            <span className="text-[10px] font-mono text-[#8A8A7A]">Press Shift+Enter for multiple lines</span>
          </div>
        </div>
      )}
    </div>
  )
}
