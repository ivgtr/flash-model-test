import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NEXT_RUN_COUNT,
  MAX_SEARCH_DAYS,
  explainCron,
  formatRun,
  nextRuns,
  parseCron,
} from './logic'

function descriptionOf(input: string, index: number): string {
  const result = explainCron(input)
  if (!result.ok) {
    throw new Error(`expected valid cron, got: ${result.error}`)
  }
  return result.fields[index]!.description
}

describe('parseCron', () => {
  it('parses a valid five-field cron expression into a typed schedule', () => {
    const result = parseCron('*/15 9 1,15 3-5 MON-FRI')
    expect(result).toEqual({
      ok: true,
      tokens: ['*/15', '9', '1,15', '3-5', 'MON-FRI'],
      schedule: {
        minute: [0, 15, 30, 45],
        hour: [9],
        dayOfMonth: [1, 15],
        month: [3, 4, 5],
        dayOfWeek: [1, 2, 3, 4, 5],
        domRestricted: true,
        dowRestricted: true,
      },
    })
  })

  it('marks unrestricted day fields', () => {
    const result = parseCron('* * * * *')
    expect(result).toEqual({
      ok: true,
      tokens: ['*', '*', '*', '*', '*'],
      schedule: {
        minute: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
          47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
        ],
        hour: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
        ],
        dayOfMonth: [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
          26, 27, 28, 29, 30, 31,
        ],
        month: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
        domRestricted: false,
        dowRestricted: false,
      },
    })
  })

  it('treats day-of-week 7 as Sunday', () => {
    const sunday = parseCron('0 0 * * 7')
    expect(sunday.ok).toBe(true)
    if (sunday.ok) {
      expect(sunday.schedule.dayOfWeek).toEqual([0])
      expect(sunday.schedule.dowRestricted).toBe(true)
    }
    const week = parseCron('0 0 * * 0-7')
    expect(week.ok).toBe(true)
    if (week.ok) {
      expect(week.schedule.dayOfWeek).toEqual([0, 1, 2, 3, 4, 5, 6])
    }
  })

  it('reports an error for empty input', () => {
    expect(parseCron('')).toEqual({ ok: false, error: 'Invalid cron expression: input is empty.' })
    expect(parseCron('   \t  ')).toEqual({
      ok: false,
      error: 'Invalid cron expression: input is empty.',
    })
  })

  it('reports an error for a wrong number of fields', () => {
    expect(parseCron('* * * *')).toEqual({
      ok: false,
      error:
        'Invalid cron expression: expected 5 fields (minute hour day-of-month month day-of-week), got 4.',
    })
    expect(parseCron('* * * * * *')).toEqual({
      ok: false,
      error:
        'Invalid cron expression: expected 5 fields (minute hour day-of-month month day-of-week), got 6.',
    })
  })

  it('reports values out of range', () => {
    expect(parseCron('60 * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: value 60 is out of range for the minute field (0-59).',
    })
    expect(parseCron('* 24 * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: value 24 is out of range for the hour field (0-23).',
    })
    expect(parseCron('* * 32 * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: value 32 is out of range for the day of month field (1-31).',
    })
    expect(parseCron('* * * 13 *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: value 13 is out of range for the month field (1-12).',
    })
    expect(parseCron('* * * * 8')).toEqual({
      ok: false,
      error: 'Invalid cron expression: value 8 is out of range for the day of week field (0-7).',
    })
    expect(parseCron('* * 0 * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: value 0 is out of range for the day of month field (1-31).',
    })
  })

  it('reports zero steps', () => {
    expect(parseCron('*/0 * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: step "0" in the minute field must be a positive integer.',
    })
    expect(parseCron('* * * * */0')).toEqual({
      ok: false,
      error:
        'Invalid cron expression: step "0" in the day of week field must be a positive integer.',
    })
    expect(parseCron('10-20/0 * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: step "0" in the minute field must be a positive integer.',
    })
    expect(parseCron('5/0 * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: step "0" in the minute field must be a positive integer.',
    })
  })

  it('reports ranges whose start exceeds the end', () => {
    expect(parseCron('5-2 * * * *')).toEqual({
      ok: false,
      error:
        'Invalid cron expression: range "5-2" in the minute field has start (5) greater than end (2).',
    })
    expect(parseCron('* * * * FRI-MON')).toEqual({
      ok: false,
      error:
        'Invalid cron expression: range "FRI-MON" in the day of week field has start (5) greater than end (1).',
    })
  })

  it('reports invalid tokens', () => {
    expect(parseCron('x * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: invalid token "x" in the minute field.',
    })
    expect(parseCron('*/x * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: invalid token "*/x" in the minute field.',
    })
    expect(parseCron('/5 * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: invalid token "/5" in the minute field.',
    })
    expect(parseCron('1,,2 * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: empty list item in the minute field.',
    })
    expect(parseCron('a-b * * * *')).toEqual({
      ok: false,
      error: 'Invalid cron expression: invalid token "a-b" in the minute field.',
    })
  })
})

