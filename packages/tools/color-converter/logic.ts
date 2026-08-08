export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

export type ParseResult = { ok: true; rgba: Rgba } | { ok: false; error: string }

export interface ConvertedColor {
  hex: string
  rgb: string
  hsl: string
  rgba: Rgba
}

export type ColorConvertResult =
  | { ok: true; empty: true }
  | { ok: true; empty: false; converted: ConvertedColor }
  | { ok: false; error: string }

export function parseColor(input: string): ParseResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  if (trimmed.startsWith('#')) {
    return parseHex(trimmed)
  }
  if (/^rgba?\(/i.test(trimmed)) {
    return parseRgb(trimmed)
  }
  if (/^hsla?\(/i.test(trimmed)) {
    return parseHsl(trimmed)
  }
  return {
    ok: false,
    error:
      'Unsupported format. Expected #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), or hsla().',
  }
}

function parseHex(input: string): ParseResult {
  const match = input.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  if (!match) {
    return { ok: false, error: 'Invalid hex color. Use #rgb, #rgba, #rrggbb, or #rrggbbaa.' }
  }
  const digits = match[1] ?? ''
  if (digits.length <= 4) {
    const r = parseInt(digits.charAt(0) + digits.charAt(0), 16)
    const g = parseInt(digits.charAt(1) + digits.charAt(1), 16)
    const b = parseInt(digits.charAt(2) + digits.charAt(2), 16)
    const a = digits.length === 4 ? parseInt(digits.charAt(3) + digits.charAt(3), 16) / 255 : 1
    return { ok: true, rgba: { r, g, b, a } }
  }
  const r = parseInt(digits.slice(0, 2), 16)
  const g = parseInt(digits.slice(2, 4), 16)
  const b = parseInt(digits.slice(4, 6), 16)
  const a = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1
  return { ok: true, rgba: { r, g, b, a } }
}

function parseRgb(input: string): ParseResult {
  const match = input.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)$/i,
  )
  if (!match) {
    return { ok: false, error: 'Invalid rgb() format. Expected rgb(r, g, b) or rgba(r, g, b, a).' }
  }
  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])
  if (r > 255 || g > 255 || b > 255) {
    return { ok: false, error: 'rgb() values must be between 0 and 255.' }
  }
  const a = match[4] === undefined ? 1 : Number(match[4])
  if (a < 0 || a > 1) {
    return { ok: false, error: 'Alpha must be between 0 and 1.' }
  }
  return { ok: true, rgba: { r, g, b, a } }
}

function parseHsl(input: string): ParseResult {
  const match = input.match(
    /^hsla?\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)$/i,
  )
  if (!match) {
    return {
      ok: false,
      error: 'Invalid hsl() format. Expected hsl(h, s%, l%) or hsla(h, s%, l%, a).',
    }
  }
  const h = ((Number(match[1]) % 360) + 360) % 360
  const s = Math.min(100, Math.max(0, Number(match[2])))
  const l = Math.min(100, Math.max(0, Number(match[3])))
  const a = match[4] === undefined ? 1 : Number(match[4])
  if (a < 0 || a > 1) {
    return { ok: false, error: 'Alpha must be between 0 and 1.' }
  }
  const { r, g, b } = hslToRgb(h, s, l)
  return { ok: true, rgba: { r, g, b, a } }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360
  const ss = Math.min(100, Math.max(0, s)) / 100
  const ll = Math.min(100, Math.max(0, l)) / 100
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2

  let r = 0
  let g = 0
  let b = 0
  if (hh < 60) {
    r = c
    g = x
  } else if (hh < 120) {
    r = x
    g = c
  } else if (hh < 180) {
    g = c
    b = x
  } else if (hh < 240) {
    r = 0
    g = x
    b = c
  } else if (hh < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min

  let h = 0
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === rn) {
      h = ((gn - bn) / d) % 6
    } else if (max === gn) {
      h = (bn - rn) / d + 2
    } else {
      h = (rn - gn) / d + 4
    }
    h *= 60
    if (h < 0) {
      h += 360
    }
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function formatHex(rgba: Rgba): string {
  const toHex = (value: number) => value.toString(16).padStart(2, '0')
  let hex = `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`
  if (rgba.a < 1) {
    hex += toHex(Math.round(rgba.a * 255))
  }
  return hex
}

export function formatRgb(rgba: Rgba): string {
  const base = `${rgba.r}, ${rgba.g}, ${rgba.b}`
  return rgba.a < 1 ? `rgba(${base}, ${rgba.a})` : `rgb(${base})`
}

export function formatHsl(rgba: Rgba): string {
  const { h, s, l } = rgbToHsl(rgba.r, rgba.g, rgba.b)
  const base = `${h}, ${s}%, ${l}%`
  return rgba.a < 1 ? `hsla(${base}, ${rgba.a})` : `hsl(${base})`
}

export function convertColor(input: string): ColorConvertResult {
  if (input.trim() === '') {
    return { ok: true, empty: true }
  }
  const parsed = parseColor(input)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error }
  }
  const { r, g, b } = parsed.rgba
  const a = Number(parsed.rgba.a.toFixed(3))
  const rgba: Rgba = { r, g, b, a }
  return {
    ok: true,
    empty: false,
    converted: { rgba, hex: formatHex(rgba), rgb: formatRgb(rgba), hsl: formatHsl(rgba) },
  }
}
