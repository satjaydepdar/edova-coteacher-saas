import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { X, NotebookPen } from 'lucide-react'
import { useStudentStore } from '../../store/studentStore'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const MIN_SELECTION_CHARS = 5

interface PdfViewerWithNotesProps {
  fileUrl: string
  title: string
  chapter: string
  onClose: () => void
}

export default function PdfViewerWithNotes({ fileUrl, title, chapter, onClose }: PdfViewerWithNotesProps) {
  const { addWikiNote } = useStudentStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function render() {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('edova_auth_token') || ''
        const pdf = await pdfjsLib.getDocument({
          url: fileUrl,
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).promise
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = ''

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1.4 })

          const pageWrap = document.createElement('div')
          pageWrap.className = 'relative mx-auto mb-4 shadow-card'
          pageWrap.style.width = `${viewport.width}px`
          pageWrap.style.height = `${viewport.height}px`

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')!
          pageWrap.appendChild(canvas)

          await page.render({ canvasContext: ctx, viewport }).promise

          const textLayer = document.createElement('div')
          textLayer.className = 'absolute inset-0 leading-none'
          textLayer.style.opacity = '0.2'
          textLayer.style.color = 'transparent'
          const textContent = await page.getTextContent()
          for (const item of textContent.items as any[]) {
            const tx = pdfjsLib.Util.transform(
              pdfjsLib.Util.transform(viewport.transform, item.transform),
              [1, 0, 0, -1, 0, 0]
            )
            const span = document.createElement('span')
            span.textContent = item.str
            span.style.position = 'absolute'
            span.style.left = `${tx[4]}px`
            span.style.top = `${tx[5] - item.height * viewport.scale}px`
            span.style.fontSize = `${Math.hypot(tx[2], tx[3])}px`
            span.style.fontFamily = 'sans-serif'
            span.style.whiteSpace = 'pre'
            textLayer.appendChild(span)
          }
          pageWrap.appendChild(textLayer)

          if (!cancelled) containerRef.current?.appendChild(pageWrap)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not load this document.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [fileUrl])

  function handleMouseUp() {
    const text = window.getSelection()?.toString().trim() || ''
    setSelection(text.length >= MIN_SELECTION_CHARS ? text : '')
    setSaved(false)
  }

  async function handleSave() {
    if (!selection) return
    await addWikiNote(chapter, title, 'quote', selection)
    setSaved(true)
    window.getSelection()?.removeAllRanges()
    setTimeout(() => setSelection(''), 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2421]/40 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl h-[85vh] bg-[#FBF9F3] border border-[#EDE8DD] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EDE8DD] bg-[#FCFBF8] shrink-0">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F8B]">{chapter}</div>
            <h3 className="font-semibold text-[#111814] text-sm truncate">{title}</h3>
          </div>
          <button onClick={onClose} className="text-[#111814]/40 hover:text-[#111814] p-1 cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex-1 overflow-auto px-4 py-4" onMouseUp={handleMouseUp}>
          {loading && <p className="text-sm text-[#111814]/50 text-center py-16">Loading document...</p>}
          {error && <p className="text-sm text-danger text-center py-16">{error}</p>}
          <div ref={containerRef} />
        </div>

        {selection && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1a2421] text-white rounded-full pl-4 pr-2 py-1.5 shadow-xl">
            <span className="text-xs max-w-[240px] truncate">"{selection}"</span>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DDB56E] text-[#1a2421] text-xs font-semibold cursor-pointer"
            >
              <NotebookPen className="w-3.5 h-3.5" />
              {saved ? 'Saved!' : 'Save to my Wiki'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
