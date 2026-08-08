import { describe, expect, it } from 'vitest'
import { DEFAULT_DELIMITER, DELIMITER_OPTIONS, convertCsv, parseDelimiter } from './logic'

describe('convertCsv', () => {
  it('converts a basic 2x2 CSV to a JSON array of objects', () => {
    const result = convertCsv('name,age\nAlice,30\nBob,25')
    expect(result).toEqual({
      ok: true,
      output: [
        '[',
        '  {',
        '    "name": "Alice",',
        '    "age": "30"',
        '  },',
        '  {',
        '    "name": "Bob",',
        '    "age": "25"',
        '  }',
        ']',
      ].join('\n'),
    })
  })

  it('returns an empty array for a header-only CSV', () => {
    expect(convertCsv('name,age')).toEqual({ ok: true, output: '[]' })
    expect(convertCsv('name,age\n')).toEqual({ ok: true, output: '[]' })
  })

  it('parses quoted fields containing delimiters, newlines, and escaped quotes', () => {
    const result = convertCsv(
      'name,note\nAlice,"hello, world"\nBob,"line1\nline2"\nCarol,"said ""hi"""',
    )
    expect(result).toEqual({
      ok: true,
      output: [
        '[',
        '  {',
        '    "name": "Alice",',
        '    "note": "hello, world"',
        '  },',
        '  {',
        '    "name": "Bob",',
        '    "note": "line1\\nline2"',
        '  },',
        '  {',
        '    "name": "Carol",',
        '    "note": "said \\"hi\\""',
        '  }',
        ']',
      ].join('\n'),
    })
  })

  it('reports an error for a row with a column count mismatch', () => {
    const result = convertCsv('name,age\nAlice,30\nBob')
    expect(result).toEqual({
      ok: false,
      error: 'Invalid CSV: row 2 has 1 column(s), expected 2.',
    })
  })

  it('reports an error for duplicate headers', () => {
    const result = convertCsv('name,name\nAlice,Bob')
    expect(result).toEqual({ ok: false, error: 'Invalid CSV: duplicate header "name".' })
  })

  it('ignores empty and whitespace-only lines', () => {
    const result = convertCsv('name,age\n\nAlice,30\n   \nBob,25\n')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(JSON.parse(result.output)).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ])
    }
  })

  it('supports semicolon and tab delimiters', () => {
    const semicolon = convertCsv('name;age\nAlice;30\nBob;25', ';')
    expect(semicolon).toEqual({
      ok: true,
      output: JSON.stringify(
        [
          { name: 'Alice', age: '30' },
          { name: 'Bob', age: '25' },
        ],
        null,
        2,
      ),
    })
    const tab = convertCsv('name\tage\nAlice\t30', '\t')
    expect(tab).toEqual({
      ok: true,
      output: JSON.stringify([{ name: 'Alice', age: '30' }], null, 2),
    })
  })

  it('treats empty fields as empty strings', () => {
    const result = convertCsv('name,age,city\nAlice,,Tokyo')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(JSON.parse(result.output)).toEqual([{ name: 'Alice', age: '', city: 'Tokyo' }])
    }
  })

  it('reports an error for empty input', () => {
    expect(convertCsv('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(convertCsv('  \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for an unterminated quoted field', () => {
    const result = convertCsv('name,note\nAlice,"oops')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid CSV: unterminated quoted field/)
    }
  })

  it('reports an error for characters after a closing quote', () => {
    const result = convertCsv('name\n"Alice"x')
    expect(result).toEqual({
      ok: false,
      error: 'Invalid CSV: unexpected character after closing quote.',
    })
  })

  it('handles CRLF line endings', () => {
    const result = convertCsv('name,age\r\nAlice,30\r\nBob,25\r\n')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(JSON.parse(result.output)).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ])
    }
  })
})

describe('parseDelimiter', () => {
  it('parses supported delimiters', () => {
    expect(parseDelimiter(',')).toBe(',')
    expect(parseDelimiter(';')).toBe(';')
    expect(parseDelimiter('\t')).toBe('\t')
  })

  it('returns null for unsupported values', () => {
    expect(parseDelimiter('|')).toBeNull()
    expect(parseDelimiter('comma')).toBeNull()
    expect(parseDelimiter('')).toBeNull()
  })

  it('exposes supported options and the default delimiter', () => {
    expect(DELIMITER_OPTIONS).toEqual([',', ';', '\t'])
    expect(DEFAULT_DELIMITER).toBe(',')
  })
})
