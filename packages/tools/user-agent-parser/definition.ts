import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'user-agent-parser',
  name: 'User-Agent Parser',
  description:
    'Detect browser, OS, and device class from a User-Agent string (lightweight pattern detection, not a full UA parser)',
  category: 'web',
  keywords: ['user-agent', 'ua', 'parse', 'browser', 'os', 'device', 'detect'],
} satisfies ToolDefinition
