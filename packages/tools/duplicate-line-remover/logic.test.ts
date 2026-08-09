import { describe, expect, it } from 'vitest'
import { removeDuplicateLines, type DuplicateLineOptions } from './logic'

const DEFAULT_OPTIONS: DuplicateLineOptions = {
  ignoreCase: false,
  trim: false,
  removeBlankLines: false,
}

describe('removeDuplicateLines', () => {
  it('removes duplicate lines while preserving first-occurrence order', () => {
    expect(removeDuplicateLines('apple\nbanana\napple\ncherry\nbanana', DEFAULT_OPTIONS)).toBe(
      'apple\nbanana\ncherry',
    )
  })

  it('collapses all-identical input to a single line', () => {
    expect(removeDuplicateLines('x\nx\nx\nx', DEFAULT_OPTIONS)).toBe('x')
  })

  it('ignores case when ignoreCase is enabled', () => {
    expect(
      removeDuplicateLines('Apple\nAPPLE\napple\napPLE', { ...DEFAULT_OPTIONS, ignoreCase: true }),
    ).toBe('Apple')
  })

  it('treats differently cased lines as distinct when ignoreCase is disabled', () => {
    expect(removeDuplicateLines('Apple\napple', DEFAULT_OPTIONS)).toBe('Apple\napple')
  })

  it('treats lines as duplicates when trim is enabled', () => {
    expect(removeDuplicateLines('abc\n  abc  \n abc', { ...DEFAULT_OPTIONS, trim: true })).toBe(
      'abc',
    )
  })

  it('keeps the original form of the first occurrence when trim is enabled', () => {
    expect(removeDuplicateLines('  abc  \nabc', { ...DEFAULT_OPTIONS, trim: true })).toBe('  abc  ')
  })

  it('removes blank and whitespace-only lines when removeBlankLines is enabled', () => {
    expect(
      removeDuplicateLines('a\n\nb\n   \nc\n', { ...DEFAULT_OPTIONS, removeBlankLines: true }),
    ).toBe('a\nb\nc')
  })

  it('returns an empty string for blank-line-only input when removeBlankLines is enabled', () => {
    expect(removeDuplicateLines('\n  \n\n', { ...DEFAULT_OPTIONS, removeBlankLines: true })).toBe(
      '',
    )
  })

  it('returns an empty string for empty input', () => {
    expect(removeDuplicateLines('', DEFAULT_OPTIONS)).toBe('')
    expect(removeDuplicateLines('', { ...DEFAULT_OPTIONS, removeBlankLines: true })).toBe('')
  })

  it('returns input unchanged when there are no duplicates', () => {
    expect(removeDuplicateLines('alpha\nbeta\ngamma', DEFAULT_OPTIONS)).toBe('alpha\nbeta\ngamma')
  })

  it('keeps blank lines by default', () => {
    expect(removeDuplicateLines('a\n\n\nb', DEFAULT_OPTIONS)).toBe('a\n\nb')
  })

  it('preserves CRLF line endings in the output', () => {
    expect(removeDuplicateLines('apple\r\nbanana\r\napple\r\ncherry', DEFAULT_OPTIONS)).toBe(
      'apple\r\nbanana\r\ncherry',
    )
  })

  it('combines all options together', () => {
    expect(
      removeDuplicateLines('  Apple  \nAPPLE\n\n  apple\n', {
        ignoreCase: true,
        trim: true,
        removeBlankLines: true,
      }),
    ).toBe('  Apple  ')
  })
})
