import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'text-diff',
  name: 'Text Diff',
  description: 'Compute a line-based diff between two texts',
  category: 'text',
  keywords: ['diff', 'compare', 'lcs', 'unified', 'lines'],
} satisfies ToolDefinition
