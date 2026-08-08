export const DECIMAL_BASE = 1000n
export const BINARY_BASE = 1024n

export type ByteUnitSystem = 'decimal' | 'binary'

export interface ByteUnitDefinition {
  id: string
  system: ByteUnitSystem
  factor: bigint
}

function power(base: bigint, exponent: number): bigint {
  let factor = 1n
  for (let i = 0; i < exponent; i += 1) {
    factor *= base
  }
  return factor
}

const DECIMAL_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
const BINARY_UNITS = ['KiB', 'MiB', 'GiB', 'TiB'] as const

export const BYTE_UNITS: readonly ByteUnitDefinition[] = [
  ...DECIMAL_UNITS.map((id, exponent) => ({
    id,
    system: 'decimal' as const,
    factor: power(DECIMAL_BASE, exponent),
  })),
  ...BINARY_UNITS.map((id, index) => ({
    id,
    system: 'binary' as const,
    factor: power(BINARY_BASE, index + 1),
  })),
]

export type ByteUnit = (typeof BYTE_UNITS)[number]['id']

export function getUnit(id: ByteUnit): ByteUnitDefinition {
  const unit = BYTE_UNITS.find((candidate) => candidate.id === id)
  if (!unit) {
    throw new Error(`Unknown byte unit: ${id}`)
  }
  return unit
}

export interface ByteRow {
  unit: ByteUnit
  system: ByteUnitSystem
  value: string
}

export type ByteConvertResult =
  | { ok: true; bytes: null }
  | { ok: true; bytes: bigint; rows: ByteRow[] }
  | { ok: false; error: string }

const DECIMAL_PATTERN = /^[+-]?\d+(?:\.\d+)?$/

function parseDecimal(input: string): { digits: bigint; scale: bigint } | null {
  if (!DECIMAL_PATTERN.test(input)) {
    return null
  }
  const [integerPart, fractionalPart = ''] = input.split('.')
  const scale = 10n ** BigInt(fractionalPart.length)
  const digits = BigInt(`${integerPart}${fractionalPart}`)
  return { digits, scale }
}

function roundHalfUp(digits: bigint, scale: bigint, factor: bigint): bigint {
  return (digits * factor * 2n + scale) / (scale * 2n)
}

export function formatValue(bytes: bigint, unit: ByteUnitDefinition): string {
  if (unit.id === 'B') {
    return bytes.toString()
  }
  const value = Number(bytes) / Number(unit.factor)
  return String(Number(value.toPrecision(6)))
}

function formatRows(bytes: bigint): ByteRow[] {
  return BYTE_UNITS.map((unit) => ({
    unit: unit.id,
    system: unit.system,
    value: formatValue(bytes, unit),
  }))
}

export function convertBytes(input: string, unit: ByteUnit): ByteConvertResult {
  const text = input.trim()
  if (text === '') {
    return { ok: true, bytes: null }
  }
  if (text.startsWith('-')) {
    return { ok: false, error: 'Value must be a non-negative number.' }
  }
  const parsed = parseDecimal(text)
  if (parsed === null) {
    return { ok: false, error: 'Value must be a valid non-negative number.' }
  }
  const bytes = roundHalfUp(parsed.digits, parsed.scale, getUnit(unit).factor)
  return { ok: true, bytes, rows: formatRows(bytes) }
}
