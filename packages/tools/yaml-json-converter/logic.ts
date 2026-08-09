export type YamlConvertResult = { ok: true; output: string } | { ok: false; error: string }

export type Direction = 'yaml-to-json' | 'json-to-yaml'

export const DIRECTIONS: readonly Direction[] = ['yaml-to-json', 'json-to-yaml']

export const DIRECTION_LABELS: Record<Direction, string> = {
  'yaml-to-json': 'YAML → JSON',
  'json-to-yaml': 'JSON → YAML',
}

export type YamlScalar = string | number | boolean | null

export type YamlNode = YamlScalar | YamlNode[] | { [key: string]: YamlNode }

type NodeResult = { ok: true; value: YamlNode } | { ok: false; error: string }

interface SourceLine {
  indent: number
  text: string
  lineNo: number
}

export function convertYamlJson(input: string, direction: Direction): YamlConvertResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  if (direction === 'yaml-to-json') {
    return yamlToJson(input)
  }
  return jsonToYaml(input)
}

export function yamlToJson(input: string): YamlConvertResult {
  const prepared = preprocessLines(input)
  if (!prepared.ok) {
    return prepared
  }
  if (prepared.lines.length === 0) {
    return { ok: false, error: 'Input is empty.' }
  }
  const parser = new YamlParser(prepared.lines)
  const first = prepared.lines[0]!
  const node = parser.parseNode(first.indent)
  if (!node.ok) {
    return node
  }
  if (parser.hasNext()) {
    const line = parser.peek()
    return { ok: false, error: `Unexpected content (line ${line?.lineNo}).` }
  }
  return { ok: true, output: JSON.stringify(node.value, null, 2) }
}

export function jsonToYaml(input: string): YamlConvertResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    return { ok: false, error: 'Invalid JSON.' }
  }
  return { ok: true, output: serializeYaml(parsed, 0) }
}

function preprocessLines(
  input: string,
): { ok: true; lines: SourceLine[] } | { ok: false; error: string } {
  const rawLines = input.split(/\r?\n/)
  const lines: SourceLine[] = []
  for (let index = 0; index < rawLines.length; index += 1) {
    const raw = rawLines[index] ?? ''
    if (raw.trim() === '') {
      continue
    }
    const match = /^ */u.exec(raw)
    const indent = match?.[0]?.length ?? 0
    const rest = raw.slice(indent)
    if (rest.startsWith('\t')) {
      return { ok: false, error: `Tab indentation is not supported (line ${index + 1}).` }
    }
    if (rest === '' || rest.startsWith('#')) {
      continue
    }
    lines.push({ indent, text: rest, lineNo: index + 1 })
  }
  return { ok: true, lines }
}

class YamlParser {
  private readonly lines: SourceLine[]
  private index = 0

  constructor(lines: SourceLine[]) {
    this.lines = lines
  }

  hasNext(): boolean {
    return this.index < this.lines.length
  }

  peek(): SourceLine | undefined {
    return this.lines[this.index]
  }

  parseNode(indent: number): NodeResult {
    const line = this.peek()
    if (!line) {
      return { ok: false, error: 'Unexpected end of input.' }
    }
    if (line.indent > indent) {
      return { ok: false, error: `Inconsistent indentation (line ${line.lineNo}).` }
    }
    if (line.indent < indent) {
      return { ok: false, error: `Unexpected dedent (line ${line.lineNo}).` }
    }
    const text = line.text
    if (text.startsWith('---') || text.startsWith('...')) {
      return { ok: false, error: `Unsupported syntax: document marker (line ${line.lineNo}).` }
    }
    if (text === '{}') {
      this.index += 1
      return { ok: true, value: {} }
    }
    if (text === '[]') {
      this.index += 1
      return { ok: true, value: [] }
    }
    if (text.startsWith('-')) {
      return this.parseSequence(indent)
    }
    if (findMappingColon(text) !== null) {
      return this.parseMapping(indent)
    }
    if (text.startsWith('&')) {
      return { ok: false, error: `Unsupported syntax: anchor (line ${line.lineNo}).` }
    }
    if (text.startsWith('*')) {
      return { ok: false, error: `Unsupported syntax: alias (line ${line.lineNo}).` }
    }
    if (text.startsWith('|') || text.startsWith('>')) {
      return { ok: false, error: `Unsupported syntax: block scalar (line ${line.lineNo}).` }
    }
    if (text.startsWith('!')) {
      return { ok: false, error: `Unsupported syntax: tag (line ${line.lineNo}).` }
    }
    if (text.startsWith('[') || text.startsWith('{')) {
      return { ok: false, error: `Unsupported syntax: flow collection (line ${line.lineNo}).` }
    }
    const scalar = this.parseScalar(text)
    if (!scalar.ok) {
      return scalar
    }
    this.index += 1
    return scalar
  }

