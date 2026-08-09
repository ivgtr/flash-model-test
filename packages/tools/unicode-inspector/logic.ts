export const MAX_CODE_POINTS = 1000

export interface CharInfo {
  char: string
  codePoint: number
  hex: string
  decimal: string
  utf16Units: number[]
  utf8Bytes: number[]
  utf8Hex: string
  isAstral: boolean
  display: string
}

export interface UnicodeStats {
  codePoints: number
  utf16Units: number
  utf8Bytes: number
}

export type InspectUnicodeResult =
  { ok: true; chars: CharInfo[]; stats: UnicodeStats } | { ok: false; error: string }

const encoder = new TextEncoder()

const C0_DISPLAY: Record<number, string> = {
  0x00: '\\0',
  0x08: '\\b',
  0x09: '\\t',
  0x0a: '\\n',
  0x0b: '\\v',
  0x0c: '\\f',
  0x0d: '\\r',
}

export function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
}

function isControl(codePoint: number): boolean {
  return codePoint <= 0x1f || codePoint === 0x7f
}

function displayFor(codePoint: number, char: string): string {
  if (isControl(codePoint)) {
    return C0_DISPLAY[codePoint] ?? formatCodePoint(codePoint)
  }
  return char
}

export function formatUtf16Units(units: readonly number[]): string {
  return units.map((unit) => `0x${unit.toString(16).toUpperCase().padStart(4, '0')}`).join(' ')
}

export function inspectUnicode(input: string): InspectUnicodeResult {
  const chars = Array.from(input)
  if (chars.length > MAX_CODE_POINTS) {
    return {
      ok: false,
      error: `Input exceeds the limit of ${MAX_CODE_POINTS} code points.`,
    }
  }

  const inspected: CharInfo[] = []
  let utf16Total = 0
  let utf8Total = 0

  for (const char of chars) {
    const codePoint = char.codePointAt(0)!
    const utf16Units: number[] = []
    for (let index = 0; index < char.length; index += 1) {
      utf16Units.push(char.charCodeAt(index))
    }
    const utf8Bytes = Array.from(encoder.encode(char))
    const utf8Hex = utf8Bytes
      .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ')
    utf16Total += utf16Units.length
    utf8Total += utf8Bytes.length
    inspected.push({
      char,
      codePoint,
      hex: formatCodePoint(codePoint),
      decimal: String(codePoint),
      utf16Units,
      utf8Bytes,
      utf8Hex,
      isAstral: codePoint > 0xffff,
      display: displayFor(codePoint, char),
    })
  }

  return {
    ok: true,
    chars: inspected,
    stats: {
      codePoints: inspected.length,
      utf16Units: utf16Total,
      utf8Bytes: utf8Total,
    },
  }
}

export function formatInspection(input: string): string {
  const result = inspectUnicode(input)
  if (!result.ok) {
    return result.error
  }
  const lines = result.chars.map((info) => {
    const utf16 = formatUtf16Units(info.utf16Units)
    const astral = info.isAstral ? ' (astral)' : ''
    return `${info.display} ${info.hex} dec:${info.decimal} utf16: ${utf16} utf8: ${info.utf8Hex}${astral}`
  })
  const { stats } = result
  lines.push(
    '---',
    `code points: ${stats.codePoints}`,
    `utf-16 units: ${stats.utf16Units}`,
    `utf-8 bytes: ${stats.utf8Bytes}`,
  )
  return lines.join('\n')
}
