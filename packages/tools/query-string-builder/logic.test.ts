import { describe, expect, it } from 'vitest'
import { MAX_ROWS, buildQueryString, parseQueryString, type KeyValueRow } from './logic'

describe('buildQueryString', () => {
  it('builds a query string from a list of key/value pairs', () => {
    const rows: KeyValueRow[] = [
      { key: 'page', value: '1' },
      { key: 'sort', value: 'asc' },
    ]
    expect(buildQueryString(rows)).toBe('page=1&sort=asc')
  })

  it('returns an empty string when there are no rows', () => {
    expect(buildQueryString([])).toBe('')
  })

  it('ignores rows whose key is empty or whitespace', () => {
    const rows: KeyValueRow[] = [
      { key: '', value: '' },
      { key: '', value: 'orphan' },
      { key: '  ', value: 'x' },
      { key: 'a', value: '1' },
    ]
    expect(buildQueryString(rows)).toBe('a=1')
  })

  it('outputs a key-only row as key=', () => {
    const rows: KeyValueRow[] = [
      { key: 'a', value: '' },
      { key: 'b', value: '2' },
    ]
    expect(buildQueryString(rows)).toBe('a=&b=2')
  })

  it('keeps duplicate keys as repeated parameters', () => {
    const rows: KeyValueRow[] = [
      { key: 'a', value: '1' },
      { key: 'a', value: '2' },
      { key: 'tag', value: 'x' },
      { key: 'tag', value: 'y' },
    ]
    expect(buildQueryString(rows)).toBe('a=1&a=2&tag=x&tag=y')
  })

  it('encodes spaces as plus signs', () => {
    expect(buildQueryString([{ key: 'q', value: 'hello world' }])).toBe('q=hello+world')
  })

  it('encodes Japanese and special characters', () => {
    const rows: KeyValueRow[] = [
      { key: '名前', value: '日本語' },
      { key: 'path', value: 'a&b=c=d' },
    ]
    expect(buildQueryString(rows)).toBe(
      '%E5%90%8D%E5%89%8D=%E6%97%A5%E6%9C%AC%E8%AA%9E&path=a%26b%3Dc%3Dd',
    )
  })

  it('handles a large number of rows without failing', () => {
    const rows: KeyValueRow[] = Array.from({ length: MAX_ROWS + 50 }, (_, i) => ({
      key: `k${i}`,
      value: `${i}`,
    }))
    const output = buildQueryString(rows)
    const parsed = new URLSearchParams(output)
    expect(parsed.size).toBe(rows.length)
  })
})

describe('parseQueryString', () => {
  it('parses a query string without a leading question mark', () => {
    expect(parseQueryString('a=1&b=2')).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ])
  })

  it('accepts a query string with a leading question mark', () => {
    expect(parseQueryString('?a=1&b=2')).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ])
  })

  it('decodes plus signs and percent-encoded values', () => {
    expect(parseQueryString('?q=hello+world&名前=%E6%97%A5%E6%9C%AC')).toEqual([
      { key: 'q', value: 'hello world' },
      { key: '名前', value: '日本' },
    ])
  })

  it('keeps duplicate keys as separate rows', () => {
    expect(parseQueryString('a=1&a=2')).toEqual([
      { key: 'a', value: '1' },
      { key: 'a', value: '2' },
    ])
  })

  it('parses a key without a value as an empty value', () => {
    expect(parseQueryString('a=1&b')).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '' },
    ])
  })

  it('does not crash on malformed input and skips empty segments', () => {
    expect(parseQueryString('a=1&&=x&&&b=2')).toEqual([
      { key: 'a', value: '1' },
      { key: '', value: 'x' },
      { key: 'b', value: '2' },
    ])
  })

  it('returns an empty list for an empty string', () => {
    expect(parseQueryString('')).toEqual([])
  })

  it('round-trips built query strings through parsing', () => {
    const rows: KeyValueRow[] = [
      { key: 'a', value: '1' },
      { key: 'tag', value: 'x' },
      { key: 'tag', value: 'y' },
      { key: 'q', value: 'hello world' },
      { key: '名前', value: '日本語' },
    ]
    expect(parseQueryString(buildQueryString(rows))).toEqual(rows)
  })
})
