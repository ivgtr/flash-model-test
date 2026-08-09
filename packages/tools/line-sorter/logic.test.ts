import { describe, expect, it } from 'vitest'
import { DEFAULT_SORT_OPTIONS, parseDirection, sortLines, type LineSortOptions } from './logic'

function sort(input: string, options: LineSortOptions = {}): string {
  return sortLines(input, options)
}

describe('sortLines', () => {
  it('sorts lines in ascending order by default', () => {
    expect(sort('banana\napple\ncherry')).toBe('apple\nbanana\ncherry')
  })

  it('sorts lines in descending order', () => {
    expect(sort('banana\napple\ncherry', { direction: 'desc' })).toBe('cherry\nbanana\napple')
  })

  it('keeps lines in their original order when every line is identical', () => {
    expect(sort('same\nsame\nsame')).toBe('same\nsame\nsame')
    expect(sort('x\nx', { direction: 'desc' })).toBe('x\nx')
  })

  it('keeps a trailing blank line and sorts it like any other blank line', () => {
    expect(sort('b\na\n')).toBe('\na\nb')
    expect(sort('b\na\n', { direction: 'desc' })).toBe('b\na\n')
  })

  it('sorts a single line without a trailing newline', () => {
    expect(sort('alone')).toBe('alone')
  })
})

describe('case sensitivity', () => {
  it('distinguishes case when caseSensitive is true (default)', () => {
    const input = 'banana\nApple\napple\nCherry'
    expect(sort(input)).toBe('Apple\nCherry\napple\nbanana')
  })

  it('ignores case when caseSensitive is false', () => {
    const input = 'banana\nApple\napple\nCherry'
    expect(sort(input, { caseSensitive: false })).toBe('Apple\napple\nbanana\nCherry')
  })

  it('keeps equal lines stable when case is ignored', () => {
    expect(sort('A\na\nB', { caseSensitive: false })).toBe('A\na\nB')
    expect(sort('b\na\nA\nB', { caseSensitive: false })).toBe('a\nA\nb\nB')
  })

  it('applies case insensitivity in descending order', () => {
    expect(sort('B\nb\na', { caseSensitive: false, direction: 'desc' })).toBe('B\nb\na')
  })
})

describe('natural sort', () => {
  it('orders file names numerically so that file2 < file10', () => {
    expect(sort('file10\nfile2\nfile1', { natural: true })).toBe('file1\nfile2\nfile10')
  })

  it('orders pure numbers numerically', () => {
    expect(sort('10\n2\n1\n100', { natural: true })).toBe('1\n2\n10\n100')
  })

  it('sorts natural lines in descending order', () => {
    expect(sort('file1\nfile10\nfile2', { natural: true, direction: 'desc' })).toBe(
      'file10\nfile2\nfile1',
    )
  })

  it('compares larger numbers by value beyond Number precision', () => {
    expect(sort('999999999999999999999\n1000000000000000000000', { natural: true })).toBe(
      '999999999999999999999\n1000000000000000000000',
    )
  })

  it('handles multiple numeric groups per line', () => {
    expect(sort('v1.10.2\nv1.2.1\nv1.10.1', { natural: true })).toBe('v1.2.1\nv1.10.1\nv1.10.2')
  })

  it('falls back to the digit text when numeric values are equal', () => {
    expect(sort('file01\nfile1', { natural: true })).toBe('file01\nfile1')
  })

  it('orders lines without numbers among numeric lines by plain text', () => {
    expect(sort('a2\nab\na1', { natural: true })).toBe('a1\na2\nab')
  })

  it('sorts naturally with case insensitivity', () => {
    expect(sort('File2\nfile10\nfile1', { natural: true, caseSensitive: false })).toBe(
      'file1\nFile2\nfile10',
    )
  })
})

