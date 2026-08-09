export type JsonValueType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'

export type JsonPathResult =
  { ok: true; value: unknown; type: JsonValueType } | { ok: false; error: string }

type PathSegment = { kind: 'key'; key: string } | { kind: 'index'; index: number }

type ParsedPath = { ok: true; segments: PathSegment[] } | { ok: false; error: string }

const IDENTIFIER_START = /[A-Za-z_$]/
const IDENTIFIER_CHAR = /[A-Za-z0-9_$]/

function findBracketClose(path: string, start: number): number {
  for (let position = start; position < path.length; position += 1) {
    if (path.charAt(position) === ']') {
      return position
    }
  }
  return -1
}

function classifyUnquotedContent(content: string): string | null {
  if (content === '*') {
    return 'Unsupported syntax: wildcard ("*") is not supported.'
  }
  if (content.startsWith('?')) {
    return 'Unsupported syntax: filters ("[?(...)]") are not supported.'
  }
  if (content.includes(':')) {
    return 'Unsupported syntax: slices ("[start:end]") are not supported.'
  }
  if (content.includes(',')) {
    return 'Unsupported syntax: unions ("[a,b]") are not supported.'
  }
  if (/^-\d+$/.test(content)) {
    return 'Unsupported syntax: negative indices are not supported.'
  }
  if (content.includes('*')) {
    return 'Unsupported syntax: wildcard ("*") is not supported.'
  }
  return null
}

export function parseJsonPath(path: string): ParsedPath {
  let position = 0
  const length = path.length

  if (path.charAt(position) !== '$') {
    return { ok: false, error: 'Invalid path: a path must start with "$".' }
  }
  position += 1

  const segments: PathSegment[] = []

  while (position < length) {
    const char = path.charAt(position)

    if (char === '.') {
      if (path.charAt(position + 1) === '.') {
        return {
          ok: false,
          error: 'Unsupported syntax: recursive descent ("..") is not supported.',
        }
      }
      position += 1
      if (position >= length) {
        return { ok: false, error: 'Invalid path: expected a key after ".".' }
      }
      if (IDENTIFIER_START.test(path.charAt(position))) {
        const keyStart = position
        while (position < length && IDENTIFIER_CHAR.test(path.charAt(position))) {
          position += 1
        }
        segments.push({ kind: 'key', key: path.slice(keyStart, position) })
        continue
      }
      if (path.charAt(position) === '*') {
        return { ok: false, error: 'Unsupported syntax: wildcard ("*") is not supported.' }
      }
      return {
        ok: false,
        error:
          'Invalid path: expected an identifier after "." — use bracket notation (["key"]) for keys with special characters.',
      }
    }

    if (char === '[') {
      position += 1
      const quote = path.charAt(position)
      if (quote === "'" || quote === '"') {
        let keyEnd = position + 1
        let closed = false
        while (keyEnd < length) {
          if (path.charAt(keyEnd) === '\\') {
            keyEnd += 2
            continue
          }
          if (path.charAt(keyEnd) === quote) {
            closed = true
            break
          }
          keyEnd += 1
        }
        if (!closed) {
          return { ok: false, error: 'Invalid path: unterminated quoted key in bracket notation.' }
        }
        const key = path.slice(position + 1, keyEnd).replace(/\\(.)/g, '$1')
        if (key === '') {
          return { ok: false, error: 'Invalid path: empty key ("$[\'\']") is not allowed.' }
        }
        position = keyEnd + 1
        if (path.charAt(position) !== ']') {
          return { ok: false, error: 'Invalid path: expected "]" after the quoted key.' }
        }
        position += 1
        segments.push({ kind: 'key', key })
        continue
      }

      const close = findBracketClose(path, position)
      if (close === -1) {
        return { ok: false, error: 'Invalid path: missing "]" in bracket notation.' }
      }
      const content = path.slice(position, close)
      const unsupported = classifyUnquotedContent(content)
      if (unsupported !== null) {
        return { ok: false, error: unsupported }
      }
      if (!/^\d+$/.test(content)) {
        return {
          ok: false,
          error: `Invalid path: bracket content "${content}" must be a non-negative integer or a quoted key.`,
        }
      }
      segments.push({ kind: 'index', index: Number(content) })
      position = close + 1
      continue
    }

    if (char === '*') {
      return { ok: false, error: 'Unsupported syntax: wildcard ("*") is not supported.' }
    }

    return { ok: false, error: `Invalid path: unexpected character "${char}".` }
  }

  return { ok: true, segments }
}

function describeType(value: unknown): JsonValueType {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'object'
  }
}

export function evaluateJsonPath(jsonText: string, pathText: string): JsonPathResult {
  if (jsonText.trim() === '') {
    return { ok: false, error: 'Input JSON is empty.' }
  }
  if (pathText.trim() === '') {
    return { ok: false, error: 'Path is empty.' }
  }

  let root: unknown
  try {
    root = JSON.parse(jsonText)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unable to parse input'
    return { ok: false, error: `Invalid JSON: ${detail}` }
  }

  const parsed = parseJsonPath(pathText.trim())
  if (!parsed.ok) {
    return parsed
  }

  let current: unknown = root
  let consumed = '$'

  for (const segment of parsed.segments) {
    if (segment.kind === 'key') {
      if (typeof current !== 'object' || current === null || Array.isArray(current)) {
        return {
          ok: false,
          error: `Not found: key "${segment.key}" at ${consumed} (${describeType(current)} does not support key access).`,
        }
      }
      if (!Object.prototype.hasOwnProperty.call(current, segment.key)) {
        return { ok: false, error: `Not found: key "${segment.key}" at ${consumed}.` }
      }
      current = (current as Record<string, unknown>)[segment.key]
      consumed = `${consumed}.${segment.key}`
    } else {
      if (!Array.isArray(current)) {
        return {
          ok: false,
          error: `Not found: index ${segment.index} at ${consumed} (${describeType(current)} does not support index access).`,
        }
      }
      if (segment.index >= current.length) {
        return {
          ok: false,
          error: `Not found: index ${segment.index} at ${consumed} (array has ${current.length} element(s)).`,
        }
      }
      current = current[segment.index]
      consumed = `${consumed}[${segment.index}]`
    }
  }

  return { ok: true, value: current, type: describeType(current) }
}
