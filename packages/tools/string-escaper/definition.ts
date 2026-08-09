import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'string-escaper',
  name: 'String Escaper',
  description: 'Escape and unescape strings for HTML, URL, JSON, regex, and JS contexts',
  category: 'text',
  keywords: [
    'escape',
    'unescape',
    'html',
    'entity',
    'url',
    'encode',
    'decode',
    'json',
    'regex',
    'js string',
  ],
} satisfies ToolDefinition
