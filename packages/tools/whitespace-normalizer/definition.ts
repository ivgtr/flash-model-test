import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'whitespace-normalizer',
  name: 'Whitespace Normalizer',
  description:
    'Normalize whitespace in text: trim lines, collapse runs of spaces and tabs, strip trailing whitespace, convert line endings to LF, and remove blank lines. Only ASCII whitespace is handled; full-width spaces are out of scope.',
  category: 'text',
  keywords: ['whitespace', 'normalize', 'trim', 'collapse', 'line endings', 'blank lines'],
} satisfies ToolDefinition
