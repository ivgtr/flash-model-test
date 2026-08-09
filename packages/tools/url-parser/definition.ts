import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'url-parser',
  name: 'URL Parser',
  description: 'Parse a URL into its components',
  category: 'web',
  keywords: ['url', 'parse', 'uri', 'components', 'query', 'protocol', 'host'],
} satisfies ToolDefinition
