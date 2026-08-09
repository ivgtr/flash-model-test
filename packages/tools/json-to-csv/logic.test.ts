import { describe, expect, it } from 'vitest'
import { DEFAULT_DELIMITER, DELIMITER_OPTIONS, jsonToCsv, parseDelimiter } from './logic'

describe('jsonToCsv', () => {
  it('converts a basic array of two objects to CSV', () => {
    const result = jsonToCsv('[{"name":"Alice","age":30},{"name":"Bob","age":25}]')
    expect(result).toEqual({
      ok: true,
      output: ['name,age', 'Alice,30', 'Bob,25'].join('\n'),
    })
  })

  it('appends columns for keys that appear in later objects', () => {
    const result = jsonToCsv('[{"name":"Alice","age":30},{"name":"Bob","age":25,"city":"Osaka"}]')
    expect(result).toEqual({
      ok: true,
      output: ['name,age,city', 'Alice,30,', 'Bob,25,Osaka'].join('\n'),
    })
  })

  it('keeps first-appearance key order even when later objects reorder keys', () => {
    const result = jsonToCsv('[{"a":1,"b":2},{"b":3,"a":4}]')
    expect(result).toEqual({
      ok: true,
      output: ['a,b', '1,2', '4,3'].join('\n'),
    })
  })

  it('emits empty fields for keys missing in an object', () => {
    const result = jsonToCsv('[{"name":"Alice","age":30,"city":"Tokyo"},{"name":"Bob"}]')
    expect(result).toEqual({
      ok: true,
      output: ['name,age,city', 'Alice,30,Tokyo', 'Bob,,'].join('\n'),
    })
  })

  it('quotes fields containing delimiters, newlines, and double quotes', () => {
    const result = jsonToCsv(
      '[{"name":"Alice","note":"hello, world"},{"name":"Bob","note":"line1\\nline2"},{"name":"Carol","note":"said \\"hi\\""}]',
    )
    expect(result).toEqual({
      ok: true,
      output: [
        'name,note',
        'Alice,"hello, world"',
        'Bob,"line1\nline2"',
        'Carol,"said ""hi"""',
      ].join('\n'),
    })
  })

  it('quotes header keys that contain delimiters or quotes', () => {
    const result = jsonToCsv('[{"first,name":"Alice","say\\"hi\\"":"yes"}]')
    expect(result).toEqual({
      ok: true,
      output: ['"first,name","say""hi"""', 'Alice,yes'].join('\n'),
    })
  })

  it('stringifies numbers and booleans', () => {
    const result = jsonToCsv('[{"count":1.5,"active":true,"label":"x"}]')
    expect(result).toEqual({
      ok: true,
      output: ['count,active,label', '1.5,true,x'].join('\n'),
    })
  })

  it('renders null values as empty fields', () => {
    const result = jsonToCsv('[{"name":"Alice","age":null,"note":"x"}]')
    expect(result).toEqual({
      ok: true,
      output: ['name,age,note', 'Alice,,x'].join('\n'),
    })
  })

  it('supports semicolon and tab delimiters', () => {
    const semicolon = jsonToCsv('[{"name":"Alice","age":30}]', ';')
    expect(semicolon).toEqual({ ok: true, output: 'name;age\nAlice;30' })
    const tab = jsonToCsv('[{"name":"Alice","age":30}]', '\t')
    expect(tab).toEqual({ ok: true, output: 'name\tage\nAlice\t30' })
  })

  it('quotes fields containing the selected semicolon delimiter', () => {
    const result = jsonToCsv('[{"name":"Alice","note":"a;b"}]', ';')
    expect(result).toEqual({ ok: true, output: 'name;note\nAlice;"a;b"' })
  })

  it('returns an empty string for an empty array', () => {
    expect(jsonToCsv('[]')).toEqual({ ok: true, output: '' })
    expect(jsonToCsv('[\n]')).toEqual({ ok: true, output: '' })
  })

  it('reports an error for empty input', () => {
    expect(jsonToCsv('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(jsonToCsv('  \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for invalid JSON', () => {
    const result = jsonToCsv('{not json')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid JSON: /)
    }
    const objectResult = jsonToCsv('{"name":"Alice"}')
    expect(objectResult).toEqual({
      ok: false,
      error: 'Invalid JSON: top-level value must be an array of objects.',
    })
  })

  it('reports an error for a primitive array', () => {
    expect(jsonToCsv('["a","b"]')).toEqual({
      ok: false,
      error: 'Invalid JSON: item at index 0 must be an object.',
    })
    expect(jsonToCsv('[1,2]')).toEqual({
      ok: false,
      error: 'Invalid JSON: item at index 0 must be an object.',
    })
    expect(jsonToCsv('[null]')).toEqual({
      ok: false,
      error: 'Invalid JSON: item at index 0 must be an object.',
    })
  })

  it('reports an error for nested objects and arrays inside items', () => {
    expect(jsonToCsv('[{"name":"Alice","tags":["a","b"]}]')).toEqual({
      ok: false,
      error:
        'Invalid JSON: value of key "tags" in item 0 must be a string, number, boolean, or null.',
    })
    expect(jsonToCsv('[{"name":"Alice","meta":{"age":30}}]')).toEqual({
      ok: false,
      error:
        'Invalid JSON: value of key "meta" in item 0 must be a string, number, boolean, or null.',
    })
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
