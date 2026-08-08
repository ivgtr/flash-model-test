# Architect C — Proposal: Shareable Tool State

## Current architecture

**Monorepo (pnpm):** `apps/web` (React 19 + react-router-dom v7 + Vite), `packages/core` (framework-agnostic), `packages/ui` (React primitives), `packages/tools/<tool-id>/` (19 tools).

**Routing / tool loading:**

- `apps/web/src/App.tsx`: `BrowserRouter` with `/` → HomePage, `/tools/:toolId` → ToolPage, `*` → NotFoundPage.
- `ToolPage.tsx`: reads `toolId` from `useParams`, looks up the definition in `toolRegistry` (built in `apps/web/src/app/tool-loader.ts` from the generated registry), then lazily loads the tool: `lazy(() => loadToolModule(toolId))` inside `ErrorBoundary` + `Suspense`, rendered as `<Tool />` (no props).
- `scripts/generate-registry.mjs` (run pre-dev/build/test/typecheck) generates gitignored `apps/web/src/generated/tool-registry.ts`: `toolDefinitions` array + `toolLoaders` record `toolId → dynamic import of packages/tools/<id>/index`. `loadToolModule` unwraps the module's `Tool` export.
- Each tool module (`index.ts`) exports `definition` and `Tool` only. There is no per-tool app-side configuration anywhere.

**Tool UI state pattern (all 5 targets):** local `useState` for inputs only; the result is computed **on button press** (`Format` / `Encode` / `Convert` / `Test`), not live. Results are derived values (`result: T | null`), never inputs.

| tool            | input state                                                             | derived result                        |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| json-formatter  | `input: string`, `indent: 0\|2\|4`                                      | `formatJson(input, indent)`           |
| base64-codec    | `direction: 'encode'\|'decode'`, `input: string`                        | `encodeToBase64` / `decodeFromBase64` |
| unix-timestamp  | `timestampInput: string`, `dateInput: string`                           | `parseTimestamp` / `dateToTimestamp`  |
| color-converter | `input: string`                                                         | `convertColor`                        |
| regex-tester    | `pattern: string`, `flags: ('g'\|'i'\|'m'\|'s'\|'u')[]`, `text: string` | `testRegex`                           |

**packages/core:** `tool-definition.ts` (zod schema + `parseToolDefinition`), `registry.ts`, `storage.ts` (key-value wrapper). Exports via `index.ts`. zod is a core dependency and **not** a dependency of `packages/tools`.

**packages/ui:** `ToolShell`, `ToolHeader`, `Panel` (has `actions?: ReactNode` slot), `ActionArea`, `Button`, `CopyButton` (copies `value` to clipboard, shows "Copied"), `Status`. All tools lay out `Panel`(s) + `ActionArea`(buttons) + result `Panel`.

**Tests:** per-tool `Tool.test.tsx` render the component directly (no router); `ToolPage.test.tsx` uses `MemoryRouter`; e2e in `apps/web/e2e/home.spec.ts`. `pnpm validate:full` = format + lint + typecheck + vitest + build + playwright.

## Problem

Input state dies on reload / cannot be shared. To make state shareable across 100–200 tools we need a mechanism where the **app never learns the shape of any tool's state** (no giant switch, no app-side schema registry) and the **tool never touches URL mechanics** (no duplicated URL code in 200 tools). Also: malformed/old URLs must degrade to defaults, and the URL must not churn on every keystroke.

## Proposed design

Three layers, each with a single responsibility:

### 1. `packages/core/src/url-state.ts` (new) — common serialization (framework-agnostic, pure)

The **tool-side contract** — what every Tool must implement:

```ts
// packages/core/src/url-state.ts
import { z } from 'zod'

export interface ToolStateCodec<S> {
  /** Plain, JSON-able object of *inputs only* (results are never persisted). */
  readonly defaultState: S
  /** Serialize a state value. Must not throw; returns JSON string. */
  serialize(state: S): string
  /** Parse a serialized string. MUST NOT throw; null = invalid → caller falls back to defaults. */
  parse(raw: string): S | null
}

/** Standard implementation for JSON-able states; covers all 5 target tools. */
export function zodStateCodec<S>(schema: z.ZodType<S>, defaultState: S): ToolStateCodec<S>
```

