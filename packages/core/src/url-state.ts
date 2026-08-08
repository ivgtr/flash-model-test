import { z } from 'zod'

/**
 * Tool-side contract for shareable tool state.
 *
 * Each shareable tool ships its own codec (usually built with `zodStateCodec`).
 * The app never sees a tool's state shape: it only passes a `?s=` param value
 * through `parseToolState` / `serializeToolState`.
 *
 * `S` must be a plain, JSON-serializable object of *inputs only*. Derived
 * results are never persisted — they are pure functions of the inputs and are
 * recomputed by the tool on restore.
 */
export interface ToolStateCodec<S> {
  readonly defaultState: S
  /** Serializes a state value to a JSON string. Must not throw. */
  serialize(state: S): string
  /** Parses a JSON string. MUST NOT throw; `null` means invalid. */
  parse(raw: string): S | null
}

/**
 * Standard codec implementation for flat, JSON-able state objects.
 *
 * Failure semantics (this is where malformed / old / unknown-version state is
 * made safe):
 * - invalid JSON                  → `null` (caller falls back to `defaultState`)
 * - schema failure                → `null` (whole-state fallback)
 * - unknown keys                  → stripped (old app reading new URLs is safe)
 * - missing keys                  → per-field `.default(...)` values
 */
export function zodStateCodec<Schema extends z.ZodTypeAny>(
  schema: Schema,
  defaultState: z.infer<Schema>,
): ToolStateCodec<z.infer<Schema>> {
  return {
    defaultState,
    serialize(state) {
      return JSON.stringify(state)
    },
    parse(raw) {
      try {
        const value: unknown = JSON.parse(raw)
        const parsed = schema.safeParse(value)
        return parsed.success ? parsed.data : null
      } catch {
        return null
      }
    },
  }
}

/**
 * Transport envelope. A `?s=` value is `"<version>.<base64url(JSON)>"`.
 * Bump the version only for cross-cutting wire-format changes; any other
 * prefix is treated as unsupported and falls back to defaults.
 */
export const STATE_PARAM_VERSION = '1'

/** Query parameter name used to carry the serialized tool state. */
export const STATE_PARAM_NAME = 's'

/** Guards against absurdly long payloads in the URL (browsers cap URLs ~2 MB). */
export const MAX_STATE_PAYLOAD_LENGTH = 100_000

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlDecode(input: string): string | null {
  try {
    const normalized = input.replaceAll('-', '+').replaceAll('_', '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

/**
 * Serializes a state value into a `?s=` param value, or `null` when the state
 * equals the codec's `defaultState` (nothing to share).
 *
 * Deterministic: the same state always produces the same string, because
 * `JSON.stringify` output is deterministic for plain objects built in a fixed
 * key order (schema / `defaultState` shape, preserved by spread-updates).
 */
export function serializeToolState<S>(state: S, codec: ToolStateCodec<S>): string | null {
  if (JSON.stringify(state) === JSON.stringify(codec.defaultState)) {
    return null
  }
  return `${STATE_PARAM_VERSION}.${base64UrlEncode(codec.serialize(state))}`
}

/**
 * Parses a raw `?s=` param value into tool state.
 *
 * Total function: any failure (missing param, malformed envelope, wrong
 * version, bad base64url, bad JSON, schema failure, oversized payload)
 * returns `codec.defaultState`. Never throws.
 */
export function parseToolState<S>(raw: string | null, codec: ToolStateCodec<S>): S {
  if (raw === null) {
    return codec.defaultState
  }
  const separator = raw.indexOf('.')
  if (separator < 1) {
    return codec.defaultState
  }
  if (raw.slice(0, separator) !== STATE_PARAM_VERSION) {
    return codec.defaultState
  }
  const payload = raw.slice(separator + 1)
  if (payload.length > MAX_STATE_PAYLOAD_LENGTH) {
    return codec.defaultState
  }
  const json = base64UrlDecode(payload)
  if (json === null) {
    return codec.defaultState
  }
  return codec.parse(json) ?? codec.defaultState
}
