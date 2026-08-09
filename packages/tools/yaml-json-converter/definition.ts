import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'yaml-json-converter',
  name: 'YAML ↔ JSON',
  description: 'Convert between YAML (block-style subset) and JSON',
  category: 'data',
  keywords: ['yaml', 'json', 'convert', 'parse', 'subset'],
} satisfies ToolDefinition