`zodStateCodec` semantics (this is where malformed/unknown/old handling happens):

- `parse`: `JSON.parse` inside try/catch → `schema.safeParse` → `parsed.data` or `null`. **Never throws.**
- Unknown keys in the URL are **stripped** by zod's default `z.object` behavior (new URLs opened by an old app are safe).
- Missing keys fall back per-field via `schema` defaults (`.default(...)`); if the whole object fails validation → `null` → whole-state fallback to `defaultState` (never a crash).

Transport envelope (shared, not tool-specific) — the `?s=` value format:

```
s = "<version>.<base64url(UTF-8 JSON produced by codec.serialize)>"     e.g. s=1.eyJpbnB1dCI6...
```

```ts
export const STATE_PARAM_VERSION = '1'
export function parseToolState<S>(raw: string | null, codec: ToolStateCodec<S>): S
// null / wrong version prefix / bad base64url / bad JSON / schema failure → codec.defaultState
export function serializeToolState<S>(state: S, codec: ToolStateCodec<S>): string | null
// JSON.stringify → base64url (A-Za-z0-9-_ , padding stripped → URL-safe, no %-escaping needed)
// returns null when state is deep-equal to codec.defaultState (nothing to share → Share disabled)
```

Versioning policy:

- **Transport version** (`1`): bumped only on wire-format changes; `parseToolState` rejects any other prefix → defaults. Never crash.
- **Tool-state evolution**: zod defaults + stripping as above. If a tool ever needs a hard break, it adds its own `v: z.literal(n)` field to its schema (documented option, not implemented now — no over-engineering).

`zod` is re-exported from core (`export { z } from 'zod'`) so tools keep a **single import surface** and `packages/tools` gains no new dependency (zod is already a core dependency).

### 2. `packages/ui/src/useToolUrlState.ts` (new) — React glue (router-agnostic)

```ts
export function useToolUrlState<S>(
  codec: ToolStateCodec<S>,
  options?: { paramName?: string }, // default 's'
): {
  state: S
  setState: React.Dispatch<React.SetStateAction<S>>
  shareUrl: string
  restored: boolean
}
```

- **Restore**: on mount (lazy `useState` initializer) reads `window.location.search`, extracts `paramName`, calls `parseToolState`. `restored` = whether a non-default state came from the URL. URL is **read once at mount** — no effect watching, no rewriting.
- **State**: `setState` is a plain React setter; it **never touches the URL** (constraint: no URL churn per keystroke).
- **Share**: `shareUrl` (memoized on state) = `serializeToolState` → `new URL(window.location.href)` + `searchParams.set('s', param)` → `''` when there is nothing to share. The tool does **not** write the URL; the address bar is only updated if the user navigates (copied URL always works regardless of the bar).
- Router-agnostic (works under BrowserRouter / MemoryRouter / direct renders); existing `Tool.test.tsx` render the component with `window.location.search === ''` → defaults → **existing tests pass unchanged**.

### 3. Per-tool wiring (5 tools) — tool-specific state lives with the tool

Each target tool gains `state.ts` (codec) and a small `Tool.tsx` rewrite:

```ts
// packages/tools/json-formatter/state.ts (new)
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
```

```tsx
// packages/tools/json-formatter/Tool.tsx (modified — inputs only)
const { state, setState, shareUrl, restored } = useToolUrlState(jsonFormatterStateCodec)
const [result, setResult] = useState<JsonFormatResult | null>(null)
useEffect(() => {
  if (restored) setResult(formatJson(state.input, state.indent))
}, [])
// ... <textarea value={state.input} onChange={(e) => setState((s) => ({ ...s, input: e.target.value }))} />
// ActionArea gains: <CopyButton value={shareUrl} label="Share" />
```

Tool contract summary:

1. Declare a `ToolStateCodec<S>`; `S` = JSON-able plain object of **inputs only**.
2. Swap the N input `useState`s for the hook's single `state` + `setState`.
3. Recompute the result once on restore via the `restored` flag (per-tool, 2–3 lines; the mechanism does not force auto-run — the tool decides).
4. Add `<CopyButton value={shareUrl} label="Share" />` to the existing `ActionArea` — existing component, no new UI, no new dependency.

### ToolPage wiring

