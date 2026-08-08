# Architect B — Shareable Tool State 設計案

## Current architecture

- **Routing**: `apps/web/src/App.tsx` は `BrowserRouter` + `/tools/:toolId` ルートのみ。`ToolPage.tsx` が `useParams()` で toolId を取り、`toolRegistry.get(toolId)` で定義を引き、`lazy(() => loadToolModule(toolId))` でツールを遅延ロードして `<Tool />` を props 無しで描画する。URL クエリは一切読んでいない。
- **Registry**: `scripts/generate-registry.mjs` が `packages/tools/*/definition.ts` + `index.ts` の存在を機械的に検証して `apps/web/src/generated/tool-registry.ts`（gitignored）を生成。`packages/core/src/registry.ts` が zod で定義を検証する。
- **Core package** (`@tool-forge/core`, framework-agnostic): `tool-definition.ts`（zod schema / ToolDefinition）、`registry.ts`、`storage.ts`（KeyValueStorage = localStorage ラッパー）。index.ts から export。
- **UI package** (`@tool-forge/ui`, React 依存のみ): `ToolShell` / `ToolHeader` / `Panel`（`actions` スロットあり）/ `ActionArea` / `Button` / `CopyButton` / `Status`。react-router には依存していない。依存は `@tool-forge/core` と `react` のみ。
- **Tool の state パターン**: 全 5 Tool とも `useState` を素朴に使う。input 系文字列（`input` / `pattern` / `text` / `timestampInput` / `dateInput`）、enum（`indent` 0|2|4、`direction` encode|decode、`flags` array）、派生結果（`result` / `tsResult` / `dateResult`）を別々の useState で保持。派生結果はボタンクリックで算出される。
- **テスト**: 既存 386 テスト。各 Tool の `Tool.test.tsx` は **Router 無し**で `<JsonFormatterTool />` を直接 render している（重要制約）。

## Problem

- ツールの入力状態は component 内の `useState` に閉じ、URL に永続化する手段がない。
- 5 Tool を個別対応しつつ、app 側にツール名による switch や全ツール分の schema を持ちたくない。共通の serialization 責務と Tool 固有の state 責務を分離する必要がある。
- URL を毎キーストローク書き換えると、履歴汚染・パフォーマンス・undo 破壊を起こす。

## Proposed design

方針: **「Tool 固有 codec（parse/serialize/デフォルト）を各ツールのディレクトリに同居させ、共通の serialization・React binding は core/ui が提供する」** 方式。URL パスが Tool を特定し、クエリパラメータが state を保持する。restore はマウント時 1 回、URL 書き込みは debounce + `history.replaceState`（履歴を増やさない）。Share はヘッダーに置いた CopyButton で、URL は**同期更新される in-memory snapshot** から構築する（debounce 中の遅延を回避）。

### 新モジュール・関数・型

**1. `packages/core/src/state-codec.ts`**（共通 URL-serialization 責務、pure・framework-agnostic、zod 不要）

```ts
export interface ToolStateCodec<S extends object> {
  version: number // スキーマ破壊的変更時に increment（現状は全て 1）
  defaultValue: S
  /** 1 フィールドずつ検証。欠損・不正は default に倒し、未知キーは無視。絶対に throw しない */
  parse(params: Readonly<Record<string, string | undefined>>): S
  /** 全フィールドを文字列化。default と等しいフィールドは省略可（core が比較して省く） */
  serialize(state: S): Record<string, string>
}

export function parseToolStateParams<S>(codec: ToolStateCodec<S>, search: string): S
// URLSearchParams → Record 化（最後の値を採用、`v` キーを剥がす）→ codec.parse → 常に安全な S
export function serializeToolState<S>(codec: ToolStateCodec<S>, state: S): string | null
// codec.serialize → default 値フィールドを省略 → `v=<version>` を付与 → URLSearchParams.toString()
// 合計長が MAX_STATE_QUERY_LENGTH(32_000、Safari pushState 上限の安全側) を超えると null（共有不可）
```

- 文字列フィールドの妥当性は**常に受け入れる**（無効 JSON 等は既存 logic がエラー表示するだけなので復元でクラッシュしない）。
- `parse` は null を返さない: 「不正 = そのフィールドだけ default」が契約。要件「malformed/old/invalid でクラッシュせず安全に戻る」を構造的に保証する。
- versioning: 将来フィールド名が変われば旧キーは unknown として無視され default に倒れる。同名のまま意味が変わればフィールド検証が reject して default。`v` は記録用で、必要なら future codec が `v` を読んで分岐できる。

