# Architect A — Shareable Tool State: Architecture Proposal

## Current architecture

**Routing** (`apps/web/src/App.tsx`): `BrowserRouter` with three routes; tools live at `/tools/:toolId` → `ToolPage`. No query-param handling anywhere.

**Tool loading** (`apps/web/src/pages/ToolPage.tsx`, `apps/web/src/app/tool-loader.ts`):

- `toolRegistry` (in `tool-loader.ts`, built from the gitignored generated `apps/web/src/generated/tool-registry.ts`) validates all definitions via zod (`parseToolDefinition`) and maps id → `ToolDefinition`.
- `ToolPage` looks up the definition; if unknown → `NotFoundPage`. Otherwise it renders `ToolShell` + back-link + `ToolHeader` (name/description/category), then `lazy(() => loadToolModule(toolId))` inside `ErrorBoundary` + `Suspense` with a "Loading tool…" fallback.
- `loadToolModule` resolves the dynamic `import()` of `packages/tools/<id>/index.ts` (generated `toolLoaders` map) and extracts `module.Tool` via a narrow cast; non-default exports are otherwise unused.

**Tool UI state patterns** (`packages/tools/*/Tool.tsx`): every tool is a zero-prop function component with local `useState` for its _inputs_ plus a separate `result` state that is computed on button click by pure `logic.ts` functions:

| tool            | input state (useState)                                                                                   | derived result                        |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| json-formatter  | `input: string`, `indent: IndentOption` (0\|2\|4, `DEFAULT_INDENT=2`)                                    | `formatJson(input, indent)`           |
| base64-codec    | `direction: 'encode'\|'decode'`, `input: string`                                                         | `encodeToBase64` / `decodeFromBase64` |
| unix-timestamp  | `timestampInput: string`, `dateInput: string`                                                            | `parseTimestamp` / `dateToTimestamp`  |
| color-converter | `input: string`                                                                                          | `convertColor(input)`                 |
| regex-tester    | `pattern: string`, `flags: RegexFlag[]` (`'g'\|'i'\|'m'\|'s'\|'u'`, from `FLAG_OPTIONS`), `text: string` | `testRegex(pattern, flags, text)`     |

All five results are **pure functions of the input state** (already unit-tested in `logic.test.ts`). Each tool exports `{ definition, Tool }` from `index.ts`.

**Core package** (`packages/core`, framework-agnostic, depends on zod): `tool-definition.ts` (zod schema + `ToolDefinition`), `registry.ts` (`ToolRegistry`), `storage.ts` (`KeyValueStorage` — localStorage wrapper, unused for URL state). Everything re-exported via `src/index.ts`.

**UI package** (`packages/ui`, React primitives): `ToolShell`, `ToolHeader` (no `actions` slot today), `Panel` (has an `actions` slot), `ActionArea`, `Button`, `CopyButton` (copies `value` via `navigator.clipboard`, shows "Copied", disabled on `''`), `Status`.

**Constraints honored by this design:** no new npm dependency (URLSearchParams + existing zod are enough); no React-internal-state persistence (tools explicitly re-declare their _inputs_ through a small codec); no DOM state; no giant universal JSON object; no `any`; no switch on tool names; no app-side schema registry; tool-specific state logic and common URL serialization live in different modules; only the 5 target tools are touched.

## Problem

Tool input state currently lives and dies inside each tool's component. There is no way to reconstruct a tool session from a URL: no shared notion of "a tool's state", no serialization, no restore, no share affordance. We need this for 5 tools today but the mechanism must be added for a tool _by the tool itself_, never by the app (otherwise 100–200 tools means 100–200 app edits).

## Proposed design

**Core idea: each shareable tool ships its own tiny, typed _state codec_ (pure functions, no React, no DOM) inside its lazy-loaded chunk. The app knows only the generic codec interface; it parses URL params, asks the codec to decode/encode, and wires a Share button. Nothing is rewritten to the URL except on an explicit Share click.**

URL shape (query params, tool is already identified by the path):

```
/tools/json-formatter?v=1&input=%7B%22a%22%3A1%7D&indent=2
/tools/regex-tester?v=1&pattern=%5Cd%2B&flags=gim&text=abc%20123
```