  private parseMapping(indent: number): NodeResult {
    const node: { [key: string]: YamlNode } = {}
    while (true) {
      const line = this.peek()
      if (!line || line.indent < indent) {
        break
      }
      if (line.indent !== indent || findMappingColon(line.text) === null) {
        break
      }
      const entry = this.parseEntryLine(line.text, line.lineNo, indent)
      if (!entry.ok) {
        return entry
      }
      if (Object.prototype.hasOwnProperty.call(node, entry.key)) {
        return { ok: false, error: `Duplicate key "${entry.key}" (line ${line.lineNo}).` }
      }
      node[entry.key] = entry.value
    }
    return { ok: true, value: node }
  }

  private parseEntryLine(
    text: string,
    lineNo: number,
    indent: number,
  ): { ok: true; key: string; value: YamlNode } | { ok: false; error: string } {
    const colon = findMappingColon(text)
    if (colon === null) {
      return { ok: false, error: `Expected a mapping entry (line ${lineNo}).` }
    }
    const keyResult = parseKey(stripInlineComment(text.slice(0, colon)))
    if (!keyResult.ok) {
      return { ok: false, error: `${keyResult.error} (line ${lineNo}).` }
    }
    const rawValue = stripInlineComment(text.slice(colon + 1)).trim()
    this.index += 1
    if (rawValue !== '') {
      const value = this.parseScalar(rawValue)
      if (!value.ok) {
        return value
      }
      return { ok: true, key: keyResult.key, value: value.value }
    }
    const next = this.peek()
    if (next && next.indent > indent) {
      const child = this.parseNode(next.indent)
      if (!child.ok) {
        return child
      }
      return { ok: true, key: keyResult.key, value: child.value }
    }
    return { ok: true, key: keyResult.key, value: null }
  }

