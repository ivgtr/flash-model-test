import { describe, expect, it } from 'vitest'
import { decodeFromBase64, encodeToBase64 } from './logic'

describe('encodeToBase64', () => {
  it('encodes an ASCII string to the standard Base64 representation', () => {
    expect(encodeToBase64('Hello')).toBe('SGVsbG8=')
    expect(encodeToBase64('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==')
    expect(encodeToBase64('Man')).toBe('TWFu')
  })

  it('encodes an empty string to an empty string', () => {
    expect(encodeToBase64('')).toBe('')
  })
})

describe('decodeFromBase64', () => {
  it('decodes a standard Base64 string back to the original text', () => {
    expect(decodeFromBase64('SGVsbG8=')).toEqual({ ok: true, output: 'Hello' })
    expect(decodeFromBase64('SGVsbG8sIFdvcmxkIQ==')).toEqual({
      ok: true,
      output: 'Hello, World!',
    })
  })

  it('round-trips an ASCII string through encode and decode', () => {
    const input = 'Hello, World! 12345 +/'
    expect(decodeFromBase64(encodeToBase64(input))).toEqual({ ok: true, output: input })
  })

  it('round-trips a Unicode string (Japanese, emoji) through UTF-8', () => {
    const input = 'こんにちは 🌍 日本語🎉'
    const encoded = encodeToBase64(input)
    expect(encoded).not.toContain('こ')
    expect(decodeFromBase64(encoded)).toEqual({ ok: true, output: input })
  })

  it('decodes an empty string to an empty string without an error', () => {
    expect(decodeFromBase64('')).toEqual({ ok: true, output: '' })
  })

  it('reports an error for characters outside the Base64 alphabet', () => {
    const result = decodeFromBase64('SGVsbG8#')
    expect(result.ok).toBe(false)
  })

  it('reports an error for an invalid length', () => {
    const result = decodeFromBase64('SGVsbG8')
    expect(result.ok).toBe(false)
  })

  it('reports an error for invalid padding placement', () => {
    expect(decodeFromBase64('SGVs=bG8=')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid Base64/),
    })
    expect(decodeFromBase64('===TWFu')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid Base64/),
    })
    expect(decodeFromBase64('SGVsbG8===')).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid Base64/),
    })
  })

  it('reports an error for decoded bytes that are not valid UTF-8', () => {
    const result = decodeFromBase64('/w==')
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/not valid UTF-8/) })
  })
})
