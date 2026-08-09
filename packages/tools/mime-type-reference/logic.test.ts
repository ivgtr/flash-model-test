import { describe, expect, it } from 'vitest'
import {
  MIME_CATEGORIES,
  MIME_TYPES,
  isValidExtension,
  isValidMimeType,
  searchMimeTypes,
  type MimeCategory,
} from './logic'

const entryTypes = (query: string, category: MimeCategory | null = null) =>
  searchMimeTypes(query, category).map((entry) => entry.type)

describe('MIME_TYPES data', () => {
  it('contains 100 or more MIME types', () => {
    expect(MIME_TYPES.length).toBeGreaterThanOrEqual(100)
  })

  it('uses valid type/subtype syntax for every entry', () => {
    const pattern = /^[a-z0-9._+-]+\/[a-z0-9._+-]+$/
    for (const entry of MIME_TYPES) {
      expect(isValidMimeType(entry.type), entry.type).toBe(true)
      expect(entry.type, entry.type).toMatch(pattern)
    }
  })

  it('uses valid extension syntax for every entry', () => {
    for (const entry of MIME_TYPES) {
      expect(entry.extensions.length, entry.type).toBeGreaterThan(0)
      for (const extension of entry.extensions) {
        expect(extension.startsWith('.'), `${entry.type} / ${extension}`).toBe(false)
        expect(isValidExtension(extension), `${entry.type} / ${extension}`).toBe(true)
      }
    }
  })

  it('has a non-empty description and matching category for every entry', () => {
    for (const entry of MIME_TYPES) {
      expect(entry.description.trim(), entry.type).not.toBe('')
      expect(entry.category, entry.type).toBe(entry.type.split('/')[0])
    }
  })

  it('has unique MIME types', () => {
    const types = MIME_TYPES.map((entry) => entry.type)
    expect(new Set(types).size).toBe(types.length)
  })

  it('covers every supported category with at least one entry', () => {
    expect(MIME_CATEGORIES).toEqual(['text', 'image', 'audio', 'video', 'application', 'font'])
    for (const category of MIME_CATEGORIES) {
      expect(
        MIME_TYPES.some((entry) => entry.category === category),
        category,
      ).toBe(true)
    }
  })
})

describe('searchMimeTypes by extension', () => {
  it.each([
    ['png', 'image/png'],
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
    ['html', 'text/html'],
    ['json', 'application/json'],
    ['pdf', 'application/pdf'],
    ['txt', 'text/plain'],
    ['md', 'text/markdown'],
    ['css', 'text/css'],
    ['zip', 'application/zip'],
  ])('finds "%s" by extension', (query, expectedType) => {
    expect(entryTypes(query)).toContain(expectedType)
  })

  it('accepts an extension without a leading dot', () => {
    expect(entryTypes('png')).toEqual(['image/png'])
  })

  it('accepts a leading dot before the extension', () => {
    expect(entryTypes('.png')).toEqual(['image/png'])
    expect(entryTypes('.jpg')).toEqual(['image/jpeg'])
  })

  it('treats ".png" and "png" identically', () => {
    expect(entryTypes('.png')).toEqual(entryTypes('png'))
  })

  it('matches every extension of a MIME type with multiple extensions', () => {
    expect(entryTypes('jpeg')).toEqual(['image/jpeg'])
    expect(entryTypes('jpg')).toEqual(['image/jpeg'])
    expect(entryTypes('htm')).toEqual(['text/html'])
    expect(entryTypes('html')).toEqual(['text/html'])
  })

  it('returns all MIME types that share an extension', () => {
    expect(entryTypes('js').sort()).toEqual(['application/javascript', 'text/javascript'])
    expect(entryTypes('wav').sort()).toEqual(['audio/wav', 'audio/x-wav'])
  })

  it('matches case-insensitively', () => {
    expect(entryTypes('PNG')).toEqual(['image/png'])
    expect(entryTypes('.PNG')).toEqual(['image/png'])
    expect(entryTypes('Png')).toEqual(['image/png'])
  })

  it('does not match partial extensions', () => {
    expect(entryTypes('pn')).toEqual([])
    expect(entryTypes('xm')).toEqual([])
  })
})

describe('searchMimeTypes by MIME type string', () => {
  it.each([
    ['image/png', 'image/png'],
    ['application/pdf', 'application/pdf'],
    ['text/html', 'text/html'],
    ['font/woff2', 'font/woff2'],
    ['application/vnd.adobe.photoshop', 'application/vnd.adobe.photoshop'],
  ])('finds "%s" by MIME type string', (query, expectedType) => {
    expect(entryTypes(query)).toContain(expectedType)
  })

  it('matches MIME type strings case-insensitively', () => {
    expect(entryTypes('IMAGE/PNG')).toContain('image/png')
    expect(entryTypes('Image/Png')).toContain('image/png')
  })

  it('matches by subtype alone', () => {
    expect(entryTypes('javascript').sort()).toEqual(['application/javascript', 'text/javascript'])
    expect(entryTypes('svg')).toContain('image/svg+xml')
  })

  it('shows an entry that matches via both the MIME type and the extension', () => {
    expect(entryTypes('json')).toEqual(['application/json'])
    expect(entryTypes('xml').sort()).toEqual(['application/xml', 'text/xml'])
  })
})

describe('searchMimeTypes categories', () => {
  it('returns everything for an empty query', () => {
    expect(searchMimeTypes('').length).toBe(MIME_TYPES.length)
    expect(searchMimeTypes('   ').length).toBe(MIME_TYPES.length)
  })

  it('filters by category only', () => {
    for (const category of MIME_CATEGORIES) {
      const results = searchMimeTypes('', category)
      expect(results.length).toBeGreaterThan(0)
      for (const entry of results) {
        expect(entry.category, entry.type).toBe(category)
      }
    }
  })

  it('filters by category combined with a query', () => {
    expect(entryTypes('mp4', 'video')).toContain('video/mp4')
    expect(entryTypes('m4a', 'video')).toEqual([])
    expect(entryTypes('m4a', 'audio')).toEqual(['audio/mp4'])
    expect(entryTypes('svg', 'image')).toContain('image/svg+xml')
    expect(entryTypes('svg', 'application')).toEqual([])
    expect(entryTypes('woff', 'font')).toContain('font/woff')
  })

  it('applies the category filter to an empty query without hiding entries', () => {
    expect(searchMimeTypes('', 'font').length).toBe(
      MIME_TYPES.filter((e) => e.category === 'font').length,
    )
  })
})

describe('searchMimeTypes no results', () => {
  it('returns an empty array for unknown queries', () => {
    expect(entryTypes('zzzz')).toEqual([])
    expect(entryTypes('.zzzz')).toEqual([])
    expect(entryTypes('image/nope')).toEqual([])
  })

  it('returns an empty array when the category excludes the match', () => {
    expect(entryTypes('png', 'font')).toEqual([])
  })
})
