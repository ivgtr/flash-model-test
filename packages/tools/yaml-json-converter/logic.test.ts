import { describe, expect, it } from 'vitest'
import { DIRECTIONS, DIRECTION_LABELS, convertYamlJson, jsonToYaml, yamlToJson } from './logic'

function parseJson(output: string): unknown {
  return JSON.parse(output)
}

describe('yamlToJson', () => {
  it('parses a basic block mapping', () => {
    const result = yamlToJson('name: tool-forge\ncount: 2\nactive: true')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual({ name: 'tool-forge', count: 2, active: true })
    }
  })

  it('parses nested mappings and sequences by indentation', () => {
    const result = yamlToJson(
      'server:\n  host: localhost\n  ports:\n    - 8080\n    - 9090\n  settings:\n    tls: true\n    level: 2',
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual({
        server: {
          host: 'localhost',
          ports: [8080, 9090],
          settings: { tls: true, level: 2 },
        },
      })
    }
  })

  it('parses a block sequence of scalars', () => {
    const result = yamlToJson('- apple\n- banana\n- 3')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual(['apple', 'banana', 3])
    }
  })

  it('parses a sequence of mappings', () => {
    const result = yamlToJson('- name: Alice\n  age: 30\n- name: Bob\n  age: 25')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ])
    }
  })

  it('parses a nested sequence inside a sequence', () => {
    const result = yamlToJson('- - a\n  - b\n- c')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual([['a', 'b'], 'c'])
    }
  })

  it('types plain scalars: booleans, null, integers, floats, strings', () => {
    const result = yamlToJson(
      'a: true\nb: FALSE\nc: null\nd: ~\ne: 42\nf: -7\ng: 1.5\nh: 1e3\ni: hello',
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual({
        a: true,
        b: false,
        c: null,
        d: null,
        e: 42,
        f: -7,
        g: 1.5,
        h: 1000,
        i: 'hello',
      })
    }
  })

  it('keeps quoted scalars as strings even when they look like numbers or booleans', () => {
    const result = yamlToJson('a: "123"\nb: \'true\'\nc: "1.5"\nd: "hello"')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual({ a: '123', b: 'true', c: '1.5', d: 'hello' })
    }
  })

  it('handles escaped quotes and escape sequences', () => {
    const result = yamlToJson(
      'a: \'it\'\'s\'\nb: "line1\\nline2"\nc: "tab\\there"\nd: "back\\\\slash"',
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual({
        a: "it's",
        b: 'line1\nline2',
        c: 'tab\there',
        d: 'back\\slash',
      })
    }
  })

  it('strips inline comments and comment-only lines, and handles CRLF', () => {
    const result = yamlToJson('a: 1 # trailing comment\r\n# full comment\r\n\r\nb: two')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual({ a: 1, b: 'two' })
    }
  })

  it('does not treat # inside quotes as a comment', () => {
    const result = yamlToJson('a: "x # y"\nb: \'# not a comment\'')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual({ a: 'x # y', b: '# not a comment' })
    }
  })

  it('maps an empty value to null and supports quoted keys with special characters', () => {
    const result = yamlToJson('empty:\n\'my key\': 1\n"a.b": 2\nplain-key: 3')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(parseJson(result.output)).toEqual({
        empty: null,
        'my key': 1,
        'a.b': 2,
        'plain-key': 3,
      })
    }
  })

  it('supports a top-level scalar, empty mapping and empty sequence', () => {
    const scalar = yamlToJson('hello world')
    expect(scalar.ok).toBe(true)
    if (scalar.ok) {
      expect(parseJson(scalar.output)).toBe('hello world')
    }
    const mapping = yamlToJson('{}')
    expect(mapping.ok).toBe(true)
    if (mapping.ok) {
      expect(parseJson(mapping.output)).toEqual({})
    }
    const sequence = yamlToJson('[]')
    expect(sequence.ok).toBe(true)
    if (sequence.ok) {
      expect(parseJson(sequence.output)).toEqual([])
    }
  })

  it('reports duplicate keys', () => {
    const result = yamlToJson('a: 1\na: 2')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/Duplicate key "a"/)
    }
  })

  it('reports tab indentation as an error', () => {
    const result = yamlToJson('a:\n\tb: 1')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/Tab indentation/)
    }
  })

  it('reports inconsistent indentation as an error', () => {
    const result = yamlToJson('a:\n  b: 1\n   c: 2')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/Unexpected content|Inconsistent indentation/)
    }
  })

  it.each([
    ['anchor', 'a: &x 1'],
    ['alias', 'a: *x'],
    ['tag', 'a: !!str 1'],
    ['document marker', '---\na: 1'],
    ['block scalar pipe', 'a: |\n  text'],
    ['block scalar angle', 'a: >\n  folded'],
    ['flow collection mapping', 'a: {b: 1}'],
    ['flow collection sequence', 'a: [1, 2]'],
  ])('reports unsupported syntax for %s', (_name, input) => {
    const result = yamlToJson(input)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/Unsupported syntax/)
    }
  })

  it('reports an unterminated quoted string', () => {
    const result = yamlToJson('a: "unterminated')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/Unterminated/)
    }
  })

  it('reports unexpected content after the document', () => {
    const result = yamlToJson('a: 1\n- stray')
    expect(result.ok).toBe(false)
  })
})

