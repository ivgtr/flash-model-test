import { describe, expect, it } from 'vitest'
import { convertMode, parseMode, type ConvertModeResult, type ParseModeResult } from './logic'

function expectOctal(result: ParseModeResult, special: number, permission: number) {
  expect(result).toEqual({ ok: true, special, permission })
}

function expectConverted(
  input: string,
  expected: Omit<Extract<ConvertModeResult, { ok: true }>, 'ok'>,
) {
  expect(convertMode(input)).toEqual({ ok: true, ...expected })
}

describe('parseMode', () => {
  it('parses a 3-digit octal mode', () => {
    expectOctal(parseMode('755'), 0, 0o755)
    expectOctal(parseMode('000'), 0, 0)
    expectOctal(parseMode('777'), 0, 0o777)
  })

  it('parses a 4-digit octal mode with special bits', () => {
    expectOctal(parseMode('4755'), 4, 0o755)
    expectOctal(parseMode('2755'), 2, 0o755)
    expectOctal(parseMode('1777'), 1, 0o777)
    expectOctal(parseMode('7755'), 7, 0o755)
  })

  it('parses a symbolic mode without special bits', () => {
    expectOctal(parseMode('rwxr-xr-x'), 0, 0o755)
    expectOctal(parseMode('---------'), 0, 0)
    expectOctal(parseMode('rw-rw-rw-'), 0, 0o666)
  })

  it('parses a symbolic mode with special bits', () => {
    expectOctal(parseMode('rwsr-xr-x'), 4, 0o755)
    expectOctal(parseMode('rwxr-sr-x'), 2, 0o755)
    expectOctal(parseMode('rwxrwxrwt'), 1, 0o777)
  })

  it('accepts S and T as special bits without the execute bit', () => {
    expectOctal(parseMode('rwSr--r--'), 4, 0o644)
    expectOctal(parseMode('rwxr-Sr-x'), 2, 0o745)
    expectOctal(parseMode('rwxrwxr-T'), 1, 0o774)
  })

  it('parses a symbolic mode positionally in user, group, other order', () => {
    expectOctal(parseMode('r-xr--rwx'), 0, 0o547)
    expectOctal(parseMode('-wx--xr--'), 0, 0o314)
  })

  it('trims surrounding whitespace', () => {
    expectOctal(parseMode('  755  '), 0, 0o755)
    expectOctal(parseMode('  rwsr-xr-x  '), 4, 0o755)
  })

  it('reports an error for empty input', () => {
    expect(parseMode('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(parseMode('   ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for octal digits 8 and 9', () => {
    expect(parseMode('8')).toMatchObject({ ok: false, error: expect.stringContaining('8 and 9') })
    expect(parseMode('7559')).toMatchObject({
      ok: false,
      error: expect.stringContaining('8 and 9'),
    })
    expect(parseMode('800')).toMatchObject({ ok: false, error: expect.stringContaining('8 and 9') })
  })

  it('reports an error for a wrong number of octal digits', () => {
    expect(parseMode('75')).toMatchObject({
      ok: false,
      error: expect.stringContaining('3 or 4 digits'),
    })
    expect(parseMode('7')).toMatchObject({
      ok: false,
      error: expect.stringContaining('3 or 4 digits'),
    })
    expect(parseMode('75555')).toMatchObject({
      ok: false,
      error: expect.stringContaining('3 or 4 digits'),
    })
  })

  it('reports an error for a wrong number of symbolic characters', () => {
    expect(parseMode('rwxr-xr-')).toMatchObject({
      ok: false,
      error: expect.stringContaining('exactly 9'),
    })
    expect(parseMode('rwxr-xr-xx')).toMatchObject({
      ok: false,
      error: expect.stringContaining('exactly 9'),
    })
    expect(parseMode('----------')).toMatchObject({
      ok: false,
      error: expect.stringContaining('exactly 9'),
    })
  })

  it('reports an error for disallowed symbolic characters', () => {
    expect(parseMode('rwxr-xr-?')).toMatchObject({ ok: false, error: expect.stringContaining('?') })
    expect(parseMode('rwxr-xr-z')).toMatchObject({ ok: false, error: expect.stringContaining('z') })
    expect(parseMode('rrxr-xr-x')).toMatchObject({ ok: false, error: expect.stringContaining('r') })
  })

  it('reports an error for special bits in invalid positions', () => {
    expect(parseMode('rwtr-xr-x')).toMatchObject({
      ok: false,
      error: expect.stringContaining('t'),
    })
    expect(parseMode('rwxr-xr-xs')).toMatchObject({
      ok: false,
      error: expect.stringContaining('s'),
    })
    expect(parseMode('rwxsr-xr-x')).toMatchObject({
      ok: false,
      error: expect.stringContaining('s'),
    })
    expect(parseMode('rwxr-tr-x')).toMatchObject({
      ok: false,
      error: expect.stringContaining('t'),
    })
  })

  it('reports an error for non-digit, non-symbolic characters', () => {
    expect(parseMode('aaaaaaaaa')).toEqual({ ok: false, error: expect.stringContaining('a') })
    expect(parseMode('rwxr-xr-a')).toEqual({ ok: false, error: expect.stringContaining('a') })
  })
})

describe('convertMode', () => {
  it('converts an octal mode to symbolic, binary, and class readings', () => {
    expectConverted('755', {
      octal: '0755',
      symbolic: 'rwxr-xr-x',
      binary: '000111101101',
      classes: { user: 'rwx', group: 'r-x', other: 'r-x' },
    })
  })

  it('converts a 4-digit octal mode with special bits', () => {
    expectConverted('4755', {
      octal: '4755',
      symbolic: 'rwsr-xr-x',
      binary: '100111101101',
      classes: { user: 'rws', group: 'r-x', other: 'r-x' },
    })
    expectConverted('2755', {
      octal: '2755',
      symbolic: 'rwxr-sr-x',
      binary: '010111101101',
      classes: { user: 'rwx', group: 'r-s', other: 'r-x' },
    })
    expectConverted('1777', {
      octal: '1777',
      symbolic: 'rwxrwxrwt',
      binary: '001111111111',
      classes: { user: 'rwx', group: 'rwx', other: 'rwt' },
    })
  })

  it('round-trips a symbolic mode back to octal', () => {
    expectConverted('rwxr-xr-x', {
      octal: '0755',
      symbolic: 'rwxr-xr-x',
      binary: '000111101101',
      classes: { user: 'rwx', group: 'r-x', other: 'r-x' },
    })
  })

  it('converts symbolic modes with S and T', () => {
    expectConverted('rwSr--r--', {
      octal: '4644',
      symbolic: 'rwSr--r--',
      binary: '100110100100',
      classes: { user: 'rwS', group: 'r--', other: 'r--' },
    })
    expectConverted('rwxrwxr-T', {
      octal: '1774',
      symbolic: 'rwxrwxr-T',
      binary: '001111111100',
      classes: { user: 'rwx', group: 'rwx', other: 'r-T' },
    })
  })

  it('handles the 000 and 777 boundaries', () => {
    expectConverted('000', {
      octal: '0000',
      symbolic: '---------',
      binary: '000000000000',
      classes: { user: '---', group: '---', other: '---' },
    })
    expectConverted('777', {
      octal: '0777',
      symbolic: 'rwxrwxrwx',
      binary: '000111111111',
      classes: { user: 'rwx', group: 'rwx', other: 'rwx' },
    })
  })

  it('reports an error for invalid input', () => {
    expect(convertMode('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(convertMode('8')).toEqual({ ok: false, error: expect.stringContaining('8 and 9') })
    expect(convertMode('95')).toEqual({ ok: false, error: expect.stringContaining('8 and 9') })
    expect(convertMode('rwxr-xr-z')).toEqual({ ok: false, error: expect.stringContaining('z') })
  })
})
