import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'csv-formatter',
  name: 'CSV Formatter',
  description: 'Parse and reformat CSV text with consistent quoting',
  category: 'data',
  keywords: ['csv', 'format', 'parse', 'delimiter', 'quote', 'trim'],
} satisfies ToolDefinition
