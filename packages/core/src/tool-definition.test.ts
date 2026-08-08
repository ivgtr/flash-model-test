import { describe, expect, it } from 'vitest'
import { parseToolDefinition } from './tool-definition'

describe('parseToolDefinition', () => {
  it('accepts a valid definition', () => {
    const definition = parseToolDefinition({
      id: 'json-formatter',
      name: 'JSON Formatter',
      description: 'Pretty-print JSON',
      category: 'data',
    })
    expect(definition).toEqual({
      id: 'json-formatter',
      name: 'JSON Formatter',
      description: 'Pretty-print JSON',
      category: 'data',
    })
  })

  it('accepts optional keywords', () => {
    const definition = parseToolDefinition({
      id: 'json-formatter',
      name: 'JSON Formatter',
      description: 'Pretty-print JSON',
      category: 'data',
      keywords: ['pretty', 'indent'],
    })
    expect(definition.keywords).toEqual(['pretty', 'indent'])
  })

  it('rejects an invalid category', () => {
    expect(() =>
      parseToolDefinition({
        id: 'x',
        name: 'X',
        description: 'X',
        category: 'nope',
      }),
    ).toThrow('Invalid tool definition')
  })

  it('rejects a non-kebab-case id', () => {
    expect(() =>
      parseToolDefinition({
        id: 'Json_Formatter',
        name: 'X',
        description: 'X',
        category: 'data',
      }),
    ).toThrow(/kebab-case/)
  })

  it('rejects an empty name', () => {
    expect(() =>
      parseToolDefinition({
        id: 'x',
        name: '',
        description: 'X',
        category: 'data',
      }),
    ).toThrow('Invalid tool definition')
  })

  it('rejects non-object input', () => {
    expect(() => parseToolDefinition(null)).toThrow('Invalid tool definition')
  })
})
