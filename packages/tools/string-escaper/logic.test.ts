import { describe, expect, it } from 'vitest'
import {
  CONTEXT_OPTIONS,
  DIRECTION_OPTIONS,
  QUOTE_STYLE_OPTIONS,
  escapeText,
  parseContext,
  parseDirection,
  parseQuoteStyle,
  unescapeText,
} from './logic'

describe('escapeText', () => {
  it('escapes HTML special characters', () => {
    const result = escapeText(`<a href="x">&'y'</a>`, 'html')
    expect(result).toEqual({
      ok: true,
      output: '&lt;a href=&quot;x&quot;&gt;&amp;&#39;y&#39;&lt;/a&gt;',
    })
  })

  it('escapes URL components with encodeURIComponent', () => {
    expect(escapeText('a b&c=d/e', 'url')).toEqual({
      ok: true,
      output: 'a%20b%26c%3Dd%2Fe',
    })
  })

  it('escapes JSON strings like JSON.stringify', () => {
    expect(escapeText('a"b\\c\nd\t', 'json')).toEqual({
      ok: true,
      output: '"a\\"b\\\\c\\nd\\t"',
    })
  })

  it('escapes regex metacharacters . * + ? ^ $ { } [ ] ( ) | / \\', () => {
    expect(escapeText('. * + ? ^ $ { } [ ] ( ) | / \\', 'regex')).toEqual({
      ok: true,
      output: '\\. \\* \\+ \\? \\^ \\$ \\{ \\} \\[ \\] \\( \\) \\| \\/ \\\\',
    })
  })

  it('escapes JS strings as single-quoted literals', () => {
    expect(escapeText("it's a test\n", 'js', 'single')).toEqual({
      ok: true,
      output: `'it\\'s a test\\n'`,
    })
  })

  it('escapes JS strings as double-quoted literals', () => {
    expect(escapeText('say "hi"', 'js', 'double')).toEqual({
      ok: true,
      output: '"say \\"hi\\""',
    })
  })

  it('escapes JS control characters using hex escapes', () => {
    expect(escapeText('a\u0001b', 'js', 'double')).toEqual({
      ok: true,
      output: '"a\\x01b"',
    })
    expect(escapeText('a\u0000b', 'js', 'double')).toEqual({
      ok: true,
      output: '"a\\0b"',
    })
  })

  it('handles Unicode and emoji correctly in every context', () => {
    expect(escapeText('こんにちは😀', 'html')).toEqual({ ok: true, output: 'こんにちは😀' })
    expect(escapeText('こんにちは😀', 'url')).toEqual({
      ok: true,
      output: encodeURIComponent('こんにちは😀'),
    })
    expect(escapeText('こんにちは😀', 'json')).toEqual({
      ok: true,
      output: JSON.stringify('こんにちは😀'),
    })
    expect(escapeText('こんにちは😀', 'js', 'double')).toEqual({
      ok: true,
      output: '"こんにちは😀"',
    })
    expect(escapeText('こんにちは😀', 'regex')).toEqual({ ok: true, output: 'こんにちは😀' })
  })

  it('returns an empty output for empty input in every context', () => {
    expect(escapeText('', 'html')).toEqual({ ok: true, output: '' })
    expect(escapeText('', 'url')).toEqual({ ok: true, output: '' })
    expect(escapeText('', 'json')).toEqual({ ok: true, output: '' })
    expect(escapeText('', 'regex')).toEqual({ ok: true, output: '' })
    expect(escapeText('', 'js')).toEqual({ ok: true, output: '' })
  })
})

