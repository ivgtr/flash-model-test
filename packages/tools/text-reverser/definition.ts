import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'text-reverser',
  name: 'Text Reverser',
  description:
    'Reverse text by Unicode code points (chars), by line order (lines), or by word order per line (words). Surrogate pairs such as emoji are preserved; combining marks are handled as individual code points.',
  category: 'text',
  keywords: ['reverse', 'text', 'unicode', 'emoji', 'lines', 'words', 'flip'],
} satisfies ToolDefinition
