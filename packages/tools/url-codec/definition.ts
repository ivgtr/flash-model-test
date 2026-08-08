import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'url-codec',
  name: 'URL Codec',
  description: 'Percent-encode and decode URL strings',
  category: 'encoding',
  keywords: ['url', 'percent', 'encoding', 'encode', 'decode', 'uri'],
} satisfies ToolDefinition
