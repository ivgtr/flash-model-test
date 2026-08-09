import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'number-formatter',
  name: 'Number Formatter',
  description: 'Format numbers with Intl.NumberFormat',
  category: 'data',
  keywords: ['number', 'format', 'intl', 'locale', 'currency', 'percent'],
} satisfies ToolDefinition
