# domainchart DDD ユビキタス言語: 問題点リスト

`domainchart`
のコードベースに対するユビキタス言語分析で発見された問題点をまとめたドキュメント。

## 用語集レベルの問題点

### `DomainDocument` の名前ずれ

- **場所**: `src/types.ts:28`, `src/parser.ts:9`
- **内容**: spec/schema は "Input"/"infographic" と呼ぶが、コードでは
  "DomainDocument"。

### `Value Object` の綴りが層によって異なる

- **場所**: JSON (`value_object`), Stats (`valueObjects`), CSS (`value-object`)
- **内容**: 同一概念に 3 つの綴りが存在。各層の慣習だが要注意。

### `Property.type` の意味的過負荷

- **場所**: `Property.type`, `inferGroups` (`src/parser.ts:102`)
- **内容**: 英語的に過負荷で、`Model.kind` (旧 `type`)
  と紛らわしい。さらに参照推論はこのフィールドの「副作用」として行われ、名前からはその役割が見えない。

### `Aggregate` がユーザー宣言ではなく推論

- **場所**: `DisplayGroup.kind === "aggregate"`, `renderAggregate`
  (`src/renderer.ts:29`), spec §3
- **内容**:
  ユーザーが宣言するのではなく、参照グラフから推論される。明示的な宣言手段がない。

### `Aggregate Root` がコードに一級表現を持たない

- **場所**: 暗黙: `kind === "aggregate"` の時の `DisplayGroup.root`
- **内容**: 専用の型も用語もコード上に存在しない。spec §4.2 にだけ登場する。

### `Display Group` がビジネス的意味を持たない

- **場所**: `DisplayGroup` (`src/types.ts:21`), `DomainDocument.groups`
- **内容**: 表示用語であり、ビジネス的意味はない。`groups`
  というフィールド名では正体が分からない。

### `Reference / Reference Graph` がコード上で命名されていない

- **場所**: `inferGroups` (`src/parser.ts:102-132`), spec §3
- **内容**: spec/コメントでは概念があるが、コードでは一級の名前なし
  (`referenced: Set<string>` で表現)。

### `Root Model` の二重の意味

- **場所**: `inferGroups` 内 `roots` (`src/parser.ts:121`)
- **内容**: 「DDD のアグリゲートルート」(spec) と「グラフのルート」(parser) の 2
  つの意味が混在している。ここでは一致しているが暗黙的。

---

## 不整合 (詳細)

### 1. "Aggregate Root" は DDD の中心概念だがコードに一級表現がない

- **概念**: アグリゲートの入口となる Entity。
- **使われている表記**: spec では "Aggregate Root"、コードでは
  `DisplayGroup.root` (`ModelNode`)
  のみで、非アグリゲートのルートと型レベルでは区別されない。
- **推奨**: `AggregateRoot`
  という別名/識別フィールドを導入するか、純粋な描画上の区別と割り切って明文化する。現状は
  `kind === "aggregate"` から推測する必要がある。

### 2. 参照関係がコード上で命名されていない

- **概念**: プロパティの `type` が他モデルの `name`
  と一致することで、アグリゲートツリーの包含エッジが宣言される。
- **使われている表記**: spec §3 は "reference graph"、コードでは
  `referenced: Set<string>` や `modelMap.has(prop.type)`
  といったインライン表現。
- **推奨**: `ModelReference` 型や `references()`
  ヘルパーなどで命名し、推論ルールが `inferGroups` に埋もれない形にする。

### 3. `Property.type` が過負荷

- **概念**: 1 つのフィールドが (a) 表示ラベル、(b)
  アグリゲート推論用の構造リンク、の両方を担う。
- **使われている表記**: schema の description
  では両方の役割に言及。フィールド名は (a) しか示さない。
- **推奨**: フィールドはそのままでよいが、`types.ts` で "type
  は暗黙の参照キーも兼ねる" と明文化。`Property` 単体では読み取れない。

### 4. `DomainDocument.groups` と spec の語彙のずれ

- **概念**: 描画対象となるアグリゲート + Standalone のリスト。
- **使われている表記**: フィールド `groups`、型 `DisplayGroup`、spec の本文
  "Aggregates and standalone models"。
- **推奨**: `groups` → `displayGroups` への改名 (もしくは `aggregates` +
  `standalones` への分割) で公開構造が自己説明的になる。

---

## 欠けている用語

### Aggregate Root

spec にはあるがコード識別子としては不在 (上記 §1)。

### Bounded Context

表現なし。入力全体が暗黙的に 1
コンテキスト。複数コンテキストはモデル化されていない。

### Domain Service / Domain Event / Repository / Factory

DDD の戦術的パターンは対象外。`kind` は Entity と Value Object
のみ。プロジェクト名 *domain*tree が示唆するより範囲が狭い点は注目に値する。

### Reference / Containment

推論ルール (プロパティ型 = モデル名) に名前がなく、`inferGroups`
の振る舞いとしてしか存在しない。

### Identity

Entity と Value Object の区別は `kind` でのみ表現され、その _理由_ (同一性)
はモデル/描画のどこにも現れない。

### Invariant

アグリゲートが概念的に存在する理由は不変条件の保護だが、入力フォーマットには
`description` 以外の場所がない。
