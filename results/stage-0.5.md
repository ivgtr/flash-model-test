# Stage 0.5 Result

- Model: opencode-go/deepseek-v4-flash
- Task: stage-0.5-parallel-development-hardening
- Result: DONE
- Started: 2026-08-09 03:57 JST / Completed: 2026-08-09 04:06 JST
- 18 files changed, 0 tests added, human intervention: none

## Findings Before Changes

- pnpm workspaces で `apps/*` / `packages/*` / `packages/tools/*` を glob 指定。
- `packages/tools/<id>/` が各自 `package.json` + `tsconfig.json` を持つ
  「1 Tool = 1 workspace package」構造。各 tool は `@tool-forge/core` / `@tool-forge/ui` /
  `react` に依存し、`pnpm-lock.yaml` の `importers` に tool ごとのエントリが存在した。
- `packages/core` は `registry.ts` で `ComponentType` (react) を import し、`ToolModule`
  interface を export していた。しかし `ToolModule` は repository 内で一度も使われていない
  (grep で定義・export 以外に一致なし)。README の「framework-agnostic」契約と矛盾。
- Registry は `scripts/generate-registry.mjs` による build 時 codegen。
  `apps/web/src/generated/` は gitignore 済みで predev/prebuild/pretest/pretypecheck が再生成。
- Husky pre-commit が format:check / lint / typecheck / test を実行 (Fast gate)。
- GitHub Actions は Stage 0 で既に削除済み (commit 125acd9)。

## Workspace Parallelism Test

元の「1 Tool = 1 workspace package」構造に対し、外部依存を一切持たない temporary tool
(`packages/tools/parallel-test-a/`, 依存は `workspace:*` と既存の `react` のみ) を追加して
再現テストを実施。

結果:

1. `pnpm install --frozen-lockfile` は `ERR_PNPM_OUTDATED_LOCKFILE` で失敗
   (lockfile が workspace package の増加を検出)。
2. `pnpm install` を実行すると共有 tracked file である `pnpm-lock.yaml` が
   **+16 行変更**された (新しい importer エントリの追加)。

つまり、npm dependency を 1 つも追加しない tool であっても、workspace package 化している
限り lockfile が必ず変更される。10〜20 Agent が並列で tool を追加すると全 Agent が
`pnpm-lock.yaml` を書き換えるため、tracked file 競合が構造的に発生する。

あわせて、generator が `packages/tools/` 直下の **全ディレクトリ** を tool とみなす
ため、`packages/tools/node_modules` の存在で codegen が失敗するバグも再現した
(`packages/tools/node_modules is missing required files`)。これは単一 workspace package 化
した後も必ず発生する (pnpm は workspace package ごとに node_modules を作る)。

## Decision

workspace 構造を変更した。理由:

- 「1 Tool = 1 workspace package」は通常の tool 追加だけで `pnpm-lock.yaml` が変わり、
  Parallel Extension Acceptance Criteria (tool 追加が `packages/tools/<tool-id>/**` だけで
  完結すること) を満たさないことを再現テストで実証したため。
- `packages/tools` を単一の workspace package とし、各 tool を素のディレクトリにした。
  tool 追加に package.json が不要になり、pnpm は新 tool を認識しない → lockfile 不変。
- tool 固有の依存は不要なため (Dependency Policy: 新規 npm 依存は ESCALATE)、
  per-tool package.json は実質的な役割を持っていなかった。

## Architecture Changes

```text
packages/tools/
├── package.json          # 単一 workspace package (@tool-forge/tools)
├── tsconfig.json         # **/*.ts(x) を include
├── json-formatter/
│   ├── definition.ts     # (package.json / tsconfig.json なし)
│   ├── logic.ts
│   ├── logic.test.ts
│   ├── Tool.tsx
│   ├── Tool.test.tsx
│   └── index.ts
└── ...
```

- `packages/tools/json-formatter/package.json` / `tsconfig.json` を削除
- `packages/tools/package.json` / `tsconfig.json` を新規作成
- `pnpm-workspace.yaml` から `packages/tools/*` glob を削除
- `pnpm-lock.yaml` の importer を `packages/tools/json-formatter` → `packages/tools` に統合
- `apps/web/src/generated/tool-registry.ts` の生成パス
  (`../../../../packages/tools/<dir>/definition`) はディレクトリ構造が不変のため変更不要

## Core Boundary

- `packages/core/src/registry.ts` の `import type { ComponentType } from 'react'` と
  未使用の `ToolModule` interface を削除。
- `packages/core/package.json` から `react` / `@types/react` を削除。
- これにより `packages/core` は React を import せず、package dependency としても
  React を必要としない。依存は `zod` のみ。
- UI 契約 (component 型) は実際に使われている `apps/web/src/app/tool-loader.ts` の
  ローカル型 (`ComponentType` + `{ Tool?: ComponentType }` キャスト) に既に集約されており、
  移動先は不要。未使用の抽象化は移動ではなく削除した。

## Registry Generator

再検証結果: 方式 (directory 走査 → 静的 import codegen) は維持。

