import { describe, expect, it } from 'vitest'
import { DEFAULT_MODE, MODE_OPTIONS, parseMode, reverseText } from './logic'

describe('reverseText', () => {
  it('reverses an ASCII string character by character', () => {
    expect(reverseText('Hello, World!')).toBe('!dlroW ,olleH')
    expect(reverseText('abc123')).toBe('321cba')
    expect(reverseText('a b c')).toBe('c b a')
  })

  it('reverses Japanese text and emoji without breaking surrogate pairs', () => {
    expect(reverseText('こんにちは')).toBe('はちにんこ')
    expect(reverseText('ab👍cd')).toBe('dc👍ba')
    expect(reverseText('😀🎉')).toBe('🎉😀')
  })

  it('preserves each surrogate pair as a single code point in the reversed output', () => {
    const input = 'a😀b'
    const reversed = reverseText(input)
    expect(reversed).toBe('b😀a')
    expect(Array.from(reversed)).toEqual(['b', '😀', 'a'])
  })

  it('treats combining marks as individual code points', () => {
    expect(reverseText('e\u0301', 'chars')).toBe('\u0301e')
    expect(reverseText('a\u0301b', 'chars')).toBe('b\u0301a')
  })

  it('reverses line order without changing the content of each line', () => {
    expect(reverseText('first\nsecond\nthird', 'lines')).toBe('third\nsecond\nfirst')
    expect(reverseText('a\nb\nc', 'lines')).toBe('c\nb\na')
  })

  it('keeps empty line positions correct when reversing lines', () => {
    expect(reverseText('a\n\nb', 'lines')).toBe('b\n\na')
    expect(reverseText('a\nb\n\nc', 'lines')).toBe('c\n\nb\na')
    expect(reverseText('\na\nb', 'lines')).toBe('b\na\n')
  })

  it('reverses word order per line without changing the characters in each word', () => {
    expect(reverseText('one two three', 'words')).toBe('three two one')
    expect(reverseText('one two\nthree four', 'words')).toBe('two one\nfour three')
  })

  it('treats consecutive spaces and tabs as word separators', () => {
    expect(reverseText('one  two   three', 'words')).toBe('three two one')
    expect(reverseText('one\ttwo\t\tthree', 'words')).toBe('three two one')
    expect(reverseText('  leading  trailing  ', 'words')).toBe('trailing leading')
  })

  it('returns an empty string for empty input in every mode', () => {
    expect(reverseText('', 'chars')).toBe('')
    expect(reverseText('', 'lines')).toBe('')
    expect(reverseText('', 'words')).toBe('')
  })

  it('keeps newline characters intact when reversing characters', () => {
    expect(reverseText('ab\ncd', 'chars')).toBe('dc\nba')
    expect(reverseText('abc\n', 'chars')).toBe('\ncba')
  })

  it('handles a trailing newline in line mode by keeping the empty last line', () => {
    expect(reverseText('a\nb\n', 'lines')).toBe('\nb\na')
    expect(reverseText('a\nb\n', 'words')).toBe('a\nb\n')
  })

  it('handles CRLF line endings in line and word modes', () => {
    expect(reverseText('a\r\nb\r\n', 'lines')).toBe('\nb\na')
    expect(reverseText('one two\r\nthree four', 'words')).toBe('two one\nfour three')
  })

  it('uses chars mode by default', () => {
    expect(reverseText('Hello')).toBe('olleH')
  })
})

describe('parseMode', () => {
  it('parses supported modes', () => {
    expect(parseMode('chars')).toBe('chars')
    expect(parseMode('lines')).toBe('lines')
    expect(parseMode('words')).toBe('words')
  })

  it('returns null for unsupported values', () => {
    expect(parseMode('reversed')).toBeNull()
    expect(parseMode('')).toBeNull()
    expect(parseMode('CHARS')).toBeNull()
  })

  it('exposes supported options and the default mode', () => {
    expect(MODE_OPTIONS).toEqual(['chars', 'lines', 'words'])
    expect(DEFAULT_MODE).toBe('chars')
  })
})