describe('unescapeText', () => {
  it('unescapes HTML named references (amp, lt, gt, quot, apos, nbsp)', () => {
    const result = unescapeText('&lt;a&gt; &amp; &quot;x&quot; &apos;y&apos; &nbsp;', 'html')
    expect(result).toEqual({ ok: true, output: `<a> & "x" 'y' \u00A0` })
  })

  it('unescapes HTML numeric references in decimal and hexadecimal', () => {
    expect(unescapeText('&#65;&#x42;&#X1F600;', 'html')).toEqual({
      ok: true,
      output: 'AB😀',
    })
  })

  it('unescapes URL components with decodeURIComponent', () => {
    expect(unescapeText('a%20b%26c%3Dd%2Fe', 'url')).toEqual({
      ok: true,
      output: 'a b&c=d/e',
    })
  })

  it('unescapes JSON string literals', () => {
    expect(unescapeText('"a\\"b\\\\c\\nd\\t"', 'json')).toEqual({
      ok: true,
      output: 'a"b\\c\nd\t',
    })
    expect(unescapeText('""', 'json')).toEqual({ ok: true, output: '' })
    expect(unescapeText('"\\u0041\\u00e9"', 'json')).toEqual({ ok: true, output: 'Aé' })
  })

  it('unescapes JS string literals in both quote styles', () => {
    expect(unescapeText("'it\\'s a test\\n'", 'js')).toEqual({
      ok: true,
      output: "it's a test\n",
    })
    expect(unescapeText('"say \\"hi\\""', 'js')).toEqual({ ok: true, output: 'say "hi"' })
    expect(unescapeText("'\\x41\\u0042\\u{1F600}'", 'js')).toEqual({
      ok: true,
      output: 'AB😀',
    })
    expect(unescapeText("'line\\\ncontinued'", 'js')).toEqual({
      ok: true,
      output: 'linecontinued',
    })
  })

  it('round-trips escaped values back to the original text', () => {
    const samples = ['a&b<c>d"e\'f', 'line1\nline2\ttab', '日本語😀🚀', 'back\\slash /path']
    for (const sample of samples) {
      for (const context of ['html', 'url', 'json'] as const) {
        const escaped = escapeText(sample, context)
        expect(escaped.ok).toBe(true)
        if (escaped.ok) {
          expect(unescapeText(escaped.output, context)).toEqual({ ok: true, output: sample })
        }
      }
    }
  })

  it('round-trips JS string literals in both quote styles', () => {
    const samples = ["it's a test", 'say "hi"', 'back\\slash', 'tab\t and \n newline', '日本語😀']
    for (const sample of samples) {
      for (const quoteStyle of ['single', 'double'] as const) {
        const escaped = escapeText(sample, 'js', quoteStyle)
        expect(escaped.ok).toBe(true)
        if (escaped.ok) {
          expect(unescapeText(escaped.output, 'js')).toEqual({ ok: true, output: sample })
        }
      }
    }
  })

  it('reports an error for invalid HTML entities without partial conversion', () => {
    expect(unescapeText('a&ampb', 'html')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid HTML entity'),
    })
    expect(unescapeText('a&b', 'html')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid HTML entity'),
    })
    expect(unescapeText('&#xZZ;', 'html')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid HTML entity'),
    })
    expect(unescapeText('&#123', 'html')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid HTML entity'),
    })
    expect(unescapeText('&#xD800;', 'html')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid HTML entity'),
    })
    expect(unescapeText('&#x110000;', 'html')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid HTML entity'),
    })
    expect(unescapeText('&nope;', 'html')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid HTML entity'),
    })
    expect(unescapeText('a&', 'html')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid HTML entity'),
    })
  })

  it('reports an error for malformed percent sequences', () => {
    expect(unescapeText('%', 'url')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid URL encoding'),
    })
    expect(unescapeText('%zz', 'url')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid URL encoding'),
    })
    expect(unescapeText('%2', 'url')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid URL encoding'),
    })
    expect(unescapeText('100%', 'url')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid URL encoding'),
    })
  })

  it('reports an error for invalid JSON strings without partial conversion', () => {
    expect(unescapeText('hello', 'json')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JSON string'),
    })
    expect(unescapeText('123', 'json')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JSON string'),
    })
    expect(unescapeText('"unterminated', 'json')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JSON string'),
    })
    expect(unescapeText('"bad\\q"', 'json')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JSON string'),
    })
    expect(unescapeText('"a" extra', 'json')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JSON string'),
    })
    expect(unescapeText("'single'", 'json')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JSON string'),
    })
  })

  it('reports an error for invalid JS string literals', () => {
    expect(unescapeText('hello', 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'unterminated", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'a'x", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'a\nb'", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'\\x4'", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'\\u12'", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'\\u{110000}'", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'\\u{D800}'", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'\\1'", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
    expect(unescapeText("'\\01'", 'js')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid JS string'),
    })
  })

  it('does not support unescaping regular expressions', () => {
    expect(unescapeText('a\\.b', 'regex')).toEqual({
      ok: false,
      error: expect.stringContaining('cannot be unescaped'),
    })
  })

  it('returns an empty output for empty input in every context', () => {
    expect(unescapeText('', 'html')).toEqual({ ok: true, output: '' })
    expect(unescapeText('', 'url')).toEqual({ ok: true, output: '' })
    expect(unescapeText('', 'json')).toEqual({ ok: true, output: '' })
    expect(unescapeText('', 'regex')).toEqual({ ok: true, output: '' })
    expect(unescapeText('', 'js')).toEqual({ ok: true, output: '' })
  })
})

describe('parse helpers', () => {
  it('parses supported contexts, directions, and quote styles', () => {
    expect(parseContext('html')).toBe('html')
    expect(parseContext('url')).toBe('url')
    expect(parseContext('json')).toBe('json')
    expect(parseContext('regex')).toBe('regex')
    expect(parseContext('js')).toBe('js')
    expect(parseDirection('escape')).toBe('escape')
    expect(parseDirection('unescape')).toBe('unescape')
    expect(parseQuoteStyle('single')).toBe('single')
    expect(parseQuoteStyle('double')).toBe('double')
  })

  it('returns null for unsupported values', () => {
    expect(parseContext('xml')).toBeNull()
    expect(parseContext('')).toBeNull()
    expect(parseDirection('encode')).toBeNull()
    expect(parseDirection('')).toBeNull()
    expect(parseQuoteStyle('none')).toBeNull()
    expect(parseQuoteStyle('')).toBeNull()
  })

  it('exposes the supported options', () => {
    expect(CONTEXT_OPTIONS).toEqual(['html', 'url', 'json', 'regex', 'js'])
    expect(DIRECTION_OPTIONS).toEqual(['escape', 'unescape'])
    expect(QUOTE_STYLE_OPTIONS).toEqual(['single', 'double'])
  })
})