describe('explainCron', () => {
  it('explains star fields', () => {
    const result = explainCron('* * * * *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.fields.map((field) => field.description)).toEqual([
        'Every minute',
        'Every hour',
        'Every day of the month',
        'Every month',
        'Every day of the week',
      ])
      expect(result.summary).toBe(
        'Runs every minute, every hour, every day of the month, every month, every day of the week.',
      )
    }
  })

  it('explains numeric values', () => {
    expect(descriptionOf('15 9 5 3 1', 0)).toBe('At minute 15')
    expect(descriptionOf('15 9 5 3 1', 1)).toBe('At hour 9')
    expect(descriptionOf('15 9 5 3 1', 2)).toBe('On day 5')
    expect(descriptionOf('15 9 5 3 1', 3)).toBe('In March')
    expect(descriptionOf('15 9 5 3 1', 4)).toBe('On Monday')
  })

  it('explains ranges', () => {
    expect(descriptionOf('10-20 * * * *', 0)).toBe('At minutes 10 through 20')
    expect(descriptionOf('* 9-17 * * *', 1)).toBe('At hours 9 through 17')
    expect(descriptionOf('* * 10-20 * *', 2)).toBe('On days 10 through 20')
    expect(descriptionOf('* * * 3-5 *', 3)).toBe('In March through May')
    expect(descriptionOf('* * * * 1-5', 4)).toBe('On Monday through Friday')
  })

  it('explains lists', () => {
    expect(descriptionOf('1,7,13 * * * *', 0)).toBe('Every 6 minutes, starting at minute 1')
    expect(descriptionOf('* 1,12 * * *', 1)).toBe('At hours 1 and 12')
    expect(descriptionOf('* * 5,20 * *', 2)).toBe('On days 5 and 20')
    expect(descriptionOf('* * * 1,6,12 *', 3)).toBe('In January, June and December')
    expect(descriptionOf('* * * * SUN,SAT', 4)).toBe('On Sunday and Saturday')
  })

  it('explains steps', () => {
    expect(descriptionOf('*/15 * * * *', 0)).toBe('Every 15 minutes')
    expect(descriptionOf('10-20/5 * * * *', 0)).toBe('Every 5 minutes, starting at minute 10')
    expect(descriptionOf('5/15 * * * *', 0)).toBe('Every 15 minutes, starting at minute 5')
    expect(descriptionOf('* */2 * * *', 1)).toBe('Every 2 hours')
    expect(descriptionOf('* * */5 * *', 2)).toBe('Every 5 days of the month')
    expect(descriptionOf('* * * 3/3 *', 3)).toBe('Every 3 months, starting in March')
    expect(descriptionOf('* * * * */2', 4)).toBe('Every 2 days of the week')
  })

  it('explains month and day-of-week names case-insensitively', () => {
    expect(descriptionOf('0 0 * jan sun', 3)).toBe('In January')
    expect(descriptionOf('0 0 * jan sun', 4)).toBe('On Sunday')
    expect(descriptionOf('0 0 * JaN Mon', 3)).toBe('In January')
    expect(descriptionOf('0 0 * JaN Mon', 4)).toBe('On Monday')
    expect(descriptionOf('0 0 * DEC SAT', 3)).toBe('In December')
    expect(descriptionOf('0 0 * DEC SAT', 4)).toBe('On Saturday')
  })

  it('explains day-of-week 7 as Sunday', () => {
    expect(descriptionOf('0 0 * * 7', 4)).toBe('On Sunday')
    expect(descriptionOf('0 0 * * 0-7', 4)).toBe('Every day of the week')
  })

  it('keeps the original tokens in the field info', () => {
    const result = explainCron('*/15 9 * * 1-5')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.fields.map((field) => field.token)).toEqual(['*/15', '9', '*', '*', '1-5'])
      expect(result.fields.map((field) => field.name)).toEqual([
        'minute',
        'hour',
        'day of month',
        'month',
        'day of week',
      ])
    }
  })

  it('builds a summary sentence', () => {
    const result = explainCron('*/15 9 * * 1-5')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.summary).toBe(
        'Runs every 15 minutes, at hour 9, every day of the month, every month, on Monday through Friday.',
      )
    }
  })

  it('notes OR semantics when both the day-of-month and day-of-week fields are restricted', () => {
    const or = explainCron('0 0 1 * 1')
    expect(or.ok).toBe(true)
    if (or.ok) {
      expect(or.notes).toHaveLength(1)
      expect(or.notes[0]).toMatch(/OR/)
    }
    const domOnly = explainCron('0 0 1 * *')
    expect(domOnly.ok).toBe(true)
    if (domOnly.ok) {
      expect(domOnly.notes).toEqual([])
    }
    const dowOnly = explainCron('0 0 * * 1')
    expect(dowOnly.ok).toBe(true)
    if (dowOnly.ok) {
      expect(dowOnly.notes).toEqual([])
    }
  })

  it('notes that non-existent days are skipped', () => {
    const result = explainCron('0 0 31 * *')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.notes.some((note) => note.includes('29-31'))).toBe(true)
    }
    const noNote = explainCron('0 0 15 * *')
    expect(noNote.ok).toBe(true)
    if (noNote.ok) {
      expect(noNote.notes).toEqual([])
    }
  })

  it('reports errors for invalid cron expressions', () => {
    const result = explainCron('60 * * * *')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/out of range/)
    }
  })
})

