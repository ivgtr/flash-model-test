import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'sql-formatter',
  name: 'SQL Formatter',
  description:
    'Format SQL by uppercasing keywords and adding line breaks and indentation. A lightweight formatter, not a full SQL parser.',
  category: 'code',
  keywords: ['sql', 'format', 'formatter', 'pretty', 'keyword', 'query'],
} satisfies ToolDefinition