Single one-line change: render `<Tool key={location.search} />`. The `key` makes the tool remount when the URL changes for the _same_ tool (SPA navigation / browser Back between two state-URLs), so the mount-time URL read always matches the current location. Component identity already changes across tools, so cross-tool navigation is unaffected.

The app (ToolPage / loader / generated registry) **never sees a tool state**: no switch, no schema registry, no new exports in `index.ts` (the codec is consumed inside `Tool.tsx`).

### The 5 tools mapping

| tool            | `S` (input state)               | schema defaults / enum                                      |
| --------------- | ------------------------------- | ----------------------------------------------------------- |
| json-formatter  | `{ input, indent }`             | `indent: 0\|2\|4` default `2`                               |
| base64-codec    | `{ direction, input }`          | `direction: z.enum(['encode','decode'])` default `'encode'` |
| unix-timestamp  | `{ timestampInput, dateInput }` | strings default `''`                                        |
| color-converter | `{ input }`                     | string default `''`                                         |
| regex-tester    | `{ pattern, flags, text }`      | `flags: z.array(z.enum(['g','i','m','s','u'])).default([])` |

All results stay derived; restore triggers the existing pure `logic.ts` functions once.

**Scaling to 100–200 tools:** adding a tool = 1 `state.ts` (5–15 lines) + 3-line hook adoption + 1 Share button. Zero shared-layer changes, zero app changes.

## Affected layers

| layer                                                                                               | change                                                                                                                         |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/src/url-state.ts`                                                                    | **new** — `ToolStateCodec`, `zodStateCodec`, `parseToolState`, `serializeToolState`, envelope/base64url, `STATE_PARAM_VERSION` |
| `packages/core/src/url-state.test.ts`                                                               | **new** — malformed/old/unknown-version/unknown-key/detault-equal cases                                                        |
| `packages/core/src/index.ts`                                                                        | export above + `export { z } from 'zod'`                                                                                       |
| `packages/ui/src/useToolUrlState.ts` + test                                                         | **new** — restore-at-mount, shareUrl memo, never rewrites URL                                                                  |
| `packages/ui/src/index.ts`                                                                          | export hook                                                                                                                    |
| `apps/web/src/pages/ToolPage.tsx`                                                                   | add `key={location.search}` to `<Tool />`                                                                                      |
| `packages/tools/{json-formatter,base64-codec,unix-timestamp,color-converter,regex-tester}/state.ts` | **new** — codec + state type                                                                                                   |
| same 5 × `Tool.tsx`                                                                                 | hook adoption + restore effect + Share button                                                                                  |
| same 5 × `Tool.test.tsx`                                                                            | **new tests** (restore from `?s=`, malformed `?s=` → defaults, unknown keys stripped), existing tests untouched                |
| `apps/web/e2e/home.spec.ts`                                                                         | 1–2 scenarios: open `?s=` URL → state restored; Share → copied URL opens with state                                            |

**Untouched:** `generate-registry.mjs`, `tool-loader.ts`, all `definition.ts` / `logic.ts` / `index.ts`, `HomePage`, other 14 tools, all existing tests.

## Data flow

**Restore (URL → Tool):**

```
/tools/json-formatter?s=1.<base64url>              (open URL in new tab / reload)
  → ToolPage: useParams → registry lookup (unchanged; unknown id → NotFound)
  → <Tool key={location.search}> mounts
  → useToolUrlState: window.location.search → URLSearchParams.get('s')
  → parseToolState: version check → base64url decode → JSON.parse → codec.parse (zod: strip unknown, default missing)   [any step fails → defaultState]
  → useState(initial) → controls render with restored input state
  → restored===true → Tool's effect re-runs pure logic → result shown
```

**Share (state → URL):**

```
user types (setState only — URL untouched)
  → memoized shareUrl = serializeToolState(state)   [null if == defaults → Share disabled]
  → user clicks <CopyButton value={shareUrl} label="Share"> → clipboard
  → paste into another tab → Restore flow above