- `v=1` — app-owned **envelope version** (the only reserved key).
- All other params are tool-owned keys chosen by the tool's codec. No two tools clash because the path already namespaces them.
- No state in the URL → `/tools/json-formatter` renders exactly as today (defaults).

### New module 1: `packages/core/src/tool-state.ts` (framework-agnostic common contract)

```ts
export interface ToolStateParams {
  readonly [key: string]: string | undefined
}

/** A tool's own, explicit mapping between its input state and URL params. */
export interface ToolStateCodec<S> {
  empty: S
  /** Never throws. Unknown keys ignored, missing/invalid fields fall back per-field. */
  decode(params: ToolStateParams): S
  /** Returns raw (un-escaped) pairs; the app does percent-encoding. Never throws. */
  encode(state: S): Record<string, string>
}

export const STATE_ENVELOPE_PARAM = 'v'
export const STATE_ENVELOPE_VERSION = '1'
export const MAX_STATE_STRING_LENGTH = 100_000

/** v absent or equal to current version ⇒ decodable; anything else ⇒ app feeds codec {} (defaults). */
export function isEnvelopeSupported(params: ToolStateParams): boolean
```

Plus small, shared, typed readers so tools don't hand-roll validation (each returns the fallback for missing/invalid input, never throws):

```ts
export function readString(params: ToolStateParams, key: string, maxLength?: number): string
export function readEnum<T extends string | number>(
  params: ToolStateParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T
export function readStringArray(
  params: ToolStateParams,
  key: string,
  allowed: readonly string[],
  maxItems?: number,
): string[]
// string-array: split on chars, filter to `allowed`, dedupe, re-sort into `allowed` order → canonical URLs
```

All `encode`/`decode` implementations in the repo are pure and fully covered by unit tests in `tool-state.test.ts`.

### New module 2: `packages/ui/src/ToolStateProps.ts` (the React-side tool contract)

```ts
export interface ToolStateProps<S> {
  /** Decoded from the URL by the app; undefined when absent/unsupported → tool uses its defaults. */
  initialState?: S
  /** Tool reports its current *input* state on mount and on every change. The app encodes it lazily. */
  onShareStateChange: (state: S) => void
}
```

(Re-exported from `@tool-forge/ui`; lives in ui because it is a React/component-type contract, and `packages/tools` already depends on ui but must not depend on the web app.)

### The exact tool-side contract a Tool must implement

For each of the 5 tools, three small additions:

1. **`packages/tools/<id>/state.ts`** (new) — the state type + codec, reusing the tool's existing `logic.ts` constants (`INDENT_OPTIONS`, `FLAG_OPTIONS`, `DEFAULT_INDENT`):

```ts
// json-formatter/state.ts
import { readEnum, readString, type ToolStateCodec } from '@tool-forge/core'
import { DEFAULT_INDENT, INDENT_OPTIONS, type IndentOption } from './logic'

export interface JsonFormatterToolState {
  input: string
  indent: IndentOption
}

export const jsonFormatterStateCodec: ToolStateCodec<JsonFormatterToolState> = {
  empty: { input: '', indent: DEFAULT_INDENT },
  decode: (p) => ({
    input: readString(p, 'input'),
    indent: readEnum(p, 'indent', INDENT_OPTIONS, DEFAULT_INDENT),
  }),
  encode: (s) => ({ input: s.input, indent: String(s.indent) }),
}
```

2. **`index.ts`** — add `export { jsonFormatterStateCodec as stateCodec } from './state'`. The codec rides inside the same lazy chunk as `Tool` (index.ts is only reached via the dynamic loader), so **`scripts/generate-registry.mjs` and the generated registry need zero changes**, and the main bundle stays free of per-tool codec code even at 200 tools.

3. **`Tool.tsx`** — accept the props, initialize inputs from `initialState`, report changes:

```tsx
export function JsonFormatterTool({
  initialState,
  onShareStateChange,
}: ToolStateProps<JsonFormatterToolState>) {
  const [input, setInput] = useState(() => initialState?.input ?? '')
  const [indent, setIndent] = useState<IndentOption>(() => initialState?.indent ?? DEFAULT_INDENT)
  // report the *input* state (not the derived result) whenever it changes
  useEffect(() => {
    onShareStateChange({ input, indent })
  }, [input, indent, onShareStateChange])
  // optional: recompute the pure result once when a URL state was restored
  useEffect(() => {
    if (initialState !== undefined) setResult(formatJson(initialState.input, initialState.indent))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // …rest unchanged (input handlers, buttons, result panel)
}
```