**2. `packages/ui/src/tool-state-store.ts`**（React 無関係の小型 store、Share 用スナップショット）

```ts
export function setToolStateSnapshot(toolId: string, query: string | null): void
// null = サイズ超過で共有不可。'' = default 状態
export function getToolStateSnapshot(toolId: string): string | null | undefined // undefined = 未マウント
export function subscribeToolStateSnapshots(callback: () => void): () => void
```

Map<toolId, query> + リスナー集合。`useSyncExternalStore`（React 19）で購読する。

**3. `packages/ui/src/use-tool-url-state.ts`**（React binding、全ツール共通の hook）

```ts
export interface ToolUrlStateApi<S> {
  state: S
  setState: (next: S | ((prev: S) => S)) => void
  clear: () => void // defaultValue へ戻し、URL のパラメータを除去
}
export function useToolUrlState<S extends object>(
  toolId: string,
  codec: ToolStateCodec<S>,
): ToolUrlStateApi<S>
```

実装:

- マウント時: `new URLSearchParams(window.location.search)` → `parseToolStateParams` → `useState(initializer)`。**restore はマウント時 1 回のみ**（外部 URL 変更で入力中の state を上書きしない）。
- `setState`: React state 更新 + **同期で** snapshot へ `serializeToolState` 結果を登録（Share 用）+ 400ms debounce で `history.replaceState(null, '', pathname + '?' + query)`。query が null（超過）や ''（default）なら replace をスキップ/パラメータ除去。unmount で timer を clear。
- 依存: react + `@tool-forge/core` のみ。**react-router を使わない**（理由は Trade-offs 参照）。

**4. `apps/web/src/app/share-tool-button.tsx`**（app 配線層）

```tsx
export function ShareToolButton({ toolId }: { toolId: string })
// useSyncExternalStore で getToolStateSnapshot(toolId) を購読
// URL = window.location.origin + pathname + (query ? '?' + query : '')
// 既存 <CopyButton label="Share" value={url} /> を返す（新しいプリミティブは作らない）
```

### Tool 側の契約（各 Tool が実装するもの）

対象 5 Tool のディレクトリに `state.ts` を追加し、Tool.tsx の useState を hook に置換する:

| tool            | `state.ts` の state 型                                  | パラメータ名               | 検証ルール                                                                          |
| --------------- | ------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| json-formatter  | `{ input: string; indent: 0\|2\|4 }`                    | `input`, `indent`          | `indent` は `INDENT_OPTIONS` 内のみ、他は default(2)                                |
| base64-codec    | `{ direction: 'encode'\|'decode'; input: string }`      | `direction`, `input`       | `direction` は `encode`/`decode` のみ                                               |
| unix-timestamp  | `{ timestamp: string; date: string }`                   | `timestamp`, `date`        | 文字列パススルー（不正値は既存 logic がエラー表示）                                 |
| color-converter | `{ input: string }`                                     | `input`                    | 文字列パススルー                                                                    |
| regex-tester    | `{ pattern: string; flags: RegexFlag[]; text: string }` | `pattern`, `flags`, `text` | `flags` は文字列（例 `"gim"`）→ `FLAG_OPTIONS` で filter + canonical order に正規化 |

各 codec の例（json-formatter）:

```ts
import { type ToolStateCodec } from '@tool-forge/core'
import { DEFAULT_INDENT, INDENT_OPTIONS, type IndentOption } from './logic'

export interface JsonFormatterState {
  input: string
  indent: IndentOption
}

export const jsonFormatterStateCodec: ToolStateCodec<JsonFormatterState> = {
  version: 1,
  defaultValue: { input: '', indent: DEFAULT_INDENT },
  parse(params) {
    const rawIndent = params['indent']
    const indent =
      rawIndent !== undefined && INDENT_OPTIONS.includes(Number(rawIndent) as IndentOption)
        ? (Number(rawIndent) as IndentOption)
        : DEFAULT_INDENT
    return { input: params['input'] ?? '', indent }
  },
  serialize(state) {
    return { input: state.input, indent: String(state.indent) }
  },
}
```

Tool.tsx 側（既存テストを壊さない形）:

```tsx
const { state, setState, clear } = useToolUrlState('json-formatter', jsonFormatterStateCodec)
const [result, setResult] = useState<JsonFormatResult | null>(null) // 派生結果は従来どおり local
const handleClear = () => {
  clear()
  setResult(null)
}
```

