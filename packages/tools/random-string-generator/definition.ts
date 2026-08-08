import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'random-string-generator',
  name: 'Random String Generator',
  description: 'Generate a random string from selectable character sets',
  category: 'misc',
  keywords: ['random', 'string', 'password', 'generate', 'charset'],
} satisfies ToolDefinition
