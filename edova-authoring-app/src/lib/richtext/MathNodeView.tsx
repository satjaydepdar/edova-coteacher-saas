import { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import katex from 'katex'

function renderInto(el: HTMLElement | null, latex: string) {
  if (!el) return
  try {
    katex.render(latex || '\\,', el, { throwOnError: false, displayMode: false })
  } catch {
    el.textContent = latex
  }
}

export default function MathNodeView({ node, updateAttributes }: NodeViewProps) {
  const latex = node.attrs.latex as string
  const [editing, setEditing] = useState(!latex)
  const [draft, setDraft] = useState(latex)
  const displayRef = useRef<HTMLSpanElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => renderInto(displayRef.current, latex), [latex])
  useEffect(() => {
    if (editing) renderInto(previewRef.current, draft)
  }, [editing, draft])

  const save = () => {
    updateAttributes({ latex: draft })
    setEditing(false)
  }
  const openEditor = () => {
    setDraft(latex)
    setEditing(true)
  }

  return (
    <NodeViewWrapper as="span" className="qmath-view">
      <span ref={displayRef} className="qmath-render" contentEditable={false} onClick={openEditor} />
      {editing && (
        <span className="qmath-popover" contentEditable={false}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="LaTeX, e.g. x^2 + 1 = 0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                save()
              }
              if (e.key === 'Escape') setEditing(false)
            }}
          />
          <div className="qmath-preview" ref={previewRef} />
          <div className="qmath-actions">
            <button type="button" className="mini" onClick={() => setEditing(false)}>Cancel</button>
            <button type="button" className="mini primary" onClick={save}>Insert</button>
          </div>
        </span>
      )}
    </NodeViewWrapper>
  )
}
