import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DELIMITER,
  DEFAULT_QUOTE_STYLE,
  DEFAULT_REMOVE_BLANK_LINES,
  DEFAULT_TRIM,
  DELIMITER_OPTIONS,
  QUOTE_STYLE_OPTIONS,
  formatCsv,
  parseDelimiter,
  parseQuoteStyle,
} from './logic'

describe('formatCsv', () => {
  it('round-trips a basic CSV unchanged with default options', () => {
    const input = 'name,age,city\nAlice,30,Tokyo\nBob,25,Osaka'
    expect(formatCsv(input)).toEqual({ ok: true, output: input })
  })

  it('reports an error for empty input', () => {
    expect(formatCsv('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(formatCsv('   \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('returns a header-only CSV unchanged', () => {
    expect(formatCsv('name,age')).toEqual({ ok: true, output: 'name,age' })
  })

  it('quotes fields containing delimiters, quotes, and newlines only when needed', () => {
    const input = 'a,b,c\n1,"x,y",2\n3,"he said ""hi""",4\n5,"line1\nline2",6'
    expect(formatCsv(input)).toEqual({ ok: true, output: input })
  })

  it('parses a quoted empty string field as an empty value', () => {
    const result = formatCsv('a,b\nx,""')
    expect(result).toEqual({ ok: true, output: 'a,b\nx,' })
  })

  it('keeps empty fields distinct from blank rows', () => {
    const result = formatCsv('a,b\n,')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toBe('a,b\n,')
    }
  })

  it('differences between the two quote styles', () => {
    const input = 'name,note\nAlice,plain\nBob,"has, comma"'
    const onlyWhenNeeded = formatCsv(input, { quoteStyle: 'only-when-needed' })
    const always = formatCsv(input, { quoteStyle: 'always' })
    expect(onlyWhenNeeded).toEqual({
      ok: true,
      output: 'name,note\nAlice,plain\nBob,"has, comma"',
    })
    expect(always).toEqual({
      ok: true,
      output: '"name","note"\n"Alice","plain"\n"Bob","has, comma"',
    })
  })

  it('escapes embedded quotes in always-quote mode', () => {
    const result = formatCsv('a\n"he said ""hi"""', { quoteStyle: 'always' })
    expect(result).toEqual({ ok: true, output: '"a"\n"he said ""hi"""' })
  })

  it('trims leading and trailing whitespace when trim is enabled', () => {
    const result = formatCsv('a,b\n  Alice  ,30\n  ,  ', { trim: true })
    expect(result).toEqual({ ok: true, output: 'a,b\nAlice,30\n,' })
  })

  it('keeps surrounding whitespace when trim is disabled', () => {
    const result = formatCsv('a,b\n  Alice  ,30')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toBe('a,b\n  Alice  ,30')
    }
  })

  it('removes blank lines when removeBlankLines is enabled', () => {
    const result = formatCsv('a,b\n\n\nc,d\n\ne,f', { removeBlankLines: true })
    expect(result).toEqual({ ok: true, output: 'a,b\nc,d\ne,f' })
  })

  it('keeps blank lines when removeBlankLines is disabled', () => {
    const result = formatCsv('a,b\n\nc,d', { removeBlankLines: false })
    expect(result).toEqual({ ok: true, output: 'a,b\n\nc,d' })
  })

  it('removes whitespace-only lines together with trim', () => {
    const result = formatCsv('a,b\n   \nc,d', { trim: true, removeBlankLines: true })
    expect(result).toEqual({ ok: true, output: 'a,b\nc,d' })
  })

  it('supports comma, semicolon, and tab delimiters', () => {
    const comma = formatCsv('a,b\n1,2', { delimiter: ',' })
    expect(comma).toEqual({ ok: true, output: 'a,b\n1,2' })
    const semicolon = formatCsv('a;b\n1;2', { delimiter: ';' })
    expect(semicolon).toEqual({ ok: true, output: 'a;b\n1;2' })
    const tab = formatCsv('a\tb\n1\t2', { delimiter: '\t' })
    expect(tab).toEqual({ ok: true, output: 'a\tb\n1\t2' })
  })

  it('quotes values containing the selected delimiter', () => {
    const semicolon = formatCsv('a;b\n1;"2;3"', { delimiter: ';' })
    expect(semicolon).toEqual({ ok: true, output: 'a;b\n1;"2;3"' })
    const tab = formatCsv('a\tb\n1\t"2\t3"', { delimiter: '\t' })
    expect(tab).toEqual({ ok: true, output: 'a\tb\n1\t"2\t3"' })
  })

  it('reports an error for an unterminated quoted field', () => {
    const result = formatCsv('a,b\n1,"oops')
    expect(result).toEqual({
      ok: false,
      error: 'Invalid CSV: unterminated quoted field.',
    })
  })

  it('reports an error for characters after a closing quote', () => {
    const result = formatCsv('a\n"1"x')
    expect(result).toEqual({
      ok: false,
      error: 'Invalid CSV: unexpected character after closing quote.',
    })
  })

  it('reports an error for a quote inside an unquoted field', () => {
    const result = formatCsv('a\nva"lue')
    expect(result).toEqual({
      ok: false,
      error: 'Invalid CSV: unexpected quote inside a field.',
    })
  })

  it('normalizes CRLF line endings to LF', () => {
    const result = formatCsv('a,b\r\n1,2\r\n3,4\r\n')
    expect(result).toEqual({ ok: true, output: 'a,b\n1,2\n3,4' })
  })

  it('normalizes CRLF inside quoted fields to LF', () => {
    const result = formatCsv('a,b\r\n1,"line1\r\nline2"\r\n')
    expect(result).toEqual({ ok: true, output: 'a,b\n1,"line1\nline2"' })
  })

  it('handles a quoted field spanning multiple lines', () => {
    const input = 'a,b\n"multi\nline",2'
    expect(formatCsv(input)).toEqual({ ok: true, output: input })
  })

  it('combines delimiter, quote style, and trim options together', () => {
    const result = formatCsv('name; note\n Alice ;"has;colons"', {
      delimiter: ';',
      quoteStyle: 'always',
      trim: true,
    })
    expect(result).toEqual({
      ok: true,
      output: '"name";"note"\n"Alice";"has;colons"',
    })
  })
})

describe('option constants and parsers', () => {
  it('exposes supported options and defaults', () => {
    expect(DELIMITER_OPTIONS).toEqual([',', ';', '\t'])
    expect(DEFAULT_DELIMITER).toBe(',')
    expect(QUOTE_STYLE_OPTIONS).toEqual(['only-when-needed', 'always'])
    expect(DEFAULT_QUOTE_STYLE).toBe('only-when-needed')
    expect(DEFAULT_TRIM).toBe(false)
    expect(DEFAULT_REMOVE_BLANK_LINES).toBe(false)
  })

  it('parses supported delimiters', () => {
    expect(parseDelimiter(',')).toBe(',')
    expect(parseDelimiter(';')).toBe(';')
    expect(parseDelimiter('\t')).toBe('\t')
  })

  it('rejects unsupported delimiters', () => {
    expect(parseDelimiter('|')).toBeNull()
    expect(parseDelimiter('')).toBeNull()
    expect(parseDelimiter('comma')).toBeNull()
  })

  it('parses supported quote styles', () => {
    expect(parseQuoteStyle('only-when-needed')).toBe('only-when-needed')
    expect(parseQuoteStyle('always')).toBe('always')
  })

  it('rejects unsupported quote styles', () => {
    expect(parseQuoteStyle('never')).toBeNull()
    expect(parseQuoteStyle('')).toBeNull()
  })
})
