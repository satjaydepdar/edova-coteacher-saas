import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import MathNodeView from './MathNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    qmath: {
      insertMath: (latex?: string) => ReturnType
    }
  }
}

/** Stored as an empty <span class="qmath" data-latex="..."> -- never KaTeX's own
 *  generated markup, which is too large/versioned to safely allowlist server-side.
 *  Every reader (this editor, the Question Bank card, eventually the student app)
 *  renders the same data-latex source with its own KaTeX call. */
export const MathNode = Node.create({
  name: 'qmath',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-latex') || '',
        renderHTML: (attrs) => ({ 'data-latex': attrs.latex }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span.qmath' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'qmath' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },

  addCommands() {
    return {
      insertMath:
        (latex = '') =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex } }),
    }
  },
})
