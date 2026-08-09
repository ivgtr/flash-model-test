import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'ip-address-converter',
  name: 'IP Address Converter',
  description:
    'Convert IPv4 (dotted / integer / binary / hex) and validate, compress, and expand IPv6 addresses',
  category: 'misc',
  keywords: ['ip', 'ipv4', 'ipv6', 'address', 'convert', 'expand', 'compress'],
} satisfies ToolDefinition
