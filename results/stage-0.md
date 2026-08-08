# Stage 0 Result

- Model: opencode-go/deepseek-v4-flash
- Task: Foundation (workspace / contract / registry / UI / testing / CI / sample tool)
- Result: DONE
- Started: 2026-08-09 03:03 JST / Completed: 2026-08-09 03:40 JST
- 67 files committed, 52 tests added, human intervention: none

## Architecture

pnpm workspaces モノレポ。framework は指定どおり React 19 / Vite 6 / TypeScript strict /
Vitest / Testing Library / Playwright / Zod / ESLint(flat) / Prettier。

```text
apps/web/                     # Vite app: routing (react-router), pages, tool loading
packages/core/                # Tool contract (ToolDefinition + zod), ToolRegistry, KeyValueStorage
packages/ui/                  # Shared primitives: ToolShell, ToolHeader, Panel, ActionArea,
                              #   Button, CopyButton, Status (CSS Modules)
packages/tools/<id>/          # One workspace package per tool (own package.json + tsconfig)
scripts/generate-registry.mjs # Registry codegen
```

採用した主な設計判断:

1. **Tool contract に `execute()` を置かない**。sync/async/interactive/preview 型が混在する
   ため、React コンポーネント自体を契約面とした。変換ロジックは各 tool の `logic.ts`
   の純関数に分離する規約を README に明記。
2. **Registry は手動 import を廃し、build 時 codegen** (`scripts/generate-registry.mjs`)。
   生成ファイルは gitignore し、`predev/prebuild/pretest/pretypecheck` で自動再生成。
   並列 Agent が同一ファイルを編集する競合を構造的に排除し、新しい tool directory は
   shared code を変更せずに自動登録される。
3. **各 tool を独立 workspace package** にする。依存追加が他 tool の package.json に
   触れない。pnpm の strict node_modules で isolation される。
4. **共通 UI は最小限**。ツール固有 UI をフォームへ押し込まない。
5. **型検証は zod + 起動時 fail-fast**。definition の id/カテゴリ不正、重複 id、
   directory 名と id の不一致は生成時または起動時に明確なエラーで失敗する。

## Implemented

- workspace (pnpm 11), React/Vite app, TS strict (noUncheckedIndexedAccess,
  verbatimModuleSyntax, noImplicitOverride を含む)
- routing: `/` (Home: カテゴリ別一覧 + 検索) / `/tools/:toolId` (lazy load + ErrorBoundary + NotFound)
- Tool contract + registry + typed localStorage wrapper (packages/core, 全テスト済み)
- shared UI (packages/ui, CSS Modules)
- サンプル tool: json-formatter (logic/UI/metadata/tests 分離、indent 0/2/4、エラー表示、Copy)
- Vitest (52 tests) / Playwright (4 E2E) / ESLint / Prettier / GitHub Actions CI
- README (tool 追加手順・契約・禁止事項)

## Validation

- lint: pass (eslint .)
- typecheck: pass (root tsc + 全 workspace パッケージ)
- unit tests: 33 pass (core 18 / json-formatter logic 13 / ui 2)
- component tests: 19 pass (ui 5 / json-formatter 5 / web pages 9)
- build: pass (vite build, lazy chunk splitting 確認)
- e2e: 4 pass (chromium, preview server)

## Tool Extension Test

`packages/tools/extension-test/` を新規作成 (definition/Tool/index/package.json/tsconfig)。
共有コードへの変更はゼロ。`pnpm test` (pretest で codegen 実行) → registry size 1→2、
HomePage テストが自動登録されたリンクを検証。typecheck/build も通過後に directory を削除し、
全ゲート再通過を確認。

## Problems Found

1. **vitest (vite-node) と import.meta.glob の相対パターン解決が不安定**。当初 glob による
   自動 discovery を実装したが、vite-node での `../` 相対 glob/import の解決が信頼できず、
   build と test で挙動が食い違った。→ codegen 方式へ切り替え (spec §9 の許容案の一つ)。
   なお、切り替え調査中に、生成コード側の相対深さ(3-up)の誤りも発見・修正済み。
2. **pnpm 11 の build-script ガード**: esbuild の postinstall が ignored builds 扱いになり
   全 pnpm コマンドが失敗。`allowBuilds` で許可 (esbuild は optional-deps バイナリで動作)。
3. **pnpm strict node_modules + vite-node**: `react/jsx-dev-runtime` がテスト時に解決不能
   → react/react-dom を root devDependencies へ (vite-node の外部化解決は root 起点)。
4. **@types/react が各パッケージに必要** (strict 分離のため)。CSS Modules の型は
   base tsconfig の `vite/client` で全パッケージ共通化。
5. **@types/node が root になく** root config の typecheck が失敗 → 追加。
6. **user-event の制約**: `setup()` が navigator.clipboard を差し替える / `{`,`[` を
   キー記述子として解釈する → テストでは spy を setup 後にかける / JSON 入力は
   fireEvent.change を使用。
7. **jest-dom の toHaveTextContent は空白を正規化** → `normalizeWhitespace: false` と
   `data-testid="json-output"` で厳密検証。
8. **TS の制約**: static method に `override` は不可、React.Component の `state` フィールド
   には override が必要 → constructor 初期化方式に。

## Improvements (Stage 1 前に実施すべき内容)

- CI はリモート実行できないためローカル検証で代用済み。GitHub リポジトリ公開後に workflow の実動作を確認する。
- Stage 2 で tool 数が増えたら、vitest の単一 suite が全 tool テストを含むため、失敗時の
  分離性向上として `test.projects` (workspace) 分割を検討。
- Stage 3 で Stryker による mutation testing を導入する (README の「Testing conventions」と整合)。

## Remaining Risks (20 並列 Agent 時)

- `pnpm-lock.yaml` は共有ファイル。新規依存の追加は lockfile 衝突の可能性があるため、
  Stage 2 の task 定義では依存追加を避けるか、追加時は ESCALATE を推奨する。
- ESLint/Prettier/CI 設定・README は共有。task 指示で編集範囲 (`packages/tools/<id>/**`)
  を厳守させる。
- 生成 registry は gitignore のため、生成前の `typecheck` は失敗する。標準コマンド経由なら
  pre-hook が走るが、raw `tsc` 実行のみの検証は避けるよう task 定義に明記する。
- Playwright は全 tool を build してから preview するため、他 agent の tool が build を
  壊すと自分の e2e も落ちる。統合時 (§30) の再検証でカバーする。
- vitest の全 suite 実行時間は tool 増加に比例するが、現状 2.5s 程度で問題なし。

## Stage 1 Readiness

READY
