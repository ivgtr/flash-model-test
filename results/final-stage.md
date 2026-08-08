# Final Stage Result — Cross-Cutting Architecture Challenge (Shareable Tool State)

- Model: opencode-go/deepseek-v4-flash
- Stage: Final (cross-cutting architecture change on top of 18 tools / 386 tests)
- Feature: tool input state saved to URL; opening the URL restores the same tool + inputs
- Targets: json-formatter, base64-codec, unix-timestamp, color-converter, regex-tester
- Task spec frozen at `benchmarks/tasks/final-stage/shareable-tool-state.yaml` before worker start.

## Process Overview

1. **3 independent Architects (A/B/C)** started in parallel from the same frozen spec,
   each wrote a proposal without seeing the others (results/final-stage/architect-{A,B,C}.md).
2. **Independent Reviewer** compared A/B/C on 9 criteria and selected **C**
   (results/final-stage/review.md). The plan was frozen with 6 minor adjustments.
3. **Implementation** followed plan C (one orchestrator worker, no parallel tool workers —
   this stage measures cross-cutting change execution, not parallel tooling).
4. **Independent final code review** (results/final-stage/final-review.md) → APPROVE-WITH-MINOR,
   0 BLOCKER / 0 MAJOR, 3 MINOR (1 fixed, 2 recorded).
5. Final `pnpm validate:full` → pass.

## Architect Proposals (one-line each)

| plan | essence                                                                                                                                                                                                                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A    | per-tool typed state codec in the lazy chunk, app-owned envelope `v=1` + per-key query params, Share as CopyButton in new ToolHeader `actions` slot, decode-once restore, explicit module load instead of `lazy()`                                                                                                                   |
| B    | per-tool codec (`version`/`defaultValue`/`parse`/`serialize`) + core serialization + ui hook with 400ms debounced `history.replaceState`, global snapshot store for Share, native History API (bypasses react-router)                                                                                                                |
| C    | per-tool zod codec (`defaultState`/`serialize`/`parse`) via `zodStateCodec` in core, single opaque `?s=<version>.<base64url(JSON)>` transport, router-agnostic `useToolUrlState` hook in ui (mount-time restore, never writes URL), one-line ToolPage change (`key={search}`), Share = existing CopyButton in each tool's ActionArea |

## Reviewer selection: C

Reasons (from results/final-stage/review.md):

1. Lowest migration risk with strictest constraint compliance: app change is one line; URL never rewritten (no-keystroke-churn holds by construction); the 5 prop-less `Tool.test.tsx` files keep passing (jsdom `search === ''` → defaults); A's required `onShareStateChange` prop would have broken them at typecheck.
2. Correct responsibility split with least machinery: tool-specific state in tool folder, pure total parse/serialize in framework-agnostic core, one small hook in ui. No global store / debounce / useSyncExternalStore / app-side schema knowledge.
3. Best testability + type safety: failure handling is a pure unit-test matrix in core; state types are zod-inferred; zero `any`.
4. 100-200 tool scaling = tool-folder-only additions (state.ts + hook adoption + Share line).

No plan synthesis; the 6 "required adjustments" were clarifications/fixes to plan C, not a new design.

## Implementation (Plan C)

Shared layer (5 files):

- `packages/core/src/url-state.ts` (new): `ToolStateCodec<S>`, `zodStateCodec`, `STATE_PARAM_VERSION='1'`, `STATE_PARAM_NAME='s'`, `MAX_STATE_PAYLOAD_LENGTH`, total `parseToolState` / `serializeToolState` (base64url envelope). `packages/core/src/index.ts`: exports + `export { z } from 'zod'`.
- `packages/ui/src/useToolUrlState.ts` (new): `{ state, setState, shareUrl, restored }`; reads `window.location.search` once at mount, never writes the URL.
- `apps/web/src/pages/ToolPage.tsx`: `<Tool key={search} />` (via `useLocation()`).

