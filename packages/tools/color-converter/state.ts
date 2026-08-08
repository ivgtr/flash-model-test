import { z, zodStateCodec, type ToolStateCodec } from '@tool-forge/core'

export const colorConverterStateSchema = z.object({
  input: z.string().default(''),
})

export type ColorConverterState = z.infer<typeof colorConverterStateSchema>

export const colorConverterStateCodec: ToolStateCodec<ColorConverterState> = zodStateCodec(
  colorConverterStateSchema,
  { input: '' },
)
