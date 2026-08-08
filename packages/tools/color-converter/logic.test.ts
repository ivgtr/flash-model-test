import { describe, expect, it } from 'vitest'
import {
  convertColor,
  formatHex,
  formatHsl,
  formatRgb,
  hslToRgb,
  parseColor,
  rgbToHsl,
} from './logic'

describe('parseColor', () => {
  it('parses #rrggbb hex', () => {
    expect(parseColor('#ff0000')).toEqual({ ok: true, rgba: { r: 255, g: 0, b: 0, a: 1 } })
  })

  it('treats #fff and #ffffff as the same color', () => {
    expect(parseColor('#fff')).toEqual({ ok: true, rgba: { r: 255, g: 255, b: 255, a: 1 } })
    expect(parseColor('#ffffff')).toEqual({ ok: true, rgba: { r: 255, g: 255, b: 255, a: 1 } })
  })

  it('accepts uppercase hex digits', () => {
    expect(parseColor('#FF0000')).toEqual({ ok: true, rgba: { r: 255, g: 0, b: 0, a: 1 } })
  })

  it('parses #rgba hex with alpha', () => {
    expect(parseColor('#f008')).toEqual({ ok: true, rgba: { r: 255, g: 0, b: 0, a: 136 / 255 } })
  })

  it('parses #rrggbbaa hex with alpha', () => {
    expect(parseColor('#ff000080')).toEqual({
      ok: true,
      rgba: { r: 255, g: 0, b: 0, a: 128 / 255 },
    })
  })

  it('parses rgb() input', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ ok: true, rgba: { r: 255, g: 0, b: 0, a: 1 } })
  })

  it('parses rgba() input with alpha', () => {
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({
      ok: true,
      rgba: { r: 255, g: 0, b: 0, a: 0.5 },
    })
  })

  it('parses hsl() input', () => {
    expect(parseColor('hsl(120, 50%, 25%)')).toEqual({
      ok: true,
      rgba: { r: 32, g: 96, b: 32, a: 1 },
    })
  })

  it('parses hsla() input with alpha', () => {
    expect(parseColor('hsla(0, 100%, 50%, 0.25)')).toEqual({
      ok: true,
      rgba: { r: 255, g: 0, b: 0, a: 0.25 },
    })
  })

  it('normalizes h values of 360 or more into 0-360', () => {
    expect(parseColor('hsl(720, 100%, 50%)')).toEqual({
      ok: true,
      rgba: { r: 255, g: 0, b: 0, a: 1 },
    })
    expect(parseColor('hsl(360, 100%, 50%)')).toEqual({
      ok: true,
      rgba: { r: 255, g: 0, b: 0, a: 1 },
    })
  })

  it('rejects out-of-range rgb() values', () => {
    expect(parseColor('rgb(256, 0, 0)')).toEqual({
      ok: false,
      error: expect.stringMatching(/between 0 and 255/),
    })
    expect(parseColor('rgb(0, 0, 999)')).toEqual({
      ok: false,
      error: expect.stringMatching(/between 0 and 255/),
    })
  })

  it('rejects out-of-range alpha', () => {
    expect(parseColor('rgba(0, 0, 0, 1.5)')).toEqual({
      ok: false,
      error: expect.stringMatching(/between 0 and 1/),
    })
  })

  it('rejects malformed formats', () => {
    expect(parseColor('red').ok).toBe(false)
    expect(parseColor('#12345').ok).toBe(false)
    expect(parseColor('rgb(1 2 3)').ok).toBe(false)
    expect(parseColor('rgb(0, -1, 0)').ok).toBe(false)
    expect(parseColor('hsl(0, 50, 50)').ok).toBe(false)
  })

  it('reports an error for empty input', () => {
    expect(parseColor('')).toEqual({ ok: false, error: 'Input is empty.' })
  })
})

describe('convertColor', () => {
  it('converts #ff0000 to rgb and hsl', () => {
    const result = convertColor('#ff0000')
    expect(result).toEqual({
      ok: true,
      empty: false,
      converted: {
        rgba: { r: 255, g: 0, b: 0, a: 1 },
        hex: '#ff0000',
        rgb: 'rgb(255, 0, 0)',
        hsl: 'hsl(0, 100%, 50%)',
      },
    })
  })

  it('normalizes #fff to lowercase #ffffff', () => {
    const result = convertColor('#fff')
    expect(result).toMatchObject({
      ok: true,
      converted: { hex: '#ffffff', rgb: 'rgb(255, 255, 255)' },
    })
  })

  it('normalizes uppercase hex to lowercase output', () => {
    const result = convertColor('#FF0000')
    expect(result).toMatchObject({ ok: true, converted: { hex: '#ff0000' } })
  })

  it('converts rgba() input including alpha', () => {
    const result = convertColor('rgba(255, 0, 0, 0.5)')
    expect(result).toMatchObject({
      ok: true,
      converted: { hex: '#ff000080', rgb: 'rgba(255, 0, 0, 0.5)', hsl: 'hsla(0, 100%, 50%, 0.5)' },
    })
  })

  it('converts hsla() input including alpha', () => {
    const result = convertColor('hsla(0, 100%, 50%, 0.333)')
    expect(result).toMatchObject({
      ok: true,
      converted: {
        rgba: { r: 255, g: 0, b: 0, a: 0.333 },
        hex: '#ff000055',
        rgb: 'rgba(255, 0, 0, 0.333)',
      },
    })
  })

  it('returns empty result for empty input without error', () => {
    expect(convertColor('')).toEqual({ ok: true, empty: true })
    expect(convertColor('   ')).toEqual({ ok: true, empty: true })
  })

  it('returns an error for invalid input', () => {
    const result = convertColor('not-a-color')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/Unsupported format/)
    }
  })
})

describe('RGB -> HSL -> RGB round-trip', () => {
  it.each([
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [0, 255, 255],
    [255, 0, 255],
    [255, 128, 0],
    [0, 0, 0],
    [255, 255, 255],
    [128, 128, 128],
  ])('preserves rgb(%d, %d, %d)', (r, g, b) => {
    const { h, s, l } = rgbToHsl(r, g, b)
    expect(hslToRgb(h, s, l)).toEqual({ r, g, b })
  })
})

describe('format functions', () => {
  it('formats hex lowercase', () => {
    expect(formatHex({ r: 0, g: 128, b: 255, a: 1 })).toBe('#0080ff')
    expect(formatHex({ r: 0, g: 128, b: 255, a: 0.5 })).toBe('#0080ff80')
  })

  it('formats rgb with integer channels', () => {
    expect(formatRgb({ r: 1, g: 2, b: 3, a: 1 })).toBe('rgb(1, 2, 3)')
    expect(formatRgb({ r: 1, g: 2, b: 3, a: 0.5 })).toBe('rgba(1, 2, 3, 0.5)')
  })

  it('formats hsl with integer hue and percent', () => {
    expect(formatHsl({ r: 255, g: 128, b: 0, a: 1 })).toBe('hsl(30, 100%, 50%)')
    expect(formatHsl({ r: 255, g: 128, b: 0, a: 0.25 })).toBe('hsla(30, 100%, 50%, 0.25)')
  })
})
