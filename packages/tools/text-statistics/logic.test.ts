import { describe, expect, it } from 'vitest'
import { countTextStatistics } from './logic'

describe('countTextStatistics', () => {
  it('counts characters, words, and lines of ASCII text', () => {
    expect(countTextStatistics('hello world')).toEqual({ characters: 11, words: 2, lines: 1 })
    expect(countTextStatistics('a\nb')).toEqual({ characters: 3, words: 2, lines: 2 })
  })

  it('returns all zeros for empty input', () => {
    expect(countTextStatistics('')).toEqual({ characters: 0, words: 0, lines: 0 })
  })

  it('handles whitespace-only and newline-only input without errors', () => {
    expect(countTextStatistics('   ')).toEqual({ characters: 3, words: 0, lines: 1 })
    expect(countTextStatistics('\n')).toEqual({ characters: 1, words: 0, lines: 2 })
  })

  it('counts characters by Unicode code point, not UTF-16 code unit', () => {
    expect(countTextStatistics('こんにちは')).toEqual({ characters: 5, words: 1, lines: 1 })
    expect(countTextStatistics('😀😀')).toEqual({ characters: 2, words: 1, lines: 1 })
    expect(countTextStatistics('e\u0301')).toEqual({ characters: 2, words: 1, lines: 1 })
  })

  it('ignores leading, trailing, and consecutive whitespace in the word count', () => {
    expect(countTextStatistics('  a   b  ')).toEqual({ characters: 9, words: 2, lines: 1 })
    expect(countTextStatistics('a\t\nb')).toEqual({ characters: 4, words: 2, lines: 2 })
  })

  it('treats tabs, multiple spaces, and full-width spaces as whitespace', () => {
    expect(countTextStatistics('a\u3000b')).toEqual({ characters: 3, words: 2, lines: 1 })
    expect(countTextStatistics('a  b')).toEqual({ characters: 4, words: 2, lines: 1 })
  })

  it('counts a trailing newline as an extra line', () => {
    expect(countTextStatistics('a\n')).toEqual({ characters: 2, words: 1, lines: 2 })
    expect(countTextStatistics('line1\nline2\n')).toEqual({ characters: 12, words: 2, lines: 3 })
  })

  it('keeps line count unaffected by leading and trailing spaces on lines', () => {
    expect(countTextStatistics(' a \n b ')).toEqual({ characters: 7, words: 2, lines: 2 })
  })
})
