import { describe, expect, it } from 'vitest'
import {
  CHARACTER_CLASS_POOL_SIZES,
  MAX_ENTROPY_BITS,
  MAX_ENTROPY_LENGTH,
  SCORE_LABELS,
  analyzePassword,
  classifyCharacter,
  estimateEntropyBits,
  type PasswordCheck,
} from './logic'

function checkIds(checks: PasswordCheck[]): string[] {
  return checks.map((check) => check.id)
}

function checkById(analysis: ReturnType<typeof analyzePassword>, id: string): PasswordCheck {
  const check = analysis.checks.find((entry) => entry.id === id)
  if (check === undefined) {
    throw new Error(`missing check ${id}`)
  }
  return check
}

describe('classifyCharacter', () => {
  it('classifies ASCII character classes', () => {
    expect(classifyCharacter('a')).toBe('lower')
    expect(classifyCharacter('z')).toBe('lower')
    expect(classifyCharacter('A')).toBe('upper')
    expect(classifyCharacter('Z')).toBe('upper')
    expect(classifyCharacter('0')).toBe('digit')
    expect(classifyCharacter('9')).toBe('digit')
    expect(classifyCharacter('!')).toBe('symbol')
    expect(classifyCharacter('~')).toBe('symbol')
    expect(classifyCharacter(' ')).toBe('symbol')
  })

  it('classifies Unicode characters as "other" rather than symbol', () => {
    expect(classifyCharacter('あ')).toBe('other')
    expect(classifyCharacter('日')).toBe('other')
    expect(classifyCharacter('👍')).toBe('other')
    expect(classifyCharacter('\u0000')).toBe('other')
  })
})

describe('estimateEntropyBits', () => {
  it('returns 0 for empty input', () => {
    expect(estimateEntropyBits('')).toBe(0)
  })

  it('matches known log2 values for single class pools', () => {
    expect(estimateEntropyBits('a')).toBe(4.7)
    expect(estimateEntropyBits('password')).toBe(37.6)
    expect(estimateEntropyBits('12345678')).toBe(26.6)
  })

  it('uses the summed pool size of all used classes', () => {
    expect(estimateEntropyBits('aB3$')).toBe(26.3)
    const allClasses = 'aA1!あ'
    const pool = Object.values(CHARACTER_CLASS_POOL_SIZES).reduce(
      (sum: number, size: number) => sum + size,
      0,
    )
    expect(estimateEntropyBits(allClasses)).toBe(Math.round(Math.log2(pool) * 5 * 10) / 10)
  })

  it('caps the length at 100 characters', () => {
    expect(estimateEntropyBits('a'.repeat(150))).toBe(
      Math.round(MAX_ENTROPY_LENGTH * Math.log2(26) * 10) / 10,
    )
  })

  it('caps the result at MAX_ENTROPY_BITS', () => {
    expect(estimateEntropyBits('aA1!あ'.repeat(30))).toBe(MAX_ENTROPY_BITS)
  })
})

describe('analyzePassword', () => {
  it('returns score 0 for empty input without erroring', () => {
    const result = analyzePassword('')
    expect(result.score).toBe(0)
    expect(result.label).toBe(SCORE_LABELS[0])
    expect(result.entropyBits).toBe(0)
    expect(result.checks.every((check) => !check.passed)).toBe(true)
  })

  it('scores single-character input as 0', () => {
    expect(analyzePassword('a').score).toBe(0)
    expect(analyzePassword('1').score).toBe(0)
    expect(analyzePassword('あ').score).toBe(0)
  })

  it('scores all-identical input in the 0-1 range', () => {
    expect(analyzePassword('aaaa').score).toBe(0)
    expect(analyzePassword('a'.repeat(12)).score).toBe(0)
    expect(analyzePassword('aaaaaaaa').score).toBe(0)
  })

  it('penalizes repeated characters', () => {
    const repeated = analyzePassword('aaaabbbb')
    const unique = analyzePassword('ab12cd')
    expect(repeated.score).toBeLessThan(unique.score)
    expect(checkById(repeated, 'repetition').passed).toBe(false)
    expect(checkById(unique, 'repetition').passed).toBe(true)
  })

  it('penalizes ascending and descending sequential characters', () => {
    expect(analyzePassword('abcdefgh').score).toBe(0)
    expect(analyzePassword('123456').score).toBe(0)
    expect(analyzePassword('fedcba').score).toBe(0)
    const ascending = analyzePassword('abcdefgh')
    expect(checkById(ascending, 'repetition').passed).toBe(false)
  })

  it('does not treat a sequence of two characters as a penalty', () => {
    expect(analyzePassword('ab1X!z9Q').score).toBe(4)
  })

  it('improves the score with length and class variety', () => {
    expect(analyzePassword('password').score).toBe(2)
    expect(analyzePassword('Password1').score).toBe(3)
    expect(analyzePassword('Tr0ub4dor&3').score).toBe(4)
    expect(analyzePassword('aB3$').score).toBe(3)
    expect(analyzePassword('CorrectHorseBatteryStaple1!').score).toBe(4)
  })

  it('treats Unicode input as the "other" class without boosting score', () => {
    expect(analyzePassword('あいうえお').score).toBe(1)
    const result = analyzePassword('日本語パスワード')
    expect(checkById(result, 'symbol').passed).toBe(false)
    expect(checkById(result, 'uppercase').passed).toBe(false)
  })

  it('reports the 7 required checklist items with ids and labels', () => {
    const result = analyzePassword('Tr0ub4dor&3X')
    expect(checkIds(result.checks)).toEqual([
      'length-8',
      'length-12',
      'uppercase',
      'lowercase',
      'digit',
      'symbol',
      'repetition',
    ])
  })

  it('marks the right checks as passed for a mixed-class password', () => {
    const result = analyzePassword('Password1')
    expect(checkById(result, 'length-8').passed).toBe(true)
    expect(checkById(result, 'length-12').passed).toBe(false)
    expect(checkById(result, 'uppercase').passed).toBe(true)
    expect(checkById(result, 'lowercase').passed).toBe(true)
    expect(checkById(result, 'digit').passed).toBe(true)
    expect(checkById(result, 'symbol').passed).toBe(false)
    expect(checkById(result, 'repetition').passed).toBe(true)
  })

  it('handles very long input without blowing up', () => {
    const long = 'A9$x'.repeat(40)
    expect(long.length).toBeGreaterThan(150)
    const result = analyzePassword(long)
    expect(result.score).toBe(4)
    expect(result.label).toBe('Strong')
    expect(result.entropyBits).toBeLessThanOrEqual(MAX_ENTROPY_BITS)
    expect(result.entropyBits).toBeGreaterThan(0)
  })

  it('is deterministic for the same input', () => {
    const inputs = ['', 'a', 'password', 'Tr0ub4dor&3', '日本語', 'aA1!あ'.repeat(10)]
    for (const input of inputs) {
      expect(analyzePassword(input)).toEqual(analyzePassword(input))
    }
  })

  it('uses the same rules across repeated calls', () => {
    const first = analyzePassword('Tr0ub4dor&3')
    const second = analyzePassword('Tr0ub4dor&3')
    expect(first).toEqual(second)
    expect(first.score).toBe(4)
  })
})
