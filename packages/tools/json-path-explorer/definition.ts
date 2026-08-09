import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'json-path-explorer',
  name: 'JSONPath Explorer',
  description:
    'Explore JSON values with a JSONPath subset: $, .key, ["key"], [n]. Wildcards, filters, recursive descent, and slices are not supported.',
  category: 'data',
  keywords: ['json', 'jsonpath', 'explore', 'query', 'path', 'navigate'],
} satisfies ToolDefinition