describe('jsonToYaml', () => {
  it('converts a basic object to block-style YAML', () => {
    const result = jsonToYaml('{"name": "tool-forge", "count": 2, "active": true}')
    expect(result).toEqual({
      ok: true,
      output: ['name: tool-forge', 'count: 2', 'active: true'].join('\n'),
    })
  })

  it('converts nested objects and arrays', () => {
    const result = jsonToYaml('{"server": {"host": "localhost", "ports": [8080, 9090]}}')
    expect(result).toEqual({
      ok: true,
      output: ['server:', '  host: localhost', '  ports:', '    - 8080', '    - 9090'].join('\n'),
    })
  })

  it('converts an array of objects', () => {
    const result = jsonToYaml('[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]')
    expect(result).toEqual({
      ok: true,
      output: ['- name: Alice', '  age: 30', '- name: Bob', '  age: 25'].join('\n'),
    })
  })

  it('quotes strings that would be misread as other types', () => {
    const result = jsonToYaml('{"a": "true", "b": "123", "c": "1.5", "d": "null"}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.split('\n').sort()).toEqual([
        "a: 'true'",
        "b: '123'",
        "c: '1.5'",
        "d: 'null'",
      ])
    }
  })

  it('quotes strings with colons, hashes, leading spaces and special starts', () => {
    const result = jsonToYaml(
      '{"a": "x: y", "b": "plain", "c": "hello world", "d": "#hash", "e": " has leading space"}',
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      const lines = result.output.split('\n')
      expect(lines[0]).toBe("a: 'x: y'")
      expect(lines[1]).toBe('b: plain')
      expect(lines[2]).toBe('c: hello world')
      expect(lines[3]).toBe("d: '#hash'")
      expect(lines[4]).toBe("e: ' has leading space'")
    }
  })

  it('uses double quotes for strings with newlines and escapes', () => {
    const result = jsonToYaml('{"a": "line1\\nline2", "b": "tab\\there", "c": "quote\\" here"}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.split('\n').sort()).toEqual([
        'a: "line1\\nline2"',
        'b: "tab\\there"',
        'c: "quote\\" here"',
      ])
    }
  })

  it('handles null, empty objects and empty arrays', () => {
    const result = jsonToYaml('{"a": null, "b": {}, "c": [], "d": ""}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.split('\n').sort()).toEqual(['a:', 'b: {}', 'c: []', "d: ''"])
    }
  })

  it('reports invalid JSON', () => {
    expect(jsonToYaml('{broken')).toEqual({ ok: false, error: 'Invalid JSON.' })
  })
})

describe('round-trip', () => {
  it('preserves values through JSON → YAML → JSON', () => {
    const input = {
      name: 'tool-forge',
      count: 2,
      ratio: 0.25,
      active: true,
      tags: ['a', 'b', '1'],
      nested: { list: [1, 2], empty: {}, note: 'true or 123', multi: 'line1\nline2' },
      special: 'x: y # z',
      nul: null,
    }
    const toYaml = jsonToYaml(JSON.stringify(input))
    expect(toYaml.ok).toBe(true)
    if (!toYaml.ok) {
      return
    }
    const back = yamlToJson(toYaml.output)
    expect(back.ok).toBe(true)
    if (back.ok) {
      expect(parseJson(back.output)).toEqual(input)
    }
  })
})

describe('convertYamlJson', () => {
  it('dispatches on direction', () => {
    expect(convertYamlJson('a: 1', 'yaml-to-json').ok).toBe(true)
    expect(convertYamlJson('{"a": 1}', 'json-to-yaml').ok).toBe(true)
  })

  it('reports an error for empty input in both directions', () => {
    expect(convertYamlJson('', 'yaml-to-json')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(convertYamlJson('  \n', 'json-to-yaml')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('exposes the direction options and labels', () => {
    expect(DIRECTIONS).toEqual(['yaml-to-json', 'json-to-yaml'])
    expect(DIRECTION_LABELS['yaml-to-json']).toBe('YAML → JSON')
  })
})
