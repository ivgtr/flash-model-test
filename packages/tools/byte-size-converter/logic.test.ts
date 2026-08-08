import { describe, expect, it } from 'vitest'
import { BYTE_UNITS, convertBytes, getUnit, type ByteRow, type ByteUnit } from './logic'

function bytesOf(input: string, unit: ByteUnit): bigint {
  const result = convertBytes(input, unit)
  if (!result.ok || result.bytes === null) {
    throw new Error(`Expected a successful conversion, got ${JSON.stringify(result)}`)
  }
  return result.bytes
}

function rowsOf(input: string, unit: ByteUnit): ByteRow[] {
  const result = convertBytes(input, unit)
  if (!result.ok || result.bytes === null) {
    throw new Error(`Expected a successful conversion, got ${JSON.stringify(result)}`)
  }
  return result.rows
}

function valueOf(rows: ByteRow[], unit: ByteUnit): string | undefined {
  return rows.find((row) => row.unit === unit)?.value
}

describe('convertBytes', () => {
  it('converts 1 KB to 1000 bytes', () => {
    expect(bytesOf('1', 'KB')).toBe(1000n)
    const rows = rowsOf('1', 'KB')
    expect(valueOf(rows, 'B')).toBe('1000')
  })

  it('converts 1 KiB to 1024 bytes', () => {
    expect(bytesOf('1', 'KiB')).toBe(1024n)
    const rows = rowsOf('1', 'KiB')
    expect(valueOf(rows, 'B')).toBe('1024')
  })

  it('shows 1 KiB and 1.024 KB for 1024 B', () => {
    const rows = rowsOf('1024', 'B')
    expect(valueOf(rows, 'KiB')).toBe('1')
    expect(valueOf(rows, 'KB')).toBe('1.024')
  })

  it('uses 1000 as the decimal conversion factor', () => {
    expect(getUnit('KB').factor).toBe(1000n)
    expect(getUnit('MB').factor).toBe(1_000_000n)
    expect(getUnit('GB').factor).toBe(1_000_000_000n)
    expect(getUnit('TB').factor).toBe(1_000_000_000_000n)
  })

  it('uses 1024 as the binary conversion factor', () => {
    expect(getUnit('KiB').factor).toBe(1024n)
    expect(getUnit('MiB').factor).toBe(1_048_576n)
    expect(getUnit('GiB').factor).toBe(1_073_741_824n)
    expect(getUnit('TiB').factor).toBe(1_099_511_627_776n)
  })

  it('covers all nine units', () => {
    expect(BYTE_UNITS.map((unit) => unit.id)).toEqual([
      'B',
      'KB',
      'MB',
      'GB',
      'TB',
      'KiB',
      'MiB',
      'GiB',
      'TiB',
    ])
  })

  it('rounds decimal inputs to a whole number of bytes', () => {
    expect(bytesOf('0.5', 'KiB')).toBe(512n)
    expect(bytesOf('1.25', 'MB')).toBe(1_250_000n)
    expect(bytesOf('0.9995', 'KB')).toBe(1000n)
  })

  it('rounds fractional bytes half up', () => {
    expect(bytesOf('0.4', 'B')).toBe(0n)
    expect(bytesOf('0.5', 'B')).toBe(1n)
    expect(bytesOf('1.5', 'B')).toBe(2n)
  })

  it('shows 0 for every unit when the input is 0', () => {
    const rows = rowsOf('0', 'B')
    for (const row of rows) {
      expect(row.value).toBe('0')
    }
  })

  it('reports an error for negative input', () => {
    expect(convertBytes('-1', 'KB').ok).toBe(false)
    expect(convertBytes('-0.5', 'MB').ok).toBe(false)
  })

  it('reports an error for non-numeric input', () => {
    expect(convertBytes('abc', 'KB').ok).toBe(false)
    expect(convertBytes('1.2.3', 'KB').ok).toBe(false)
    expect(convertBytes('0x10', 'KB').ok).toBe(false)
  })

  it('returns an empty result for empty input', () => {
    expect(convertBytes('', 'B')).toEqual({ ok: true, bytes: null })
    expect(convertBytes('   \n\t ', 'B')).toEqual({ ok: true, bytes: null })
  })

  it('computes huge values exactly with BigInt', () => {
    expect(bytesOf('1152921504606846976', 'TiB')).toBe(2n ** 100n)
    const rows = rowsOf('1152921504606846976', 'TiB')
    expect(valueOf(rows, 'B')).toBe((2n ** 100n).toString())
  })

  it('trims surrounding whitespace', () => {
    expect(bytesOf('  1.5  ', 'KB')).toBe(1500n)
  })
})
