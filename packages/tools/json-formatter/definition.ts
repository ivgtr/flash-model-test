import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'json-formatter',
  name: 'JSON Formatter',
  description: 'Pretty-print and validate JSON',
  category: 'data',
  keywords: ['pretty', 'print', 'indent', 'validate', 'minify'],
} satisfies ToolDefinition