- deterministic: `readdir` + sort で安定。同一入力 → 同一出力。
- directory 追加だけで自動登録される (temporary tool 3 つで確認、1 → 4 tools)。
- duplicate id: dir 名 == definition id の構造的検証により、異なる dir が同一 id を
  宣言することが構造的に不可能。実行時 `ToolRegistry` の重複チェックも残る。
- dir 名と id の不一致・id 形式不正・必須ファイル欠落: 生成時に明確なエラーで失敗。
- malformed definition: 起動時 zod 検証で fail-fast。

実際に再現した failure mode は 1 つ: `packages/tools/` 直下の非 tool ディレクトリ
(`node_modules`) を tool と誤認して失敗した。最小限の修正として
`.` 始まりのディレクトリと `node_modules` をスキップするようにした。単一 workspace
package 化後も `packages/tools/node_modules` は必ず存在するため、これは必須の修正だった。

## Local Quality Gates

GitHub Actions は追加・復元していない (commit 125acd9 でローカル検証へ移管済みのまま)。

- **Fast Validation** — `pnpm validate` = `format:check` + `lint` + `typecheck` + `test`。
  実測約 10 秒。husky pre-commit がこの 4 コマンドを実行する役割を維持 (高速なので変更せず)。
- **Full Validation** — `pnpm validate:full` = `validate` + `build` + `e2e`。
  Task 完了時・Stage 完了時・複数 Agent 統合後に実行。
- Agent の自己申告は成功判定に使用せず、外側から Full Validation を実行して判定する
  方針を README に明記。

## Parallel Extension Verification

temporary Tool:

- parallel-test-a
- parallel-test-b
- parallel-test-c

各 tool は definition/logic/logic.test/Tool/Tool.test/index の 6 ファイル構成
(package.json なし)。registry は自動的に 1 → 4 tools を認識し、生成ファイルに
3 tool 分の static import と loader が出現した。Fast Validation (58 tests) /
build / e2e すべて成功。

追加時に変更された shared tracked files:

- なし (git status は `packages/tools/parallel-test-*/` の untracked のみ新規出現、
  `pnpm-lock.yaml` / root `package.json` / `pnpm-workspace.yaml` / `apps/web/**` /
  `packages/core/**` / `packages/ui/**` / `scripts/**` は不変)

削除後の状態:

- 3 directory を削除し `pnpm validate:full` を再実行。format / lint / typecheck /
  tests (52) / build / e2e (4) すべて成功。registry は 1 tools に戻った。

## Benchmark Infrastructure

`benchmarks/schemas/benchmark-result.schema.json` を追加 (JSON Schema draft-07)。

- 必須: model / task / stage / startedAt / completedAt / agentResult / attempts /
  filesChanged / testsAdded / format / lint / typecheck / tests / build / e2e /
  agentReportedDone / verified / humanIntervention / inputTokens / outputTokens /
  costUsd / metricsSource
- `agentResult` は `DONE | RETRY_REQUIRED | ESCALATE | FAILED` の enum。
- 取得不能な値は `null` を許可 (推定値の埋め込みは禁止)。
- `metricsSource` で token / cost の取得元を記録可能。
- オプションの `notes` (文字列配列) を追加。

## Stage 1 Task Specs

`benchmarks/tasks/stage-1/` に 5 本を作成 (YAML)。各 spec は id / difficulty /
description / requirements / edge cases / required tests / allowed paths /
forbidden changes / validation commands / dependency policy を含む。

- base64-codec (easy)
- unix-timestamp (easy-medium)
- url-codec (easy)
- text-statistics (easy-medium)
- query-string-parser (medium)

契約 (encode 規則・10/13 桁判別・word の定義・duplicate key の保持など) を実行結果を
見て後から調整できないよう、数値的に期待できる形で spec に固定した。実装そのものは
書き込んでいない。依存ポリシー (新規 npm 依存は ESCALATE: DEPENDENCY_REQUIRED) を
各 spec と README に反映済み。

## Validation

- format: pass (prettier --check)
- lint: pass (eslint .)
- typecheck: pass (root tsc + 全 workspace package)
- tests: 52 pass
- build: pass (vite build)
- e2e: 4 pass (chromium, preview server)

## Remaining Risks

- `pnpm-lock.yaml` は共有ファイルのまま。新規 npm dependency 追加は依然として
  lockfile を変更するため、並列 tool 実装と分離して処理する (Dependency Policy で担保)。
- `packages/tools` 配下に package.json を持つディレクトリが誤って追加されると
  workspace package 化して lockfile 競合が再発する。Task Spec の forbidden changes
  で抑止する。
- Stage 2 の並列 Agent が同一 tool ディレクトリを触らない前提は保たれるが、
  prettier/eslint 設定や README を共有ファイルとして編集しない規約は Task Spec に依存。
- vitest は全 tool テストを単一 suite で実行するため、1 tool の失敗が他 tool の
  テスト実行を妨げる (分離性の問題)。Tool 数が増えたら `test.projects` 分割を検討
  (Stage 0 からの既知リスク、現状 2.4 秒程度で許容)。

## Stage 1 Readiness

READY
