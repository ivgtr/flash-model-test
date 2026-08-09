import { describe, expect, it } from 'vitest'
import {
  MAX_CODE_POINTS,
  formatCodePoint,
  formatInspection,
  formatUtf16Units,
  inspectUnicode,
} from './logic'

describe('inspectUnicode', () => {
  it('reports ASCII display values for each column', () => {
    const result = inspectUnicode('ABz7')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.chars.map((info) => info.char)).toEqual(['A', 'B', 'z', '7'])
    const a = result.chars[0]!
    expect(a.hex).toBe('U+0041')
    expect(a.decimal).toBe('65')
    expect(a.utf16Units).toEqual([0x41])
    expect(a.utf8Bytes).toEqual([0x41])
    expect(a.utf8Hex).toBe('41')
    expect(a.isAstral).toBe(false)
    expect(a.display).toBe('A')
    expect(result.chars[2]!.hex).toBe('U+007A')
    expect(result.chars[2]!.decimal).toBe('122')
    expect(result.chars[3]!.utf8Hex).toBe('37')
  })

  it('shows the UTF-8 multibyte representation for Japanese characters', () => {
    const result = inspectUnicode('あ')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    const info = result.chars[0]!
    expect(info.hex).toBe('U+3042')
    expect(info.decimal).toBe('12354')
    expect(info.utf8Bytes).toEqual([0xe3, 0x81, 0x82])
    expect(info.utf8Hex).toBe('E3 81 82')
    expect(info.isAstral).toBe(false)
  })

  it('treats an emoji as a single astral character with two UTF-16 units', () => {
    const result = inspectUnicode('😀')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.chars).toHaveLength(1)
    const info = result.chars[0]!
    expect(info.char).toBe('😀')
    expect(info.hex).toBe('U+1F600')
    expect(info.decimal).toBe('128512')
    expect(info.isAstral).toBe(true)
    expect(info.utf16Units).toEqual([0xd83d, 0xde00])
    expect(info.utf8Bytes).toEqual([0xf0, 0x9f, 0x98, 0x80])
    expect(info.utf8Hex).toBe('F0 9F 98 80')
  })

  it('does not split a surrogate pair into two characters', () => {
    const result = inspectUnicode('a😀b')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.chars.map((info) => info.char)).toEqual(['a', '😀', 'b'])
    expect(result.chars[1]!.isAstral).toBe(true)
  })

  it('shows control characters as escape notation', () => {
    const result = inspectUnicode('a\n\t\0\x1b\u007f')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.chars.map((info) => info.display)).toEqual([
      'a',
      '\\n',
      '\\t',
      '\\0',
      'U+001B',
      'U+007F',
    ])
    expect(result.chars[1]!.hex).toBe('U+000A')
  })

  it('renders CR and other C0 controls with escape notation', () => {
    const result = inspectUnicode('\r\f')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.chars.map((info) => info.display)).toEqual(['\\r', '\\f'])
  })

  it('computes overall statistics across code points, UTF-16 units, and UTF-8 bytes', () => {
    const result = inspectUnicode('Aあ😀')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.stats).toEqual({ codePoints: 3, utf16Units: 4, utf8Bytes: 8 })
  })

  it('returns zero statistics for empty input without an error', () => {
    const result = inspectUnicode('')
    expect(result).toEqual({
      ok: true,
      chars: [],
      stats: { codePoints: 0, utf16Units: 0, utf8Bytes: 0 },
    })
  })

  it('treats combining marks as independent code points', () => {
    const result = inspectUnicode('e\u0301')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.chars.map((info) => info.char)).toEqual(['e', '\u0301'])
    expect(result.chars[1]!.hex).toBe('U+0301')
    expect(result.stats.codePoints).toBe(2)
  })

  it('handles unassigned code points without crashing', () => {
    const result = inspectUnicode('\u{10FFFF}')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.chars[0]!.hex).toBe('U+10FFFF')
    expect(result.chars[0]!.isAstral).toBe(true)
    expect(result.chars[0]!.utf16Units).toEqual([0xdbff, 0xdfff])
  })

  it('accepts exactly the code point limit', () => {
    const result = inspectUnicode('x'.repeat(MAX_CODE_POINTS))
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.stats.codePoints).toBe(MAX_CODE_POINTS)
  })

  it('rejects input beyond the code point limit with an explicit error', () => {
    const result = inspectUnicode('x'.repeat(MAX_CODE_POINTS + 1))
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error).toContain(`limit of ${MAX_CODE_POINTS} code points`)
  })
})

describe('formatCodePoint and formatUtf16Units', () => {
  it('formats code points as zero-padded uppercase hex', () => {
    expect(formatCodePoint(0x41)).toBe('U+0041')
    expect(formatCodePoint(0x1f600)).toBe('U+1F600')
    expect(formatCodePoint(0x10ffff)).toBe('U+10FFFF')
  })

  it('formats UTF-16 units as zero-padded uppercase hex with a prefix', () => {
    expect(formatUtf16Units([0xd83d, 0xde00])).toBe('0xD83D 0xDE00')
    expect(formatUtf16Units([0x41])).toBe('0x0041')
  })
})

describe('formatInspection', () => {
  it('serializes chars and stats into a copyable text block', () => {
    const text = formatInspection('A😀')
    expect(text).toContain('A U+0041 dec:65 utf16: 0x0041 utf8: 41')
    expect(text).toContain('😀 U+1F600 dec:128512 utf16: 0xD83D 0xDE00 utf8: F0 9F 98 80 (astral)')
    expect(text).toContain('code points: 2')
    expect(text).toContain('utf-16 units: 3')
    expect(text).toContain('utf-8 bytes: 5')
  })

  it('returns the error text for input beyond the limit', () => {
    const text = formatInspection('x'.repeat(MAX_CODE_POINTS + 1))
    expect(text).toContain(`limit of ${MAX_CODE_POINTS} code points`)
  })
})

describe('CharInfo shape', () => {
  it('keeps the raw character alongside its display form', () => {
    const result = inspectUnicode('\nA')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.chars[0]!.char).toBe('\n')
    expect(result.chars[0]!.display).toBe('\\n')
    expect(result.chars[1]!.char).toBe('A')
    expect(result.chars[1]!.display).toBe('A')
  })
})
