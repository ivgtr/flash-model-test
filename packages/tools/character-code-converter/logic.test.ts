import { describe, expect, it } from 'vitest'
import { charsToCodes, codesToChars, formatCodePointRows } from './logic'

describe('charsToCodes', () => {
  it('reports an error for empty input', () => {
    expect(charsToCodes('')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('shows decimal, hex, octal, and binary code values for an ASCII character', () => {
    expect(charsToCodes('A')).toEqual({
      ok: true,
      rows: [
        {
          char: 'A',
          decimal: 65,
          hex: 'U+41',
          octal: '101',
          binary: '1000001',
          utf16Units: ['0041'],
        },
      ],
    })
  })

  it('shows code values for a Japanese character', () => {
    const result = charsToCodes('あ')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rows).toEqual([
        {
          char: 'あ',
          decimal: 12354,
          hex: 'U+3042',
          octal: '30102',
          binary: '11000001000010',
          utf16Units: ['3042'],
        },
      ])
    }
  })

  it('treats an emoji surrogate pair as one code point with two UTF-16 units', () => {
    const result = charsToCodes('😀')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rows).toEqual([
        {
          char: '😀',
          decimal: 128512,
          hex: 'U+1F600',
          octal: '373000',
          binary: '11111011000000000',
          utf16Units: ['D83D', 'DE00'],
        },
      ])
    }
  })

  it('produces one row per code point for a mixed string', () => {
    const result = charsToCodes('Aあ😀')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rows.map((row) => row.decimal)).toEqual([65, 12354, 128512])
      expect(result.rows.map((row) => row.hex)).toEqual(['U+41', 'U+3042', 'U+1F600'])
    }
  })

  it('treats combining characters as independent code points', () => {
    const result = charsToCodes('e\u0301')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rows.map((row) => row.char)).toEqual(['e', '\u0301'])
      expect(result.rows.map((row) => row.decimal)).toEqual([101, 769])
    }
  })

  it('shows UTF-16 units for BMP and astral characters', () => {
    const result = charsToCodes('A😀')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rows[0]!.utf16Units).toEqual(['0041'])
      expect(result.rows[1]!.utf16Units).toEqual(['D83D', 'DE00'])
    }
  })
})

describe('formatCodePointRows', () => {
  it('formats each row as a labeled line', () => {
    const result = charsToCodes('A')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(formatCodePointRows(result.rows)).toBe(
        'A  decimal=65  hex=U+41  octal=101  binary=1000001  utf16=0041',
      )
    }
  })

  it('escapes control characters in the char column', () => {
    const result = charsToCodes('\n')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(formatCodePointRows(result.rows)).toContain('\\n  decimal=10')
    }
  })
})

describe('codesToChars', () => {
  it('converts a decimal code value', () => {
    expect(codesToChars('65')).toEqual({ ok: true, output: 'A' })
    expect(codesToChars('128512')).toEqual({ ok: true, output: '😀' })
  })

  it('converts U+ prefixed hex code values in upper or lower case', () => {
    expect(codesToChars('U+41')).toEqual({ ok: true, output: 'A' })
    expect(codesToChars('u+1f600')).toEqual({ ok: true, output: '😀' })
    expect(codesToChars('U+3042')).toEqual({ ok: true, output: 'あ' })
  })

  it('converts 0x prefixed hex code values in upper or lower case', () => {
    expect(codesToChars('0x41')).toEqual({ ok: true, output: 'A' })
    expect(codesToChars('0X1F600')).toEqual({ ok: true, output: '😀' })
  })

  it('converts octal code values', () => {
    expect(codesToChars('0101')).toEqual({ ok: true, output: 'A' })
    expect(codesToChars('030102')).toEqual({ ok: true, output: 'あ' })
  })

  it('converts binary code values', () => {
    expect(codesToChars('1000001')).toEqual({ ok: true, output: 'A' })
    expect(codesToChars('0b1000001')).toEqual({ ok: true, output: 'A' })
    expect(codesToChars('11000000000')).toEqual({ ok: true, output: '\u0600' })
  })

  it('converts multiple comma-separated code values', () => {
    expect(codesToChars('72,97,112,112,121')).toEqual({ ok: true, output: 'Happy' })
    expect(codesToChars('65, 0x42, 0103')).toEqual({ ok: true, output: 'ABC' })
    expect(codesToChars('65, U+3042, 0x1F600')).toEqual({ ok: true, output: 'Aあ😀' })
  })

  it('tolerates surrounding whitespace around tokens', () => {
    expect(codesToChars('  65 , U+41  ')).toEqual({ ok: true, output: 'AA' })
  })

  it('reports an error for empty input', () => {
    expect(codesToChars('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(codesToChars('   ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for empty tokens', () => {
    expect(codesToChars('65,,66')).toEqual({ ok: false, error: 'Invalid code: empty token.' })
    expect(codesToChars('65,')).toEqual({ ok: false, error: 'Invalid code: empty token.' })
    expect(codesToChars(',65')).toEqual({ ok: false, error: 'Invalid code: empty token.' })
  })

  it('reports an error for out-of-range code values', () => {
    expect(codesToChars('0x110000')).toEqual({
      ok: false,
      error: 'Invalid code: "0x110000" is out of range (maximum 0x10FFFF).',
    })
    expect(codesToChars('1114112')).toEqual({
      ok: false,
      error: expect.stringContaining('out of range'),
    })
    expect(codesToChars('0xFFFFFFFF')).toEqual({
      ok: false,
      error: expect.stringContaining('out of range'),
    })
  })

  it('reports an error for lone surrogates', () => {
    expect(codesToChars('0xD800')).toEqual({
      ok: false,
      error: 'Invalid code: "0xD800" is a lone surrogate (0xD800-0xDFFF).',
    })
    expect(codesToChars('55296')).toEqual({
      ok: false,
      error: expect.stringContaining('lone surrogate'),
    })
    expect(codesToChars('0xDFFF')).toEqual({
      ok: false,
      error: expect.stringContaining('lone surrogate'),
    })
    expect(codesToChars('57343')).toEqual({
      ok: false,
      error: expect.stringContaining('lone surrogate'),
    })
  })

  it('reports an error for invalid characters', () => {
    expect(codesToChars('xyz')).toEqual({
      ok: false,
      error: 'Invalid code: "xyz" is not a valid code value.',
    })
    expect(codesToChars('0x')).toEqual({
      ok: false,
      error: expect.stringContaining('not a valid code value'),
    })
    expect(codesToChars('U+')).toEqual({
      ok: false,
      error: expect.stringContaining('not a valid code value'),
    })
    expect(codesToChars('12a')).toEqual({
      ok: false,
      error: expect.stringContaining('not a valid code value'),
    })
    expect(codesToChars('65,zz')).toEqual({
      ok: false,
      error: expect.stringContaining('"zz"'),
    })
  })
})
