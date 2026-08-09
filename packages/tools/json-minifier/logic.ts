export type MinifyMode = 'minified' | 'pretty'

export const MINIFY_MODES: readonly MinifyMode[] = ['minified', 'pretty']

export const DEFAULT_MODE: MinifyMode = 'minified'

export interface MinifyStats {
  bytesBefore: number
  bytesAfter: number
  savedPercent: number
}

export type MinifyJsonResult =
  { ok: true; output: string; stats: MinifyStats } | { ok: false; error: string }

const encoder = new TextEncoder()

/**
 * Minifies (or pretty-prints) JSON via the native JSON.parse/JSON.stringify
 * round-trip. Byte counts are measured in UTF-8 with TextEncoder.
 *
 * Number precision follows the native JSON round-trip: huge numbers may lose
 * precision (e.g. 9007199254740993 becomes 9007199254740992).
 */
export function minifyJson(input: string, mode: MinifyMode = DEFAULT_MODE): MinifyJsonResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  let value: unknown
  try {
    value = JSON.parse(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error'
    return { ok: false, error: `Invalid JSON: ${message}` }
  }
  const output = JSON.stringify(value, null, mode === 'pretty' ? 2 : undefined)
  const bytesBefore = encoder.encode(input).length
  const bytesAfter = encoder.encode(output).length
  const savedPercent = Math.round(((bytesBefore - bytesAfter) / bytesBefore) * 10000) / 100
  return { ok: true, output, stats: { bytesBefore, bytesAfter, savedPercent } }
}

export function parseMode(value: string): MinifyMode | null {
  if (value === 'minified' || value === 'pretty') {
    return value
  }
  return null
}
