import { describe, expect, it } from 'vitest'
import { evaluateJsonPath, parseJsonPath } from './logic'

const NESTED = {
  user: { name: 'Alice', address: { city: 'Kyoto' } },
  scores: [9, 8, 7],
  matrix: [
    [1, 2],
    [3, 4],
  ],
  nullish: null,
  empty: [],
  'a.b': 'dot-key',
  'my key': 'space-key',
  名前: 'japanese-key',
  0: 'numeric-string-key',
  'a"b': 'double-quote-key',
  "a'b": 'single-quote-key',
}

const NESTED_JSON = JSON.stringify(NESTED)

describe('evaluateJsonPath', () => {
  it('returns the whole document for the root path $', () => {
    const result = evaluateJsonPath(NESTED_JSON, '$')
    expect(result).toEqual({ ok: true, value: NESTED, type: 'object' })
  })

  it('traverses with dot notation', () => {
    expect(evaluateJsonPath(NESTED_JSON, '$.user.name')).toEqual({
      ok: true,
      value: 'Alice',
      type: 'string',
    })
    expect(evaluateJsonPath(NESTED_JSON, '$.user.address.city')).toEqual({
      ok: true,
      value: 'Kyoto',
      type: 'string',
    })
  })

  it('traverses with bracket notation', () => {
    expect(evaluateJsonPath(NESTED_JSON, "$['user']['name']")).toEqual({
      ok: true,
      value: 'Alice',
      type: 'string',
    })
    expect(evaluateJsonPath(NESTED_JSON, '$["user"]["address"]["city"]')).toEqual({
      ok: true,
      value: 'Kyoto',
      type: 'string',
    })
  })

  it('traverses arrays with index notation', () => {
    expect(evaluateJsonPath(NESTED_JSON, '$.scores[0]')).toEqual({
      ok: true,
      value: 9,
      type: 'number',
    })
    expect(evaluateJsonPath(JSON.stringify([{ x: 1 }, 2]), '$[0]')).toEqual({
      ok: true,
      value: { x: 1 },
      type: 'object',
    })
  })

  it('traverses nested arrays', () => {
    expect(evaluateJsonPath(NESTED_JSON, '$.matrix[1][0]')).toEqual({
      ok: true,
      value: 3,
      type: 'number',
    })
    expect(evaluateJsonPath(NESTED_JSON, '$.matrix[0][1]')).toEqual({
      ok: true,
      value: 2,
      type: 'number',
    })
  })

  it('mixes dot, bracket, and index notation', () => {
    expect(evaluateJsonPath(NESTED_JSON, "$['user'].name")).toEqual({
      ok: true,
      value: 'Alice',
      type: 'string',
    })
    expect(evaluateJsonPath(NESTED_JSON, "$['scores'][1]")).toEqual({
      ok: true,
      value: 8,
      type: 'number',
    })
    expect(evaluateJsonPath(NESTED_JSON, '$.scores[2]')).toEqual({
      ok: true,
      value: 7,
      type: 'number',
    })
  })

  it('traverses arrays of objects', () => {
    const json = JSON.stringify([{ a: [{ b: 'deep' }] }])
    expect(evaluateJsonPath(json, '$[0].a[0].b')).toEqual({
      ok: true,
      value: 'deep',
      type: 'string',
    })
    expect(evaluateJsonPath(json, "$[0]['a'][0]['b']")).toEqual({
      ok: true,
      value: 'deep',
      type: 'string',
    })
  })

  it.each([
    ['$.*', 'wildcard ("*")'],
    ['$.user.*', 'wildcard ("*")'],
    ['$[*]', 'wildcard ("*")'],
    ['$.scores[*]', 'wildcard ("*")'],
    ['$..name', 'recursive descent ("..")'],
    ['$.user..name', 'recursive descent ("..")'],
    ['$..', 'recursive descent ("..")'],
    ['$[?(@.age > 30)]', 'filters ("[?(...)]")'],
    ['$.user[?(@.name)]', 'filters ("[?(...)]")'],
    ['$[0:2]', 'slices ("[start:end]")'],
    ['$.scores[1:3]', 'slices ("[start:end]")'],
    ['$[::2]', 'slices ("[start:end]")'],
    ['$[0,2]', 'unions ("[a,b]")'],
    ['$[-1]', 'negative indices'],
  ])('reports unsupported syntax for %s', (path, fragment) => {
    const result = evaluateJsonPath(NESTED_JSON, path)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Unsupported syntax')
      expect(result.error).toContain(fragment)
    }
  })

  it('reports not found for a missing key', () => {
    const result = evaluateJsonPath(NESTED_JSON, '$.user.missing')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Not found: key "missing" at $.user.')
    }
  })

  it('reports not found for a missing key in a deep path', () => {
    const result = evaluateJsonPath(NESTED_JSON, '$.nope.name')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Not found: key "nope" at $.')
    }
  })

  it('reports not found for an out-of-range index', () => {
    const result = evaluateJsonPath(NESTED_JSON, '$.scores[5]')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Not found: index 5 at $.scores (array has 3 element(s)).')
    }
  })

  it('reports not found for an index on an object', () => {
    const result = evaluateJsonPath(NESTED_JSON, '$.user[0]')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Not found')
      expect(result.error).toContain('does not support index access')
    }
  })

  it('reports not found for a key on an array', () => {
    const result = evaluateJsonPath(NESTED_JSON, "$.scores['name']")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Not found')
      expect(result.error).toContain('does not support key access')
    }
  })

  it('reports not found for an index on an empty array', () => {
    const result = evaluateJsonPath(NESTED_JSON, '$.empty[0]')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Not found: index 0 at $.empty (array has 0 element(s)).')
    }
  })

  it('distinguishes a null value from not found', () => {
    const found = evaluateJsonPath(NESTED_JSON, '$.nullish')
    expect(found).toEqual({ ok: true, value: null, type: 'null' })
    const missing = evaluateJsonPath(NESTED_JSON, '$.nothing')
    expect(missing.ok).toBe(false)
  })

  it('treats an array containing null as a found null value', () => {
    const json = JSON.stringify([null, 1])
    expect(evaluateJsonPath(json, '$[0]')).toEqual({ ok: true, value: null, type: 'null' })
  })

  it('reports an error for invalid JSON', () => {
    const result = evaluateJsonPath('{ not json', '$.a')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid JSON:/)
    }
  })

  it('reports an error for empty JSON input', () => {
    expect(evaluateJsonPath('', '$.a')).toEqual({ ok: false, error: 'Input JSON is empty.' })
    expect(evaluateJsonPath('   \n\t ', '$.a')).toEqual({
      ok: false,
      error: 'Input JSON is empty.',
    })
  })

  it('reports an error for an empty path', () => {
    expect(evaluateJsonPath('{"a": 1}', '')).toEqual({ ok: false, error: 'Path is empty.' })
    expect(evaluateJsonPath('{"a": 1}', '   ')).toEqual({ ok: false, error: 'Path is empty.' })
  })

  it('reports an error when both inputs are empty', () => {
    expect(evaluateJsonPath('', '')).toEqual({ ok: false, error: 'Input JSON is empty.' })
  })

  it.each([
    ['string', '$.user.name', 'Alice'],
    ['number', '$.scores[0]', 9],
    ['boolean', '$.flag', true],
    ['null', '$.nullish', null],
    ['array', '$.scores', [9, 8, 7]],
    ['object', '$.user', { name: 'Alice', address: { city: 'Kyoto' } }],
  ])('determines the type %s', (type, path, value) => {
    const json = JSON.stringify({ ...NESTED, flag: true })
    const result = evaluateJsonPath(json, path)
    expect(result).toEqual({ ok: true, value, type })
  })

  it('determines the type of the root value', () => {
    expect(evaluateJsonPath('[1, 2]', '$')).toEqual({ ok: true, value: [1, 2], type: 'array' })
    expect(evaluateJsonPath('"hi"', '$')).toEqual({ ok: true, value: 'hi', type: 'string' })
    expect(evaluateJsonPath('42', '$')).toEqual({ ok: true, value: 42, type: 'number' })
    expect(evaluateJsonPath('true', '$')).toEqual({ ok: true, value: true, type: 'boolean' })
    expect(evaluateJsonPath('null', '$')).toEqual({ ok: true, value: null, type: 'null' })
  })

  it('accesses keys containing dots via bracket notation', () => {
    const result = evaluateJsonPath(NESTED_JSON, "$['a.b']")
    expect(result).toEqual({ ok: true, value: 'dot-key', type: 'string' })
  })

  it('accesses keys containing spaces via bracket notation', () => {
    const result = evaluateJsonPath(NESTED_JSON, "$['my key']")
    expect(result).toEqual({ ok: true, value: 'space-key', type: 'string' })
  })

  it('accesses Japanese keys via bracket notation', () => {
    const result = evaluateJsonPath(NESTED_JSON, "$['名前']")
    expect(result).toEqual({ ok: true, value: 'japanese-key', type: 'string' })
  })

  it('accesses numeric-looking keys via bracket notation', () => {
    const result = evaluateJsonPath(NESTED_JSON, "$['0']")
    expect(result).toEqual({ ok: true, value: 'numeric-string-key', type: 'string' })
  })

  it('accesses keys containing a double quote via bracket notation', () => {
    const result = evaluateJsonPath(NESTED_JSON, '$["a\\"b"]')
    expect(result).toEqual({ ok: true, value: 'double-quote-key', type: 'string' })
  })

  it('accesses keys containing a single quote with an escaped quote', () => {
    const result = evaluateJsonPath(NESTED_JSON, "$['a\\'b']")
    expect(result).toEqual({ ok: true, value: 'single-quote-key', type: 'string' })
  })

  it('accesses a key with an escaped backslash', () => {
    const json = JSON.stringify({ 'back\\slash': 'ok' })
    const result = evaluateJsonPath(json, "$['back\\\\slash']")
    expect(result).toEqual({ ok: true, value: 'ok', type: 'string' })
  })

  it('reports an error for an empty bracket key', () => {
    const result = evaluateJsonPath(NESTED_JSON, "$['']")
    expect(result).toEqual({
      ok: false,
      error: 'Invalid path: empty key ("$[\'\']") is not allowed.',
    })
    expect(evaluateJsonPath(NESTED_JSON, '$[""]').ok).toBe(false)
  })

  it.each([
    ['$user', 'unexpected character'],
    ['user.name', 'must start with "$"'],
    ['$.', 'expected a key after "."'],
    ['$.a.', 'expected a key after "."'],
    ['$..a', 'recursive descent'],
    ["$['a", 'unterminated quoted key'],
    ["$['a'b']", 'expected "]" after the quoted key'],
    ['$[0', 'missing "]"'],
    ['$[abc]', 'non-negative integer or a quoted key'],
    ['$[1.5]', 'non-negative integer or a quoted key'],
    ['$[ ]', 'non-negative integer or a quoted key'],
    ['$.a-b', 'unexpected character'],
    ['$%', 'unexpected character'],
  ])('rejects the malformed path %s', (path, fragment) => {
    const result = evaluateJsonPath(NESTED_JSON, path)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain(fragment)
    }
  })
})

describe('parseJsonPath', () => {
  it('parses the root path', () => {
    expect(parseJsonPath('$')).toEqual({ ok: true, segments: [] })
  })

  it('parses dot, bracket-key, and index segments', () => {
    const parsed = parseJsonPath("$.a['b'].c[2]")
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.segments).toEqual([
        { kind: 'key', key: 'a' },
        { kind: 'key', key: 'b' },
        { kind: 'key', key: 'c' },
        { kind: 'index', index: 2 },
      ])
    }
  })

  it('unquotes escaped characters inside bracket keys', () => {
    const parsed = parseJsonPath("$['a\\'b']")
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.segments).toEqual([{ kind: 'key', key: "a'b" }])
    }
  })

  it('trims surrounding whitespace from the path', () => {
    const result = evaluateJsonPath('{"a": 1}', '  $.a  ')
    expect(result).toEqual({ ok: true, value: 1, type: 'number' })
  })
})
