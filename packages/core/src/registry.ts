import { parseToolDefinition, type ToolCategory, type ToolDefinition } from './tool-definition'

export interface CategoryGroup {
  category: ToolCategory
  tools: readonly ToolDefinition[]
}

export class ToolRegistryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ToolRegistryError'
  }
}

export function groupByCategory(tools: readonly ToolDefinition[]): CategoryGroup[] {
  const groups = new Map<ToolCategory, ToolDefinition[]>()
  for (const tool of tools) {
    const group = groups.get(tool.category)
    if (group) {
      group.push(tool)
    } else {
      groups.set(tool.category, [tool])
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, entries]) => ({ category, tools: entries }))
}

export class ToolRegistry {
  private readonly definitionsById: ReadonlyMap<string, ToolDefinition>

  constructor(rawDefinitions: readonly unknown[]) {
    const definitions = rawDefinitions.map((raw) => parseToolDefinition(raw))
    const seen = new Map<string, ToolDefinition>()
    for (const definition of definitions) {
      if (seen.has(definition.id)) {
        throw new ToolRegistryError(`Duplicate tool id: "${definition.id}"`)
      }
      seen.set(definition.id, definition)
    }
    this.definitionsById = seen
  }

  get size(): number {
    return this.definitionsById.size
  }

  list(): ToolDefinition[] {
    return [...this.definitionsById.values()].sort((a, b) => a.name.localeCompare(b.name))
  }

  get(id: string): ToolDefinition | undefined {
    return this.definitionsById.get(id)
  }

  byCategory(): CategoryGroup[] {
    return groupByCategory(this.list())
  }

  search(query: string): ToolDefinition[] {
    const normalized = query.trim().toLowerCase()
    if (normalized === '') {
      return this.list()
    }
    return this.list().filter((definition) => {
      const haystack = [definition.name, definition.description, ...(definition.keywords ?? [])]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }
}

export function createToolRegistry(rawDefinitions: readonly unknown[]): ToolRegistry {
  return new ToolRegistry(rawDefinitions)
}
