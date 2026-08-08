import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'text-statistics',
  name: 'Text Statistics',
  description: 'Count characters, words, and lines in a text',
  category: 'text',
  keywords: ['count', 'characters', 'words', 'lines', 'statistics'],
} satisfies ToolDefinition
