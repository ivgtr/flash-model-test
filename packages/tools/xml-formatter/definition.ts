import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'xml-formatter',
  name: 'XML Formatter',
  description: 'Pretty-print XML with configurable indentation',
  category: 'data',
  keywords: ['xml', 'format', 'pretty-print', 'pretty', 'indent', 'parse'],
} satisfies ToolDefinition
