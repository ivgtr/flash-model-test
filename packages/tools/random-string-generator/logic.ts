export const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
} as const

export type CharsetKey = keyof typeof CHARSETS

export const CHARSET_ORDER: readonly CharsetKey[] = ['lowercase', 'uppercase', 'digits', 'symbols']

export const DEFAULT_LENGTH = 16
export const MIN_LENGTH = 1
export const MAX_LENGTH = 1024

export type RandomStringResult = { ok: true; output: string } | { ok: false; error: string }

type LengthValidation = { ok: true; value: number } | { ok: false; error: string }

export function parseLength(value: string): LengthValidation {
  const trimmed = value.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Length is required.' }
  }
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed)) {
    return { ok: false, error: 'Length must be a whole number.' }
  }
  if (parsed < MIN_LENGTH || parsed > MAX_LENGTH) {
    return { ok: false, error: `Length must be between ${MIN_LENGTH} and ${MAX_LENGTH}.` }
  }
  return { ok: true, value: parsed }
}

export function buildCharset(selection: readonly CharsetKey[]): string | null {
  const chars = selection.map((key) => CHARSETS[key]).join('')
  return chars === '' ? null : chars
}

export function generateRandomString(length: number, charset: string): string {
  const pool = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / charset.length) * charset.length
  let output = ''
  for (let i = 0; i < length; i++) {
    let value: number
    do {
      crypto.getRandomValues(pool)
      value = pool[0] ?? 0
    } while (value >= limit)
    output += charset[value % charset.length]
  }
  return output
}

export function createRandomString(
  selection: readonly CharsetKey[],
  lengthText: string,
): RandomStringResult {
  const lengthResult = parseLength(lengthText)
  if (!lengthResult.ok) {
    return lengthResult
  }
  const charset = buildCharset(selection)
  if (charset === null) {
    return { ok: false, error: 'Select at least one character set.' }
  }
  return { ok: true, output: generateRandomString(lengthResult.value, charset) }
}
