import { z, zodStateCodec, type ToolStateCodec } from '@tool-forge/core'

export const base64CodecStateSchema = z.object({
  direction: z.enum(['encode', 'decode']).default('encode'),
  input: z.string().default(''),
})

export type Base64CodecState = z.infer<typeof base64CodecStateSchema>

export type Direction = Base64CodecState['direction']

export const base64CodecStateCodec: ToolStateCodec<Base64CodecState> = zodStateCodec(
  base64CodecStateSchema,
  { direction: 'encode', input: '' },
)
