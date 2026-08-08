import { describe, expect, it } from 'vitest'
import { MAX_MATCHES, testRegex, type RegexTestResult } from './logic'

function expectSuccess(result: RegexTestResult) {
  if (!result.ok) {
    throw new Error(`expected success but got error: ${result.error}`)
  }
  return result
}

describe('testRegex', () => {
  it('returns all matches with their strings and indices when the g flag is set', () => {
    const result = expectSuccess(testRegex('\\b\\w+\\b', ['g'], 'foo bar baz'))
    expect(result.global).toBe(true)
    expect(result.truncated).toBe(false)
    expect(result.matches.map((match) => match.match)).toEqual(['foo', 'bar', 'baz'])
    expect(result.matches.map((match) => match.index)).toEqual([0, 4, 8])
  })

  it('returns only the first match without the g flag', () => {
    const result = expectSuccess(testRegex('\\b\\w+\\b', [], 'foo bar baz'))
    expect(result.global).toBe(false)
    expect(result.matches).toEqual([{ match: 'foo', index: 0, groups: [] }])
  })

  it('returns capture group values', () => {
    const result = expectSuccess(testRegex('(\\d{4})-(\\d{2})', ['g'], '2024-01 1999-12'))
    expect(result.matches).toEqual([
      {
        match: '2024-01',
        index: 0,
        groups: [
          { name: null, value: '2024' },
          { name: null, value: '01' },
        ],
      },
      {
        match: '1999-12',
        index: 8,
        groups: [
          { name: null, value: '1999' },
          { name: null, value: '12' },
        ],
      },
    ])
  })

  it('returns named groups with their names and values', () => {
    const result = expectSuccess(testRegex('(?<year>\\d{4})-(?<month>\\d{2})', [], '2024-01'))
    expect(result.matches).toEqual([
      {
        match: '2024-01',
        index: 0,
        groups: [
          { name: null, value: '2024' },
          { name: null, value: '01' },
          { name: 'year', value: '2024' },
          { name: 'month', value: '01' },
        ],
      },
    ])
  })

  it('reports non-participating groups as undefined', () => {
    const result = expectSuccess(testRegex('(a)?b', [], 'b'))
    expect(result.matches).toHaveLength(1)
    const [match] = result.matches
    expect(match?.groups).toEqual([{ name: null, value: undefined }])
  })

  it('reports an error for an invalid pattern', () => {
    const result = testRegex('(', [], 'abc')
    expect(result.ok).toBe(false)
    if (result.ok) {
      throw new Error('expected failure')
    }
    expect(result.error).toMatch(/^Invalid pattern:/)
  })

  it('reports an error for an empty pattern', () => {
    expect(testRegex('', ['g'], 'abc')).toEqual({ ok: false, error: 'Pattern is empty.' })
  })

  it('returns no matches for an empty test string', () => {
    const result = expectSuccess(testRegex('\\d+', ['g'], ''))
    expect(result.matches).toHaveLength(0)
  })

  describe('flags', () => {
    it('applies the i flag', () => {
      const result = expectSuccess(testRegex('hello', ['i'], 'HELLO world'))
      expect(result.matches).toEqual([{ match: 'HELLO', index: 0, groups: [] }])
    })

    it('applies the m flag', () => {
      const without = expectSuccess(testRegex('^b', [], 'a\nb'))
      expect(without.matches).toHaveLength(0)
      const withFlag = expectSuccess(testRegex('^b', ['m'], 'a\nb'))
      expect(withFlag.matches).toEqual([{ match: 'b', index: 2, groups: [] }])
    })

    it('applies the s flag', () => {
      const without = expectSuccess(testRegex('a.b', [], 'a\nb'))
      expect(without.matches).toHaveLength(0)
      const withFlag = expectSuccess(testRegex('a.b', ['s'], 'a\nb'))
      expect(withFlag.matches).toEqual([{ match: 'a\nb', index: 0, groups: [] }])
    })

    it('applies the u flag', () => {
      const without = expectSuccess(testRegex('\\u{1F600}', [], '😀'))
      expect(without.matches).toHaveLength(0)
      const withFlag = expectSuccess(testRegex('\\u{1F600}', ['u'], '😀'))
      expect(withFlag.matches).toEqual([{ match: '😀', index: 0, groups: [] }])
    })
  })

  it('reports an error for an invalid pattern under the u flag', () => {
    const result = testRegex('\\p{Foo}', ['u'], 'abc')
    expect(result.ok).toBe(false)
    if (result.ok) {
      throw new Error('expected failure')
    }
    expect(result.error).toMatch(/^Invalid pattern:/)
  })

  it('caps the number of matches and reports truncation', () => {
    const result = expectSuccess(testRegex('(?:)', ['g'], 'a'.repeat(MAX_MATCHES + 100)))
    expect(result.matches).toHaveLength(MAX_MATCHES)
    expect(result.truncated).toBe(true)
  })

  it('does not hang on empty matches combined with ^ $ and the g flag', () => {
    const result = expectSuccess(testRegex('^', ['g'], 'a'.repeat(1000)))
    expect(result.matches).toEqual([{ match: '', index: 0, groups: [] }])
  })
})
