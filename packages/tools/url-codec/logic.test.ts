import { describe, expect, it } from 'vitest'
import { decodeUrl, encodeUrl } from './logic'

describe('encodeUrl', () => {
  it('matches encodeURIComponent rules for unreserved characters', () => {
    expect(encodeUrl("A-Za-z0-9-_.!~*'()")).toBe("A-Za-z0-9-_.!~*'()")
    expect(encodeUrl('a b&c=d?e#f')).toBe('a%20b%26c%3Dd%3Fe%23f')
  })

  it('encodes an empty string to an empty string', () => {
    expect(encodeUrl('')).toBe('')
  })
})

describe('decodeUrl', () => {
  it('decodes percent-encoded text back to the original', () => {
    expect(decodeUrl('Hello%2C%20World%21')).toEqual({ ok: true, output: 'Hello, World!' })
  })

  it('round-trips an ASCII string through encode and decode', () => {
    const input = 'a b&c=d?e#f/'
    expect(decodeUrl(encodeUrl(input))).toEqual({ ok: true, output: input })
  })

  it('round-trips a Unicode string (Japanese, emoji) through UTF-8', () => {
    const input = 'こんにちは 🌍 日本語🎉'
    const encoded = encodeUrl(input)
    expect(encoded).toBe(
      '%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF%20%F0%9F%8C%8D%20%E6%97%A5%E6%9C%AC%E8%AA%9E%F0%9F%8E%89',
    )
    expect(decodeUrl(encoded)).toEqual({ ok: true, output: input })
  })

  it('keeps unreserved characters as-is', () => {
    expect(decodeUrl("A-Za-z0-9-_.!~*'()")).toEqual({ ok: true, output: "A-Za-z0-9-_.!~*'()" })
  })

  it('decodes an empty string to an empty string without an error', () => {
    expect(decodeUrl('')).toEqual({ ok: true, output: '' })
  })

  it('reports an error for a percent sign not followed by two hex digits', () => {
    expect(decodeUrl('%zz')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid percent-encoding/),
    })
    expect(decodeUrl('trailing%')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid percent-encoding/),
    })
    expect(decodeUrl('%A')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid percent-encoding/),
    })
  })

  it('reports an error for malformed UTF-8 sequences', () => {
    expect(decodeUrl('%C3%28')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid percent-encoding/),
    })
  })
})
