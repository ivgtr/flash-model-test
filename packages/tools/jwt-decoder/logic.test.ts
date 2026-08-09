import { describe, expect, it } from 'vitest'
import { collectDateClaims, decodeJwt, encodeBase64Url } from './logic'

const HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
const PAYLOAD = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ'
const SIGNATURE = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

const TOKEN = [HEADER, PAYLOAD, SIGNATURE].join('.')

describe('encodeBase64Url', () => {
  it('encodes JSON to unpadded base64url using URL-safe characters', () => {
    expect(encodeBase64Url('{"alg":"HS256","typ":"JWT"}')).toBe(HEADER)
    expect(encodeBase64Url('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ')
    expect(encodeBase64Url('')).toBe('')
  })

  it('uses - and _ instead of +, /, and = (no padding)', () => {
    expect(encodeBase64Url('\xff\xfe\x01')).toBe('w7_DvgE')
    expect(encodeBase64Url('😀')).toBe('8J-YgA')
    expect(encodeBase64Url('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ')
    expect(encodeBase64Url('Hello, World!')).not.toMatch(/[+/=]/)
  })
})

describe('decodeJwt', () => {
  it('decodes the header and payload of a typical 3-part JWT as pretty JSON', () => {
    const result = decodeJwt(TOKEN)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.output).toContain(
      ['Header', '{', '  "alg": "HS256",', '  "typ": "JWT"', '}'].join('\n'),
    )
    expect(result.output).toContain(
      [
        'Payload',
        '{',
        '  "sub": "1234567890",',
        '  "name": "John Doe",',
        '  "iat": 1516239022',
        '}',
      ].join('\n'),
    )
  })

  it('shows the signature as raw base64url without decoding it', () => {
    const result = decodeJwt(TOKEN)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.output).toContain(`Signature\n${SIGNATURE}`)
  })

  it('converts numeric exp claims to ISO 8601 and a readable date', () => {
    const result = decodeJwt([HEADER, 'eyJleHAiOjE3MDAwMDAwMDB9', SIGNATURE].join('.'))
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.output).toContain(
      'exp: 1700000000 -> ISO 8601: 2023-11-14T22:13:20.000Z | Readable: Tue, 14 Nov 2023 22:13:20 GMT',
    )
  })

  it('converts numeric iat and nbf claims alongside exp', () => {
    const result = decodeJwt(
      [HEADER, 'eyJuYmYiOjE3MDAwMDAwMDAsImlhdCI6MTcwMDAwMDAwMH0', SIGNATURE].join('.'),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.output).toContain(
      'nbf: 1700000000 -> ISO 8601: 2023-11-14T22:13:20.000Z | Readable: Tue, 14 Nov 2023 22:13:20 GMT',
    )
    expect(result.output).toContain(
      'iat: 1700000000 -> ISO 8601: 2023-11-14T22:13:20.000Z | Readable: Tue, 14 Nov 2023 22:13:20 GMT',
    )
  })

  it('keeps a string exp as-is without converting or crashing', () => {
    const result = decodeJwt([HEADER, 'eyJleHAiOiJub3QtYS1udW1iZXIifQ', SIGNATURE].join('.'))
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.output).toContain('"exp": "not-a-number"')
    expect(result.output).not.toContain('Date claims')
  })

  it('reports an error for empty input', () => {
    expect(decodeJwt('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(decodeJwt('   \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error when the token does not have exactly 3 dot-separated parts', () => {
    expect(decodeJwt('single-part')).toEqual({
      ok: false,
      error: "Invalid JWT: expected 3 parts separated by '.', found 1.",
    })
    expect(decodeJwt([HEADER, PAYLOAD].join('.'))).toEqual({
      ok: false,
      error: "Invalid JWT: expected 3 parts separated by '.', found 2.",
    })
    expect(decodeJwt(`${TOKEN}.extra`)).toEqual({
      ok: false,
      error: "Invalid JWT: expected 3 parts separated by '.', found 4.",
    })
  })

  it('reports an error for invalid Base64URL characters in any part', () => {
    expect(decodeJwt(`eyJhbGciOiJIUzI1NiI+.${PAYLOAD}.${SIGNATURE}`)).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid Base64URL in header/),
    })
    expect(decodeJwt(`${HEADER}.${PAYLOAD}+.${SIGNATURE}`)).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid Base64URL in payload/),
    })
    expect(decodeJwt(`${HEADER}.${PAYLOAD}.${SIGNATURE}=`)).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid Base64URL in signature/),
    })
    expect(decodeJwt(`${HEADER}.${PAYLOAD}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV/adQssw5c`)).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid Base64URL in signature/),
    })
  })

  it('reports an error when a part has an invalid base64 length', () => {
    expect(decodeJwt(`A.${PAYLOAD}.${SIGNATURE}`)).toEqual({
      ok: false,
      error: expect.stringMatching(/Invalid Base64URL in header/),
    })
  })

  it('reports an error when the header is not valid JSON', () => {
    const result = decodeJwt(`aGVsbG8.${PAYLOAD}.${SIGNATURE}`)
    expect(result).toEqual({ ok: false, error: 'Invalid JWT: header is not valid JSON.' })
  })

  it('reports an error when the payload is not valid JSON', () => {
    const result = decodeJwt(`${HEADER}.aGVsbG8.${SIGNATURE}`)
    expect(result).toEqual({ ok: false, error: 'Invalid JWT: payload is not valid JSON.' })
  })

  it('reports an error when the payload decodes to arbitrary non-UTF-8 bytes', () => {
    const result = decodeJwt(`${HEADER}.__4B.${SIGNATURE}`)
    expect(result).toEqual({ ok: false, error: 'Invalid JWT: payload is not valid JSON.' })
  })

  it('accepts valid JSON that is not an object as the payload', () => {
    const result = decodeJwt(`${HEADER}.WzEsMiwzXQ.${SIGNATURE}`)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.output).toContain(`Payload\n${JSON.stringify([1, 2, 3], null, 2)}`)
  })

  it('round-trips a JWT built from encodeBase64Url (URL-safe, padding-free)', () => {
    const header = encodeBase64Url('{"alg":"HS256","typ":"JWT"}')
    const payload = encodeBase64Url(
      '{"sub":"user_1","name":"Zażółć gęślą jaźń 🌍","iat":1516239022}',
    )
    const signature = '__-AB_CD-_'
    const token = `${header}.${payload}.${signature}`
    const result = decodeJwt(token)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.output).toContain('"sub": "user_1"')
    expect(result.output).toContain('"name": "Zażółć gęślą jaźń 🌍"')
    expect(result.output).toContain(`Signature\n${signature}`)
    expect(result.output).toContain(
      'iat: 1516239022 -> ISO 8601: 2018-01-18T01:30:22.000Z | Readable: Thu, 18 Jan 2018 01:30:22 GMT',
    )
  })

  it('does not crash on a very large payload and displays it in full', () => {
    const data = 'x'.repeat(1_000_000)
    const payload = encodeBase64Url(JSON.stringify({ data }))
    const result = decodeJwt(`${HEADER}.${payload}.${SIGNATURE}`)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.output).toContain(`Signature\n${SIGNATURE}`)
    expect(result.output).toContain('"data":')
    expect(result.output.length).toBeGreaterThan(data.length)
  })
})

