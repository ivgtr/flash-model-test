import { describe, expect, it } from 'vitest'
import { convertBase, isValidDigit, parseRadix, type Radix } from './logic'

describe('convertBase', () => {
  it('converts decimal to binary', () => {
    expect(convertBase('255', 10, 2)).toEqual({ ok: true, output: '11111111' })
  })

  it('converts decimal to octal', () => {
    expect(convertBase('255', 10, 8)).toEqual({ ok: true, output: '377' })
  })

  it('converts decimal to hexadecimal', () => {
    expect(convertBase('255', 10, 16)).toEqual({ ok: true, output: 'ff' })
  })

  it('converts decimal to base 36', () => {
    expect(convertBase('35', 10, 36)).toEqual({ ok: true, output: 'z' })
    expect(convertBase('1295', 10, 36)).toEqual({ ok: true, output: 'zz' })
    expect(convertBase('1296', 10, 36)).toEqual({ ok: true, output: '100' })
  })

  it('converts binary to decimal', () => {
    expect(convertBase('101010', 2, 10)).toEqual({ ok: true, output: '42' })
  })

  it('converts hexadecimal to decimal', () => {
    expect(convertBase('ff', 16, 10)).toEqual({ ok: true, output: '255' })
  })

  it('accepts uppercase digits in input', () => {
    expect(convertBase('FF', 16, 10)).toEqual({ ok: true, output: '255' })
  })

  it('outputs lowercase only', () => {
    expect(convertBase('255', 10, 16)).toEqual({ ok: true, output: 'ff' })
  })

  it('converts negative numbers', () => {
    expect(convertBase('-255', 10, 16)).toEqual({ ok: true, output: '-ff' })
    expect(convertBase('-255', 10, 2)).toEqual({ ok: true, output: '-11111111' })
    expect(convertBase('-ff', 16, 10)).toEqual({ ok: true, output: '-255' })
  })

  it('normalizes negative zero to "0"', () => {
    expect(convertBase('-0', 10, 16)).toEqual({ ok: true, output: '0' })
  })

  it('converts zero to "0" in every base', () => {
    expect(convertBase('0', 2, 16)).toEqual({ ok: true, output: '0' })
    expect(convertBase('0', 16, 36)).toEqual({ ok: true, output: '0' })
  })

  it('normalizes leading zeros', () => {
    expect(convertBase('007', 10, 16)).toEqual({ ok: true, output: '7' })
    expect(convertBase('000ff', 16, 10)).toEqual({ ok: true, output: '255' })
    expect(convertBase('0000', 10, 2)).toEqual({ ok: true, output: '0' })
  })

  it('returns empty output for empty input', () => {
    expect(convertBase('', 10, 16)).toEqual({ ok: true, output: '' })
  })

  it('returns empty output for whitespace-only input', () => {
    expect(convertBase('   ', 10, 16)).toEqual({ ok: true, output: '' })
  })

  it('rejects digits invalid for the input base', () => {
    expect(convertBase('2', 2, 10)).toEqual({ ok: false, error: 'Invalid digit "2" for base 2' })
    expect(convertBase('9', 8, 10)).toEqual({ ok: false, error: 'Invalid digit "9" for base 8' })
    expect(convertBase('z', 16, 10)).toEqual({ ok: false, error: 'Invalid digit "z" for base 16' })
    expect(convertBase('2g', 16, 10)).toEqual({ ok: false, error: 'Invalid digit "g" for base 16' })
    expect(convertBase('0x10', 10, 16)).toEqual({
      ok: false,
      error: 'Invalid digit "x" for base 10',
    })
  })

  it('rejects a lone sign', () => {
    expect(convertBase('-', 10, 16)).toEqual({ ok: false, error: expect.stringContaining('sign') })
  })

  it('converts integers beyond Number precision exactly', () => {
    const huge = 2n ** 100n
    const decimal = huge.toString()
    expect(convertBase(decimal, 10, 2)).toEqual({ ok: true, output: `1${'0'.repeat(100)}` })
    expect(convertBase(decimal, 10, 16)).toEqual({ ok: true, output: `1${'0'.repeat(25)}` })
    expect(convertBase(`1${'0'.repeat(100)}`, 2, 10)).toEqual({ ok: true, output: decimal })
  })

  it('handles the maximum base-36 digit', () => {
    expect(convertBase('z', 36, 10)).toEqual({ ok: true, output: '35' })
  })

  it('round-trips between radices', () => {
    const cases: Array<[string, Radix, Radix]> = [
      ['1100100', 2, 36],
      ['777', 8, 16],
      ['deadbeef', 16, 2],
      ['toolforge', 36, 8],
    ]
    for (const [value, from, to] of cases) {
      const first = convertBase(value, from, to)
      expect(first.ok).toBe(true)
      if (!first.ok) continue
      const back = convertBase(first.output, to, from)
      expect(back.ok).toBe(true)
      if (back.ok) {
        expect(back.output).toBe(value)
      }
    }
  })
})

describe('isValidDigit', () => {
  it('accepts digits below the radix', () => {
    expect(isValidDigit('0', 2)).toBe(true)
    expect(isValidDigit('1', 2)).toBe(true)
    expect(isValidDigit('f', 16)).toBe(true)
    expect(isValidDigit('F', 16)).toBe(true)
    expect(isValidDigit('z', 36)).toBe(true)
  })

  it('rejects digits at or above the radix', () => {
    expect(isValidDigit('2', 2)).toBe(false)
    expect(isValidDigit('8', 8)).toBe(false)
    expect(isValidDigit('g', 16)).toBe(false)
    expect(isValidDigit('aa', 10)).toBe(false)
  })
})

describe('parseRadix', () => {
  it('parses supported radices', () => {
    expect(parseRadix('2')).toBe(2)
    expect(parseRadix('8')).toBe(8)
    expect(parseRadix('10')).toBe(10)
    expect(parseRadix('16')).toBe(16)
    expect(parseRadix('36')).toBe(36)
  })

  it('returns null for unsupported values', () => {
    expect(parseRadix('3')).toBeNull()
    expect(parseRadix('abc')).toBeNull()
    expect(parseRadix('')).toBeNull()
  })
})