The `result`/`tsResult`/`dateResult` states are **not** part of the shared state: they are pure functions of the inputs, so on restore they are recomputed from the restored inputs via the existing `logic.ts` functions (identical output, small URLs). For the 5 targets this is a 3-line mount effect; for a hypothetical tool with non-recomputable results the tool simply omits it.

### How the app wires restore + share (`apps/web/src/pages/ToolPage.tsx`)

ToolPage becomes the single place that owns the common flow. The `lazy()` call is replaced by an explicit async load (same chunk splitting, same "Loading tool…" fallback, same `ErrorBoundary`), because we now need the module's `stateCodec` export before rendering the tool:

```tsx
export function ToolPage() {
  const { toolId } = useParams()
  const definition = toolId === undefined ? undefined : toolRegistry.get(toolId)
  const [searchParams, setSearchParams] = useSearchParams()
  const [module, setModule] = useState<ToolModule<object> | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [shareParams, setShareParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    let cancelled = false
    setModule(null)
    setShareParams(null)
    setLoadError(false)
    loadToolModule(toolId).then(
      (m) => {
        if (!cancelled) setModule(m)
      },
      () => {
        if (!cancelled) setLoadError(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [toolId])

  // Decode ONCE per tool load (never re-run when the URL later changes via Share).
  const initialState = useMemo(
    () =>
      module?.stateCodec ? module.stateCodec.decode(parseToolStateParams(searchParams)) : undefined,
    [module], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const codec = module?.stateCodec
  const handleShareStateChange = useCallback(
    (state: object) => {
      if (codec) setShareParams(new URLSearchParams(codec.encode(state)))
    },
    [codec],
  )
  const shareUrl = useMemo(
    () =>
      shareParams && new URL(buildShareUrl(toolId, shareParams), window.location.href).toString(),
    [shareParams, toolId],
  )

  const handleShare = useCallback(() => {
    if (shareParams) setSearchParams(shareParams, { replace: true }) // address bar update, only here
  }, [shareParams, setSearchParams])
  // …
  return (
    <ToolShell>
      <Link className="backLink" to="/">
        ← All tools
      </Link>
      <ToolHeader
        name={definition.name}
        description={definition.description}
        category={definition.category}
        actions={
          codec && shareUrl ? (
            <CopyButton value={shareUrl} label="Share" onCopy={handleShare} />
          ) : undefined
        }
      />
      <ErrorBoundary>
        {module === null ? (
          <p className="muted">Loading tool…</p>
        ) : (
          <module.Tool initialState={initialState} onShareStateChange={handleShareStateChange} />
        )}
      </ErrorBoundary>
    </ToolShell>
  )
}
```

- `loadToolModule` gains the module type `ToolModule<S>` (`{ Tool: ComponentType<ToolStateProps<S>>; stateCodec?: ToolStateCodec<S> }`) and extracts `stateCodec` next to `Tool` (same single, narrow, existing-style cast at the loader boundary; no `any`; `S` is instantiated as `object` in ToolPage and as the exact state type in each tool).
- **Restore**: URL → `useSearchParams` → app checks `isEnvelopeSupported` + strips reserved keys → codec `decode` → typed state → `initialState` prop → tool's `useState` initializers (each field independently safe) → optional result recompute.
- **Share**: any input change → tool effect → `onShareStateChange` → app `codec.encode` → `buildShareUrl` → `CopyButton` value. Only the button click touches the address bar (`setSearchParams(..., { replace: true })`); keystrokes never do.
- **No codec (the other 13 tools)**: `ToolPage` hides Share, passes `undefined` + a no-op callback; their zero-prop components still typecheck against `ComponentType<ToolStateProps<object>>` (a component may ignore props) — **zero changes to non-target tools**.

### New module 3: `apps/web/src/app/share-state.ts` (common URL responsibilities)

