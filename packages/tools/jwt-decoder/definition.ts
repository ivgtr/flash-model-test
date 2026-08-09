import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'jwt-decoder',
  name: 'JWT Decoder',
  description: 'Decode a JWT (JWS) into its header, payload, and signature',
  category: 'encoding',
  keywords: ['jwt', 'decode', 'json', 'web-token', 'base64url'],
} satisfies ToolDefinition
