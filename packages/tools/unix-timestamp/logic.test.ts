import { describe, expect, it } from 'vitest'
import { dateToTimestamp, formatTimestampInfo, parseTimestamp } from './logic'

const pad = (n: number): string => n.toString().padStart(2, '0')

function localFormat(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

describe('parseTimestamp', () => {
  it('converts seconds (10 digits) to a date', () => {
    const result = parseTimestamp('0')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.seconds).toBe(0)
      expect(result.output.utc).toBe('1970-01-01 00:00:00')
    }
  })

  it('converts milliseconds (13 digits) to a date', () => {
    const result = parseTimestamp('1700000000000')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.seconds).toBe(1700000000)
      expect(result.output.milliseconds).toBe(1700000000000)
      expect(result.output.utc).toBe('2023-11-14 22:13:20')
    }
  })

  it('displays both local timezone and UTC', () => {
    const result = parseTimestamp('0')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.local).toBe(localFormat(new Date(0)))
      expect(result.output.utc).toBe('1970-01-01 00:00:00')
    }
  })

  it('shows the seconds to milliseconds conversion', () => {
    const result = parseTimestamp('1700000000')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.seconds).toBe(1700000000)
      expect(result.output.milliseconds).toBe(1700000000000)
    }
  })

  it('auto-detects seconds vs milliseconds at the boundary', () => {
    const seconds = parseTimestamp('9999999999')
    expect(seconds.ok).toBe(true)
    if (seconds.ok) {
      expect(seconds.output.seconds).toBe(9999999999)
    }
    const milliseconds = parseTimestamp('9999999999999')
    expect(milliseconds.ok).toBe(true)
    if (milliseconds.ok) {
      expect(milliseconds.output.milliseconds).toBe(9999999999999)
    }
  })

  it('reports an error for non-numeric input', () => {
    const result = parseTimestamp('abc')
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/Invalid timestamp/) })
  })

  it('reports an error for negative input', () => {
    const result = parseTimestamp('-1700000000')
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/Invalid timestamp/) })
  })

  it('reports an error for values that are neither 10 nor 13 digits', () => {
    expect(parseTimestamp('12345678').ok).toBe(false)
    expect(parseTimestamp('123456789').ok).toBe(false)
    expect(parseTimestamp('12345678901234').ok).toBe(false)
  })

  it('reports an error for empty input', () => {
    expect(parseTimestamp('').ok).toBe(false)
    expect(parseTimestamp('   ').ok).toBe(false)
  })
})

describe('dateToTimestamp', () => {
  it('converts a local datetime input to a Unix timestamp in seconds', () => {
    const input = '2026-08-09T10:30'
    const result = dateToTimestamp(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const expected = Math.floor(new Date(input).getTime() / 1000)
      expect(result.output.seconds).toBe(expected)
      expect(result.output.milliseconds).toBe(expected * 1000)
    }
  })

  it('interprets the datetime as local time and converts to UTC', () => {
    const input = '1970-01-01T00:00'
    const date = new Date(input)
    const result = dateToTimestamp(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.seconds).toBe(Math.floor(date.getTime() / 1000))
      expect(result.output.utc).toBe(date.toISOString().slice(0, 19).replace('T', ' '))
    }
  })

  it('reports an error for empty input', () => {
    expect(dateToTimestamp('').ok).toBe(false)
  })

  it('reports an error for an invalid date', () => {
    expect(dateToTimestamp('not-a-date').ok).toBe(false)
  })
})

describe('formatTimestampInfo', () => {
  it('formats a date in local timezone and UTC', () => {
    const date = new Date(1700000000000)
    const info = formatTimestampInfo(date)
    expect(info.local).toBe(localFormat(date))
    expect(info.utc).toBe('2023-11-14 22:13:20')
  })
})
