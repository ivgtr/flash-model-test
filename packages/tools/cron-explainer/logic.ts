export const MAX_SEARCH_DAYS = 400
export const DEFAULT_NEXT_RUN_COUNT = 5

export type CronSchedule = {
  minute: readonly number[]
  hour: readonly number[]
  dayOfMonth: readonly number[]
  month: readonly number[]
  dayOfWeek: readonly number[]
  domRestricted: boolean
  dowRestricted: boolean
}

export type CronFieldInfo = {
  name: string
  token: string
  description: string
}

export type ParseCronResult =
  { ok: true; schedule: CronSchedule; tokens: readonly string[] } | { ok: false; error: string }

export type ExplainCronResult =
  | { ok: true; summary: string; fields: readonly CronFieldInfo[]; notes: readonly string[] }
  | { ok: false; error: string }

export type NextRunsResult =
  | { ok: true; runs: readonly Date[]; notFound: false }
  | { ok: true; runs: readonly Date[]; notFound: true }
  | { ok: false; error: string }

export type CronFieldId = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
}

const DAY_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

const MONTH_DISPLAY = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAY_DISPLAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type FieldConfig = {
  id: CronFieldId
  name: string
  min: number
  max: number
  fullCount: number
  names?: Record<string, number>
  normalize?: (value: number) => number
  every: string
  everyStep: string
  singleAt: (value: number) => string
  listAt: (values: readonly number[]) => string
  rangeThrough: (start: number, end: number) => string
  stepStart: { prefix: 'at' | 'in' | 'on'; word: (value: number) => string }
}

