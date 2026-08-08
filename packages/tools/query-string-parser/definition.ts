import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'query-string-parser',
  name: 'Query String Parser',
  description: 'Parse and serialize URL query strings',
  category: 'web',
  keywords: ['query', 'string', 'url', 'parse', 'serialize', 'params'],
} satisfies ToolDefinition
