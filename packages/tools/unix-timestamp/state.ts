import { z, zodStateCodec, type ToolStateCodec } from '@tool-forge/core'

export const unixTimestampStateSchema = z.object({
  timestamp: z.string().default(''),
  date: z.string().default(''),
})

export type UnixTimestampState = z.infer<typeof unixTimestampStateSchema>

export const unixTimestampStateCodec: ToolStateCodec<UnixTimestampState> = zodStateCodec(
  unixTimestampStateSchema,
  { timestamp: '', date: '' },
)
