import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'character-code-converter',
  name: 'Character Code Converter',
  description:
    'Convert between characters and their code values (decimal / hex / octal / binary / UTF-16)',
  category: 'text',
  keywords: ['character', 'code point', 'unicode', 'hex', 'octal', 'binary', 'utf-16', 'convert'],
} satisfies ToolDefinition
