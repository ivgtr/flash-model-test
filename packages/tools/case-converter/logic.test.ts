import { describe, expect, it } from 'vitest'
import { convertCase, splitWords } from './logic'

describe('splitWords', () => {
  it('splits on separators and camel boundaries', () => {
    expect(splitWords('foo_bar-baz qux')).toEqual(['foo', 'bar', 'baz', 'qux'])
    expect(splitWords('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request'])
    expect(splitWords('fooBar')).toEqual(['foo', 'Bar'])
  })

  it('keeps digits attached to the previous word', () => {
    expect(splitWords('html5')).toEqual(['html5'])
    expect(splitWords('version2')).toEqual(['version2'])
    expect(splitWords('foo-2-bar')).toEqual(['foo', '2', 'bar'])
  })

  it('returns no words for empty or separator-only input', () => {
    expect(splitWords('')).toEqual([])
    expect(splitWords('--__')).toEqual([])
    expect(splitWords('   ')).toEqual([])
  })

  it('keeps a digit-only input as a single word', () => {
    expect(splitWords('123')).toEqual(['123'])
  })
})

describe('convertCase', () => {
  it('converts snake_case to every target', () => {
    expect(convertCase('foo_bar', 'camelCase')).toBe('fooBar')
    expect(convertCase('foo_bar', 'PascalCase')).toBe('FooBar')
    expect(convertCase('foo_bar', 'snake_case')).toBe('foo_bar')
    expect(convertCase('foo_bar', 'kebab-case')).toBe('foo-bar')
    expect(convertCase('foo_bar', 'SCREAMING_SNAKE_CASE')).toBe('FOO_BAR')
    expect(convertCase('foo_bar', 'Title Case')).toBe('Foo Bar')
  })

  it('converts kebab-case to camelCase', () => {
    expect(convertCase('foo-bar', 'camelCase')).toBe('fooBar')
  })

  it('converts camelCase to snake_case', () => {
    expect(convertCase('fooBarBaz', 'snake_case')).toBe('foo_bar_baz')
  })

  it('splits uppercase runs at the last uppercase before a lowercase', () => {
    expect(convertCase('XMLHttpRequest', 'snake_case')).toBe('xml_http_request')
    expect(convertCase('HTMLParser', 'snake_case')).toBe('html_parser')
  })

  it('splits inputs with mixed separators', () => {
    expect(convertCase('foo_bar-baz qux', 'kebab-case')).toBe('foo-bar-baz-qux')
  })

  it('keeps digits in the word without creating a boundary', () => {
    expect(convertCase('version2', 'camelCase')).toBe('version2')
    expect(convertCase('html5', 'PascalCase')).toBe('Html5')
    expect(convertCase('foo-2-bar', 'camelCase')).toBe('foo2Bar')
  })

  it('returns an empty string for empty or separator-only input', () => {
    expect(convertCase('', 'camelCase')).toBe('')
    expect(convertCase('--__', 'camelCase')).toBe('')
    expect(convertCase('   ', 'PascalCase')).toBe('')
  })

  it('keeps a digit-only input intact', () => {
    expect(convertCase('123', 'camelCase')).toBe('123')
    expect(convertCase('123', 'Title Case')).toBe('123')
  })

  it('converts a single word', () => {
    expect(convertCase('hello', 'camelCase')).toBe('hello')
    expect(convertCase('hello', 'SCREAMING_SNAKE_CASE')).toBe('HELLO')
  })

  it('uses camelCase as the default target', () => {
    expect(convertCase('foo_bar')).toBe('fooBar')
  })
})
