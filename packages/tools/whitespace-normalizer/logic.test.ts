import { describe, expect, it } from 'vitest'
import { normalizeWhitespace, type WhitespaceNormalizerOptions } from './logic'

const ALL_OFF: WhitespaceNormalizerOptions = {
  trim: false,
  collapseSpaces: false,
  stripTrailing: false,
  unifyLineEndings: false,
  removeBlankLines: false,
}

const ALL_ON: WhitespaceNormalizerOptions = {
  trim: true,
  collapseSpaces: true,
  stripTrailing: true,
  unifyLineEndings: true,
  removeBlankLines: true,
}

function withOption(
  key: keyof WhitespaceNormalizerOptions,
  value: boolean,
): WhitespaceNormalizerOptions {
  return { ...ALL_OFF, [key]: value }
}

describe('normalizeWhitespace', () => {
  it('returns the input unchanged when every option is off', () => {
    const input = '  a  \r\nb\t c  \n\n  \t'
    expect(normalizeWhitespace(input, ALL_OFF)).toBe(input)
  })

  it('returns an empty string for empty input without failing', () => {
    expect(normalizeWhitespace('', ALL_OFF)).toBe('')
    expect(normalizeWhitespace('', ALL_ON)).toBe('')
  })

  it('trims leading and trailing whitespace from each line when trim is on', () => {
    const options = withOption('trim', true)
    expect(normalizeWhitespace('  a  \n b \n', options)).toBe('a\nb\n')
    expect(normalizeWhitespace('\tfirst\t\n\tsecond\t', options)).toBe('first\nsecond')
  })

  it('collapses runs of spaces and tabs into a single space when collapseSpaces is on', () => {
    const options = withOption('collapseSpaces', true)
    expect(normalizeWhitespace('a\t  b \t c', options)).toBe('a b c')
    expect(normalizeWhitespace('  leading\n\t\tinner\t', options)).toBe(' leading\n inner ')
  })

  it('strips trailing whitespace from each line when stripTrailing is on', () => {
    const options = withOption('stripTrailing', true)
    expect(normalizeWhitespace('a  \nb\t \nc \n', options)).toBe('a\nb\nc\n')
  })

  it('strips trailing whitespace independently of trim', () => {
    const stripTrailingOnly = withOption('stripTrailing', true)
    expect(normalizeWhitespace(' a \n b ', stripTrailingOnly)).toBe(' a\n b')
    const trimOnly = withOption('trim', true)
    expect(normalizeWhitespace(' a \n b ', trimOnly)).toBe('a\nb')
  })

  it('converts CRLF and CR line endings to LF when unifyLineEndings is on', () => {
    const options = withOption('unifyLineEndings', true)
    expect(normalizeWhitespace('a\r\nb\rc\n', options)).toBe('a\nb\nc\n')
    expect(normalizeWhitespace('only\r\ncrlf', options)).toBe('only\ncrlf')
  })

  it('removes blank lines (including whitespace-only lines) when removeBlankLines is on', () => {
    const options = withOption('removeBlankLines', true)
    expect(normalizeWhitespace('a\n\n  \n\t\nb', options)).toBe('a\nb')
  })

  it('collapses multiple blank lines to none when removal is on and keeps them when off', () => {
    const remove = withOption('removeBlankLines', true)
    expect(normalizeWhitespace('a\n\n\nb', remove)).toBe('a\nb')
    const keep = withOption('removeBlankLines', false)
    expect(normalizeWhitespace('a\n\n\nb', keep)).toBe('a\n\n\nb')
  })

  it('applies every transformation together when all options are on', () => {
    expect(normalizeWhitespace('  Hello   World\t \r\n\r\n  \nSecond  line  ', ALL_ON)).toBe(
      'Hello World\nSecond line',
    )
  })

  it('leaves full-width spaces untouched since only ASCII whitespace is handled', () => {
    expect(normalizeWhitespace('　 a 　', ALL_ON)).toBe('　 a 　')
    expect(normalizeWhitespace('　　\nx', ALL_ON)).toBe('　　\nx')
  })
})
