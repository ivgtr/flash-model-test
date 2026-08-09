export type NumberStyle = 'decimal' | 'percent' | 'currency'

export interface NumberFormatOptions {
  locale: string
  style: NumberStyle
  currency: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping: boolean
  prefix: string
  suffix: string
}

export type NumberFormatResult = { ok: true; output: string } | { ok: false; error: string }

export const DEFAULT_LOCALE = 'en-US'
export const DEFAULT_STYLE: NumberStyle = 'decimal'
export const DEFAULT_CURRENCY = 'USD'
export const FRACTION_DIGITS_MIN = 0
export const FRACTION_DIGITS_MAX = 6
export const AUTO_FRACTION_DIGITS = 'auto'

export const LOCALE_OPTIONS = [
  'en-US',
  'ja-JP',
  'de-DE',
  'fr-FR',
  'zh-CN',
  'es-ES',
  'pt-BR',
  'it-IT',
  'ko-KR',
] as const

export const STYLE_OPTIONS: readonly NumberStyle[] = ['decimal', 'percent', 'currency']

export const CURRENCY_OPTIONS = [
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'CNY',
  'KRW',
  'INR',
  'AUD',
  'CAD',
  'CHF',
  'BRL',
  'MXN',
] as const

export function parseStyle(value: string): NumberStyle | null {
  if (value === 'decimal' || value === 'percent' || value === 'currency') {
    return value
  }
  return null
}

export function parseFractionDigits(value: string): number | null {
  if (value === '' || value === AUTO_FRACTION_DIGITS) {
    return null
  }
  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed >= FRACTION_DIGITS_MIN && parsed <= FRACTION_DIGITS_MAX) {
    return parsed
  }
  return null
}

function isValidLocale(locale: string): boolean {
  if (locale === '') {
    return false
  }
  try {
    return Intl.NumberFormat.supportedLocalesOf([locale]).length > 0
  } catch {
    return false
  }
}

function isValidCurrency(currency: string): boolean {
  if (!/^[A-Z]{3}$/.test(currency)) {
    return false
  }
  return Intl.supportedValuesOf('currency').includes(currency)
}

function isValidFractionDigits(value: number | undefined): boolean {
  if (value === undefined) {
    return true
  }
  return Number.isInteger(value) && value >= FRACTION_DIGITS_MIN && value <= FRACTION_DIGITS_MAX
}

export function formatNumber(input: string, options: NumberFormatOptions): NumberFormatResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  if (!isValidLocale(options.locale)) {
    return { ok: false, error: `Invalid locale: "${options.locale}".` }
  }
  if (options.style === 'currency' && !isValidCurrency(options.currency)) {
    return { ok: false, error: `Invalid currency code: "${options.currency}".` }
  }
  if (
    !isValidFractionDigits(options.minimumFractionDigits) ||
    !isValidFractionDigits(options.maximumFractionDigits)
  ) {
    return { ok: false, error: 'Fraction digits must be integers between 0 and 6.' }
  }
  if (
    options.minimumFractionDigits !== undefined &&
    options.maximumFractionDigits !== undefined &&
    options.minimumFractionDigits > options.maximumFractionDigits
  ) {
    return { ok: false, error: 'Minimum fraction digits cannot exceed maximum fraction digits.' }
  }

  const value = Number(input)
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return { ok: false, error: 'Invalid number: expected a finite numeric value.' }
  }

  let formatted: string
  try {
    formatted = new Intl.NumberFormat(options.locale, {
      style: options.style,
      currency: options.style === 'currency' ? options.currency.toUpperCase() : undefined,
      minimumFractionDigits: options.minimumFractionDigits,
      maximumFractionDigits: options.maximumFractionDigits,
      useGrouping: options.useGrouping,
    }).format(value)
  } catch {
    return { ok: false, error: 'Invalid number format options.' }
  }

  return { ok: true, output: `${options.prefix}${formatted}${options.suffix}` }
}
