import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'json-to-csv',
  name: 'JSON to CSV',
  description: 'Convert a JSON array of objects to CSV text',
  category: 'data',
  keywords: ['json', 'convert', 'csv', 'serialize', 'delimiter'],
} satisfies ToolDefinition