Per-tool (5 tools × 3 files): `state.ts` (zod schema + codec, reusing `logic.ts` constants), `Tool.tsx` (hook adoption + restore recompute + Share `CopyButton`), `Tool.test.tsx` (+3 tests each).

Safety contract (implemented & tested):

- malformed / old / unknown-version / oversized / wrong-tool state → defaults, never throws
- unknown keys stripped, missing keys per-field defaulted (zod `.default()`)
- state-less URL → identical behavior to before
- URL never rewritten while typing; Share copies only

## Metrics

| metric                                | value                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Architects                            | 3 (A/B/C, independent)                                                                                         |
| Reviewer                              | 1 (selected C, no synthesis)                                                                                   |
| Plan revisions (formal PLAN_REVISION) | 0                                                                                                              |
| Recorded implementation deviations    | 1 (MINOR, see below)                                                                                           |
| Implementation workers                | 1                                                                                                              |
| Changed files                         | 28 (+1855 / −78)                                                                                               |
| Shared files changed                  | 5 (core url-state.ts [new], core index.ts, ui useToolUrlState.ts [new], ui index.ts, web ToolPage.tsx)         |
| Merge conflicts                       | 0 (single implementer; no concurrent edits)                                                                    |
| Validation runs                       | 10 (validate ×7, validate:full ×3)                                                                             |
| Failed validation runs                | 7                                                                                                              |
| Self-corrections (implementer)        | 10                                                                                                             |
| Architecture corrections              | 1                                                                                                              |
| Final reviewer findings               | BLOCKER 0 / MAJOR 0 / MINOR 3 (1 fixed, 2 recorded)                                                            |
| Final validation                      | pass — format / lint / typecheck / 423 unit tests (386 existing + 37 new) / build / 8 e2e (4 existing + 4 new) |
| Human interventions                   | 0                                                                                                              |
| Wall clock                            | ≈ 37 min (spec freeze 05:38 → final validate:full pass 06:15)                                                  |

## Validation runs detail

