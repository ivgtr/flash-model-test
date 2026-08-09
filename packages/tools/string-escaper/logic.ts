export type EscapeContext = 'html' | 'url' | 'json' | 'regex' | 'js'

export type Direction = 'escape' | 'unescape'

export type QuoteStyle = 'single' | 'double'

export type EscapeResult = { ok: true; output: string } | { ok: false; error: string }

export const CONTEXT_OPTIONS: readonly EscapeContext[] = ['html', 'url', 'json', 'regex', 'js']

export const DIRECTION_OPTIONS: readonly Direction[] = ['escape', 'unescape']

export const QUOTE_STYLE_OPTIONS: readonly QuoteStyle[] = ['single', 'double']

export function parseContext(value: string): EscapeContext | null {
  if (
    value === 'html' ||
    value === 'url' ||
    value === 'json' ||
    value === 'regex' ||
    value === 'js'
  ) {
    return value
  }
  return null
}

export function parseDirection(value: string): Direction | null {
  if (value === 'escape' || value === 'unescape') {
    return value
  }
  return null
}

export function parseQuoteStyle(value: string): QuoteStyle | null {
  if (value === 'single' || value === 'double') {
    return value
  }
  return null
}

const HTML_ESCAPE_PATTERN = /[&<>"']/g

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
} as const

function escapeHtml(input: string): string {
  return input.replace(
    HTML_ESCAPE_PATTERN,
    (char) => HTML_ESCAPE_MAP[char as keyof typeof HTML_ESCAPE_MAP],
  )
}

const NAMED_ENTITY_PATTERN = /^&(amp|lt|gt|quot|apos|nbsp);/

const NAMED_ENTITY_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': '\u00A0',
} as const

const NUMERIC_ENTITY_PATTERN = /^&#(?:[xX]([0-9a-fA-F]+)|([0-9]+));/

function isCodePointAllowed(codePoint: number): boolean {
  return codePoint <= 0x10ffff && (codePoint < 0xd800 || codePoint > 0xdfff)
}

function matchHtmlEntity(input: string, start: number): { decoded: string; end: number } | null {
  const rest = input.slice(start)
  const named = NAMED_ENTITY_PATTERN.exec(rest)
  if (named !== null) {
    const decoded = NAMED_ENTITY_MAP[named[0] as keyof typeof NAMED_ENTITY_MAP]
    return { decoded, end: start + named[0].length }
  }
  const numeric = NUMERIC_ENTITY_PATTERN.exec(rest)
  if (numeric !== null) {
    const hexDigits = numeric[1]
    const decimalDigits = numeric[2]
    const codePoint =
      hexDigits !== undefined ? parseInt(hexDigits, 16) : parseInt(decimalDigits!, 10)
    if (!isCodePointAllowed(codePoint)) {
      return null
    }
    return { decoded: String.fromCodePoint(codePoint), end: start + numeric[0].length }
  }
  return null
}

function unescapeHtml(input: string): EscapeResult {
  let output = ''
  let index = 0
  while (index < input.length) {
    const ampersand = input.indexOf('&', index)
    if (ampersand === -1) {
      output += input.slice(index)
      return { ok: true, output }
    }
    output += input.slice(index, ampersand)
    const entity = matchHtmlEntity(input, ampersand)
    if (entity === null) {
      return { ok: false, error: `Invalid HTML entity at position ${ampersand}.` }
    }
    output += entity.decoded
    index = entity.end
  }
  return { ok: true, output }
}

function unescapeUrl(input: string): EscapeResult {
  try {
    return { ok: true, output: decodeURIComponent(input) }
  } catch {
    return { ok: false, error: 'Invalid URL encoding: malformed percent sequence.' }
  }
}

function unescapeJson(input: string): EscapeResult {
  if (input[0] !== '"' || input[input.length - 1] !== '"') {
    return { ok: false, error: 'Invalid JSON string: expected a quoted string literal.' }
  }
  try {
    const parsed = JSON.parse(input) as unknown
    if (typeof parsed !== 'string') {
      return { ok: false, error: 'Invalid JSON string: expected a string literal.' }
    }
    return { ok: true, output: parsed }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error'
    return { ok: false, error: `Invalid JSON string: ${detail}.` }
  }
}

const REGEX_SPECIAL_CHARS_PATTERN = /[.*+?^${}()|[\]\\/]/g

function escapeRegex(input: string): string {
  return input.replace(REGEX_SPECIAL_CHARS_PATTERN, (char) => `\\${char}`)
}

const JS_NAMED_ESCAPES = {
  '\0': '\\0',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\v': '\\v',
  '\f': '\\f',
  '\r': '\\r',
} as const

