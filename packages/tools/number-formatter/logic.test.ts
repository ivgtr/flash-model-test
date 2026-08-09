import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  DEFAULT_STYLE,
  FRACTION_DIGITS_MAX,
  FRACTION_DIGITS_MIN,
  LOCALE_OPTIONS,
  STYLE_OPTIONS,
  formatNumber,
  parseFractionDigits,
  parseStyle,
  type NumberFormatOptions,
} from './logic'

const BASE_OPTIONS: NumberFormatOptions = {
  locale: 'en-US',
  style: 'decimal',
  currency: 'USD',
  useGrouping: true,
  prefix: '',
  suffix: '',
}

function format(input: string, overrides: Partial<NumberFormatOptions> = {}) {
  return formatNumber(input, { ...BASE_OPTIONS, ...overrides })
}

describe('formatNumber', () => {
  it('formats with locale-specific grouping and separators', () => {
    expect(format('1234.5', { locale: 'en-US' })).toEqual({ ok: true, output: '1,234.5' })
    expect(format('1234.5', { locale: 'de-DE' })).toEqual({ ok: true, output: '1.234,5' })
    expect(format('1234.5', { locale: 'ja-JP' })).toEqual({ ok: true, output: '1,234.5' })
  })

  it('matches Intl.NumberFormat for other supported locales', () => {
    for (const locale of ['fr-FR', 'zh-CN', 'es-ES', 'pt-BR', 'ko-KR'] as const) {
      const expected = new Intl.NumberFormat(locale, { useGrouping: true }).format(1234.5)
      expect(format('1234.5', { locale })).toEqual({ ok: true, output: expected })
    }
  })

  it('treats locale tags case-insensitively', () => {
    const upper = format('1234.5', { locale: 'EN-US' })
    const lower = format('1234.5', { locale: 'en-us' })
    expect(upper).toEqual({ ok: true, output: '1,234.5' })
    expect(lower).toEqual({ ok: true, output: '1,234.5' })
  })

  it('formats percentages by treating the input as a ratio', () => {
    expect(format('0.25', { style: 'percent' })).toEqual({ ok: true, output: '25%' })
    expect(format('0.5', { style: 'percent' })).toEqual({ ok: true, output: '50%' })
    expect(format('1', { style: 'percent' })).toEqual({ ok: true, output: '100%' })
    expect(format('0.335', { style: 'percent' })).toEqual({ ok: true, output: '34%' })
  })

  it('formats percentages with explicit fraction digits', () => {
    expect(
      format('0.335', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    ).toEqual({ ok: true, output: '33.5%' })
  })

  it('formats currencies with locale defaults', () => {
    expect(format('42', { style: 'currency', currency: 'USD' })).toEqual({
      ok: true,
      output: '$42.00',
    })
    expect(format('1000', { style: 'currency', currency: 'JPY' })).toEqual({
      ok: true,
      output: '¥1,000',
    })
  })

  it('follows Intl.NumberFormat for currency style across locales', () => {
    for (const [locale, currency] of [
      ['de-DE', 'EUR'],
      ['ja-JP', 'JPY'],
      ['fr-FR', 'EUR'],
    ] as const) {
      const expected = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(1234.5)
      expect(format('1234.5', { locale, style: 'currency', currency })).toEqual({
        ok: true,
        output: expected,
      })
    }
  })

  it('lets explicit fraction digits override currency defaults', () => {
    expect(
      format('1000', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ).toEqual({ ok: true, output: '¥1,000.00' })
  })

  it('applies minimum and maximum fraction digits', () => {
    expect(format('3.14159', { maximumFractionDigits: 2 })).toEqual({ ok: true, output: '3.14' })
    expect(format('3.1', { minimumFractionDigits: 2 })).toEqual({ ok: true, output: '3.10' })
    expect(format('3.14159', { minimumFractionDigits: 2, maximumFractionDigits: 3 })).toEqual({
      ok: true,
      output: '3.142',
    })
  })

  it('supports grouping off', () => {
    expect(format('1234.5', { useGrouping: false })).toEqual({ ok: true, output: '1234.5' })
    expect(format('1234.5', { style: 'currency', currency: 'USD', useGrouping: false })).toEqual({
      ok: true,
      output: '$1234.50',
    })
  })

  it('adds a prefix and suffix', () => {
    expect(format('1234.5', { prefix: 'Total: ', suffix: ' USD' })).toEqual({
      ok: true,
      output: 'Total: 1,234.5 USD',
    })
  })

  it('formats negative, decimal, and large numbers', () => {
    expect(format('-42.5')).toEqual({ ok: true, output: '-42.5' })
    expect(format('.5')).toEqual({ ok: true, output: '0.5' })
    expect(format('123456789012345')).toEqual({ ok: true, output: '123,456,789,012,345' })
  })

  it('interprets leading zeros as a number', () => {
    expect(format('007')).toEqual({ ok: true, output: '7' })
    expect(format('007.5')).toEqual({ ok: true, output: '7.5' })
  })

  it('reports an error for empty or whitespace-only input', () => {
    expect(format('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(format('   ')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(format('\n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for unparsable input', () => {
    expect(format('abc')).toEqual({
      ok: false,
      error: 'Invalid number: expected a finite numeric value.',
    })
    expect(format('12abc')).toEqual({
      ok: false,
      error: 'Invalid number: expected a finite numeric value.',
    })
    expect(format('1,234')).toEqual({
      ok: false,
      error: 'Invalid number: expected a finite numeric value.',
    })
  })

  it('reports an error for NaN and Infinity', () => {
    expect(format('NaN')).toEqual({
      ok: false,
      error: 'Invalid number: expected a finite numeric value.',
    })
    expect(format('Infinity')).toEqual({
      ok: false,
      error: 'Invalid number: expected a finite numeric value.',
    })
    expect(format('-Infinity')).toEqual({
      ok: false,
      error: 'Invalid number: expected a finite numeric value.',
    })
    expect(format('1e999')).toEqual({
      ok: false,
      error: 'Invalid number: expected a finite numeric value.',
    })
  })

  it('reports an error for invalid locales', () => {
    expect(format('1234', { locale: 'en_US' })).toEqual({
      ok: false,
      error: 'Invalid locale: "en_US".',
    })
    expect(format('1234', { locale: 'not-a-locale' })).toEqual({
      ok: false,
      error: 'Invalid locale: "not-a-locale".',
    })
    expect(format('1234', { locale: 'xx-XX' })).toEqual({
      ok: false,
      error: 'Invalid locale: "xx-XX".',
    })
    expect(format('1234', { locale: '' })).toEqual({ ok: false, error: 'Invalid locale: "".' })
  })

  it('reports an error for invalid currency codes in currency style', () => {
    expect(format('42', { style: 'currency', currency: 'US' })).toEqual({
      ok: false,
      error: 'Invalid currency code: "US".',
    })
    expect(format('42', { style: 'currency', currency: 'DOLLAR' })).toEqual({
      ok: false,
      error: 'Invalid currency code: "DOLLAR".',
    })
    expect(format('42', { style: 'currency', currency: 'XYZ' })).toEqual({
      ok: false,
      error: 'Invalid currency code: "XYZ".',
    })
  })

  it('ignores the currency code in non-currency styles', () => {
    expect(format('1234.5', { currency: 'US' })).toEqual({ ok: true, output: '1,234.5' })
    expect(format('0.25', { style: 'percent', currency: 'US' })).toEqual({
      ok: true,
      output: '25%',
    })
  })

  it('reports an error for fraction digits outside 0-6', () => {
    expect(format('1.5', { minimumFractionDigits: 7 })).toEqual({
      ok: false,
      error: 'Fraction digits must be integers between 0 and 6.',
    })
    expect(format('1.5', { maximumFractionDigits: -1 })).toEqual({
      ok: false,
      error: 'Fraction digits must be integers between 0 and 6.',
    })
    expect(format('1.5', { maximumFractionDigits: 2.5 })).toEqual({
      ok: false,
      error: 'Fraction digits must be integers between 0 and 6.',
    })
  })

  it('reports an error when minimum exceeds maximum fraction digits', () => {
    expect(format('1.5', { minimumFractionDigits: 3, maximumFractionDigits: 2 })).toEqual({
      ok: false,
      error: 'Minimum fraction digits cannot exceed maximum fraction digits.',
    })
  })

  it('formats with a minimum-only fraction digit bound', () => {
    expect(format('3.1', { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toEqual({
      ok: true,
      output: '3.10',
    })
  })
})

describe('parseStyle', () => {
  it('parses supported styles', () => {
    expect(parseStyle('decimal')).toBe('decimal')
    expect(parseStyle('percent')).toBe('percent')
    expect(parseStyle('currency')).toBe('currency')
  })

  it('returns null for unsupported values', () => {
    expect(parseStyle('binary')).toBeNull()
    expect(parseStyle('')).toBeNull()
  })

  it('exposes supported style options', () => {
    expect(STYLE_OPTIONS).toEqual(['decimal', 'percent', 'currency'])
  })
})

describe('parseFractionDigits', () => {
  it('parses digits within the supported range', () => {
    expect(parseFractionDigits('0')).toBe(0)
    expect(parseFractionDigits('3')).toBe(3)
    expect(parseFractionDigits('6')).toBe(6)
  })

  it('returns null for out-of-range or non-numeric values', () => {
    expect(parseFractionDigits('7')).toBeNull()
    expect(parseFractionDigits('-1')).toBeNull()
    expect(parseFractionDigits('abc')).toBeNull()
    expect(parseFractionDigits('')).toBeNull()
  })

  it('returns null for the auto sentinel', () => {
    expect(parseFractionDigits('auto')).toBeNull()
  })

  it('exposes the fraction digit bounds', () => {
    expect(FRACTION_DIGITS_MIN).toBe(0)
    expect(FRACTION_DIGITS_MAX).toBe(6)
  })
})

describe('constants', () => {
  it('exposes default option values', () => {
    expect(DEFAULT_LOCALE).toBe('en-US')
    expect(DEFAULT_STYLE).toBe('decimal')
    expect(DEFAULT_CURRENCY).toBe('USD')
  })

  it('offers Intl-supported locales', () => {
    for (const locale of LOCALE_OPTIONS) {
      expect(Intl.NumberFormat.supportedLocalesOf([locale])).toContain(locale)
    }
  })
})