describe('nextRuns', () => {
  it('computes the next five run times for a fixed schedule from an injected date', () => {
    const result = nextRuns('0 9 * * 1-5', new Date(2026, 7, 9, 23, 0), 5)
    expect(result).toEqual({
      ok: true,
      notFound: false,
      runs: [
        new Date(2026, 7, 10, 9, 0),
        new Date(2026, 7, 11, 9, 0),
        new Date(2026, 7, 12, 9, 0),
        new Date(2026, 7, 13, 9, 0),
        new Date(2026, 7, 14, 9, 0),
      ],
    })
  })

  it('starts strictly after the injected time', () => {
    const result = nextRuns('* * * * *', new Date(2026, 7, 10, 9, 58, 30), 5)
    expect(result).toEqual({
      ok: true,
      notFound: false,
      runs: [
        new Date(2026, 7, 10, 9, 59),
        new Date(2026, 7, 10, 10, 0),
        new Date(2026, 7, 10, 10, 1),
        new Date(2026, 7, 10, 10, 2),
        new Date(2026, 7, 10, 10, 3),
      ],
    })
  })

  it('honours an explicit count', () => {
    const result = nextRuns('0 9 * * *', new Date(2026, 7, 9, 23, 0), 3)
    expect(result).toEqual({
      ok: true,
      notFound: false,
      runs: [new Date(2026, 7, 10, 9, 0), new Date(2026, 7, 11, 9, 0), new Date(2026, 7, 12, 9, 0)],
    })
  })

  it('evaluates restricted day-of-month and day-of-week as OR', () => {
    const result = nextRuns('0 0 1 * 1', new Date(2026, 7, 30, 0, 0), 5)
    expect(result).toEqual({
      ok: true,
      notFound: false,
      runs: [
        new Date(2026, 7, 31, 0, 0),
        new Date(2026, 8, 1, 0, 0),
        new Date(2026, 8, 7, 0, 0),
        new Date(2026, 8, 14, 0, 0),
        new Date(2026, 8, 21, 0, 0),
      ],
    })
  })

  it('skips months that do not have day 31', () => {
    const result = nextRuns('0 0 31 * *', new Date(2026, 0, 31, 0, 30), 5)
    expect(result).toEqual({
      ok: true,
      notFound: false,
      runs: [
        new Date(2026, 2, 31, 0, 0),
        new Date(2026, 4, 31, 0, 0),
        new Date(2026, 6, 31, 0, 0),
        new Date(2026, 7, 31, 0, 0),
        new Date(2026, 9, 31, 0, 0),
      ],
    })
  })

  it('handles leap-year February 29', () => {
    const leapAhead = nextRuns('0 0 29 2 *', new Date(2027, 5, 15, 9, 0), 5)
    expect(leapAhead).toEqual({
      ok: true,
      notFound: false,
      runs: [new Date(2028, 1, 29, 0, 0)],
    })
    const onLeapYear = nextRuns('0 0 29 2 *', new Date(2028, 1, 28, 12, 0), 5)
    expect(onLeapYear).toEqual({
      ok: true,
      notFound: false,
      runs: [new Date(2028, 1, 29, 0, 0)],
    })
  })

  it('reports when no run exists within 400 days', () => {
    const never = nextRuns('0 0 30 2 *', new Date(2026, 0, 1, 0, 0), 5)
    expect(never).toEqual({ ok: true, runs: [], notFound: true })
    const pastLeap = nextRuns('0 0 29 2 *', new Date(2024, 2, 1, 0, 0), 5)
    expect(pastLeap).toEqual({ ok: true, runs: [], notFound: true })
  })

  it('finds a run nearly a year away when within 400 days', () => {
    const result = nextRuns('0 0 1 1 *', new Date(2026, 7, 9, 23, 0), 5)
    expect(result).toEqual({
      ok: true,
      notFound: false,
      runs: [new Date(2027, 0, 1, 0, 0)],
    })
  })

  it('returns a parse error for invalid input', () => {
    const result = nextRuns('60 * * * *', new Date(2026, 7, 9, 23, 0), 5)
    expect(result).toEqual({
      ok: false,
      error: 'Invalid cron expression: value 60 is out of range for the minute field (0-59).',
    })
  })

  it('rejects a non-positive count', () => {
    const result = nextRuns('* * * * *', new Date(2026, 7, 9, 23, 0), 0)
    expect(result).toEqual({
      ok: false,
      error: 'Invalid request: count must be at least 1.',
    })
  })
})

describe('formatRun', () => {
  it('formats run times deterministically without locale dependence', () => {
    expect(formatRun(new Date(2026, 7, 10, 9, 5))).toBe('2026-08-10 09:05')
    expect(formatRun(new Date(2027, 11, 31, 23, 59))).toBe('2027-12-31 23:59')
  })
})

describe('constants', () => {
  it('exposes the 400-day search bound and the default run count', () => {
    expect(MAX_SEARCH_DAYS).toBe(400)
    expect(DEFAULT_NEXT_RUN_COUNT).toBe(5)
  })
})