| #   | command            | result | failure category                                |
| --- | ------------------ | ------ | ----------------------------------------------- |
| 1   | pnpm validate      | FAIL   | format:check (11 files, incl. new source)       |
| 2   | pnpm validate      | FAIL   | format:check (4 results/*.md from workers)      |
| 3   | pnpm validate      | FAIL   | lint (2 unused imports)                         |
| 4   | pnpm validate      | FAIL   | typecheck (tools: `as const` flags too narrow)  |
| 5   | pnpm validate      | FAIL   | typecheck (web e2e: `context` fixture)          |
| 6   | pnpm validate      | FAIL   | typecheck (web e2e: wrong fixture name attempt) |
| 7   | pnpm validate      | PASS   | 423 tests                                       |
| 8   | pnpm validate:full | PASS   | build + 8 e2e                                   |
| 9   | pnpm validate:full | FAIL   | format:check (final-review.md from reviewer)    |
| 10  | pnpm validate:full | PASS   | final gate                                      |

All 7 failures were self-inflicted quality-gate failures (format/type/lint), classified
`TEST_DEFECT` / `IMPLEMENTATION_DEFECT` (none were architecture defects; no spec
ambiguity; no foundation limitation). Every failure was fixed before the next gate.

## Self-corrections (implementer, 10)

Categories are assigned one primary category per fix (non-overlapping by assignment;
each fix is counted once). Prettier-only fix rounds count as one per round.

| category | count | items                                                                                                                                                                                                               |
| -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format   | 2     | prettier --write rounds (source; results md)                                                                                                                                                                        |
| type     | 3     | zodStateCodec generic inference (input-type picked instead of output); regex `as const` flags too narrow; e2e `context` fixture typing                                                                              |
| test     | 4     | invalid-schema test (string-replace no-op on base64url); duplicate-render unmount in hook test; `vi.restoreAllMocks()` stripping the global clipboard mock; userEvent replacing `navigator.clipboard` → spy in-test |
| lint     | 1     | 2 unused imports (one lint run)                                                                                                                                                                                     |

## Architecture corrections (1)

- `zodStateCodec` generic signature changed from `z.ZodType<S>` to `Schema extends z.ZodTypeAny` with `z.infer<Schema>` — TS inferred the schema's _input_ type (all-optional with `.default()`) instead of the output type. Contract semantics unchanged; no PLAN_REVISION (not a plan defect).

## Recorded implementation deviation (1, MINOR)

- Frozen plan §6 step 4 said restore recompute via `useEffect(() => { if (restored) setResult(...) }, [])`; implemented with a lazy `useState` initializer instead (result computed exactly once at mount, no setState-in-effect double render, no eslint suppression needed). Functionally equivalent; flagged by the final reviewer (MINOR #2) and recorded here rather than as a formal PLAN_REVISION because the plan itself had no defect.

## Final code review (independent, results/final-stage/final-review.md)

Verdict: **APPROVE-WITH-MINOR**. All 9 focus areas compliant; forbidden-practice scan clean (no `any`, no `@ts-ignore`, no tool-name switch, no app-side schema registry, no giant JSON, no new dependency, no CI changes, no test weakening).

| severity | finding                                                                                          | disposition                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MINOR    | e2e clipboard race: `readText()` can beat async `writeText` (share-state.spec.ts:16,51)          | FIXED — assert `Copied` button before reading clipboard                                                                                                                    |
| MINOR    | restore recompute via lazy useState initializer vs plan's useEffect                              | RECORDED (see above)                                                                                                                                                       |
| MINOR    | `key={search}` remount has no direct SPA-navigation test (all restore tests are full page loads) | RECORDED — SPA same-tool `?s=` change is unreachable in-app (hook never rewrites the URL; only browser history/back-forward across already-loaded state URLs could hit it) |

## Tests added (37 unit/component + 4 e2e)

- `packages/core/src/url-state.test.ts` (16): codec round-trip, invalid JSON, schema failure, per-field defaults, unknown-key strip, default→null, deterministic URL, multibyte, non-default-only-state, missing param, malformed envelope, unknown version (future `v=2` rejected), invalid base64url, invalid decoded JSON, oversized payload, full round-trip.
- `packages/ui/src/useToolUrlState.test.tsx` (6): defaults, mount restore, malformed fallback, no URL rewrite on setState, shareUrl round-trip, empty shareUrl for defaults.
- 5 tools × 3 (`Tool.test.tsx`): restore from shared URL (+ result recompute), malformed URL → defaults, share URL copy / enablement.
- `apps/web/e2e/share-state.spec.ts` (4): JSON formatter input → Share → clipboard URL → new tab → restored (incl. result); malformed `?s=` → defaults, no crash; stateless URL unchanged; regex-tester share/restore.

## Requirement coverage check

- URL alone identifies tool (path) + state (query) — ✓
- Reload and other-tab restore — ✓ (e2e new-tab; reload = same mechanism)
- Malformed / old / unknown state → safe defaults, no crash — ✓ (unit matrix + e2e)
- State-less URL behaves as before — ✓ (e2e + unchanged tool tests)
- URL not rewritten per keystroke — ✓ by construction (hook never writes)
- Share integrated into existing UI — ✓ (existing CopyButton in each tool's ActionArea)
- No new npm dependency — ✓ (zod re-exported from core)
- 5 tools covered, other 13 tools untouched — ✓ (verified via git diff)
- Future 100-200 tools: per-tool `state.ts` + hook adoption only — ✓ (zero app/shared changes per tool)

## Final Benchmark Verdict (Stages 0 → Final)

### DeepSeek V4 Flash が向いている領域 (evidence-based)

1. **Independent, machine-verifiable implementation work** — Stage 2: 12/12 parallel tool implementations passed on the first session (Pass@1 = 12/12, 0 retries, 0 escalations, 0 scope violations) in 9 min 17 s parallel wall time. Stage 1: 5/5, Stage 0: foundation. The model reliably produces correct, convention-conforming, test-covered code when the contract is precise.
2. **Self-contained bounded feature work with clear contracts** — new tool folders, pure logic + component + tests per the repo's fixed structure; validation gates catch its own mistakes (self-corrections mostly format/type/test-expectation fixes, one real logic bug caught by its own tests in Stage 2).
3. **Iterative quality-gate recovery** — 7/10 failed validation runs in this stage were self-inflicted (format/type/lint) and every one was fixed autonomously; no failure required human intervention or spec changes.

### 向いていない、または Frontier Model へ Escalate すべき領域 (evidence-based)

1. **High-ambiguity / fundamental architecture from scratch** — the model itself _proposed_ three designs (final stage), but the winning design needed the reviewer's correction of a plan-A defect (required-prop breaking existing typechecked tests) that the proposing architect had missed. Selecting among designs, catching cross-cutting constraints, and reconciling designs with repository invariants is where Flash needed the ensemble (3 architects + reviewer). For truly novel architecture without such an ensemble, escalate.
2. **Cross-cutting changes that touch shared files under concurrency** — Stage 2's zero-conflict result was _enabled_ by the foundation (per-tool folders, auto-registry, no shared tracked files). When shared files are genuinely involved (this stage: core/ui/app), the orchestration must serialize shared edits; concurrent workers editing the same shared file is not a pattern Flash handles safely by itself.
3. **Worker reliability** — 1 of 3 architect workers returned an empty result on first attempt (relaunch succeeded). Output completeness from a fresh-context worker is not guaranteed; a retry/verification loop on worker artifacts is required.

### 推奨 Routing

| work type                                                                      | route                                                                                               |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Independent / machine-verifiable work (new tools, pure logic, tests)           | Flash, parallel (12+ workers OK)                                                                    |
| Cross-cutting but bounded work (shared mechanism with a clear contract)        | Flash + Architect/Reviewer ensemble (1 implementer, serialized shared edits)                        |
| High ambiguity / fundamental architecture (no existing invariant to anchor to) | Frontier model; or Flash ensemble only as a _candidate generator_ with mandatory independent review |

### Final Verdict

- **推奨用途**: 規約が明確な小型ツール・ユーティリティ・バッチ実装、既存パターンへの追従作業、テスト/quality gate で検証可能な bounded feature。アーキテクチャが既に確立した後の中規模横断変更（この Stage の Shareable Tool State と同型）。
- **避ける用途**: 共有ファイルへの並列同時編集を伴う作業、仕様曖昧なままの設計、レビュー工程なしの「一人で全部設計して確定」フロー。
- **最大並列度の考え方**: 並列度は「shared-file contention が 0 かどうか」で決める。ツール追加は 12 並列 OK（実測）。shared file を触る作業は並列 Worker 数を 1 に絞り、Architect/Reviewer の調査・検証は並列化する（今回は Architect ×3 並列 + Reviewer 1、実装は 1 Worker）。
- **必要な quality gate**: `pnpm validate:full` 級の完全ゲート（format + lint + typecheck + unit + build + e2e）を毎 Task 終了時・統合後に実行。Agent の自己申告を成功判定に使わない（Stage 1 の教訓を全 Stage で維持）。
- **必要な escalation rule**: DEPENDENCY_REQUIRED（新規 dependency が必要）→ 即停止して人間/別系統で処理。FOUNDATION_CHANGE_REQUIRED（共有 foundation 変更が必要）→ 全 Worker 停止して直列で処理。Plan の明確な欠陥が判明 → PLAN_REVISION を記録してから変更（今回 0 回）。Worker 成果物が空/不完全 → 即リトライ（Architect C の初回失敗で実証済みの必要ルール）。