```

## Trade-offs

- **Query param (`?s=`) vs hash vs path segment.** Query: works with react-router's existing `/tools/:toolId` route unchanged, browser Back/Forward and reload behave, and the param can be read at mount without route changes. Hash would need manual routing and pollutes the tool id anchor; path segments (`/tools/:toolId/state/...`) would change the route shape and require URL-encoding of every field in the path. Chosen: single query param.
- **Single opaque `s` param vs per-field params (`?input=...&indent=2`).** Per-field params leak tool schema into the app-level URL space and force the app to know field names (forbidden direction). A single opaque value keeps the app generic; the tool's codec is the only thing that understands it. Chosen: single `s`.
- **base64url(JSON) vs raw JSON in the param.** base64url is ~4/3 size but fully URL-safe (no `%22`-style escaping), compact in the address bar, and keeps newlines/multibyte safe. Raw JSON is readable but bloated and needs escaping. Chosen: base64url; the base64 is opaque so debuggers use the codec anyway.
- **zod-based codec (via core) vs hand-written parse per tool.** All 5 states are flat JSON-able objects; zod gives free type-safe coercion, unknown-key stripping, `.default()` migration semantics, and reuses an existing core dependency. Tools that need custom logic can still implement `ToolStateCodec` by hand (interface stays minimal).
- **Restore-on-mount (auto) vs restore-then-user-recomputes.** Auto-run on `restored` gives "same state visible immediately" (the goal's flow) with 2–3 lines per tool; the mechanism doesn't mandate it.
- **Copy-only Share vs address-bar rewrite.** The hook never rewrites the URL (hard constraint: no per-keystroke churn). Share copies a working URL even if the bar differs; optionally the bar could be synced once per Share click via `history.replaceState` — omitted now to avoid coupling to react-router internals (risk: router overwriting it on later navigations).
- **Results not persisted.** Results are derivable pure-function output; persisting them duplicates state and risks staleness. Restore recomputes them.
- **`key={location.search}` remount vs in-place update.** Remount is simple and correct for same-tool URL changes; re-render-in-place would need effect-watching the URL and re-entrant state sync (more code, more edge cases).

## Migration / implementation plan

1. **Shared, core:** add `url-state.ts` + exports (+ `z` re-export); write `url-state.test.ts` (malformed base64/JSON, wrong version, unknown keys stripped, missing keys defaulted, defaults-equal → null, round-trip). Run core tests.
2. **Shared, ui:** add `useToolUrlState` + index export + hook test (mount restore, no URL writes on setState, shareUrl round-trip).
3. **App:** `ToolPage` `key={location.search}` (one line).
4. **Per tool (repeat ×5):** add `state.ts`; adapt `Tool.tsx` (hook + restore effect + Share button in existing `ActionArea`); add restore/malformed tests to `Tool.test.tsx`. Existing tests must pass unmodified.
5. **E2E:** share-URL restore scenario (+ clipboard permission grant in playwright config if needed); keep existing e2e green.
6. **Gate:** `pnpm validate:full` (all suites incl. the existing 386 tests; new tests add, none removed/weakened).

Steps 1–3 are shared; step 4 is strictly per-tool and can be parallelized across the 5 tools.

## Risks

- **Mount-time URL read** is correct for reload/new-tab (full page load) and for SPA navigation only because of the `key={location.search}` remount; forgetting the key would leave stale state on same-tool URL changes. Mitigated by the key + tests.
- **Non-JSON-able state in future tools** (Date, Map, regex objects): the contract requires plain JSON-able `S`; zod schemas naturally keep this honest, and a hand-written codec can still custom-encode. Note in codec docs.
- **URL length limits** for very large inputs (browsers allow ~2 MB in Chrome; well above textarea realities). If ever hit, this design can switch to a storage-backed key (`?s=k:<id>`) without changing the tool contract.
- **Clipboard API** requires a secure context; dev/localhost and https are fine; e2e may need `permissions: ['clipboard-read','clipboard-write']` in the playwright context.
- **zod re-export from core** couples core's public API to zod — acceptable since zod is already core's dependency and tools already rely on core types; alternative (declaring zod in `packages/tools/package.json`) is noted but adds a workspace dependency.
- **Auto-run on restore** changes perceived behavior for URLs with state (result appears without a button click). Desired per the goal; tools that disagree simply skip the effect.
- **Broken URLs must never crash**: `parseToolState` and the hook are total functions (all failure paths → defaults); the `ErrorBoundary` remains as a final net.
