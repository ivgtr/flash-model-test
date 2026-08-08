import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'color-converter',
  name: 'Color Converter',
  description: 'Convert between HEX, RGB, and HSL color formats',
  category: 'visual',
  keywords: ['color', 'hex', 'rgb', 'hsl', 'rgba', 'hsla', 'convert'],
} satisfies ToolDefinition
