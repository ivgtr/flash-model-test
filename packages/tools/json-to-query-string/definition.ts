import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'json-to-query-string',
  name: 'JSON to Query String',
  description: 'Convert a flat JSON object to a URL query string',
  category: 'web',
  keywords: ['json', 'query', 'string', 'url', 'encode', 'urlsearchparams'],
} satisfies ToolDefinition
