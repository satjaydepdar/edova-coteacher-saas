import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { MathNode } from './mathNode'
import RichView from './RichView'
import { isRichTextEmpty } from './utils'
import './richtext.css'

export interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  /** Uploads the picked file and resolves to the URL to embed. Omit to hide the image button. */
  onImageUpload?: (file: File) => Promise<string>
  placeholder?: string
}

/** Click-to-edit: renders as a clean, finished-looking view (math rendered, no
 * toolbar) until clicked, then becomes the live Tiptap editor; moving focus
 * anywhere outside the field (blur) reverts it back to the rendered view. */
export default function RichEditor({ value, onChange, onImageUpload, placeholder }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)

  const editor = useEditor({
    // Several of these editors mount at once (question text, 4 options, passage,
    // explanation) and MathNode's NodeView bridges into React itself -- rendering
    // synchronously during React's own render pass triggers a flushSync warning
    // (Tiptap's documented fix for React 18: defer the first render to an effect).
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({ openOnClick: false, autolink: false }),
      Image.configure({ inline: true, HTMLAttributes: { class: 'rte-image' } }),
      MathNode,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: 'rte-content' } },
  })

  // keep the editor in sync when `value` changes from outside (e.g. switching
  // which question is loaded into the form) without fighting the user's own typing.
  // Deferred a tick: setContent on content containing a math NodeView mounts a new
  // React portal synchronously (Tiptap's NodeView bridge), which -- run directly
  // inside this effect, itself a consequence of the same setDraft() that changed
  // `value` -- trips React's "flushSync during a lifecycle method" warning.
  useEffect(() => {
    if (!editor || value === editor.getHTML()) return
    const id = window.setTimeout(() => editor.commands.setContent(value, { emitUpdate: false }), 0)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // "Click outside" rather than onBlur/relatedTarget: ProseMirror manages its own
  // focus internally and a React onBlur on the wrapper doesn't reliably fire
  // around it (confirmed empirically -- e.g. the equation popover's Insert
  // button unmounts on click, dropping focus straight to <body> with no normal
  // focus-transfer event to key off). Tracking the click target's DOM position
  // instead is independent of that and is the standard pattern for this exact
  // problem (dropdowns, popovers, etc). Kept above the `!editor` early return
  // below so hook call order never changes between renders.
  useEffect(() => {
    if (!isEditing) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (!wrapperRef.current || wrapperRef.current.contains(e.target as Node)) return
      // Deferred a tick, same reason as the setContent effect above: exiting
      // edit mode unmounts EditorContent's ProseMirror view, and doing that
      // synchronously within the SAME mousedown that's also about to deliver a
      // click to whatever was clicked outside (e.g. a Save button) intermittently
      // swallowed that other click/alert entirely -- confirmed empirically.
      window.setTimeout(() => setIsEditing(false), 0)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [isEditing])

  if (!editor) return null

  const setLink = () => {
    const url = window.prompt('Link URL')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onImageUpload) return
    const url = await onImageUpload(file)
    editor.chain().focus().setImage({ src: url }).run()
  }

  const enterEdit = () => {
    setIsEditing(true)
    window.setTimeout(() => editor.commands.focus('end'), 0)
  }

  if (!isEditing) {
    return (
      <div className="rte-view-mode" onClick={enterEdit} onFocus={enterEdit} tabIndex={0} role="textbox">
        {isRichTextEmpty(value) ? (
          <span className="rte-placeholder-static">{placeholder || 'Click to add text…'}</span>
        ) : (
          <RichView html={value} />
        )}
      </div>
    )
  }

  return (
    <div className="rte" ref={wrapperRef}>
      <div className="rte-toolbar">
        <button type="button" className={editor.isActive('bold') ? 'on' : ''} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" className={editor.isActive('italic') ? 'on' : ''} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" className={editor.isActive('link') ? 'on' : ''} onClick={setLink}>🔗</button>
        <button type="button" className={editor.isActive('bulletList') ? 'on' : ''} onClick={() => editor.chain().focus().toggleBulletList().run()}>&#8226;&#8226;&#8226;</button>
        <button type="button" className={editor.isActive('orderedList') ? 'on' : ''} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.2.3</button>
        {onImageUpload && <button type="button" onClick={() => fileInputRef.current?.click()}>🖼</button>}
        <button type="button" onClick={() => editor.chain().focus().insertMath('').run()}>&Sigma; Equation</button>
        <span className="rte-toolbar-sep" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()}>&#8630;</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}>&#8631;</button>
      </div>
      {onImageUpload && (
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
      )}
      <EditorContent editor={editor} />
      {placeholder && editor.isEmpty && <div className="rte-placeholder">{placeholder}</div>}
    </div>
  )
}
