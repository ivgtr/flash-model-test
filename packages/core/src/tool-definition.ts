import { z } from 'zod'

export const TOOL_CATEGORIES = [
  'data',
  'encoding',
  'text',
  'crypto',
  'date-time',
  'web',
  'code',
  'visual',
  'misc',
] as const

export type ToolCategory = (typeof TOOL_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  data: 'Data',
  encoding: 'Encoding',
  text: 'Text',
  crypto: 'Crypto',
  'date-time': 'Date & Time',
  web: 'Web',
  code: 'Code',
  visual: 'Visual',
  misc: 'Misc',
}

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  keywords?: readonly string[]
}

export const toolDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be a kebab-case slug'),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(TOOL_CATEGORIES),
  keywords: z.array(z.string()).optional(),
})

export class ToolDefinitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ToolDefinitionError'
  }
}

export function parseToolDefinition(input: unknown): ToolDefinition {
  const parsed = toolDefinitionSchema.safeParse(input)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')
    throw new ToolDefinitionError(`Invalid tool definition: ${detail}`)
  }
  return parsed.data
}
