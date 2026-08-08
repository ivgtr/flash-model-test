import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'base64-codec',
  name: 'Base64 Codec',
  description: 'Encode UTF-8 text to Base64 and decode it back',
  category: 'encoding',
  keywords: ['base64', 'encode', 'decode', 'utf-8'],
} satisfies ToolDefinition
