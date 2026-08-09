import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'query-string-builder',
  name: 'Query String Builder',
  description: 'Build a query string from editable key/value pairs',
  category: 'web',
  keywords: ['query', 'url', 'params', 'query string', 'urlsearchparams'],
} satisfies ToolDefinition