```ts
/** URLSearchParams → raw string map; duplicate keys: last wins; no percent-decoding needed (URLSearchParams already decodes). */
export function parseToolStateParams(search: URLSearchParams): ToolStateParams
/** `/tools/<id>?v=1&k=v&…`; values percent-encoded via URLSearchParams.toString(). */
export function buildShareUrl(toolId: string, params: URLSearchParams): string
export const MAX_STATE_URL_LENGTH = 200_000 // guard: absurdly long state URLs are treated as no-state
```

`parseToolStateParams` keeps the reserved `v` key in the map; `isEnvelopeSupported` (core) decides whether the codec is allowed to decode. `decode` never runs against the raw URL — always against the normalized map, and the envelope guard means a future `v=2` URL degrades to defaults instead of crashing.

### Versioning / unknown-keys handling (summary)

- **Envelope** `v`: unknown, missing, or future version ⇒ the app skips decode entirely, tools get defaults. Bump `STATE_ENVELOPE_VERSION` only for cross-cutting format changes.
- **Per-field (tool-level)**: `decode` is permissively typed — unknown keys are ignored (forward compatibility: old app, new tool state and vice versa), missing fields get per-field defaults, wrong-typed / out-of-range enum values get per-field defaults, oversized strings are truncated to `MAX_STATE_STRING_LENGTH`, `flags` chars outside `FLAG_OPTIONS` are dropped and the rest are canonicalized.
- **No per-tool version number** is emitted initially: field-level forgiveness already answers "old/invalid state". If a tool ever needs to hard-reject old URLs, the codec interface can grow an optional `version` later — deliberately not built now (no over-abstraction).
- **Malformed URL** (`v=abc`, `%zz`, `indent=99`, wrong-tool params pasted in, 2 MB of junk): every path ends in the tool's defaults; nothing throws anywhere in the decode chain.
- **Duplicate keys**: last occurrence wins (deterministic).

### How the 5 tools map onto the contract

| tool            | state type                                              | keys (encode/decode)       | decode rule notes                                                                                                 |
| --------------- | ------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| json-formatter  | `{ input: string; indent: IndentOption }`               | `input`, `indent`          | `readString`; `readEnum(indent, INDENT_OPTIONS, DEFAULT_INDENT)`                                                  |
| base64-codec    | `{ direction: 'encode'\|'decode'; input: string }`      | `direction`, `input`       | `readEnum(direction, ['encode','decode'], 'encode')`                                                              |
| unix-timestamp  | `{ timestamp: string; date: string }`                   | `timestamp`, `date`        | both `readString`; `datetime-local` values round-trip fine percent-encoded                                        |
| color-converter | `{ input: string }`                                     | `input`                    | `readString`                                                                                                      |
| regex-tester    | `{ pattern: string; flags: RegexFlag[]; text: string }` | `pattern`, `flags`, `text` | `flags` = joined string `gim`; `readStringArray(flags, FLAG_OPTIONS)` canonicalizes order and drops invalid chars |

Each gets its own `state.test.ts` (decode fallback matrix + encode round-trip). Existing `Tool.test.tsx` files keep passing: props are optional, defaults identical.

### Other shared-component changes (backwards compatible)