describe('leading whitespace', () => {
  it('ignores leading whitespace when ignoreLeadingWhitespace is true', () => {
    const input = '  banana\napple\n cherry'
    expect(sort(input, { ignoreLeadingWhitespace: true })).toBe('apple\n  banana\n cherry')
  })

  it('keeps the original lines including leading whitespace in the output', () => {
    const result = sort(' b\na\n  c', { ignoreLeadingWhitespace: true })
    expect(result).toBe('a\n b\n  c')
    expect(result.startsWith('  ')).toBe(false)
    expect(result).toContain('  c')
  })

  it('compares leading whitespace when ignoreLeadingWhitespace is false', () => {
    expect(sort('a\n b\n  c', { ignoreLeadingWhitespace: false })).toBe('  c\n b\na')
  })

  it('sorts lines that only differ in leading whitespace stably', () => {
    expect(sort('b\n b', { ignoreLeadingWhitespace: true })).toBe('b\n b')
  })
})

describe('blank lines', () => {
  it('keeps blank lines by default', () => {
    expect(sort('b\n\na')).toBe('\na\nb')
    expect(sort('b\n\na\n')).toBe('\n\na\nb')
  })

  it('keeps blank lines at the start, middle, and end of the input', () => {
    expect(sort('\nb\n\nc')).toBe('\n\nb\nc')
  })

  it('removes blank lines when removeBlankLines is true', () => {
    expect(sort('\nb\n\na\n', { removeBlankLines: true })).toBe('a\nb')
    expect(sort('b\n\na', { removeBlankLines: true })).toBe('a\nb')
  })

  it('treats tab- and space-only lines as blank when removing', () => {
    expect(sort('b\n   \n\t\na', { removeBlankLines: true })).toBe('a\nb')
  })

  it('keeps tab- and space-only lines when blank lines are kept', () => {
    expect(sort('b\n   \n\t\na')).toBe('\t\n   \na\nb')
  })

  it('returns an empty string for a blank-only input when removing blank lines', () => {
    expect(sort('\n\n', { removeBlankLines: true })).toBe('')
    expect(sort('  \n\t', { removeBlankLines: true })).toBe('')
  })
})

describe('empty input', () => {
  it('returns an empty string without error', () => {
    expect(sort('')).toBe('')
    expect(sort('', { direction: 'desc', natural: true })).toBe('')
  })
})

describe('newline format', () => {
  it('returns CRLF output for CRLF input', () => {
    expect(sort('b\r\na\r\nc\r\n')).toBe('\r\na\r\nb\r\nc')
    expect(sort('b\r\na\r\nc\r\n', { direction: 'desc' })).toBe('c\r\nb\r\na\r\n')
  })

  it('keeps CRLF output when blank lines are removed', () => {
    expect(sort('b\r\n\r\na\r\n', { removeBlankLines: true })).toBe('a\r\nb')
  })

  it('treats a bare CR as content when the input also uses CRLF', () => {
    expect(sort('b\ra\r\n')).toBe('\r\nb\ra')
  })

  it('sorts with LF newlines when the input uses LF', () => {
    const result = sort('b\na\n')
    expect(result).toBe('\na\nb')
    expect(result).not.toContain('\r')
  })
})

describe('unicode input', () => {
  it('sorts lines containing unicode characters without crashing', () => {
    const input = 'カキ\nあお\nイチゴ\n🍎りんご\nzebra'
    const result = sort(input)
    expect(result.split('\n')).toHaveLength(5)
    expect(result.split('\n').sort()).toEqual(result.split('\n'))
    const naturalResult = sort(input, { natural: true, caseSensitive: false })
    expect(naturalResult.split('\n')).toHaveLength(5)
  })
})

describe('option resolution', () => {
  it('exposes documented defaults', () => {
    expect(DEFAULT_SORT_OPTIONS).toEqual({
      direction: 'asc',
      caseSensitive: true,
      natural: false,
      ignoreLeadingWhitespace: false,
      removeBlankLines: false,
    })
  })

  it('merges partial options with defaults', () => {
    expect(sort('b\na', { direction: 'desc' })).toBe('b\na')
    expect(sort('10\n2', { natural: true })).toBe('2\n10')
  })
})

describe('parseDirection', () => {
  it('parses supported directions', () => {
    expect(parseDirection('asc')).toBe('asc')
    expect(parseDirection('desc')).toBe('desc')
  })

  it('returns null for unsupported values', () => {
    expect(parseDirection('up')).toBeNull()
    expect(parseDirection('')).toBeNull()
  })
})
