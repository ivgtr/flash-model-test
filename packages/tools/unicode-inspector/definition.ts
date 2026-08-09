import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'unicode-inspector',
  name: 'Unicode Inspector',
  description:
    'Inspect text code point by code point: U+XXXX hex, decimal, UTF-16 units, UTF-8 bytes, and astral (surrogate pair) detection. No Unicode name or category database is bundled.',
  category: 'text',
  keywords: ['unicode', 'code point', 'utf-8', 'utf-16', 'surrogate', 'emoji'],
} satisfies ToolDefinition