function joinList(parts: readonly string[]): string {
  if (parts.length <= 1) {
    return parts[0] ?? ''
  }
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]!}`
}

const MINUTE_CONFIG: FieldConfig = {
  id: 'minute',
  name: 'minute',
  min: 0,
  max: 59,
  fullCount: 60,
  every: 'Every minute',
  everyStep: 'minutes',
  singleAt: (value) => `At minute ${value}`,
  listAt: (values) => `At minutes ${joinList(values.map(String))}`,
  rangeThrough: (start, end) => `At minutes ${start} through ${end}`,
  stepStart: { prefix: 'at', word: (value) => `minute ${value}` },
}

const HOUR_CONFIG: FieldConfig = {
  id: 'hour',
  name: 'hour',
  min: 0,
  max: 23,
  fullCount: 24,
  every: 'Every hour',
  everyStep: 'hours',
  singleAt: (value) => `At hour ${value}`,
  listAt: (values) => `At hours ${joinList(values.map(String))}`,
  rangeThrough: (start, end) => `At hours ${start} through ${end}`,
  stepStart: { prefix: 'at', word: (value) => `hour ${value}` },
}

const DAY_OF_MONTH_CONFIG: FieldConfig = {
  id: 'dayOfMonth',
  name: 'day of month',
  min: 1,
  max: 31,
  fullCount: 31,
  every: 'Every day of the month',
  everyStep: 'days of the month',
  singleAt: (value) => `On day ${value}`,
  listAt: (values) => `On days ${joinList(values.map(String))}`,
  rangeThrough: (start, end) => `On days ${start} through ${end}`,
  stepStart: { prefix: 'on', word: (value) => `day ${value}` },
}

const MONTH_CONFIG: FieldConfig = {
  id: 'month',
  name: 'month',
  min: 1,
  max: 12,
  fullCount: 12,
  names: MONTH_NAMES,
  every: 'Every month',
  everyStep: 'months',
  singleAt: (value) => `In ${MONTH_DISPLAY[value - 1]!}`,
  listAt: (values) => `In ${joinList(values.map((value) => MONTH_DISPLAY[value - 1]!))}`,
  rangeThrough: (start, end) =>
    `In ${MONTH_DISPLAY[start - 1]!} through ${MONTH_DISPLAY[end - 1]!}`,
  stepStart: { prefix: 'in', word: (value) => MONTH_DISPLAY[value - 1]! },
}

const DAY_OF_WEEK_CONFIG: FieldConfig = {
  id: 'dayOfWeek',
  name: 'day of week',
  min: 0,
  max: 7,
  fullCount: 7,
  names: DAY_NAMES,
  normalize: (value) => (value === 7 ? 0 : value),
  every: 'Every day of the week',
  everyStep: 'days of the week',
  singleAt: (value) => `On ${DAY_DISPLAY[value]!}`,
  listAt: (values) => `On ${joinList(values.map((value) => DAY_DISPLAY[value]!))}`,
  rangeThrough: (start, end) => `On ${DAY_DISPLAY[start]!} through ${DAY_DISPLAY[end]!}`,
  stepStart: { prefix: 'on', word: (value) => DAY_DISPLAY[value]! },
}

const FIELD_CONFIGS: readonly FieldConfig[] = [
  MINUTE_CONFIG,
  HOUR_CONFIG,
  DAY_OF_MONTH_CONFIG,
  MONTH_CONFIG,
  DAY_OF_WEEK_CONFIG,
]

type ParsedAtom = { ok: true; values: number[] } | { ok: false; error: string }

function parseValue(raw: string, config: FieldConfig): number | null {
  if (config.names) {
    const named = config.names[raw.toUpperCase()]
    if (named !== undefined) {
      return named
    }
  }
  if (!/^\d+$/.test(raw)) {
    return null
  }
  return Number(raw)
}

function parseBase(raw: string, config: FieldConfig, originalToken: string): ParsedAtom {
  if (raw === '*') {
    const values: number[] = []
    for (let value = config.min; value <= config.max; value += 1) {
      values.push(value)
    }
    return { ok: true, values }
  }
  const dashIndex = raw.indexOf('-')
  if (dashIndex !== -1) {
    const start = parseValue(raw.slice(0, dashIndex), config)
    const end = parseValue(raw.slice(dashIndex + 1), config)
    if (start === null || end === null) {
      return {
        ok: false,
        error: `Invalid cron expression: invalid token "${originalToken}" in the ${config.name} field.`,
      }
    }
    if (start > end) {
      return {
        ok: false,
        error: `Invalid cron expression: range "${originalToken}" in the ${config.name} field has start (${start}) greater than end (${end}).`,
      }
    }
    const values: number[] = []
    for (let value = start; value <= end; value += 1) {
      values.push(value)
    }
    return { ok: true, values }
  }
  const value = parseValue(raw, config)
  if (value === null) {
    return {
      ok: false,
      error: `Invalid cron expression: invalid token "${originalToken}" in the ${config.name} field.`,
    }
  }
  return { ok: true, values: [value] }
}

function parseAtom(part: string, config: FieldConfig): ParsedAtom {
  const stepIndex = part.indexOf('/')
  if (stepIndex !== -1) {
    const baseToken = part.slice(0, stepIndex)
    const stepToken = part.slice(stepIndex + 1)
    if (baseToken === '' || !/^\d+$/.test(stepToken)) {
      return {
        ok: false,
        error: `Invalid cron expression: invalid token "${part}" in the ${config.name} field.`,
      }
    }
    const step = Number(stepToken)
    if (step < 1) {
      return {
        ok: false,
        error: `Invalid cron expression: step "${stepToken}" in the ${config.name} field must be a positive integer.`,
      }
    }
    const base = parseBase(baseToken, config, part)
    if (!base.ok) {
      return base
    }
    const start = base.values[0]!
    const end = base.values.length === 1 ? config.max : base.values[base.values.length - 1]!
    const values: number[] = []
    for (let value = start; value <= end; value += step) {
      values.push(value)
    }
    return { ok: true, values }
  }
  return parseBase(part, config, part)
}

function parseField(
  token: string,
  config: FieldConfig,
): { ok: true; values: number[] } | { ok: false; error: string } {
  const parts = token.split(',')
  if (parts.some((part) => part === '')) {
    return {
      ok: false,
      error: `Invalid cron expression: empty list item in the ${config.name} field.`,
    }
  }
  const values: number[] = []
  for (const part of parts) {
    const parsed = parseAtom(part, config)
    if (!parsed.ok) {
      return parsed
    }
    for (const value of parsed.values) {
      if (value < config.min || value > config.max) {
        return {
          ok: false,
          error: `Invalid cron expression: value ${value} is out of range for the ${config.name} field (${config.min}-${config.max}).`,
        }
      }
      values.push(config.normalize ? config.normalize(value) : value)
    }
  }
  return { ok: true, values: [...new Set(values)].sort((a, b) => a - b) }
}

export function parseCron(input: string): ParseCronResult {
  const tokens = input.trim().split(/\s+/)
  if (tokens.length === 1 && tokens[0] === '') {
    return { ok: false, error: 'Invalid cron expression: input is empty.' }
  }
  if (tokens.length !== 5) {
    return {
      ok: false,
      error: `Invalid cron expression: expected 5 fields (minute hour day-of-month month day-of-week), got ${tokens.length}.`,
    }
  }
  const minute = parseField(tokens[0]!, MINUTE_CONFIG)
  if (!minute.ok) {
    return minute
  }
  const hour = parseField(tokens[1]!, HOUR_CONFIG)
  if (!hour.ok) {
    return hour
  }
  const dayOfMonth = parseField(tokens[2]!, DAY_OF_MONTH_CONFIG)
  if (!dayOfMonth.ok) {
    return dayOfMonth
  }
  const month = parseField(tokens[3]!, MONTH_CONFIG)
  if (!month.ok) {
    return month
  }
  const dayOfWeek = parseField(tokens[4]!, DAY_OF_WEEK_CONFIG)
  if (!dayOfWeek.ok) {
    return dayOfWeek
  }
  const schedule: CronSchedule = {
    minute: minute.values,
    hour: hour.values,
    dayOfMonth: dayOfMonth.values,
    month: month.values,
    dayOfWeek: dayOfWeek.values,
    domRestricted: tokens[2] !== '*',
    dowRestricted: tokens[4] !== '*',
  }
  return { ok: true, schedule, tokens }
}

function stepOf(values: readonly number[]): number | null {
  if (values.length < 2) {
    return null
  }
  const step = values[1]! - values[0]!
  for (let index = 2; index < values.length; index += 1) {
    if (values[index]! - values[index - 1]! !== step) {
      return null
    }
  }
  return step
}

function describeField(config: FieldConfig, values: readonly number[]): string {
  if (values.length === config.fullCount) {
    return config.every
  }
  if (values.length === 1) {
    return config.singleAt(values[0]!)
  }
  const step = stepOf(values)
  if (step === 1) {
    if (values.length >= 3) {
      return config.rangeThrough(values[0]!, values[values.length - 1]!)
    }
    return config.listAt(values)
  }
  if (step !== null && values.length >= 3) {
    const base = `Every ${step} ${config.everyStep}`
    if (values[0]! > config.min) {
      return `${base}, starting ${config.stepStart.prefix} ${config.stepStart.word(values[0]!)}`
    }
    return base
  }
  return config.listAt(values)
}

export function explainCron(input: string): ExplainCronResult {
  const parsed = parseCron(input)
  if (!parsed.ok) {
    return parsed
  }
  const fields: readonly CronFieldInfo[] = FIELD_CONFIGS.map((config, index) => ({
    name: config.name,
    token: parsed.tokens[index]!,
    description: describeField(config, parsed.schedule[config.id]),
  }))
  const notes: string[] = []
  if (parsed.schedule.domRestricted && parsed.schedule.dowRestricted) {
    notes.push(
      'Both the day-of-month and day-of-week fields are restricted. Per standard cron convention they are evaluated with OR logic, so a run occurs when either field matches.',
    )
  }
  if (parsed.schedule.domRestricted && parsed.schedule.dayOfMonth.some((value) => value >= 29)) {
    notes.push(
      'Days 29-31 do not exist in every month; months without the matching day are skipped.',
    )
  }
  const summary = `Runs ${fields
    .map((field) => field.description[0]!.toLowerCase() + field.description.slice(1))
    .join(', ')}.`
  return { ok: true, summary, fields, notes }
}

export function nextRuns(input: string, from: Date, count: number): NextRunsResult {
  if (count < 1) {
    return { ok: false, error: 'Invalid request: count must be at least 1.' }
  }
  const parsed = parseCron(input)
  if (!parsed.ok) {
    return parsed
  }
  const { schedule } = parsed
  const fromMs = from.getTime()
  const limitMs = fromMs + MAX_SEARCH_DAYS * 86_400_000
  const runs: Date[] = []
  for (let dayOffset = 0; dayOffset <= MAX_SEARCH_DAYS; dayOffset += 1) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + dayOffset)
    if (day.getTime() > limitMs) {
      break
    }
    if (!schedule.month.includes(day.getMonth() + 1)) {
      continue
    }
    const domMatches = schedule.dayOfMonth.includes(day.getDate())
    const dowMatches = schedule.dayOfWeek.includes(day.getDay())
    const dayMatches =
      schedule.domRestricted && schedule.dowRestricted
        ? domMatches || dowMatches
        : schedule.domRestricted
          ? domMatches
          : schedule.dowRestricted
            ? dowMatches
            : true
    if (!dayMatches) {
      continue
    }
    for (const hour of schedule.hour) {
      for (const minute of schedule.minute) {
        const candidate = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          hour,
          minute,
          0,
          0,
        )
        if (candidate.getTime() <= fromMs || candidate.getTime() > limitMs) {
          continue
        }
        runs.push(candidate)
        if (runs.length >= count) {
          return { ok: true, runs, notFound: false }
        }
      }
    }
  }
  return runs.length > 0 ? { ok: true, runs, notFound: false } : { ok: true, runs, notFound: true }
}

export function formatRun(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}
