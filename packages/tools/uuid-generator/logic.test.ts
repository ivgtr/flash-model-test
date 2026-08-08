import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CASE,
  MAX_COUNT,
  MIN_COUNT,
  UUID_V4_PATTERN,
  generateUuids,
  isUuidV4,
  parseCount,
} from './logic'

describe('generateUuids', () => {
  it('generates a single lowercase UUID v4 by default', () => {
    const result = generateUuids(1)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.uuids).toHaveLength(1)
    const uuid = result.uuids[0]
    expect(uuid).toBeDefined()
    if (uuid === undefined) {
      return
    }
    expect(uuid).toMatch(UUID_V4_PATTERN)
    expect(uuid).toBe(uuid.toLowerCase())
  })

  it('generates multiple UUIDs that all match the v4 format without duplicates', () => {
    const result = generateUuids(10)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.uuids).toHaveLength(10)
    for (const uuid of result.uuids) {
      expect(uuid).toMatch(UUID_V4_PATTERN)
    }
    expect(new Set(result.uuids).size).toBe(10)
  })

  it('generates uppercase UUIDs when requested', () => {
    const result = generateUuids(5, 'upper')
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    for (const uuid of result.uuids) {
      expect(uuid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/)
      expect(uuid).toBe(uuid.toUpperCase())
    }
  })

  it('reports an error for counts below the minimum', () => {
    const result = generateUuids(0)
    expect(result).toEqual({
      ok: false,
      error: `Count must be an integer between ${MIN_COUNT} and ${MAX_COUNT}.`,
    })
  })

  it('reports an error for counts above the maximum', () => {
    const result = generateUuids(101)
    expect(result.ok).toBe(false)
  })

  it('reports an error for non-integer counts', () => {
    expect(generateUuids(NaN).ok).toBe(false)
    expect(generateUuids(2.5).ok).toBe(false)
  })
})

describe('parseCount', () => {
  it('parses valid counts within range', () => {
    expect(parseCount('1')).toBe(1)
    expect(parseCount('10')).toBe(10)
    expect(parseCount('100')).toBe(100)
    expect(parseCount(' 5 ')).toBe(5)
  })

  it('returns null for out-of-range or non-numeric input', () => {
    expect(parseCount('0')).toBeNull()
    expect(parseCount('101')).toBeNull()
    expect(parseCount('abc')).toBeNull()
    expect(parseCount('1.5')).toBeNull()
    expect(parseCount('')).toBeNull()
  })
})

describe('isUuidV4', () => {
  it('accepts RFC 4122 v4 UUIDs', () => {
    expect(isUuidV4('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isUuidV4('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true)
    expect(isUuidV4('9c858b90-3c0d-4f8f-b9b2-9d3f6a7e8c11')).toBe(true)
  })

  it('rejects malformed UUIDs', () => {
    expect(isUuidV4('')).toBe(false)
    expect(isUuidV4('550e8400e29b41d4a716446655440000')).toBe(false)
    expect(isUuidV4('550e8400-e29b-51d4-a716-446655440000')).toBe(false)
    expect(isUuidV4('550e8400-e29b-41d4-c716-446655440000')).toBe(false)
    expect(isUuidV4('550e8400-e29b-41d4-a716-44665544000z')).toBe(false)
    expect(isUuidV4('550E8400-E29B-41D4-A716-446655440000')).toBe(false)
  })

  it('default case is lower', () => {
    expect(DEFAULT_CASE).toBe('lower')
  })
})
