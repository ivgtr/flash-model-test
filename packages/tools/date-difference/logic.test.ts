import { describe, expect, it } from 'vitest'
import { computeDateDifference, formatDateDifference } from './logic'

function okResult(start: string, end: string) {
  const output = computeDateDifference(start, end)
  if (output.status !== 'ok') {
    throw new Error(`expected ok, got ${output.status}`)
  }
  return output.result
}

describe('computeDateDifference totals', () => {
  it('computes a one-day difference as 24 hours', () => {
    const result = okResult('2024-01-15T10:30', '2024-01-16T10:30')
    expect(result).toEqual({
      years: 0,
      months: 0,
      days: 1,
      totalHours: 24,
      totalMinutes: 1440,
      totalSeconds: 86400,
      totalDays: 1,
    })
  })

  it('computes totals across multiple days with hours and minutes', () => {
    const result = okResult('2024-01-01T00:00', '2024-01-04T12:45')
    expect(result.totalSeconds).toBe(305100)
    expect(result.totalMinutes).toBe(5085)
    expect(result.totalHours).toBe(84)
    expect(result.totalDays).toBe(3)
  })

  it('counts a leap day (Feb 29) in the total', () => {
    const leap = okResult('2024-02-28T00:00', '2024-03-01T00:00')
    expect(leap.totalDays).toBe(2)
    expect(leap.totalHours).toBe(48)
    const nonLeap = okResult('2023-02-28T00:00', '2023-03-01T00:00')
    expect(nonLeap.totalDays).toBe(1)
    expect(nonLeap.totalHours).toBe(24)
  })
})

describe('computeDateDifference calendar difference', () => {
  it('computes a month crossing', () => {
    const result = okResult('2024-01-15T10:30', '2024-02-15T10:30')
    expect(result.years).toBe(0)
    expect(result.months).toBe(1)
    expect(result.days).toBe(0)
  })

  it('computes a year crossing', () => {
    const result = okResult('2023-11-15T00:00', '2024-03-20T00:00')
    expect(result.years).toBe(0)
    expect(result.months).toBe(4)
    expect(result.days).toBe(5)
  })

  it('computes a multi-year difference', () => {
    const result = okResult('2022-06-01T00:00', '2025-06-01T00:00')
    expect(result.years).toBe(3)
    expect(result.months).toBe(0)
    expect(result.days).toBe(0)
  })

  it('handles the end-of-January boundary in a common year', () => {
    const result = okResult('2024-01-31T10:30', '2024-02-28T10:30')
    expect(result.years).toBe(0)
    expect(result.months).toBe(0)
    expect(result.days).toBe(28)
  })

  it('handles the end-of-January boundary in a leap year', () => {
    const result = okResult('2024-01-31T10:30', '2024-02-29T10:30')
    expect(result.years).toBe(0)
    expect(result.months).toBe(0)
    expect(result.days).toBe(29)
  })

  it('spans the leap day Feb 29', () => {
    const result = okResult('2024-02-29T00:00', '2025-02-28T00:00')
    expect(result.years).toBe(0)
    expect(result.months).toBe(11)
    expect(result.days).toBe(30)
  })
})

describe('computeDateDifference order', () => {
  it('returns the same result when start and end are swapped', () => {
    const forward = okResult('2024-01-15T10:30', '2024-03-20T09:15')
    const backward = okResult('2024-03-20T09:15', '2024-01-15T10:30')
    expect(backward).toEqual(forward)
  })

  it('returns the same result for totals when swapped', () => {
    const forward = okResult('2024-01-01T00:00', '2024-02-29T12:00')
    const backward = okResult('2024-02-29T12:00', '2024-01-01T00:00')
    expect(backward.totalSeconds).toBe(forward.totalSeconds)
  })

  it('returns all zeros for identical datetimes', () => {
    const result = okResult('2024-06-15T08:00', '2024-06-15T08:00')
    expect(result).toEqual({
      years: 0,
      months: 0,
      days: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      totalDays: 0,
    })
  })
})

describe('computeDateDifference input handling', () => {
  it('reports empty when both inputs are empty', () => {
    expect(computeDateDifference('', '')).toEqual({ status: 'empty' })
  })

  it('reports an error when only one input is given', () => {
    const output = computeDateDifference('2024-01-15T10:30', '')
    expect(output.status).toBe('error')
    if (output.status === 'error') {
      expect(output.error).toMatch(/both/i)
    }
  })

  it('reports an error for malformed input', () => {
    const output = computeDateDifference('not-a-date', '2024-01-15T10:30')
    expect(output.status).toBe('error')
  })

  it('reports an error for impossible calendar dates', () => {
    const output = computeDateDifference('2024-13-01T00:00', '2024-01-15T10:30')
    expect(output.status).toBe('error')
  })
})

describe('formatDateDifference', () => {
  it('renders the calendar difference and totals', () => {
    const result = okResult('2024-01-15T10:30', '2024-01-16T10:30')
    expect(formatDateDifference(result)).toBe(
      [
        '0 年 0 ヶ月 1 日',
        '総時間: 24 時間',
        '総分数: 1440 分',
        '総秒数: 86400 秒',
        '総日数: 1 日',
      ].join('\n'),
    )
  })
})