派生結果（result 等）は URL に**保存しない**。仕様のゴールは「同じ入力状態の復元」であり、結果は入力から導出されるため。

### app 側の配線（restore + share）

- **restore**: ToolPage は無変更に近い（後述の Header だけ）。restore は遅延ロードされた Tool 内部の hook が行う — codec はツールと同一モジュールなので、app がツールの schema を知る必要が一切ない。
- **share**: `ToolHeader` に `actions?: ReactNode` を追加（既存 `Panel` の `actions` スロットと同パターン）し、ToolPage が `<ToolHeader ... actions={<ShareToolButton toolId={toolId} />} />` を渡す。ToolPage は lazy ツールの内部 state を知らなくてよい（snapshot store が橋渡し）。

### URL フォーマット

`/tools/json-formatter?input=%7B%22a%22%3A1%7D&indent=4&v=1`

- パス = Tool 特定、クエリ = state（フィールド毎の名前付きパラメータ）。
- 全フィールドが default ならクエリは付かない（従来どおりの素のツール URL = 互換）。
- 未知パラメータ・`v` 不一致・不正値はすべて無害（無視 or フィールド単位で default）。

## Affected layers

**新規ファイル**

- `packages/core/src/state-codec.ts` + `state-codec.test.ts`
- `packages/ui/src/use-tool-url-state.ts`、`packages/ui/src/tool-state-store.ts`（+ 必要ならテスト）
- `apps/web/src/app/share-tool-button.tsx`
- `packages/tools/{json-formatter,base64-codec,unix-timestamp,color-converter,regex-tester}/state.ts`

**変更ファイル**

- `packages/core/src/index.ts`（codec 系 export 追加）
- `packages/ui/src/index.ts`（hook / store の export 追加）
- `packages/ui/src/ToolHeader.tsx`（`actions?` プロップ追加）
- `apps/web/src/pages/ToolPage.tsx`（ToolHeader に ShareToolButton を渡す 1〜2 行）
- 5 × `packages/tools/<id>/Tool.tsx`（useState → hook 置換、派生 result は local のまま）

**変更しないもの**: `generate-registry.mjs`、generated registry、`App.tsx`、`storage.ts`、他 15 Tool、`definition.ts`、`index.ts`、`logic.ts`。

## Data flow

**URL → 復元**: 共有 URL を開く → `BrowserRouter` が `/tools/:toolId` にマッチ → ToolPage が定義解決 + lazy Tool マウント → hook が `window.location.search` → `parseToolStateParams`（Record 化 → `v` 除去 → `codec.parse` がフィールド毎検証・unknown 無視・default フォールバック）→ 初期 state として入力欄に反映。不正/古い/壊れた URL は必ず安全な state に収束。URL 無しは defaultValue → 従来動作。

**state → URL**: 入力変更 → `setState`（React state 更新は即時）→ 同期で snapshot に query を登録（Share が常に最新値を読める）→ 400ms debounce 後に `serializeToolState`（default 省略 + `v` + 長さガード）→ `history.replaceState`（履歴追加なし、毎キーストローク書き換えなし）。reload・別タブで同じ URL → 上の復元フロー。

**Share**: ヘッダーの `ShareToolButton` が snapshot の最新 query から URL を組み立てて CopyButton がコピー。debounce 未満でクリックしても最新 state が入る（スナップショットは同期更新のため）。サイズ超過時は query=null → 素のツール URL をコピー（クラッシュなしの劣化）。

## Trade-offs

