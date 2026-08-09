import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'json-minifier',
  name: 'JSON Minifier',
  description:
    'Minify or pretty-print JSON and report UTF-8 byte savings. Number precision follows the native JSON round-trip, so huge numbers may lose precision.',
  category: 'data',
  keywords: ['json', 'minify', 'minifier', 'compact', 'compress', 'pretty'],
} satisfies ToolDefinition
