import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'semver-comparator',
  name: 'SemVer Comparator',
  description: 'Validate, compare, sort, and range-check SemVer 2.0.0 versions',
  category: 'code',
  keywords: ['semver', 'version', 'compare', 'sort', 'prerelease', 'range'],
} satisfies ToolDefinition
