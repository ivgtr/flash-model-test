import { z } from 'zod'
import { describe, expect, it } from 'vitest'
import {
  MAX_STATE_PAYLOAD_LENGTH,
  STATE_PARAM_VERSION,
  parseToolState,
  serializeToolState,
  zodStateCodec,
  type ToolStateCodec,
} from './url-state'

const sampleSchema = z.object({
  input: z.string().default(''),
  indent: z.union([z.literal(0), z.literal(2), z.literal(4)]).default(2),
  flags: z.array(z.enum(['g', 'i', 'm'])).default([]),
})

type SampleState = z.infer<typeof sampleSchema>

const sampleCodec: ToolStateCodec<SampleState> = zodStateCodec(sampleSchema, {
  input: '',
  indent: 2,
  flags: [],
})

describe('zodStateCodec', () => {
  it('round-trips a state value through serialize/parse', () => {
    const state: SampleState = { input: '{"a":1}', indent: 4, flags: ['g', 'm'] }
    expect(sampleCodec.parse(sampleCodec.serialize(state))).toEqual(state)
  })

  it('returns null for invalid JSON', () => {
    expect(sampleCodec.parse('{not json')).toBeNull()
  })

  it('returns null when the value fails schema validation', () => {
    expect(sampleCodec.parse(JSON.stringify({ input: 42 }))).toBeNull()
    expect(sampleCodec.parse(JSON.stringify({ indent: 3 }))).toBeNull()
    expect(sampleCodec.parse(JSON.stringify({ flags: ['x'] }))).toBeNull()
  })

  it('defaults missing keys per-field', () => {
    expect(sampleCodec.parse(JSON.stringify({}))).toEqual({ input: '', indent: 2, flags: [] })
    expect(sampleCodec.parse(JSON.stringify({ input: 'hi' }))).toEqual({
      input: 'hi',
      indent: 2,
      flags: [],
    })
  })

  it('strips unknown keys', () => {
    expect(sampleCodec.parse(JSON.stringify({ input: 'hi', future: 'x' }))).toEqual({
      input: 'hi',
      indent: 2,
      flags: [],
    })
  })
})

describe('serializeToolState', () => {
  it('returns null for the default state (nothing to share)', () => {
    expect(serializeToolState({ input: '', indent: 2, flags: [] }, sampleCodec)).toBeNull()
  })

  it('produces a deterministic envelope: version dot base64url', () => {
    const state: SampleState = { input: '{"a":1}', indent: 4, flags: [] }
    const first = serializeToolState(state, sampleCodec)
    const second = serializeToolState(state, sampleCodec)
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(first).toBe(second)
    expect(first).toMatch(/^1\.[A-Za-z0-9_-]+$/)
  })

  it('encodes multibyte input safely', () => {
    const state: SampleState = { input: 'こんにちは 🎉', indent: 2, flags: [] }
    const serialized = serializeToolState(state, sampleCodec)
    expect(serialized).toMatch(/^1\./)
    expect(parseToolState(serialized, sampleCodec)).toEqual(state)
  })

  it('distinguishes states that differ only in defaults', () => {
    const nonDefault: SampleState = { input: '', indent: 4, flags: [] }
    expect(serializeToolState(nonDefault, sampleCodec)).toMatch(/^1\./)
  })
})

describe('parseToolState', () => {
  it('returns the default state for a missing param', () => {
    expect(parseToolState(null, sampleCodec)).toEqual({ input: '', indent: 2, flags: [] })
  })

  it('falls back to defaults for a malformed envelope', () => {
    expect(parseToolState('', sampleCodec)).toEqual(sampleCodec.defaultState)
    expect(parseToolState('garbage', sampleCodec)).toEqual(sampleCodec.defaultState)
    expect(parseToolState('1', sampleCodec)).toEqual(sampleCodec.defaultState)
  })

  it('falls back to defaults for an unknown version', () => {
    const state: SampleState = { input: 'hi', indent: 2, flags: [] }
    const serialized = serializeToolState(state, sampleCodec)
    expect(serialized).not.toBeNull()
    const future = `2.${serialized!.slice(2)}`
    expect(parseToolState(future, sampleCodec)).toEqual(sampleCodec.defaultState)
  })

  it('falls back to defaults for invalid base64url / invalid JSON', () => {
    expect(parseToolState('1.!!!not-base64!!!', sampleCodec)).toEqual(sampleCodec.defaultState)
    expect(parseToolState('1.9Z94Cg==', sampleCodec)).toEqual(sampleCodec.defaultState)
  })

  it('falls back to defaults when the decoded JSON fails schema validation', () => {
    const json = JSON.stringify({ input: 'hi', indent: 9 })
    const payload = btoa(json).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
    expect(parseToolState(`1.${payload}`, sampleCodec)).toEqual(sampleCodec.defaultState)
  })

  it('falls back to defaults for oversized payloads', () => {
    const huge = `${STATE_PARAM_VERSION}.${'A'.repeat(MAX_STATE_PAYLOAD_LENGTH + 1)}`
    expect(parseToolState(huge, sampleCodec)).toEqual(sampleCodec.defaultState)
  })

  it('round-trips a full state value', () => {
    const state: SampleState = { input: '{"a":1}', indent: 0, flags: ['g', 'i'] }
    const serialized = serializeToolState(state, sampleCodec)
    expect(serialized).not.toBeNull()
    expect(parseToolState(serialized, sampleCodec)).toEqual(state)
  })
})
