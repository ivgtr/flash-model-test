import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'csv-to-json',
  name: 'CSV to JSON',
  description: 'Convert CSV text to JSON',
  category: 'data',
  keywords: ['csv', 'convert', 'json', 'parse', 'delimiter'],
} satisfies ToolDefinition
