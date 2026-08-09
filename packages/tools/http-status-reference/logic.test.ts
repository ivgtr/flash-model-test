import { describe, expect, it } from 'vitest'
import {
  STATUS_CODE_CATEGORIES,
  STATUS_CODE_CATEGORY_LABELS,
  STATUS_CODES,
  searchStatusCodes,
  type StatusCategory,
} from './logic'

describe('searchStatusCodes', () => {
  it('finds entries by exact code number', () => {
    expect(searchStatusCodes('404', null).map((entry) => entry.code)).toEqual([404])
    expect(searchStatusCodes('200', null).map((entry) => entry.code)).toEqual([200])
    expect(searchStatusCodes('301', null).map((entry) => entry.code)).toEqual([301])
    expect(searchStatusCodes('500', null).map((entry) => entry.code)).toEqual([500])
  })

  it('finds entries by partial code number', () => {
    const results = searchStatusCodes('30', null)
    expect(results.some((entry) => entry.code === 301)).toBe(true)
    expect(results.some((entry) => entry.code === 302)).toBe(true)
    expect(results.some((entry) => entry.code === 304)).toBe(true)
    expect(results.every((entry) => entry.code >= 300 && entry.code < 400)).toBe(true)
  })

  it('searches by name ignoring case', () => {
    expect(searchStatusCodes('not found', null).map((entry) => entry.code)).toEqual([404])
    expect(searchStatusCodes('Not Found', null).map((entry) => entry.code)).toEqual([404])
    expect(searchStatusCodes('NOT FOUND', null).map((entry) => entry.code)).toEqual([404])
    expect(searchStatusCodes('internal server error', null).map((entry) => entry.code)).toEqual([
      500,
    ])
    expect(searchStatusCodes('INTERNAL', null).map((entry) => entry.code)).toEqual([500])
  })

  it('supports mixed numeric and alphabetic queries', () => {
    expect(searchStatusCodes('404 not', null).map((entry) => entry.code)).toEqual([404])
    expect(searchStatusCodes('too many', null).map((entry) => entry.code)).toEqual([429])
    expect(searchStatusCodes('forbidden', null).map((entry) => entry.code)).toEqual([403])
  })

  it('returns all entries for an empty query', () => {
    expect(searchStatusCodes('', null)).toHaveLength(STATUS_CODES.length)
    expect(searchStatusCodes('   ', null)).toHaveLength(STATUS_CODES.length)
    expect(searchStatusCodes('', null)).toEqual(STATUS_CODES)
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchStatusCodes('nonexistent-status', null)).toEqual([])
    expect(searchStatusCodes('zzz', null)).toEqual([])
    expect(searchStatusCodes('999', null)).toEqual([])
  })
})

describe('searchStatusCodes with category filter', () => {
  it('filters to a single category', () => {
    const clientErrors = searchStatusCodes('', '4xx')
    expect(clientErrors.length).toBeGreaterThan(0)
    expect(clientErrors.every((entry) => entry.category === '4xx')).toBe(true)
    expect(clientErrors.every((entry) => entry.code >= 400 && entry.code < 500)).toBe(true)
  })

  it('combines category filter with a code search', () => {
    expect(searchStatusCodes('404', '4xx').map((entry) => entry.code)).toEqual([404])
    expect(searchStatusCodes('404', '5xx')).toEqual([])
  })

  it('combines category filter with a name search', () => {
    expect(searchStatusCodes('found', '3xx').map((entry) => entry.code)).toEqual([302])
    expect(searchStatusCodes('found', '4xx').map((entry) => entry.code)).toEqual([404])
    expect(searchStatusCodes('found', '2xx')).toEqual([])
  })

  it('applies the filter to every category', () => {
    for (const category of STATUS_CODE_CATEGORIES) {
      const results = searchStatusCodes('', category)
      expect(results.length).toBeGreaterThan(0)
      expect(results.every((entry) => entry.category === category)).toBe(true)
    }
  })

  it('exposes labels for every category', () => {
    expect(STATUS_CODE_CATEGORY_LABELS['1xx']).toContain('Informational')
    expect(STATUS_CODE_CATEGORY_LABELS['2xx']).toContain('Success')
    expect(STATUS_CODE_CATEGORY_LABELS['3xx']).toContain('Redirection')
    expect(STATUS_CODE_CATEGORY_LABELS['4xx']).toContain('Client Error')
    expect(STATUS_CODE_CATEGORY_LABELS['5xx']).toContain('Server Error')
  })
})

describe('STATUS_CODES data integrity', () => {
  it('has no duplicate codes', () => {
    const codes = STATUS_CODES.map((entry) => entry.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('only contains codes within the standard 100-599 range', () => {
    for (const entry of STATUS_CODES) {
      expect(entry.code).toBeGreaterThanOrEqual(100)
      expect(entry.code).toBeLessThanOrEqual(599)
    }
  })

  it('covers every category from 1xx to 5xx', () => {
    const categories = new Set<StatusCategory>(STATUS_CODES.map((entry) => entry.category))
    expect([...categories].sort()).toEqual(['1xx', '2xx', '3xx', '4xx', '5xx'])
  })

  it('matches each entry category to its code range', () => {
    for (const entry of STATUS_CODES) {
      const expectedCategory: StatusCategory = `${Math.floor(entry.code / 100)}xx` as StatusCategory
      expect(entry.category).toBe(expectedCategory)
    }
  })

  it('has a non-empty name and description for every entry', () => {
    for (const entry of STATUS_CODES) {
      expect(entry.name.trim()).not.toBe('')
      expect(entry.description.trim()).not.toBe('')
    }
  })

  it('contains representative well-known codes', () => {
    const codes = new Set(STATUS_CODES.map((entry) => entry.code))
    for (const code of [100, 200, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503]) {
      expect(codes.has(code)).toBe(true)
    }
  })

  it('contains standard extension codes', () => {
    const codes = new Set(STATUS_CODES.map((entry) => entry.code))
    for (const code of [
      103, 207, 226, 308, 418, 421, 422, 425, 429, 431, 451, 506, 507, 508, 511,
    ]) {
      expect(codes.has(code)).toBe(true)
    }
  })

  it('does not contain non-standard codes', () => {
    const codes = new Set(STATUS_CODES.map((entry) => entry.code))
    for (const code of [306, 419, 420, 444, 494, 499, 599, 999]) {
      expect(codes.has(code)).toBe(false)
    }
  })
})
