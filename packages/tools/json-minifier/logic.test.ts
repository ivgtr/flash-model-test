import { describe, expect, it } from 'vitest'
import { DEFAULT_MODE, MINIFY_MODES, minifyJson, parseMode } from './logic'

const encoder = new TextEncoder()

describe('minifyJson', () => {
  it('minifies pretty-printed JSON', () => {
    const result = minifyJson('{\n  "name": "Alice",\n  "age": 30\n}')
    expect(result).toEqual({
      ok: true,
      output: '{"name":"Alice","age":30}',
      stats: { bytesBefore: 34, bytesAfter: 25, savedPercent: 26.47 },
    })
  })

  it('leaves already-minified JSON unchanged', () => {
    const input = '{"a":[1,2,3],"b":true}'
    const result = minifyJson(input)
    expect(result).toEqual({
      ok: true,
      output: input,
      stats: { bytesBefore: 22, bytesAfter: 22, savedPercent: 0 },
    })
  })

  it('pretty-prints when the pretty mode is requested', () => {
    const result = minifyJson('{"name":"Alice","age":30}', 'pretty')
    expect(result).toEqual({
      ok: true,
      output: '{\n  "name": "Alice",\n  "age": 30\n}',
      stats: { bytesBefore: 25, bytesAfter: 34, savedPercent: -36 },
    })
  })

  it('reports an error for invalid JSON', () => {
    const result = minifyJson('{"name": }')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid JSON:/)
    }
  })

  it('reports an error for empty input', () => {
    expect(minifyJson('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(minifyJson('  \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports correct byte counts and reduction percentage', () => {
    const result = minifyJson('{\n  "a": 1,\n  "b": [2, 3],\n  "c": "text"\n}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.stats.bytesBefore).toBe(
        encoder.encode('{\n  "a": 1,\n  "b": [2, 3],\n  "c": "text"\n}').length,
      )
      expect(result.stats.bytesAfter).toBe(encoder.encode(result.output).length)
      const expected =
        Math.round(
          ((result.stats.bytesBefore - result.stats.bytesAfter) / result.stats.bytesBefore) * 10000,
        ) / 100
      expect(result.stats.savedPercent).toBe(expected)
      expect(result.stats.savedPercent).toBeGreaterThan(0)
    }
  })

  it('minifies deeply nested JSON', () => {
    const input = [
      '{',
      '  "a": {',
      '    "b": [',
      '      1,',
      '      {',
      '        "c": null',
      '      }',
      '    ]',
      '  },',
      '  "d": "text"',
      '}',
    ].join('\n')
    const result = minifyJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toBe(JSON.stringify(JSON.parse(input)))
      expect(JSON.parse(result.output)).toEqual(JSON.parse(input))
    }
  })

  it('preserves array order and object key order through the round-trip', () => {
    const result = minifyJson('{ "zebra": 1, "alpha": [ "second", "first" ] }')
    expect(result).toEqual({
      ok: true,
      output: '{"zebra":1,"alpha":["second","first"]}',
      stats: { bytesBefore: 46, bytesAfter: 38, savedPercent: 17.39 },
    })
  })

  it('counts bytes in UTF-8 with TextEncoder, not UTF-16 code units', () => {
    const result = minifyJson('{ "s": "😀" }')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.stats.bytesBefore).toBe(15)
      expect(result.stats.bytesBefore).not.toBe('{ "s": "😀" }'.length)
      expect(result.stats.bytesAfter).toBe(12)
    }
  })

  it('follows the native JSON round-trip for number precision', () => {
    const result = minifyJson('{ "big": 9007199254740993 }')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output).toBe(JSON.stringify(JSON.parse('{ "big": 9007199254740993 }')))
      expect(result.output).toBe('{"big":9007199254740992}')
    }
  })
})

describe('parseMode', () => {
  it('parses supported modes', () => {
    expect(parseMode('minified')).toBe('minified')
    expect(parseMode('pretty')).toBe('pretty')
  })

  it('returns null for unsupported values', () => {
    expect(parseMode('compact')).toBeNull()
    expect(parseMode('')).toBeNull()
  })

  it('exposes supported modes and the default mode', () => {
    expect(MINIFY_MODES).toEqual(['minified', 'pretty'])
    expect(DEFAULT_MODE).toBe('minified')
  })
})
