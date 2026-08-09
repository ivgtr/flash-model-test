import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'http-status-reference',
  name: 'HTTP Status Code Reference',
  description: 'Look up standard HTTP status codes and their meanings',
  category: 'web',
  keywords: ['http', 'status', 'code', 'reference', 'response'],
} satisfies ToolDefinition