  private parseSequence(indent: number): NodeResult {
    const items: YamlNode[] = []
    while (true) {
      const line = this.peek()
      if (!line || line.indent < indent) {
        break
      }
      if (line.indent !== indent || !line.text.startsWith('-')) {
        break
      }
      const rest = line.text.slice(1).trimStart()
      if (rest === '') {
        this.index += 1
        const next = this.peek()
        if (next && next.indent > indent) {
          const child = this.parseNode(next.indent)
          if (!child.ok) {
            return child
          }
          items.push(child.value)
        } else {
          items.push(null)
        }
        continue
      }
      if (rest.startsWith('&')) {
        return { ok: false, error: `Unsupported syntax: anchor (line ${line.lineNo}).` }
      }
      if (rest.startsWith('*')) {
        return { ok: false, error: `Unsupported syntax: alias (line ${line.lineNo}).` }
      }
      if (rest.startsWith('---') || rest.startsWith('...')) {
        return { ok: false, error: `Unsupported syntax: document marker (line ${line.lineNo}).` }
      }
      if (rest.startsWith('|') || rest.startsWith('>')) {
        return { ok: false, error: `Unsupported syntax: block scalar (line ${line.lineNo}).` }
      }
      if (rest.startsWith('!')) {
        return { ok: false, error: `Unsupported syntax: tag (line ${line.lineNo}).` }
      }
      if (rest.startsWith('[') || rest.startsWith('{')) {
        if (rest === '{}' || rest === '[]') {
          this.index += 1
          items.push(rest === '{}' ? {} : [])
          continue
        }
        return { ok: false, error: `Unsupported syntax: flow collection (line ${line.lineNo}).` }
      }
      if (findMappingColon(rest) !== null) {
        const entry = this.parseEntryLine(rest, line.lineNo, indent + 2)
        if (!entry.ok) {
          return entry
        }
        const node: { [key: string]: YamlNode } = {}
        node[entry.key] = entry.value
        const continuation = this.parseMapping(indent + 2)
        if (!continuation.ok) {
          return continuation
        }
        if (
          continuation.value === null ||
          typeof continuation.value !== 'object' ||
          Array.isArray(continuation.value)
        ) {
          return { ok: false, error: 'Internal error: expected a mapping.' }
        }
        for (const key of Object.keys(continuation.value)) {
          if (Object.prototype.hasOwnProperty.call(node, key)) {
            return { ok: false, error: `Duplicate key "${key}".` }
          }
          node[key] = continuation.value[key]!
        }
        items.push(node)
        continue
      }
      if (rest.startsWith('-')) {
        this.lines[this.index] = { indent: indent + 2, text: rest, lineNo: line.lineNo }
        const child = this.parseNode(indent + 2)
        if (!child.ok) {
          return child
        }
        items.push(child.value)
        continue
      }
      this.index += 1
      const value = this.parseScalar(rest)
      if (!value.ok) {
        return value
      }
      items.push(value.value)
    }
    return { ok: true, value: items }
  }

  private parseScalar(raw: string): NodeResult {
    const value = stripInlineComment(raw).trim()
    if (value === '') {
      return { ok: true, value: null }
    }
    if (value.startsWith('"')) {
      const quoted = parseDoubleQuoted(value)
      if (!quoted.ok) {
        return { ok: false, error: quoted.error }
      }
      return { ok: true, value: quoted.value }
    }
    if (value.startsWith("'")) {
      const quoted = parseSingleQuoted(value)
      if (!quoted.ok) {
        return { ok: false, error: quoted.error }
      }
      return { ok: true, value: quoted.value }
    }
    if (value === '{}') {
      return { ok: true, value: {} }
    }
    if (value === '[]') {
      return { ok: true, value: [] }
    }
    if (value.startsWith('&')) {
      return { ok: false, error: 'Unsupported syntax: anchor.' }
    }
    if (value.startsWith('*')) {
      return { ok: false, error: 'Unsupported syntax: alias.' }
    }
    if (value.startsWith('!')) {
      return { ok: false, error: 'Unsupported syntax: tag.' }
    }
    if (value.startsWith('|') || value.startsWith('>')) {
      return { ok: false, error: 'Unsupported syntax: block scalar.' }
    }
    if (value.startsWith('[') || value.startsWith('{')) {
      return { ok: false, error: 'Unsupported syntax: flow collection.' }
    }
    if (value.includes(': ')) {
      return { ok: false, error: 'Unexpected ": " inside an unquoted value.' }
    }
    return { ok: true, value: parsePlainScalar(value) }
  }
}

function findMappingColon(text: string): number | null {
  let quote: '"' | "'" | null = null
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index]!
    if (quote === '"') {
      if (ch === '\\') {
        index += 1
        continue
      }
      if (ch === '"') {
        quote = null
      }
      continue
    }
    if (quote === "'") {
      if (ch === "'") {
        if (text[index + 1] === "'") {
          index += 1
          continue
        }
        quote = null
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === ':' && (text[index + 1] === ' ' || text[index + 1] === undefined)) {
      return index
    }
  }
  return null
}