- **query param vs hash vs path**: query を選択。path はツール識別が既にあり、hash は URL 共有・サーバーログ・`history.replaceState` で不利。query なら既存 `/tools/:toolId` ルートを無変更で通せる。
- **react-router の `useSearchParams` を使わない（native History API）**: 既存 386 テストのうち 5 ツールの `Tool.test.tsx` が Router 無しで Tool を直接 render しているため、`useSearchParams` はそれらを破壊する（Router コンテキスト必須になる）。native `history.replaceState` + popstate なら既存テスト無変更・ui に react-router 依存も追加しない。デメリット: ルーターと URL 同期が別経路になるが、本機能はナビゲーションではなく現在ページのパラメータだけを触るため衝突しない。
- **1 フィールド = 1 パラメータ（JSON blob でない）**: 巨大万能 JSON object 禁止を満たし、手編集しやすく、未知キー・部分復元・マージが構造的に安全。配列（flags）は canonical 順の結合文字列で表現。
- **restore はマウント時 1 回のみ（back/forward での復元はしない）**: 入力中に外部 URL 変化で state が巻き戻る事故を防ぐ。要件（別タブ・reload）は満たす。back/forward 復元は将来の拡張として明記。
- **入力のみ保存（派生結果は保存しない）**: ゴールが「入力状態の復元」のため。結果は環境（ロケール等）に依存しうる。コスト: 共有直後は再計算ボタンを押す必要がある。
- **debounce 400ms**: キーストローク毎書き換え禁止と、直後の reload での復元可能性の妥協点。直後に reload すると URL が古い可能性がある（許容し、unmount で timer を安全に破棄）。
- **共有は自動（マウントで復元）**: 手動復元 UI は不要。要求どおり自動。
- **サイズ上限 32,000 chars のガード**: Safari の pushState 上限による SecurityError クラッシュを予防。超過時は共有不可（素の URL に劣化）。巨大入力の URL 共有は本質的に不可能なので別機構（短期共有等）は将来課題。

## Migration / implementation plan

1. **core**: `state-codec.ts` + unit tests（parse の lenient 動作、default 省略、`v`、長さガード、unknown キー無視）→ index.ts export。`pnpm validate` で緑を確認。
2. **ui**: `tool-state-store.ts` + `use-tool-url-state.ts`（+ テスト）→ index.ts export。既存 ui テストが通ることを確認。
3. **ToolHeader**: `actions?` 追加（Panel と同じパターン）。
4. **app**: `share-tool-button.tsx` 作成、ToolPage に配線。既存 ToolPage.test が通ることを確認。
5. **per-tool（5 ツールを 1 つずつ）**: `state.ts` 追加 → Tool.tsx を hook に置換（派生 result は useState のまま）→ 既存 Tool.test.tsx が無修正で通ることを確認 → 新規テスト追加（例: `window.history.replaceState` で URL を仕込み render → 入力が復元される / 不正 `indent` が default に倒れる）。
6. **app テスト追加**: ToolPage.test に「URL 付きで開くと state 復元」「Share ボタンが現行 state 入り URL をコピー」。
7. **全体**: `pnpm validate:full`（386 既存 + 新規、lint、typecheck、build、e2e）。

## Risks

- **既存テストの互換**: hook を Router 非依存にすることで回避済みだが、もし実装で `useSearchParams` に寄せると 5 ツール分のテストが即死する。実装時に最初の検証ポイント。
- **jsdom の `history.replaceState` / `navigator.clipboard`**: CopyButton は既に clipboard mock のテスト慣習あり。replaceState は jsdom で動作する。
- **debounce タイミング**: 入力直後の reload で state が失われる（トレードオフとして明記済み）。400ms は要件とのバランス。
- **size guard の閾値**: 過剰に小さいと共有体験を損ない、大きいと Safari でクラッシュ。32,000 は安全側。
- **enum 検証の型キャスト**: `INDENT_OPTIONS.includes(... as IndentOption)` のような箇所で `any` を使わず型安全を保つ（generics と既存定数で対応可能）。
- **scope creep**: 「結果も保存」「back/forward 復元」「全 20 ツール対応」に手を出すと作業が膨張する。対象 5 ツール + 入力のみに厳守する。

---

## 要約（orchestrator 向け）

5 ツールの各ディレクトリに `state.ts`（`ToolStateCodec<S>`: `version` / `defaultValue` / フィールド単位で検証し不正・欠損・未知キーを無害化する `parse` / `serialize`）を同居させ、共通の pure serialization（`parseToolStateParams` / `serializeToolState`、default 省略・`v` バージョン・長さガード）を `packages/core` に、React binding（`useToolUrlState`: マウント時 1 回の復元 + 400ms debounce の `history.replaceState`、毎キーストローク書き換えなし）を `packages/ui` に置き、app 側は ToolHeader の新 `actions` スロットに CopyButton ベースの Share ボタンを 1 つ置くだけで済む設計。Share は debounce を待たず最新 state を返す in-memory snapshot store から URL を構築する。URL は `/tools/:toolId?フィールド名=値&v=1` 形式（巨大万能 JSON object 禁止・名前付きパラメータで部分復元可）。派生結果は保存せず入力のみ保存。react-router には依存せず native History API を使うため、Router 無しで render する既存 386 テストを一切壊さない。ツール追加コストは codec 1 ファイル + useState→hook 置換のみで、Tool 名 switch・app 側 schema 管理・`any` は一切なし。
