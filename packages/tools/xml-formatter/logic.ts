export const INDENT_OPTIONS = [2, 4] as const

export type IndentOption = (typeof INDENT_OPTIONS)[number]

export const DEFAULT_INDENT: IndentOption = 2

export type XmlFormatResult = { ok: true; output: string } | { ok: false; error: string }

const ELEMENT_NODE = 1
const TEXT_NODE = 3
const CDATA_SECTION_NODE = 4
const PROCESSING_INSTRUCTION_NODE = 7
const COMMENT_NODE = 8
const DOCUMENT_TYPE_NODE = 10

type XmlChild =
  | { kind: 'element'; node: Element }
  | { kind: 'text'; text: string }
  | { kind: 'cdata'; text: string }
  | { kind: 'comment'; text: string }
  | { kind: 'pi'; text: string }
  | { kind: 'doctype'; name: string }

export function parseIndent(value: string): IndentOption | null {
  if (value === '2') {
    return 2
  }
  if (value === '4') {
    return 4
  }
  return null
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;')
    .replaceAll('>', '&gt;')
}

function serializeAttributes(element: Element): string {
  const parts: string[] = []
  for (const attribute of Array.from(element.attributes)) {
    parts.push(`${attribute.name}="${escapeAttribute(attribute.value)}"`)
  }
  return parts.length === 0 ? '' : ` ${parts.join(' ')}`
}

function isInline(child: XmlChild): boolean {
  return child.kind === 'text' || child.kind === 'cdata' || child.kind === 'pi'
}

function serializeInline(child: XmlChild): string {
  switch (child.kind) {
    case 'text':
      return escapeText(child.text)
    case 'cdata':
      return `<![CDATA[${child.text}]]>`
    case 'comment':
      return `<!--${child.text}-->`
    case 'pi':
      return `<?${child.text}?>`
    case 'doctype':
      return `<!DOCTYPE ${child.name}>`
    case 'element':
      return ''
  }
}

function collectChildren(node: Node): XmlChild[] {
  const children: XmlChild[] = []
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === ELEMENT_NODE) {
      children.push({ kind: 'element', node: child as Element })
    } else if (child.nodeType === TEXT_NODE) {
      const text = child.textContent ?? ''
      if (text.trim() !== '') {
        children.push({ kind: 'text', text })
      }
    } else if (child.nodeType === CDATA_SECTION_NODE) {
      children.push({ kind: 'cdata', text: child.textContent ?? '' })
    } else if (child.nodeType === COMMENT_NODE) {
      children.push({ kind: 'comment', text: child.textContent ?? '' })
    } else if (child.nodeType === PROCESSING_INSTRUCTION_NODE) {
      children.push({ kind: 'pi', text: child.textContent ?? '' })
    } else if (child.nodeType === DOCUMENT_TYPE_NODE) {
      children.push({ kind: 'doctype', name: child.nodeName })
    }
  }
  return children
}

function serializeElement(element: Element, depth: number, indentUnit: string): string[] {
  const indent = indentUnit.repeat(depth)
  const name = element.nodeName
  const open = `<${name}${serializeAttributes(element)}>`
  const children = collectChildren(element)
  const elementChildren = children.filter((child) => child.kind === 'element')

  if (elementChildren.length === 0) {
    if (children.length === 0) {
      return [`${indent}${open.slice(0, -1)}/>`]
    }
    return [`${indent}${open}${children.map(serializeInline).join('')}</${name}>`]
  }

  const lines: string[] = []
  let leading = ''
  let childIndex = 0
  while (childIndex < children.length && isInline(children[childIndex]!)) {
    leading += serializeInline(children[childIndex]!)
    childIndex += 1
  }
  lines.push(`${indent}${open}${leading}`)
  for (; childIndex < children.length; childIndex += 1) {
    const child = children[childIndex]!
    if (child.kind === 'element') {
      lines.push(...serializeElement(child.node, depth + 1, indentUnit))
    } else {
      lines.push(`${indentUnit.repeat(depth + 1)}${serializeInline(child)}`)
    }
  }
  lines.push(`${indent}</${name}>`)
  return lines
}

export function formatXml(input: string, indent: IndentOption = DEFAULT_INDENT): XmlFormatResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  let document: Document
  try {
    document = new DOMParser().parseFromString(input, 'application/xml')
  } catch {
    return { ok: false, error: 'Invalid XML: could not parse the document.' }
  }
  if (document.getElementsByTagName('parsererror').length > 0) {
    return { ok: false, error: 'Invalid XML: document is not well-formed.' }
  }
  if (document.documentElement === null) {
    return { ok: false, error: 'Invalid XML: no root element found.' }
  }
  const indentUnit = ' '.repeat(indent)
  const lines: string[] = []
  for (const child of collectChildren(document)) {
    if (child.kind === 'element') {
      lines.push(...serializeElement(child.node, 0, indentUnit))
    } else {
      lines.push(serializeInline(child))
    }
  }
  return { ok: true, output: lines.join('\n') }
}
