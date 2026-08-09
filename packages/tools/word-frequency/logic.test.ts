import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LIMIT,
  DEFAULT_OPTIONS,
  LIMIT_OPTIONS,
  countWords,
  tokenize,
  type WordFrequencyOptions,
} from './logic'

function count(input: string, options?: Partial<WordFrequencyOptions>) {
  return countWords(input, { ...DEFAULT_OPTIONS, ...options })
}

describe('countWords', () => {
  it('counts frequencies and orders by count desc then word asc', () => {
    const result = count('alpha beta gamma alpha delta beta beta')
    expect(result.entries).toEqual([
      { word: 'beta', count: 3 },
      { word: 'alpha', count: 2 },
      { word: 'delta', count: 1 },
      { word: 'gamma', count: 1 },
    ])
  })

  it('breaks ties by ascending word order', () => {
    const result = count('zebra alpha zebra mango alpha mango')
    expect(result.entries.map((entry) => entry.word)).toEqual(['alpha', 'mango', 'zebra'])
  })

  it('merges case-insensitively and keeps the first spelling', () => {
    const result = count('The the THE the', { caseInsensitive: true })
    expect(result.entries).toEqual([{ word: 'The', count: 4 }])
    expect(result.totals).toEqual({ words: 4, unique: 1 })
  })

  it('keeps cases separate by default', () => {
    const result = count('The the')
    expect(result.entries).toEqual([
      { word: 'The', count: 1 },
      { word: 'the', count: 1 },
    ])
  })

  it('limits the number of entries to the top N', () => {
    const input = 'a a a b b b c c c d d d e e e f f f g g g h h h i i i j j j k k k l l l'
    const limited = count(input, { limit: 10 })
    expect(limited.entries).toHaveLength(10)
    expect(limited.entries[9]).toEqual({ word: 'j', count: 3 })
    const all = count(input, { limit: 'all' })
    expect(all.entries).toHaveLength(12)
    expect(all.entries[11]).toEqual({ word: 'l', count: 3 })
  })

  it('handles punctuation and symbols as separators', () => {
    const result = count('Hello, world! hello? world.')
    expect(result.entries).toEqual([
      { word: 'world', count: 2 },
      { word: 'Hello', count: 1 },
      { word: 'hello', count: 1 },
    ])
    expect(result.totals).toEqual({ words: 4, unique: 3 })
  })

  it('returns zero totals for empty input', () => {
    expect(count('')).toEqual({ entries: [], totals: { words: 0, unique: 0 } })
  })

  it('returns zero totals for punctuation-only input', () => {
    expect(count('!!! ??? --- ... ,')).toEqual({ entries: [], totals: { words: 0, unique: 0 } })
    expect(count(' \n\t ')).toEqual({ entries: [], totals: { words: 0, unique: 0 } })
  })

  it('counts digit-only tokens as words', () => {
    const result = count('123 123 456')
    expect(result.entries).toEqual([
      { word: '123', count: 2 },
      { word: '456', count: 1 },
    ])
    expect(result.totals).toEqual({ words: 3, unique: 2 })
  })

  it('treats an apostrophe as a separator', () => {
    const result = count("can't")
    expect(result.entries).toEqual([
      { word: 'can', count: 1 },
      { word: 't', count: 1 },
    ])
    expect(result.totals).toEqual({ words: 2, unique: 2 })
  })

  it('treats a hyphen as a separator', () => {
    const result = count('well-known')
    expect(result.entries).toEqual([
      { word: 'known', count: 1 },
      { word: 'well', count: 1 },
    ])
    expect(result.totals).toEqual({ words: 2, unique: 2 })
  })

  it('counts Japanese text without spaces as a single token', () => {
    const result = count('こんにちは世界こんにちは')
    expect(result.entries).toEqual([{ word: 'こんにちは世界こんにちは', count: 1 }])
    expect(result.totals).toEqual({ words: 1, unique: 1 })
  })

  it('splits Japanese text on punctuation', () => {
    const result = count('こんにちは、世界。')
    expect(result.entries).toEqual([
      { word: 'こんにちは', count: 1 },
      { word: '世界', count: 1 },
    ])
  })

  it('computes totals and unique counts across mixed tokens', () => {
    const result = count('a b a c c c 2024 a', { caseInsensitive: true })
    expect(result.totals).toEqual({ words: 8, unique: 4 })
  })

  it('exposes default options and supported limits', () => {
    expect(LIMIT_OPTIONS).toEqual([10, 20, 50, 'all'])
    expect(DEFAULT_LIMIT).toBe(10)
    expect(DEFAULT_OPTIONS).toEqual({ caseInsensitive: false, limit: 10 })
  })
})

describe('tokenize', () => {
  it('splits on whitespace, punctuation, and symbols', () => {
    expect(tokenize('The quick, brown-fox! 2024')).toEqual(['The', 'quick', 'brown', 'fox', '2024'])
  })

  it('returns an empty array for input with no words', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('??? ***')).toEqual([])
  })
})
