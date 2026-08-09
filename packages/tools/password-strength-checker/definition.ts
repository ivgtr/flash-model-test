import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'password-strength-checker',
  name: 'Password Strength Checker',
  description:
    'Estimate password strength heuristically with a 0-4 score, a checklist, and an entropy estimate. No common-password dictionary is used; Unicode characters such as Japanese text are treated as "other" rather than symbols.',
  category: 'misc',
  keywords: ['password', 'strength', 'entropy', 'security', 'check', 'estimate', 'score'],
} satisfies ToolDefinition
