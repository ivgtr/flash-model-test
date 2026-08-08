export interface DateTimeFields {
  year: number
  month: number
  date: number
  hours: number
  minutes: number
}

export interface DateDifferenceResult {
  years: number
  months: number
  days: number
  totalHours: number
  totalMinutes: number
  totalSeconds: number
  totalDays: number
}

export type DateDifferenceOutput =
  | { status: 'empty' }
  | { status: 'error'; error: string }
  | { status: 'ok'; result: DateDifferenceResult }

const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

function parseUtcFields(value: string): DateTimeFields | null {
  if (!DATETIME_LOCAL_PATTERN.test(value)) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth(),
    date: parsed.getUTCDate(),
    hours: parsed.getUTCHours(),
    minutes: parsed.getUTCMinutes(),
  }
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (month === 1 && isLeapYear(year)) {
    return 29
  }
  return days[month] as number
}

function toUtcMillis(fields: DateTimeFields): number {
  return Date.UTC(fields.year + 400, fields.month, fields.date, fields.hours, fields.minutes)
}

function computeCalendarDifference(
  earlier: DateTimeFields,
  later: DateTimeFields,
): { years: number; months: number; days: number } {
  let years = later.year - earlier.year
  let months = later.month - earlier.month
  let days = later.date - earlier.date
  if (days < 0) {
    months -= 1
    days += daysInMonth(later.year, (later.month - 1 + 12) % 12)
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { years, months, days }
}

export function computeDateDifference(start: string, end: string): DateDifferenceOutput {
  const trimmedStart = start.trim()
  const trimmedEnd = end.trim()

  if (trimmedStart === '' && trimmedEnd === '') {
    return { status: 'empty' }
  }
  if (trimmedStart === '' || trimmedEnd === '') {
    return { status: 'error', error: 'Both start and end are required.' }
  }

  const startFields = parseUtcFields(trimmedStart)
  const endFields = parseUtcFields(trimmedEnd)
  if (startFields === null || endFields === null) {
    return { status: 'error', error: 'Invalid date format.' }
  }

  const [earlier, later] =
    toUtcMillis(startFields) <= toUtcMillis(endFields)
      ? [startFields, endFields]
      : [endFields, startFields]

  const calendar = computeCalendarDifference(earlier, later)
  const totalSeconds = Math.floor((toUtcMillis(later) - toUtcMillis(earlier)) / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)

  return {
    status: 'ok',
    result: {
      ...calendar,
      totalHours,
      totalMinutes,
      totalSeconds,
      totalDays: Math.floor(totalHours / 24),
    },
  }
}

export function formatDateDifference(result: DateDifferenceResult): string {
  return [
    `${result.years} 年 ${result.months} ヶ月 ${result.days} 日`,
    `総時間: ${result.totalHours} 時間`,
    `総分数: ${result.totalMinutes} 分`,
    `総秒数: ${result.totalSeconds} 秒`,
    `総日数: ${result.totalDays} 日`,
  ].join('\n')
}
