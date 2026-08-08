import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'html-escape',
  name: 'HTML Escape',
  description: 'Escape and unescape HTML entities (& < > " \')',
  category: 'encoding',
  keywords: ['html', 'escape', 'unescape', 'entity', 'encode', 'decode'],
} satisfies ToolDefinition
