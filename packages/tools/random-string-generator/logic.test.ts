import { describe, expect, it } from 'vitest'
import {
  CHARSETS,
  CHARSET_ORDER,
  MAX_LENGTH,
  MIN_LENGTH,
  buildCharset,
  createRandomString,
  generateRandomString,
  parseLength,
} from './logic'

const ALL_KEYS = CHARSET_ORDER

describe('character sets', () => {
  it('lowercase is a-z', () => {
    expect(CHARSETS.lowercase).toBe('abcdefghijklmnopqrstuvwxyz')
  })

  it('uppercase is A-Z', () => {
    expect(CHARSETS.uppercase).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  })

  it('digits is 0-9', () => {
    expect(CHARSETS.digits).toBe('0123456789')
  })

  it('symbols matches the spec', () => {
    expect(CHARSETS.symbols).toBe('!@#$%^&*()-_=+[]{};:,.?/~')
  })
})

describe('parseLength', () => {
  it('accepts the default length', () => {
    expect(parseLength('16')).toEqual({ ok: true, value: 16 })
  })

  it('accepts boundary lengths', () => {
    expect(parseLength('1')).toEqual({ ok: true, value: 1 })
    expect(parseLength('1024')).toEqual({ ok: true, value: 1024 })
  })

  it('rejects zero and negative lengths', () => {
    expect(parseLength('0').ok).toBe(false)
    expect(parseLength('-1').ok).toBe(false)
  })

  it('rejects lengths above 1024', () => {
    const result = parseLength('1025')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/between/)
    }
  })

  it('rejects non-numeric input', () => {
    expect(parseLength('abc').ok).toBe(false)
    expect(parseLength('').ok).toBe(false)
    expect(parseLength('1.5').ok).toBe(false)
  })

  it('rejects missing input', () => {
    expect(parseLength('').ok).toBe(false)
    expect(parseLength('   ').ok).toBe(false)
  })
})

describe('buildCharset', () => {
  it('combines selected sets in order', () => {
    expect(buildCharset(['digits', 'lowercase'])).toBe('0123456789abcdefghijklmnopqrstuvwxyz')
  })

  it('returns null when nothing is selected', () => {
    expect(buildCharset([])).toBeNull()
  })
})

describe('generateRandomString', () => {
  it('returns a string of the requested length', () => {
    expect(generateRandomString(1, CHARSETS.digits)).toHaveLength(1)
    expect(generateRandomString(64, CHARSETS.lowercase)).toHaveLength(64)
    expect(generateRandomString(1024, CHARSETS.symbols)).toHaveLength(1024)
  })

  it('only uses characters from the given charset', () => {
    const output = generateRandomString(256, CHARSETS.digits)
    expect(output).toMatch(/^[0-9]+$/)
  })
})

describe('createRandomString', () => {
  it('matches the requested length', () => {
    const result = createRandomString(ALL_KEYS, '32')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toHaveLength(32)
    }
  })

  it('generates length 1 strings', () => {
    const result = createRandomString(ALL_KEYS, '1')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toHaveLength(1)
    }
  })

  it('only contains characters from the selected sets', () => {
    for (const key of ALL_KEYS) {
      const result = createRandomString([key], '128')
      expect(result.ok).toBe(true)
      if (result.ok) {
        const allowed = new Set(CHARSETS[key])
        for (const char of result.output) {
          expect(allowed.has(char)).toBe(true)
        }
      }
    }
  })

  it('uses only that set when a single set is selected', () => {
    const result = createRandomString(['uppercase'], '64')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toMatch(/^[A-Z]+$/)
    }
  })

  it('uses only digits when only digits are selected', () => {
    const result = createRandomString(['digits'], '64')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toMatch(/^[0-9]+$/)
    }
  })

  it('reports an error when no set is selected', () => {
    const result = createRandomString([], '16')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/at least one/)
    }
  })

  it('reports an error for an invalid length', () => {
    for (const lengthText of ['0', '1025', 'abc', '']) {
      const result = createRandomString(ALL_KEYS, lengthText)
      expect(result.ok).toBe(false)
    }
  })

  it('supports the maximum length', () => {
    const result = createRandomString(ALL_KEYS, String(MAX_LENGTH))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toHaveLength(MAX_LENGTH)
    }
  })

  it('supports the minimum length', () => {
    const result = createRandomString(ALL_KEYS, String(MIN_LENGTH))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toHaveLength(MIN_LENGTH)
    }
  })
})
