import { describe, expect, it } from 'vitest'
import { createToolRegistry } from './registry'

const TOOLS = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Pretty-print JSON',
    category: 'data',
  },
  {
    id: 'base64',
    name: 'Base64',
    description: 'Encode and decode Base64',
    category: 'encoding',
    keywords: ['encode', 'decode'],
  },
  {
    id: 'text-stats',
    name: 'Text Statistics',
    description: 'Count characters, words and lines',
    category: 'text',
  },
]

describe('ToolRegistry', () => {
  it('validates definitions on construction', () => {
    expect(() => createToolRegistry([{ ...TOOLS[0], category: 'invalid' }])).toThrow(
      'Invalid tool definition',
    )
  })

  it('rejects duplicate ids', () => {
    expect(() => createToolRegistry([TOOLS[0], TOOLS[0]])).toThrow('Duplicate tool id')
  })

  it('lists tools sorted by name', () => {
    const registry = createToolRegistry(TOOLS)
    expect(registry.list().map((t) => t.id)).toEqual(['base64', 'json-formatter', 'text-stats'])
  })

  it('exposes size', () => {
    const registry = createToolRegistry(TOOLS)
    expect(registry.size).toBe(3)
  })

  it('gets a tool by id', () => {
    const registry = createToolRegistry(TOOLS)
    expect(registry.get('base64')?.name).toBe('Base64')
    expect(registry.get('missing')).toBeUndefined()
  })

  it('groups tools by category with sorted categories and tools', () => {
    const registry = createToolRegistry([{ ...TOOLS[2], category: 'data' }, TOOLS[0], TOOLS[1]])
    expect(registry.byCategory()).toEqual([
      { category: 'data', tools: [TOOLS[0], { ...TOOLS[2], category: 'data' }] },
      { category: 'encoding', tools: [TOOLS[1]] },
    ])
  })

  it('searches name, description and keywords case-insensitively', () => {
    const registry = createToolRegistry(TOOLS)
    expect(registry.search('JSON').map((t) => t.id)).toEqual(['json-formatter'])
    expect(registry.search('pretty').map((t) => t.id)).toEqual(['json-formatter'])
    expect(registry.search('encode').map((t) => t.id)).toEqual(['base64'])
    expect(registry.search('MISSING')).toEqual([])
    expect(registry.search('')).toHaveLength(3)
    expect(registry.search('   ')).toHaveLength(3)
  })
})
