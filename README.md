# Tool Forge

ブラウザ上で動作する Developer Toolbox。50 個程度の独立した小型ツールを持つ Web アプリケーション。

## Stack

- Frontend: React 19
- Build: Vite
- Language: TypeScript (strict mode)
- Package Manager: pnpm (workspaces)
- Unit / Component Test: Vitest + Testing Library
- E2E: Playwright
- Schema Validation: Zod
- Lint: ESLint (flat config)
- Format: Prettier

バックエンド・DB・認証・外部 SaaS には依存しない。すべてブラウザ単体で完結する。

## Commands (repository root)

```sh
pnpm install
pnpm dev          # dev server (http://localhost:5173)
pnpm lint
pnpm format       # prettier --write
pnpm format:check
pnpm typecheck
pnpm test         # vitest run (unit + component)
pnpm test:watch
pnpm build
pnpm e2e          # Playwright (build + preview + run)
```

## Repository structure

```text
apps/web/                     # Vite application (routing, pages, tool loading)
packages/core/                # Tool contract, registry, storage (framework-agnostic)
packages/ui/                  # Shared UI primitives
packages/tools/<tool-id>/     # One directory per tool
results/                      # Benchmark records
```

## Tool Contract

各 Tool は `packages/tools/<id>/` に以下を持ち、`packages/core` の `ToolDefinition` に従う。

```ts
// packages/core/src/tool-definition.ts
interface ToolDefinition {
  id: string // kebab-case, URL slug, ディレクトリ名と一致させる
  name: string
  description: string
  category: ToolCategory // data | encoding | text | crypto | date-time | web | code | visual | misc
  keywords?: readonly string[] // 検索用
}
```

Tool は Registry に手動登録しない。`scripts/generate-registry.mjs` が
`packages/tools/*/` を走査し、`apps/web/src/generated/tool-registry.ts` を自動生成する。
この生成ファイルは git 管理外で、`predev` / `prebuild` / `pretest` / `pretypecheck` 時に
自動的に再生成される。definition は zod で実行時検証され、id の重複やカテゴリ不正は
起動時にエラーになる。ディレクトリ名と定義内の id が一致しない場合は生成時に失敗する。

### 各 Tool ディレクトリの構成

```text
packages/tools/<id>/
├── definition.ts    # metadata (satisfies ToolDefinition)
├── logic.ts         # 純粋な変換ロジック。React に依存しない
├── logic.test.ts    # domain logic の単体テスト
├── Tool.tsx         # UI本体。ページ側がレンダリングするヘッダ以外の body を担う
├── Tool.test.tsx    # ユーザーに見える契約のコンポーネントテスト
├── index.ts         # definition と Tool を再export
├── package.json     # 依存: @tool-forge/core, @tool-forge/ui, react
└── tsconfig.json
```

`execute()` のような共通変換関数を契約に含めない。sync / async / interactive /
preview 型など UI 性質が Tool ごとに異なるため、React コンポーネント自体が
契約面である。変換ロジックは `logic.ts` の純関数として分離する。

## Adding a Tool

既存の共通コードを変更せずに追加できる。

1. `packages/tools/<id>/` を新規作成し、上記のファイル構成に従う
2. `definition.ts` の `id` をディレクトリ名と一致させる
3. 新しい npm 依存が必要なら自身の `package.json` に追加し `pnpm install`
4. ルートで `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
   (registry はゲート実行時に自動生成される。手動生成は `pnpm tools:gen`)

## Shared UI (packages/ui)

共通化すべきものだけを提供する。Tool 固有 UI までフォームへ押し込まない。

- `ToolShell` — ページ全体のレイアウト
- `ToolHeader` — ツール名・説明・カテゴリ
- `Panel` — タイトル付きセクション (Input / Output など)
- `ActionArea` — ボタン行
- `Button` — primary / secondary / danger
- `CopyButton` — クリップボードへコピー
- `Status` — error / success / info メッセージ

## Testing conventions

- テスト数より、domain logic・境界条件・malformed input・ユーザーに見える契約を優先する
- implementation detail への過剰なテストは禁止
- テストを削除・弱体化して CI を通すことは禁止

## Forbidden

- `any` の安易な使用、`@ts-ignore`、`@ts-expect-error` による問題隠蔽
- 不要な後方互換レイヤー、wrapper、fallback の乱造
- 巨大な万能 utility、単一巨大コンポーネントへの集約
- エラーの握り潰し、原因不明の setTimeout

## Git

- 各 Task は独立 branch (`agent/<tool-id>`) を使用する
- commit message は Conventional Commits (`feat(tools): add ...`)
