import { describe, expect, it } from 'vitest'
import { slugify } from './logic'

describe('slugify', () => {
  it('converts a plain sentence', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('lowercases mixed-case input', () => {
    expect(slugify('Foo Bar BAZ')).toBe('foo-bar-baz')
  })

  it('replaces mixed symbols and whitespace with hyphens', () => {
    expect(slugify('Hello, World! How are you?')).toBe('hello-world-how-are-you')
  })

  it('strips diacritical marks', () => {
    expect(slugify('café')).toBe('cafe')
    expect(slugify('München')).toBe('munchen')
    expect(slugify('Español')).toBe('espanol')
    expect(slugify('über déjà vu')).toBe('uber-deja-vu')
  })

  it('collapses consecutive hyphens', () => {
    expect(slugify('a---b   c')).toBe('a-b-c')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('-Hello---World-')).toBe('hello-world')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(slugify('   \n\t ')).toBe('')
  })

  it('returns empty string for non-Latin input without transliteration', () => {
    expect(slugify('日本語のテキスト')).toBe('')
  })

  it('returns empty string for symbol-only input', () => {
    expect(slugify('???')).toBe('')
  })

  it('keeps an already-slug-like input almost unchanged', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug')
  })
})
