import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'unix-timestamp',
  name: 'Unix Timestamp',
  description: 'Convert between Unix timestamps and human-readable dates',
  category: 'date-time',
  keywords: ['timestamp', 'unix', 'epoch', 'datetime', 'seconds', 'milliseconds'],
} satisfies ToolDefinition