describe('collectDateClaims', () => {
  it('returns only numeric, finite top-level claims in exp/nbf/iat order', () => {
    expect(collectDateClaims('{"exp":1700000000,"nbf":1700000001,"iat":1700000002}')).toEqual([
      {
        name: 'exp',
        value: 1700000000,
        iso: '2023-11-14T22:13:20.000Z',
        readable: 'Tue, 14 Nov 2023 22:13:20 GMT',
      },
      {
        name: 'nbf',
        value: 1700000001,
        iso: '2023-11-14T22:13:21.000Z',
        readable: 'Tue, 14 Nov 2023 22:13:21 GMT',
      },
      {
        name: 'iat',
        value: 1700000002,
        iso: '2023-11-14T22:13:22.000Z',
        readable: 'Tue, 14 Nov 2023 22:13:22 GMT',
      },
    ])
  })

  it('skips string and missing claims instead of converting them', () => {
    expect(collectDateClaims('{"exp":"soon","iat":1516239022}')).toEqual([
      {
        name: 'iat',
        value: 1516239022,
        iso: '2018-01-18T01:30:22.000Z',
        readable: 'Thu, 18 Jan 2018 01:30:22 GMT',
      },
    ])
    expect(collectDateClaims('{"exp":null}')).toEqual([])
    expect(collectDateClaims('{"sub":"123"}')).toEqual([])
  })

  it('returns no claims for non-object payloads', () => {
    expect(collectDateClaims('123')).toEqual([])
    expect(collectDateClaims('"exp"')).toEqual([])
    expect(collectDateClaims('[1,2,3]')).toEqual([])
    expect(collectDateClaims('not json')).toEqual([])
  })
})
