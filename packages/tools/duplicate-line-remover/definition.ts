import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'duplicate-line-remover',
  name: 'Duplicate Line Remover',
  description: 'Remove duplicate lines while preserving the first occurrence',
  category: 'text',
  keywords: ['duplicate', 'dedupe', 'lines', 'unique', 'remove', 'distinct'],
} satisfies ToolDefinition
