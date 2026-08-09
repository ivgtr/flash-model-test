export type Direction = 'to-codes' | 'to-chars'

export interface CodePointRow {
  char: string
  decimal: number
  hex: string
  octal: string
  binary: string
  utf16Units: readonly string[]
}

export type CharsToCodesResult = { ok: true; rows: CodePointRow[] } | { ok: false; error: string }

export type CodesToCharsResult = { ok: true; output: string } | { ok: false; error: string }

const MAX_CODE_POINT = 0x10ffff
const SURROGATE_MIN = 0xd800
const SURROGATE_MAX = 0xdfff

function utf16UnitsOf(codePoint: number): readonly string[] {
  const char = String.fromCodePoint(codePoint)
  const units: string[] = []
  for (let i = 0; i < char.length; i += 1) {
    units.push(char.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'))
  }
  return units
}

export function charsToCodes(input: string): CharsToCodesResult {
  if (input === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  const rows: CodePointRow[] = []
  for (const char of input) {
    const codePoint = char.codePointAt(0)!
    rows.push({
      char,
      decimal: codePoint,
      hex: `U+${codePoint.toString(16).toUpperCase()}`,
      octal: codePoint.toString(8),
      binary: codePoint.toString(2),
      utf16Units: utf16UnitsOf(codePoint),
    })
  }
  return { ok: true, rows }
}

export function formatCodePointRows(rows: readonly CodePointRow[]): string {
  return rows
    .map((row) => {
      const char = JSON.stringify(row.char).slice(1, -1)
      return `${char}  decimal=${row.decimal}  hex=${row.hex}  octal=${row.octal}  binary=${row.binary}  utf16=${row.utf16Units.join(' ')}`
    })
    .join('\n')
}

type ParsedCode = { ok: true; value: number } | { ok: false; error: string }

function parseCodeToken(raw: string): ParsedCode {
  const token = raw.trim()
  if (token === '') {
    return { ok: false, error: 'Invalid code: empty token.' }
  }
  let value: number | null = null
  if (/^[uU]\+[0-9a-fA-F]+$/.test(token)) {
    value = parseInt(token.slice(2), 16)
  } else if (/^0[xX][0-9a-fA-F]+$/.test(token)) {
    value = parseInt(token.slice(2), 16)
  } else if (/^0[bB][01]+$/.test(token)) {
    value = parseInt(token.slice(2), 2)
  } else if (/^0[0-7]+$/.test(token)) {
    value = parseInt(token, 8)
  } else if (/^[01]+$/.test(token)) {
    value = parseInt(token, 2)
  } else if (/^[0-9]+$/.test(token)) {
    value = parseInt(token, 10)
  }
  if (value === null) {
    return { ok: false, error: `Invalid code: "${token}" is not a valid code value.` }
  }
  if (value > MAX_CODE_POINT) {
    return {
      ok: false,
      error: `Invalid code: "${token}" is out of range (maximum 0x10FFFF).`,
    }
  }
  if (value >= SURROGATE_MIN && value <= SURROGATE_MAX) {
    return {
      ok: false,
      error: `Invalid code: "${token}" is a lone surrogate (0xD800-0xDFFF).`,
    }
  }
  return { ok: true, value }
}

export function codesToChars(input: string): CodesToCharsResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  let output = ''
  for (const raw of input.split(',')) {
    const parsed = parseCodeToken(raw)
    if (!parsed.ok) {
      return parsed
    }
    output += String.fromCodePoint(parsed.value)
  }
  return { ok: true, output }
}
