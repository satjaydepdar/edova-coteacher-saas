import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export interface RichViewProps {
  html: string | null | undefined
  className?: string
}

/** Read-only renderer for content authored in edova-authoring-app's RichEditor.
 *  The HTML was already sanitized server-side on save (backend/main.py
 *  sanitize_rich_text) -- this only fills in KaTeX for <span class="qmath">
 *  nodes, the same math-source contract the authoring app's editor uses. */
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
  return (
    <div
      ref={ref}
      className={`rte-view text-[14px] leading-relaxed [&_p]:mb-2 last:[&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-gold-dark [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg${className ? ` ${className}` : ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