function stripInlineComment(raw: string): string {
  let quote: '"' | "'" | null = null
  for (let index = 0; index < raw.length; index += 1) {
    const ch = raw[index]!
    if (quote === '"') {
      if (ch === '\\') {
        index += 1
        continue
      }
      if (ch === '"') {
        quote = null
      }
      continue
    }
    if (quote === "'") {
      if (ch === "'") {
        if (raw[index + 1] === "'") {
          index += 1
          continue
        }
        quote = null
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '#' && (index === 0 || raw[index - 1] === ' ' || raw[index - 1] === '\t')) {
      return raw.slice(0, index)
    }
  }
  return raw
}

function parseKey(raw: string): { ok: true; key: string } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Empty key' }
  }
  if (trimmed.startsWith('"')) {
    const quoted = parseDoubleQuoted(trimmed)
    if (!quoted.ok) {
      return { ok: false, error: quoted.error }
    }
    return { ok: true, key: quoted.value }
  }
  if (trimmed.startsWith("'")) {
    const quoted = parseSingleQuoted(trimmed)
    if (!quoted.ok) {
      return { ok: false, error: quoted.error }
    }
    return { ok: true, key: quoted.value }
  }
  return { ok: true, key: trimmed }
}

function parseDoubleQuoted(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (value.length < 2 || !value.endsWith('"')) {
    return { ok: false, error: 'Unterminated double-quoted string.' }
  }
  const body = value.slice(1, -1)
  let out = ''
  for (let index = 0; index < body.length; index += 1) {
    const ch = body[index]!
    if (ch !== '\\') {
      out += ch
      continue
    }
    const esc = body[index + 1]
    index += 1
    switch (esc) {
      case '"':
        out += '"'
        break
      case '\\':
        out += '\\'
        break
      case 'n':
        out += '\n'
        break
      case 't':
        out += '\t'
        break
      case 'r':
        out += '\r'
        break
      case '0':
        out += '\0'
        break
      case 'u': {
        const hex = body.slice(index + 1, index + 5)
        if (!/^[0-9a-fA-F]{4}$/u.test(hex)) {
          return { ok: false, error: 'Invalid \\u escape sequence.' }
        }
        out += String.fromCharCode(parseInt(hex, 16))
        index += 4
        break
      }
      default:
        return { ok: false, error: `Unsupported escape sequence \\${esc}.` }
    }
  }
  return { ok: true, value: out }
}

function parseSingleQuoted(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (value.length < 2 || !value.endsWith("'")) {
    return { ok: false, error: 'Unterminated single-quoted string.' }
  }
  const body = value.slice(1, -1)
  let out = ''
  for (let index = 0; index < body.length; index += 1) {
    const ch = body[index]!
    if (ch === "'") {
      if (body[index + 1] === "'") {
        out += "'"
        index += 1
        continue
      }
      return { ok: false, error: 'Unexpected quote inside single-quoted string.' }
    }
    out += ch
  }
  return { ok: true, value: out }
}

function parsePlainScalar(value: string): YamlScalar {
  if (value === 'true' || value === 'True' || value === 'TRUE') {
    return true
  }
  if (value === 'false' || value === 'False' || value === 'FALSE') {
    return false
  }
  if (value === 'null' || value === 'Null' || value === 'NULL' || value === '~') {
    return null
  }
  if (/^[-+]?[0-9]+$/u.test(value)) {
    const number = Number(value)
    if (Number.isSafeInteger(number)) {
      return number
    }
    return value
  }
  if (/^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?$/u.test(value)) {
    const number = Number(value)
    if (Number.isFinite(number)) {
      return number
    }
    return value
  }
  return value
}

function serializeYaml(value: unknown, level: number): string {
  if (Array.isArray(value)) {
    return serializeSequence(value, level)
  }
  if (value !== null && typeof value === 'object') {
    return serializeMapping(value as Record<string, unknown>, level)
  }
  return `${'  '.repeat(level)}${serializeScalar(value)}`
}

