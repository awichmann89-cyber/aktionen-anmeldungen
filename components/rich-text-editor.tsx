'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // wichtig für Next.js SSR
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Text eingeben…',
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'tiptap min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Leerer Editor liefert "<p></p>" – als leer behandeln
      onChange(html === '<p></p>' ? '' : html)
    },
  })

  // Externe Wertänderung (z. B. nach Laden der Aktion) in den Editor übernehmen
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = value || ''
    if (incoming !== current && !(incoming === '' && current === '<p></p>')) {
      editor.commands.setContent(incoming, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) return null

  function setLink() {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link-URL (leer lassen zum Entfernen):', previous ?? 'https://')
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const btn = (active: boolean) =>
    cn(
      'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
      active && 'bg-muted text-foreground'
    )

  return (
    <div className="rounded-md border border-input">
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-1">
        <button type="button" title="Fett" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" title="Kursiv" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" title="Überschrift" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" title="Aufzählung" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" title="Nummerierte Liste" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" title="Link" className={btn(editor.isActive('link'))} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" title="Rückgängig" className={btn(false)} onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </button>
        <button type="button" title="Wiederholen" className={btn(false)} onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
