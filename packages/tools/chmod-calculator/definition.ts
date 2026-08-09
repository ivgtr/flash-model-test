import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'chmod-calculator',
  name: 'Chmod Calculator',
  description: 'Convert between octal and symbolic Unix file permission notation',
  category: 'misc',
  keywords: ['chmod', 'permissions', 'octal', 'symbolic', 'setuid', 'setgid', 'sticky'],
} satisfies ToolDefinition
