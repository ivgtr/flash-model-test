import { describe, expect, it } from 'vitest'
import { parseQueryString, serializeQueryString } from './logic'

describe('parseQueryString', () => {
  it('parses a basic query string preserving order', () => {
    expect(parseQueryString('a=1&b=2')).toEqual({
      ok: true,
      output: [
        ['a', '1'],
        ['b', '2'],
      ],
    })
    expect(parseQueryString('?a=1&b=2')).toEqual({
      ok: true,
      output: [
        ['a', '1'],
        ['b', '2'],
      ],
    })
  })

  it('preserves duplicate keys', () => {
    expect(parseQueryString('?a=1&a=2')).toEqual({
      ok: true,
      output: [
        ['a', '1'],
        ['a', '2'],
      ],
    })
  })

  it('treats a segment without = and a segment with trailing = as empty values', () => {
    expect(parseQueryString('a&b=')).toEqual({
      ok: true,
      output: [
        ['a', ''],
        ['b', ''],
      ],
    })
    expect(parseQueryString('a')).toEqual({ ok: true, output: [['a', '']] })
    expect(parseQueryString('a=')).toEqual({ ok: true, output: [['a', '']] })
  })

  it('returns an empty list for an empty input', () => {
    expect(parseQueryString('')).toEqual({ ok: true, output: [] })
    expect(parseQueryString('?')).toEqual({ ok: true, output: [] })
  })

  it('decodes percent-encoded values', () => {
    expect(parseQueryString('q=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF')).toEqual({
      ok: true,
      output: [['q', 'こんにちは']],
    })
  })

  it('reports an error for malformed percent-encoding', () => {
    expect(parseQueryString('a=%zz')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid percent-encoding/),
    })
    expect(parseQueryString('a=1&b=%')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid percent-encoding/),
    })
    expect(parseQueryString('%C3%28=1')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid percent-encoding/),
    })
  })

  it('splits on the first = and keeps the rest in the value', () => {
    expect(parseQueryString('a=b=c')).toEqual({ ok: true, output: [['a', 'b=c']] })
  })

  it('keeps empty segments as empty pairs', () => {
    expect(parseQueryString('a&&b')).toEqual({
      ok: true,
      output: [
        ['a', ''],
        ['', ''],
        ['b', ''],
      ],
    })
  })
})

describe('serializeQueryString', () => {
  it('joins pairs without a leading ?', () => {
    expect(
      serializeQueryString([
        ['a', '1'],
        ['b', '2'],
      ]),
    ).toEqual({
      ok: true,
      output: 'a=1&b=2',
    })
  })

  it('round-trips parse then serialize to the normalized input', () => {
    const input = 'a=1&a=2&b=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF&c=&d='
    const parsed = parseQueryString(input)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(serializeQueryString(parsed.output)).toEqual({ ok: true, output: input })
    }
  })

  it('preserves order and duplicates when serializing', () => {
    const pairs: [string, string][] = [
      ['a', '1'],
      ['a', '2'],
      ['b', '3'],
    ]
    expect(serializeQueryString(pairs)).toEqual({ ok: true, output: 'a=1&a=2&b=3' })
  })

  it('percent-encodes keys and values on serialize', () => {
    expect(serializeQueryString([['q', 'こんにちは 世界']])).toEqual({
      ok: true,
      output: 'q=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF%20%E4%B8%96%E7%95%8C',
    })
  })

  it('serializes an empty pair list to an empty string', () => {
    expect(serializeQueryString([])).toEqual({ ok: true, output: '' })
  })

  it('reports an error for unencodable characters', () => {
    expect(serializeQueryString([['\uD800', '1']])).toEqual({
      ok: false,
      error: expect.stringMatching(/Could not serialize/),
    })
  })
})
