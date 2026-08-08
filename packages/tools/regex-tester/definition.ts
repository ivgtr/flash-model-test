import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'regex-tester',
  name: 'Regex Tester',
  description: 'Test regular expression patterns against a string',
  category: 'code',
  keywords: ['regex', 'regular', 'expression', 'pattern', 'match', 'capture', 'flags'],
} satisfies ToolDefinition
