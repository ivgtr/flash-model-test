export interface TimestampInfo {
  seconds: number
  milliseconds: number
  local: string
  utc: string
}

export type TimestampResult = { ok: true; output: TimestampInfo } | { ok: false; error: string }

const pad = (n: number): string => n.toString().padStart(2, '0')

export function formatTimestampInfo(date: Date): TimestampInfo {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    milliseconds: date.getTime(),
    local: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    utc: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`,
  }
}

const TIMESTAMP_PATTERN = /^(0|\d{10}|\d{13})$/

export function parseTimestamp(input: string): TimestampResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Enter a Unix timestamp first.' }
  }
  if (!TIMESTAMP_PATTERN.test(input)) {
    return {
      ok: false,
      error: 'Invalid timestamp: enter 10 digits (seconds) or 13 digits (milliseconds).',
    }
  }
  const milliseconds = input.length === 13 ? Number(input) : Number(input) * 1000
  return { ok: true, output: formatTimestampInfo(new Date(milliseconds)) }
}

export function dateToTimestamp(input: string): TimestampResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Enter a date and time first.' }
  }
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: 'Invalid date and time.' }
  }
  return { ok: true, output: formatTimestampInfo(date) }
}
