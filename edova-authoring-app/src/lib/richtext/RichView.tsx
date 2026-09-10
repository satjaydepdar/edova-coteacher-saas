import { useEffect, useRef } from 'react'
import katex from 'katex'
import './richtext.css'

export interface RichViewProps {
  html: string | null | undefined
  className?: string
}

/** Read-only renderer for content saved by RichEditor. The HTML itself was
 *  already sanitized server-side on save (backend/main.py sanitize_rich_text) --
 *  this only fills in the KaTeX rendering for any <span class="qmath"> nodes,
 *  the same way the editor's own MathNodeView does while authoring. */
export default function RichView({ html, className }: RichViewProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.querySelectorAll<HTMLElement>('.qmath').forEach((node) => {
      const latex = node.getAttribute('data-latex') || ''
      try {
        katex.render(latex, node, { throwOnError: false, displayMode: false })
      } catch {
        node.textContent = latex
      }
    })
  }, [html])

  if (!html) return null
  return <div ref={ref} className={`rte-content rte-view${className ? ` ${className}` : ''}`} dangerouslySetInnerHTML={{ __html: html }} />
}
