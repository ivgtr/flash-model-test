import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'slug-generator',
  name: 'Slug Generator',
  description: 'Generate URL-friendly slugs from any text',
  category: 'web',
  keywords: ['slug', 'url', 'seo', 'normalize', 'hyphen'],
} satisfies ToolDefinition
