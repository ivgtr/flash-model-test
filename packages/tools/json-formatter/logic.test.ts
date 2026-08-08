import { describe, expect, it } from 'vitest'
import { DEFAULT_INDENT, formatJson, parseIndent } from './logic'

describe('formatJson', () => {
  it('pretty-prints a nested object with the default indent', () => {
    const result = formatJson('{"a":{"b":[1,2]},"c":true}')
    expect(result).toEqual({
      ok: true,
      output: '{\n  "a": {\n    "b": [\n      1,\n      2\n    ]\n  },\n  "c": true\n}',
    })
  })

  it('respects a custom indent', () => {
    const result = formatJson('{"a":1}', 4)
    expect(result).toEqual({ ok: true, output: '{\n    "a": 1\n}' })
  })

  it('minifies when indent is 0', () => {
    const result = formatJson('{\n  "a": 1,\n  "b": [1, 2]\n}', 0)
    expect(result).toEqual({ ok: true, output: '{"a":1,"b":[1,2]}' })
  })

  it('preserves primitive values', () => {
    expect(formatJson('42')).toEqual({ ok: true, output: '42' })
    expect(formatJson('true')).toEqual({ ok: true, output: 'true' })
    expect(formatJson('null')).toEqual({ ok: true, output: 'null' })
    expect(formatJson('"text"')).toEqual({ ok: true, output: '"text"' })
  })

  it('preserves unicode characters', () => {
    const result = formatJson('{"message":"こんにちは 🌍"}')
    expect(result).toEqual({ ok: true, output: '{\n  "message": "こんにちは 🌍"\n}' })
  })

  it('reports an error for empty input', () => {
    expect(formatJson('')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for whitespace-only input', () => {
    expect(formatJson('   \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for malformed JSON', () => {
    const result = formatJson('{"a":}')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid JSON:/)
    }
  })

  it('reports an error for trailing commas', () => {
    const result = formatJson('[1, 2,]')
    expect(result.ok).toBe(false)
  })

  it('reports an error for unquoted keys', () => {
    const result = formatJson('{a: 1}')
    expect(result.ok).toBe(false)
  })
})

describe('parseIndent', () => {
  it('parses supported indent options', () => {
    expect(parseIndent('0')).toBe(0)
    expect(parseIndent('2')).toBe(2)
    expect(parseIndent('4')).toBe(4)
  })

  it('returns null for unsupported values', () => {
    expect(parseIndent('3')).toBeNull()
    expect(parseIndent('abc')).toBeNull()
    expect(parseIndent('')).toBeNull()
  })

  it('default indent is 2', () => {
    expect(DEFAULT_INDENT).toBe(2)
  })
})
