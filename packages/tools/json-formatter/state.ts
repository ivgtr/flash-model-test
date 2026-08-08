import { z, zodStateCodec, type ToolStateCodec } from '@tool-forge/core'
import { DEFAULT_INDENT } from './logic'

export const jsonFormatterStateSchema = z.object({
  input: z.string().default(''),
  indent: z.union([z.literal(0), z.literal(2), z.literal(4)]).default(DEFAULT_INDENT),
})

export type JsonFormatterState = z.infer<typeof jsonFormatterStateSchema>

export const jsonFormatterStateCodec: ToolStateCodec<JsonFormatterState> = zodStateCodec(
  jsonFormatterStateSchema,
  { input: '', indent: DEFAULT_INDENT },
)
