import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  STATE_PARAM_NAME,
  parseToolState,
  serializeToolState,
  type ToolStateCodec,
} from '@tool-forge/core'

export interface ToolUrlStateApi<S> {
  /** Current input state. */
  state: S
  /** Plain React setter. Never touches the URL. */
  setState: Dispatch<SetStateAction<S>>
  /**
   * Absolute URL carrying the current state, or `''` when the state equals
   * `codec.defaultState` (nothing to share yet).
   */
  shareUrl: string
  /** `true` when a non-default state was restored from the URL on mount. */
  restored: boolean
}

export interface UseToolUrlStateOptions {
  /** Query parameter name used to carry the state. Defaults to `STATE_PARAM_NAME`. */
  paramName?: string
}

/**
 * Router-agnostic binding between a tool's input state and a shareable URL.
 *
 * - Restore: reads `window.location.search` exactly once at mount and decodes
 *   the state via `codec`. Malformed / missing / unsupported state safely
 *   falls back to `codec.defaultState` (never throws).
 * - `setState` never rewrites the URL — the address bar is not touched while
 *   typing.
 * - `shareUrl` is derived on demand, so a copied link always reflects the
 *   latest state.
 */
export function useToolUrlState<S>(
  codec: ToolStateCodec<S>,
  options?: UseToolUrlStateOptions,
): ToolUrlStateApi<S> {
  const paramName = options?.paramName ?? STATE_PARAM_NAME

  const [initial] = useState(() => {
    const raw = new URLSearchParams(window.location.search).get(paramName)
    const state = parseToolState(raw, codec)
    const restored = raw !== null && JSON.stringify(state) !== JSON.stringify(codec.defaultState)
    return { state, restored }
  })

  const [state, setState] = useState<S>(initial.state)

  const shareUrl = useMemo(() => {
    const serialized = serializeToolState(state, codec)
    if (serialized === null) {
      return ''
    }
    const url = new URL(window.location.href)
    url.searchParams.set(paramName, serialized)
    return url.toString()
  }, [state, codec, paramName])

  return { state, setState, shareUrl, restored: initial.restored }
}