function serializeMapping(obj: Record<string, unknown>, level: number): string {
  const indent = '  '.repeat(level)
  const keys = Object.keys(obj)
  if (keys.length === 0) {
    return `${indent}{}`
  }
  const lines: string[] = []
  for (const key of keys) {
    const keyText = quoteKey(key)
    const value = obj[key]
    const prefix = `${indent}${keyText}:`
    if (value === null) {
      lines.push(prefix)
      continue
    }
    if (isScalar(value)) {
      lines.push(`${prefix} ${serializeScalar(value)}`)
      continue
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${prefix} []`)
        continue
      }
      lines.push(prefix)
      lines.push(serializeSequence(value, level + 1))
      continue
    }
    const child = serializeMapping(value as Record<string, unknown>, level + 1)
    if (child.trim() === '{}') {
      lines.push(`${prefix} {}`)
      continue
    }
    lines.push(prefix)
    lines.push(child)
  }
  return lines.join('\n')
}

function serializeSequence(arr: unknown[], level: number): string {
  const indent = '  '.repeat(level)
  if (arr.length === 0) {
    return `${indent}[]`
  }
  const lines: string[] = []
  for (const item of arr) {
    if (item === null) {
      lines.push(`${indent}- null`)
      continue
    }
    if (isScalar(item)) {
      lines.push(`${indent}- ${serializeScalar(item)}`)
      continue
    }
    if (Array.isArray(item)) {
      if (item.length === 0) {
        lines.push(`${indent}- []`)
        continue
      }
      lines.push(`${indent}-`)
      lines.push(serializeSequence(item, level + 1))
      continue
    }
    const obj = item as Record<string, unknown>
    if (Object.keys(obj).length === 0) {
      lines.push(`${indent}- {}`)
      continue
    }
    const objLines = serializeMapping(obj, level + 1).split('\n')
    const first = objLines[0]
    if (first !== undefined) {
      lines.push(`${indent}- ${first.trimStart()}`)
    }
    for (let index = 1; index < objLines.length; index += 1) {
      const rest = objLines[index]
      if (rest !== undefined) {
        lines.push(rest)
      }
    }
  }
  return lines.join('\n')
}

function isScalar(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function serializeScalar(value: unknown): string {
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return quoteString(value as string)
}

function quoteKey(key: string): string {
  if (
    /^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(key) &&
    !/^(?:true|false|null|yes|no|on|off)$/iu.test(key)
  ) {
    return key
  }
  return quoteString(key)
}

function quoteString(value: string): string {
  if (isSafePlain(value)) {
    return value
  }
  if (hasControlChar(value) || value.includes('"') || value.includes('\\')) {
    return doubleQuote(value)
  }
  return `'${value.replace(/'/gu, "''")}'`
}

function isSafePlain(value: string): boolean {
  if (value === '' || value !== value.trim()) {
    return false
  }
  if (/^[-+]?[0-9]/u.test(value)) {
    return false
  }
  if (/^(?:true|false|null|yes|no|on|off|~)$/iu.test(value)) {
    return false
  }
  if (/[{}[\],]/u.test(value)) {
    return false
  }
  if (value.includes('"') || value.includes("'")) {
    return false
  }
  if (/^[#"'\-?:&*!|>%@`]/u.test(value)) {
    return false
  }
  if (value.includes(': ') || value.endsWith(':') || value.includes(' #')) {
    return false
  }
  if (hasControlChar(value)) {
    return false
  }
  return true
}

function hasControlChar(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) {
      return true
    }
  }
  return false
}

function doubleQuote(value: string): string {
  let out = '"'
  for (const ch of value) {
    switch (ch) {
      case '"':
        out += '\\"'
        break
      case '\\':
        out += '\\\\'
        break
      case '\n':
        out += '\\n'
        break
      case '\t':
        out += '\\t'
        break
      case '\r':
        out += '\\r'
        break
      default:
        if (ch.charCodeAt(0) < 0x20 || ch.charCodeAt(0) === 0x7f) {
          out += `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`
        } else {
          out += ch
        }
    }
  }
  return `${out}"`
}
