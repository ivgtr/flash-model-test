import { describe, expect, it } from 'vitest'
import { jsonToQueryString } from './logic'

describe('jsonToQueryString', () => {
  it('converts a flat object to a query string', () => {
    expect(jsonToQueryString('{"name":"Alice","age":30,"active":true}')).toEqual({
      ok: true,
      output: 'name=Alice&age=30&active=true',
    })
  })

  it('outputs arrays as repeated keys', () => {
    expect(jsonToQueryString('{"tag":["a","b","c"]}')).toEqual({
      ok: true,
      output: 'tag=a&tag=b&tag=c',
    })
  })

  it('skips null and undefined values', () => {
    expect(jsonToQueryString('{"name":"Alice","nickname":null,"extra":null}')).toEqual({
      ok: true,
      output: 'name=Alice',
    })
    expect(jsonToQueryString('{"tag":["a",null,"b"]}')).toEqual({
      ok: true,
      output: 'tag=a&tag=b',
    })
  })

  it('encodes Japanese text, special characters, and spaces per URLSearchParams', () => {
    expect(
      jsonToQueryString('{"query":"hello world","名前":"太郎","q":"a&b=c?","sym":"@#$"}'),
    ).toEqual({
      ok: true,
      output:
        'query=hello+world&%E5%90%8D%E5%89%8D=%E5%A4%AA%E9%83%8E&q=a%26b%3Dc%3F&sym=%40%23%24',
    })
  })

  it('encodes keys that contain spaces, special characters, and Japanese text', () => {
    expect(jsonToQueryString('{"key with space":"v","日本語":"x"}')).toEqual({
      ok: true,
      output: 'key+with+space=v&%E6%97%A5%E6%9C%AC%E8%AA%9E=x',
    })
  })

  it('reports an error for nested objects', () => {
    expect(jsonToQueryString('{"user":{"name":"Alice"}}')).toEqual({
      ok: false,
      error: 'Invalid JSON: nested objects are not supported at key "user".',
    })
  })

  it('reports an error for arrays containing non-primitive values', () => {
    const nested = jsonToQueryString('{"items":[{"id":1}]}')
    expect(nested.ok).toBe(false)
    if (!nested.ok) {
      expect(nested.error).toContain('"items"')
    }
    const deepArray = jsonToQueryString('{"items":[["a"]]}')
    expect(deepArray.ok).toBe(false)
  })

  it('outputs an empty string for an empty object', () => {
    expect(jsonToQueryString('{}')).toEqual({ ok: true, output: '' })
    expect(jsonToQueryString('{}', true)).toEqual({ ok: true, output: '' })
  })

  it('omits keys for empty arrays', () => {
    expect(jsonToQueryString('{"tag":[],"name":"Alice"}')).toEqual({
      ok: true,
      output: 'name=Alice',
    })
    expect(jsonToQueryString('{"tag":[]}')).toEqual({ ok: true, output: '' })
  })

  it('outputs empty string values as key=', () => {
    expect(jsonToQueryString('{"name":""}')).toEqual({ ok: true, output: 'name=' })
    expect(jsonToQueryString('{"name":"","nick":"N"}')).toEqual({
      ok: true,
      output: 'name=&nick=N',
    })
  })

  it('reports an error for empty input', () => {
    expect(jsonToQueryString('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(jsonToQueryString('  \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for invalid JSON', () => {
    expect(jsonToQueryString('{"name":').ok).toBe(false)
    expect(jsonToQueryString('not json').ok).toBe(false)
  })

  it('reports an error when the root value is not an object', () => {
    expect(jsonToQueryString('"hello"').ok).toBe(false)
    expect(jsonToQueryString('[1,2]').ok).toBe(false)
    expect(jsonToQueryString('42').ok).toBe(false)
    expect(jsonToQueryString('null').ok).toBe(false)
    expect(jsonToQueryString('true').ok).toBe(false)
  })

  it('optionally prepends a leading question mark', () => {
    expect(jsonToQueryString('{"name":"Alice"}', true)).toEqual({
      ok: true,
      output: '?name=Alice',
    })
    expect(jsonToQueryString('{"name":"Alice"}')).toEqual({ ok: true, output: 'name=Alice' })
  })
})
