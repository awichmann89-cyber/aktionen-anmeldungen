import DOMPurify from 'isomorphic-dompurify'
import { cn } from '@/lib/utils'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li',
  'h2', 'h3', 'a', 'blockquote', 'code', 'pre', 'span',
]
const ALLOWED_ATTR = ['href', 'target', 'rel']

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Rendert formatierten Beschreibungstext.
 * - Neuer Inhalt ist HTML (Tiptap) -> wird sanitisiert.
 * - Alter Inhalt ist reiner Text -> Zeilenumbrüche bleiben erhalten.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  const raw = html || ''
  const prepared = looksLikeHtml(raw)
    ? raw
    : escapeHtml(raw).replace(/\n/g, '<br />')

  const clean = DOMPurify.sanitize(prepared, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })

  return (
    <div
      className={cn('rich-text', className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}

/** HTML zu reinem Text für Vorschauen (z. B. Karten mit line-clamp). */
export function stripHtml(html: string): string {
  if (!html) return ''
  const text = looksLikeHtml(html) ? html.replace(/<[^>]*>/g, ' ') : html
  return text.replace(/\s+/g, ' ').trim()
}