function escapeJs(input: string, quoteStyle: QuoteStyle): string {
  const quoteChar = quoteStyle === 'single' ? "'" : '"'
  let content = ''
  for (const char of input) {
    if (char === '\\') {
      content += '\\\\'
      continue
    }
    const named = JS_NAMED_ESCAPES[char as keyof typeof JS_NAMED_ESCAPES]
    if (named !== undefined) {
      content += named
      continue
    }
    const code = char.charCodeAt(0)
    if (code < 0x20 || code === 0x7f) {
      content += `\\x${code.toString(16).padStart(2, '0')}`
      continue
    }
    content += char
  }
  content = content.replaceAll(quoteChar, `\\${quoteChar}`)
  return `${quoteChar}${content}${quoteChar}`
}

const JS_SIMPLE_ESCAPES = {
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
} as const

const HEX_PAIR_PATTERN = /^[0-9a-fA-F]{2}$/

const HEX_QUAD_PATTERN = /^[0-9a-fA-F]{4}$/

const CODE_POINT_PATTERN = /^[0-9a-fA-F]{1,6}$/

function unescapeJs(input: string): EscapeResult {
  const first = input[0]
  if (input.length < 2 || (first !== "'" && first !== '"')) {
    return { ok: false, error: 'Invalid JS string: expected a quoted string literal.' }
  }
  if (input[input.length - 1] !== first) {
    return { ok: false, error: 'Invalid JS string: unterminated or trailing content.' }
  }
  let output = ''
  let index = 1
  const end = input.length - 1
  while (index < end) {
    const char = input[index]!
    if (char === '\\') {
      const next = input[index + 1]
      if (next === undefined) {
        return { ok: false, error: 'Invalid JS string: dangling escape.' }
      }
      if (next === '\n') {
        index += 2
        continue
      }
      if (next === '\r') {
        index += input[index + 2] === '\n' ? 3 : 2
        continue
      }
      if (next === 'x') {
        const hex = input.slice(index + 2, index + 4)
        if (!HEX_PAIR_PATTERN.test(hex)) {
          return { ok: false, error: 'Invalid JS string: malformed \\x escape.' }
        }
        output += String.fromCharCode(parseInt(hex, 16))
        index += 4
        continue
      }
      if (next === 'u') {
        if (input[index + 2] === '{') {
          const close = input.indexOf('}', index + 3)
          if (close === -1) {
            return { ok: false, error: 'Invalid JS string: unterminated \\u{...} escape.' }
          }
          const hex = input.slice(index + 3, close)
          if (!CODE_POINT_PATTERN.test(hex)) {
            return { ok: false, error: 'Invalid JS string: malformed \\u{...} escape.' }
          }
          const codePoint = parseInt(hex, 16)
          if (!isCodePointAllowed(codePoint)) {
            return { ok: false, error: 'Invalid JS string: code point out of range.' }
          }
          output += String.fromCodePoint(codePoint)
          index = close + 1
          continue
        }
        const hex = input.slice(index + 2, index + 6)
        if (!HEX_QUAD_PATTERN.test(hex)) {
          return { ok: false, error: 'Invalid JS string: malformed \\u escape.' }
        }
        output += String.fromCharCode(parseInt(hex, 16))
        index += 6
        continue
      }
      if (next === '0') {
        const following = input[index + 2]
        if (following !== undefined && following >= '0' && following <= '9') {
          return { ok: false, error: 'Invalid JS string: legacy octal escape.' }
        }
        output += '\0'
        index += 2
        continue
      }
      if (next >= '1' && next <= '9') {
        return { ok: false, error: 'Invalid JS string: legacy octal escape.' }
      }
      const simple = JS_SIMPLE_ESCAPES[next as keyof typeof JS_SIMPLE_ESCAPES]
      if (simple !== undefined) {
        output += simple
        index += 2
        continue
      }
      output += next
      index += 2
      continue
    }
    if (char === '\n' || char === '\r') {
      return { ok: false, error: 'Invalid JS string: raw newline inside a literal.' }
    }
    output += char
    index += 1
  }
  return { ok: true, output }
}

export function escapeText(
  input: string,
  context: EscapeContext,
  quoteStyle: QuoteStyle = 'double',
): EscapeResult {
  if (input === '') {
    return { ok: true, output: '' }
  }
  switch (context) {
    case 'html':
      return { ok: true, output: escapeHtml(input) }
    case 'url':
      return { ok: true, output: encodeURIComponent(input) }
    case 'json':
      return { ok: true, output: JSON.stringify(input) }
    case 'regex':
      return { ok: true, output: escapeRegex(input) }
    case 'js':
      return { ok: true, output: escapeJs(input, quoteStyle) }
  }
}

export function unescapeText(input: string, context: EscapeContext): EscapeResult {
  if (input === '') {
    return { ok: true, output: '' }
  }
  switch (context) {
    case 'html':
      return unescapeHtml(input)
    case 'url':
      return unescapeUrl(input)
    case 'json':
      return unescapeJson(input)
    case 'regex':
      return { ok: false, error: 'Regular expressions cannot be unescaped.' }
    case 'js':
      return unescapeJs(input)
  }
}
