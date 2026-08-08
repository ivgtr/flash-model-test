export const RADICES = [2, 8, 10, 16, 36] as const

export type Radix = (typeof RADICES)[number]

export const DEFAULT_INPUT_RADIX: Radix = 10

export const DEFAULT_OUTPUT_RADIX: Radix = 16

export type ConvertResult = { ok: true; output: string } | { ok: false; error: string }

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export function parseRadix(value: string): Radix | null {
  const parsed = Number(value)
  if (RADICES.includes(parsed as Radix)) {
    return parsed as Radix
  }
  return null
}

export function isValidDigit(ch: string, radix: Radix): boolean {
  const value = DIGITS.indexOf(ch.toLowerCase())
  return value !== -1 && value < radix
}

export function convertBase(input: string, inputRadix: Radix, outputRadix: Radix): ConvertResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { ok: true, output: '' }
  }

  let negative = false
  let digits = trimmed
  if (digits.startsWith('-')) {
    negative = true
    digits = digits.slice(1)
  }
  if (digits === '') {
    return { ok: false, error: 'Invalid number: missing digits after sign' }
  }

  let value = 0n
  for (const ch of digits) {
    if (!isValidDigit(ch, inputRadix)) {
      return {
        ok: false,
        error: `Invalid digit "${ch}" for base ${inputRadix}`,
      }
    }
    const digitValue = BigInt(DIGITS.indexOf(ch.toLowerCase()))
    value = value * BigInt(inputRadix) + digitValue
  }
  if (negative) {
    value = -value
  }

  return { ok: true, output: bigIntToRadix(value, outputRadix) }
}

function bigIntToRadix(value: bigint, radix: Radix): string {
  if (value === 0n) {
    return '0'
  }
  const base = BigInt(radix)
  const negative = value < 0n
  let abs = negative ? -value : value
  let result = ''
  while (abs > 0n) {
    result = DIGITS[Number(abs % base)] + result
    abs = abs / base
  }
  return negative ? `-${result}` : result
}
