import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'hash-generator',
  name: 'Hash Generator',
  description: 'Generate SHA-1 / SHA-256 / SHA-384 / SHA-512 hashes of text',
  category: 'crypto',
  keywords: ['sha', 'sha1', 'sha256', 'sha384', 'sha512', 'digest', 'hash'],
} satisfies ToolDefinition
