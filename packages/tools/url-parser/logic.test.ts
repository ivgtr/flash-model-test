import { describe, expect, it } from 'vitest'
import { formatUrlParts, parseUrl, type UrlParts } from './logic'

describe('parseUrl', () => {
  it('decomposes a typical URL into all components', () => {
    const result = parseUrl(
      'https://user:pass@example.com:8080/path/to/page?q=hello&lang=en#section-1',
    )
    expect(result).toEqual({
      ok: true,
      parts: {
        protocol: 'https:',
        host: 'example.com:8080',
        hostname: 'example.com',
        port: '8080',
        pathname: '/path/to/page',
        search: '?q=hello&lang=en',
        hash: '#section-1',
        username: 'user',
        password: 'pass',
        origin: 'https://example.com:8080',
        params: [
          { key: 'q', value: 'hello' },
          { key: 'lang', value: 'en' },
        ],
      },
    })
  })

  it('decomposes query parameters in order, keeping duplicates and decoding values', () => {
    const result = parseUrl('https://example.com/?a=1&a=2&b=&c=%E3%81%82&flag')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.parts.params).toEqual([
        { key: 'a', value: '1' },
        { key: 'a', value: '2' },
        { key: 'b', value: '' },
        { key: 'c', value: 'あ' },
        { key: 'flag', value: '' },
      ])
    }
  })

  it('separates percent-encoded paths and queries without double decoding', () => {
    const result = parseUrl('https://example.com/a%20b/c%2Fd?x=1%2B2&y=%2525')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.parts.pathname).toBe('/a%20b/c%2Fd')
      expect(result.parts.search).toBe('?x=1%2B2&y=%2525')
      expect(result.parts.params).toEqual([
        { key: 'x', value: '1+2' },
        { key: 'y', value: '%25' },
      ])
    }
  })

  it('reports an error for a relative URL', () => {
    for (const input of ['/path/to/page', '?q=1', '#fragment', 'path', 'example.com']) {
      expect(parseUrl(input).ok).toBe(false)
    }
  })

  it('reports an error for empty and whitespace-only input', () => {
    expect(parseUrl('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(parseUrl('   ')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(parseUrl('\t\n')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for an invalid URL', () => {
    for (const input of [
      'https://exa mple.com',
      'https://example.com:abc',
      'https://example.com:99999',
      'ht!tp://example.com',
    ]) {
      const result = parseUrl(input)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/^Invalid URL:/)
      }
    }
  })

  it('parses an IPv6 host', () => {
    const result = parseUrl('http://[::1]:8080/')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.parts).toMatchObject({
        host: '[::1]:8080',
        hostname: '[::1]',
        port: '8080',
        origin: 'http://[::1]:8080',
        pathname: '/',
      })
    }
  })

  it('leaves port and search empty when not present in the URL', () => {
    const result = parseUrl('https://example.com/')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.parts.port).toBe('')
      expect(result.parts.search).toBe('')
      expect(result.parts.hash).toBe('')
      expect(result.parts.params).toEqual([])
    }
  })

  it('extracts username and password from the userinfo component', () => {
    const result = parseUrl('https://alice:s3cret@example.com/')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.parts.username).toBe('alice')
      expect(result.parts.password).toBe('s3cret')
      expect(result.parts.host).toBe('example.com')
      expect(result.parts.origin).toBe('https://example.com')
    }
  })
})

describe('formatUrlParts', () => {
  it('serializes parts to formatted JSON', () => {
    const parts: UrlParts = {
      protocol: 'https:',
      host: 'example.com',
      hostname: 'example.com',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
      username: '',
      password: '',
      origin: 'https://example.com',
      params: [{ key: 'a', value: '1' }],
    }
    const output = formatUrlParts(parts)
    expect(JSON.parse(output)).toEqual(parts)
    expect(output).toContain('\n  "host"')
  })
})
