import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'uuid-generator',
  name: 'UUID Generator',
  description: 'Generate UUID v4 values',
  category: 'crypto',
  keywords: ['uuid', 'v4', 'random', 'id', 'guid'],
} satisfies ToolDefinition
