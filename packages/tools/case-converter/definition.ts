import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'case-converter',
  name: 'Case Converter',
  description:
    'Convert text between camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE_CASE, and Title Case',
  category: 'text',
  keywords: ['camel', 'pascal', 'snake', 'kebab', 'title', 'case', 'convert'],
} satisfies ToolDefinition
