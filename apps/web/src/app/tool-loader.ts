import { createToolRegistry, type ToolDefinition } from '@tool-forge/core'
import type { ComponentType } from 'react'
import { toolDefinitions, toolLoaders } from '../generated/tool-registry'

export const toolRegistry = createToolRegistry(toolDefinitions)

export function loadToolModule(toolId: string): Promise<{ default: ComponentType }> {
  const loader = toolLoaders[toolId]
  if (loader === undefined) {
    return Promise.reject(new Error(`[tool-forge] unknown tool: ${toolId}`))
  }
  return loader().then((module) => {
    const component = (module as { Tool?: ComponentType }).Tool
    if (component === undefined) {
      throw new Error(`[tool-forge] tool "${toolId}" does not export a Tool component`)
    }
    return { default: component }
  })
}

export function getToolDefinition(toolId: string): ToolDefinition | undefined {
  return toolRegistry.get(toolId)
}
