export type HtmlToTextResult = { ok: true; output: string } | { ok: false; error: string }

const TEXT_NODE = 3
const ELEMENT_NODE = 1

const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
])

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'template'])

const NOSCRIPT_REGION = /<noscript\b[^>]*>[\s\S]*?(?:<\/noscript\s*>|$)/gi

const COLLAPSE_WHITESPACE = /\s+/g

type TextPart = { kind: 'text'; text: string; preserve: boolean }
type NewlinePart = { kind: 'newline' }
type Part = TextPart | NewlinePart

function extractText(node: Node, parts: Part[]): void {
  if (node.nodeType === TEXT_NODE) {
    parts.push({ kind: 'text', text: node.textContent ?? '', preserve: false })
    return
  }
  if (node.nodeType !== ELEMENT_NODE) {
    return
  }
  const element = node as Element
  const tag = element.tagName.toLowerCase()
  if (SKIP_TAGS.has(tag)) {
    return
  }
  if (tag === 'br') {
    parts.push({ kind: 'newline' })
    return
  }
  if (tag === 'pre') {
    parts.push({ kind: 'newline' })
    parts.push({ kind: 'text', text: element.textContent ?? '', preserve: true })
    parts.push({ kind: 'newline' })
    return
  }
  if (tag === 'code') {
    parts.push({ kind: 'text', text: element.textContent ?? '', preserve: true })
    return
  }
  const block = BLOCK_TAGS.has(tag)
  if (block) {
    parts.push({ kind: 'newline' })
  }
  for (const child of element.childNodes) {
    extractText(child, parts)
  }
  if (block) {
    parts.push({ kind: 'newline' })
  }
}

function renderLine(parts: readonly TextPart[]): string {
  const preservesWhitespace = parts.every((part) => part.preserve)
  if (preservesWhitespace) {
    return parts.map((part) => part.text).join('')
  }
  return parts
    .map((part) => (part.preserve ? part.text : part.text.replace(COLLAPSE_WHITESPACE, ' ')))
    .join('')
    .trim()
}

function render(parts: readonly Part[]): string {
  const lines: TextPart[][] = []
  let current: TextPart[] = []
  for (const part of parts) {
    if (part.kind === 'newline') {
      if (current.length > 0) {
        lines.push(current)
        current = []
      }
      continue
    }
    current.push(part)
  }
  if (current.length > 0) {
    lines.push(current)
  }
  return lines.map(renderLine).join('\n')
}

export function convertHtmlToText(input: string): HtmlToTextResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  const withoutNoscript = input.replace(NOSCRIPT_REGION, '')
  const doc = new DOMParser().parseFromString(withoutNoscript, 'text/html')
  const parts: Part[] = []
  for (const child of doc.body.childNodes) {
    extractText(child, parts)
  }
  return { ok: true, output: render(parts) }
}