- `ToolHeader` gains optional `actions?: ReactNode` (mirrors `Panel`'s existing slot).
- `CopyButton` gains optional `onCopy?: () => void` (fires after a successful copy) so the Share action can also update the address bar; existing usages unaffected.
- No new components, no new npm dependency — Share is literally `CopyButton` with `label="Share"` inside `ToolHeader`, reusing the existing "Copied" feedback and clipboard code.

## Affected layers

**Shared (new / modified):**

- `packages/core/src/tool-state.ts` (new) — codec interface, envelope constants/check, typed readers. `packages/core/src/index.ts` (exports). `packages/core/src/tool-state.test.ts` (new).
- `packages/ui/src/ToolStateProps.ts` (new) — React-side contract. `packages/ui/src/index.ts` (export). `packages/ui/src/ToolHeader.tsx` (+`actions`), `packages/ui/src/CopyButton.tsx` (+`onCopy`), their tests.
- `apps/web/src/app/share-state.ts` (new) — parse/build URL helpers (+ tests).
- `apps/web/src/app/tool-loader.ts` — `ToolModule<S>` type + `stateCodec` extraction.
- `apps/web/src/pages/ToolPage.tsx` — async load (replaces `lazy`), decode-once, Share wiring, loading/error fallback.
- `apps/web/src/pages/ToolPage.test.tsx` — new cases: restore happy path, malformed/unsupported-envelope fallback, stateless URL unchanged, Share button behavior.

**Per-tool (5 only):** `packages/tools/{json-formatter,base64-codec,unix-timestamp,color-converter,regex-tester}/state.ts` (new), `index.ts` (+`stateCodec`), `Tool.tsx` (props + init + report effect + optional recompute effect), `state.test.ts` (new).

**Untouched:** `scripts/generate-registry.mjs`, generated registry, `packages/core/{tool-definition,registry,storage}.ts`, the other 13 tools, all existing logic/tests.

## Data flow

**Restore (URL → state):**

```
/tools/json-formatter?v=1&input=%7B%22a%22%3A1%7D&indent=2
  → react-router: useParams(toolId) + useSearchParams
  → app/share-state.ts: parseToolStateParams → {v:'1', input:'{"a":1}', indent:'2'}
  → core: isEnvelopeSupported({v:'1'}) ✓
  → lazy chunk: loadToolModule → jsonFormatterStateCodec
  → codec.decode → { input:'{"a":1}', indent:2 }   (invalid → defaults, never throws)
  → <JsonFormatterTool initialState={...}/>
  → useState initializers → inputs restored
  → mount effect → formatJson(...) → result panel restored
```

**Share (state → URL):**

```
user types → setInput → tool effect → onShareStateChange({input, indent})
  → ToolPage: codec.encode → {input, indent:'2'} → buildShareUrl → /tools/...?v=1&input=…&indent=2
  → CopyButton(value=absolute URL, label="Share") renders "Copied" on click
  → onCopy → setSearchParams(params, {replace:true}) → address bar updated (once per Share, never per keystroke)
```

## Trade-offs

- **Query params vs hash vs path segment.** Chosen: query. It is the native react-router integration (`useSearchParams` works under `MemoryRouter` in tests), readable, survives reloads, and is namespaced by the tool path. Hash was rejected: it bypasses the router, muddies `location.hash` parsing, and its "not sent to server" advantage is moot for an SPA. A path segment (`/tools/:id/s/…`) needs routing changes and buys nothing over escaped query values. Known cost: very long inputs live in the URL (browsers allow ~2 MB; we also cap state URLs at 200 KB and strings at 100 KB).
- **Per-key params vs single JSON param.** Chosen: per-key. It matches the "no giant universal JSON object" constraint, keeps partial restoration trivial (field-level), and a single corrupt char can't invalidate the whole state. The one "array" case (flags) is a compact joined string.
- **Envelope versioning vs none.** `v=1` costs one URL char and cleanly answers future cross-cutting format changes; per-field forgiveness handles everything else without a per-tool version.
- **Shared URL ownership split.** App owns envelope + escaping + button + decode-once policy; tool owns field names, validation, defaults. Exactly the required responsibility separation; adding a 100th tool touches only that tool's folder.
- **Manual Share vs auto-sync.** URL is written only on explicit Share (requirement: no churn per keystroke). Share _also_ does `replaceState` so a reload restores — without pushing history entries or syncing on every input. We deliberately do not live-sync the URL on input (that would violate the constraint and spam history).
- **Results excluded from state.** They're pure functions of inputs; recomputing on restore keeps URLs small (regex match tables, formatted JSON would bloat them). Trade-off: the restored page shows results only if the tool opts into the recompute effect (all 5 targets do).
- **Codec in lazy chunk vs statically imported.** Chosen: lazy. `stateCodec` rides in each tool's existing chunk (via `index.ts`), so the generated registry and the main bundle stay untouched and per-tool codec code is loaded only when the tool is opened — the right shape for 100–200 tools. Trade-off: ToolPage must load the module explicitly instead of `lazy()` (same chunk splitting, ~10 extra lines, same fallback UI).
- **Decode-once per tool load.** Restore is applied at mount and never re-applied when the URL later changes (Share uses `replace`); back/forward across _different_ shared URLs does not reset a live session. Predictable and simple; a future "live URL sync" would build on the same codec without breaking this contract.
- **CopyButton `onCopy` extension.** A one-line backward-compatible prop beats a new component; no new dependency.

## Migration / implementation plan

1. **Core** (no app/tool deps): add `packages/core/src/tool-state.ts` + exports + `tool-state.test.ts`. Run `pnpm test` + typecheck.
2. **UI** (no tool deps): add `ToolStateProps`, `ToolHeader.actions`, `CopyButton.onCopy` + tests.
3. **App plumbing:** `tool-loader.ts` module type/extraction; `share-state.ts` (parse/build/envelope guard) + tests.
4. **ToolPage:** explicit async load (keep `ErrorBoundary`, fallback copy, NotFound for unknown ids), decode-once, Share wiring; extend `ToolPage.test.tsx` (restore / malformed / stateless / Share).
5. **Reference tool first:** `json-formatter` (state.ts + index.ts + Tool.tsx + state.test.ts); verify full flow manually (type → Share → copy → new tab → restore).
6. **Remaining 4 tools** independently: base64-codec, unix-timestamp, color-converter, regex-tester (same pattern; each is a self-contained diff).
7. **E2E:** one new Playwright spec (type → Share → open URL → restored; malformed URL → defaults; stateless URL → unchanged). No CI changes.
8. **Gate:** `pnpm validate:full` — all existing 386 unit tests plus new ones, typecheck (strict, no `any`), lint/format, build, e2e.

## Risks

- **ToolPage `lazy()` → explicit load refactor** could subtly change loading/error behavior; mitigated by preserving the same fallback copy and `ErrorBoundary` and by the existing ToolPage tests (`findByRole` async queries keep passing).
- **The single boundary cast** in `loadToolModule` (mirrors today's `module as { Tool? }`) relies on the tool author keeping `stateCodec` and `Tool`'s state type consistent; mitigated by per-tool codec round-trip tests and code review. No `any` anywhere (only `object`/`unknown`).
- **Per-keystroke parent re-render** (share URL rebuild on each `onShareStateChange`): trivially cheap (string building), but if it ever matters, the report callback can be switched to a ref read at click time without changing the contract.
- **URL length** for very large inputs (e.g. multi-MB JSON in the textarea): browsers tolerate ~2 MB URLs, and we cap state strings (100 KB) and total state URL (200 KB) — above that, restore safely falls back to defaults rather than failing.
- **Tool tests must keep rendering `<Tool />` prop-less** — props are optional, so no breakage; the report effect is a no-op-free addition.
- **Envelope `v=1` forever**: future format changes must bump the constant and keep `isEnvelopeSupported` tolerant (absent = OK). Documented in `tool-state.ts`.

---

## Summary

The design makes each shareable tool own a tiny, typed, pure **state codec** (`state.ts` exporting `stateCodec: ToolStateCodec<S>` with `empty`/`decode`/`encode`, re-exported from its existing `index.ts` so it travels inside the tool's lazy chunk with zero changes to the generated registry); the app knows only the generic interface, keeps all common URL responsibility in two small modules (`core/tool-state.ts`: envelope `v=1`, `isEnvelopeSupported`, typed readers; `app/share-state.ts`: param parsing/building with last-wins duplicates, URL-length guard), and never touches the address bar except on an explicit Share. ToolPage loads the tool module explicitly, decodes the URL params **once** per tool load through `stateCodec.decode` (which never throws — unknown keys ignored, each field falls back to its default, unsupported envelope yields defaults), passes the result as an optional `initialState` prop to `Tool`, which initializes its existing `useState` inputs from it and reports every input change via `onShareStateChange`; the app encodes that state, builds `/tools/<id>?v=1&…` (percent-encoded, per-key params, no JSON blob), and shows it as a `CopyButton` labeled "Share" inside a new `ToolHeader` actions slot, with an optional `onCopy` doing `setSearchParams(..., {replace:true})` so reload restores. Results are excluded from the URL (they are pure functions of inputs, recomputed on restore). Only the 5 target tools change (3 small files each, reusing their existing `logic.ts` constants); the other 13 tools, all existing tests, and the registry generator are untouched; the contract is per-tool explicit with no app-side switch, no `any`, no new dependency, and scales to 100–200 tools by adding codecs to tool folders alone.
