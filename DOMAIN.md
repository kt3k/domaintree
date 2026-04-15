# Domain Model

`domaingraph` 自身のドメインを記述する。本ツールはユーザーが定義した DDD
モデルを HTML として可視化する CLI/ライブラリであり、ここで言う「ドメイン」は
**ドメインモデルの可視化処理そのもの** を指す (ユーザー入力に現れる Order /
Customer などのサンプル概念ではない)。

## Context Map

単一の Bounded Context: **Domain Model Visualization**。

外部システムとの境界:

- **入力境界**: JSON ファイル (`models[]`)。`src/schema.ts` の `inputSchema`
  が契約。`validate` サブコマンドがゲートキーパー。
- **出力境界**: 単一の自己完結型 HTML ファイル。`src/template.ts` の HTML/CSS
  テンプレートが境界。
- **CLI 境界**: `main.ts` (citty)。`build` / `types` / `validate` の 3
  サブコマンドを公開。

統合パターン: 入力側は **Published Language** (JSON Schema)、出力側は **Open
Host Service** 的に固定 HTML 構造を提供。

## Glossary

| Term              | Definition                                                                                       | Code Location                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| DomainDocument    | 可視化対象の入力ドキュメント全体。タイトルと表示グループの集合。                                 | `src/types.ts` (`DomainDocument`)                                          |
| DomainObject      | ユーザーが宣言する DDD ビルディングブロック (Entity または Value Object)。                       | `src/types.ts` (`DomainObject`)                                            |
| Property          | DomainObject の名前付き属性。`type` フィールドが他 DomainObject 名と一致すれば暗黙の参照になる。 | `src/types.ts` (`Property`)                                                |
| Kind              | DomainObject の種別判別子。`"entity"` または `"value_object"`。                                  | `src/types.ts`, `src/schema.ts`                                            |
| Entity            | 同一性を持つ DomainObject。アイコン 🔷。                                                         | `kind: "entity"`                                                           |
| Value Object      | 属性で同一性が決まる DomainObject。アイコン 💎。                                                 | `kind: "value_object"`                                                     |
| Aggregate (推論)  | 子参照を持つ DomainObject ルート。📦 ヘッダー付きで描画。                                        | `DisplayGroup.kind === "aggregate"`, `renderAggregate` (`src/renderer.ts`) |
| Standalone (推論) | 子参照を持たないルート。アグリゲート枠なしで描画。                                               | `DisplayGroup.kind === "standalone"`                                       |
| DomainObjectNode  | 推論ツリーのノード。1 つの DomainObject と子ノード列を保持する内部表現。                         | `src/types.ts` (`DomainObjectNode`)                                        |
| DisplayGroup      | 描画単位 (アグリゲート or Standalone) のラッパ。                                                 | `src/types.ts` (`DisplayGroup`)                                            |
| Reference (暗黙)  | プロパティの `type` が別 DomainObject の `name` と一致したときに成立する親→子関係。              | `inferGroups` (`src/parser.ts`)                                            |
| ValidationError   | スキーマ検証で見つかった不整合 (path + message)。                                                | `src/validator.ts` (`ValidationError`)                                     |

## Aggregates

ここでの「Aggregate」は domaingraph の **内部モデル** の集約を指す
(ユーザー入力の Aggregate 推論とは別レイヤ)。

### DomainDocument

- **Purpose**: 可視化のための完結した入力単位を表す。パーサ出力 = レンダラ入力
  の中枢データ。
- **Invariants**:
  - `title` は非空文字列。
  - `groups` の各要素は `aggregate` または `standalone` のいずれか。
  - `aggregate` ならば `root.children.length > 0`、`standalone` ならば
    `root.children.length === 0`。
  - 同一 `DomainObject` は推論ツリー内で 2 度展開されない (循環防止 —
    `buildTree` の `visited` セット)。
- **Entities**: `DomainObject` (集約内の唯一のエンティティ的存在。`name`
  がローカル ID)。
- **Value Objects**: `Property`、`DisplayGroup`、`DomainObjectNode`
  (純粋な構造値)。
- **Domain Events**: なし (純粋な変換パイプライン)。
- **Code references**:
  - 構築: `parse()` (`src/parser.ts`)
  - 消費: `render()` (`src/renderer.ts`)

### ValidationReport (軽量な集約)

- **Purpose**: `validate` サブコマンドが返す診断結果の集合。
- **Invariants**: エラー 0 件 = 入力が `inputSchema` に適合。
- **Entities**: なし。
- **Value Objects**: `ValidationError` (path + message)。
- **Domain Events**: なし。
- **Code references**: `validate()` (`src/validator.ts`)、`inputSchema`
  (`src/schema.ts`)。

## Known Limitations (DDD 観点)

`ddd-issues.md` を参照。要点:

- **Aggregate Root** は型レベルで一級表現を持たない (`DisplayGroup.kind`
  から推測)。
- **Reference Graph** の概念に固有の名前がない (`inferGroups` 内に埋め込み)。
- **Bounded Context** / **Domain Service** / **Domain Event** / **Repository** /
  **Factory** / **Invariant** はユーザー入力の表現範囲外 (現状 `kind` は Entity
  / Value Object のみ)。
