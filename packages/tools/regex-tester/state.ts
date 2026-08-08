import { z, zodStateCodec, type ToolStateCodec } from '@tool-forge/core'
import { FLAG_OPTIONS } from './logic'

export const regexTesterStateSchema = z.object({
  pattern: z.string().default(''),
  flags: z.array(z.enum(FLAG_OPTIONS)).default([]),
  text: z.string().default(''),
})

export type RegexTesterState = z.infer<typeof regexTesterStateSchema>

export const regexTesterStateCodec: ToolStateCodec<RegexTesterState> = zodStateCodec(
  regexTesterStateSchema,
  { pattern: '', flags: [], text: '' },
)
