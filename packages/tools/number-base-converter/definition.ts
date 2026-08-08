import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'number-base-converter',
  name: 'Number Base Converter',
  description: 'Convert integers between bases 2, 8, 10, 16, and 36',
  category: 'data',
  keywords: ['base', 'radix', 'binary', 'octal', 'decimal', 'hexadecimal', 'convert', 'bigint'],
} satisfies ToolDefinition
