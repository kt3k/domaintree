# domaingraphics 仕様書

ドメインモデルの定義 (YAML) を受け取り、1 枚の自己完結した HTML ファイルとして描画する CLI ツール。

## 1. ゴール

- DDD のドメインモデル (Aggregate, Entity, Value Object, Enum) を **ファイルツリー風のレイアウト** でビジュアライズする
- 出力は **1 枚の HTML ファイル** (CSS インライン、外部依存なし) で、ブラウザで開くだけで閲覧できる
- ドメインの全体像を俯瞰できるインフォグラフィクスとして機能する

出力イメージのモックは [mock.html](./mock.html) を参照。

## 2. 入力形式

YAML ファイル。以下の構造を持つ。

```yaml
title: "ECサイト ドメインモデル"

aggregates:
  - name: Order
    description: "注文集約"
    root:
      name: Order
      type: entity
      properties:
        - name: id
          type: OrderId
        - name: status
          type: OrderStatus
        - name: orderedAt
          type: Date
      children:
        - name: OrderItem
          type: entity
          description: "注文明細"
          properties:
            - name: id
              type: OrderItemId
            - name: quantity
              type: number
            - name: unitPrice
              type: Money
          children:
            - name: Money
              type: value_object
              properties:
                - name: amount
                  type: number
                - name: currency
                  type: string

        - name: OrderStatus
          type: enum
          values:
            - PENDING
            - CONFIRMED
            - SHIPPED
            - DELIVERED
            - CANCELLED

        - name: OrderId
          type: value_object
          properties:
            - name: value
              type: string

  - name: Customer
    description: "顧客集約"
    root:
      name: Customer
      type: entity
      properties:
        - name: id
          type: CustomerId
        - name: name
          type: PersonName
        - name: email
          type: Email
      children:
        - name: PersonName
          type: value_object
          properties:
            - name: firstName
              type: string
            - name: lastName
              type: string

        - name: Email
          type: value_object
          properties:
            - name: value
              type: string

        - name: CustomerId
          type: value_object
          properties:
            - name: value
              type: string
```

### 2.1 スキーマ定義

#### トップレベル

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `title` | string | Yes | インフォグラフィクスのタイトル |
| `aggregates` | Aggregate[] | Yes | 集約のリスト |

#### Aggregate

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `name` | string | Yes | 集約名 |
| `description` | string | No | 説明 |
| `root` | DomainModel | Yes | 集約ルート (Entity) |

#### DomainModel

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `name` | string | Yes | モデル名 |
| `type` | `"entity"` \| `"value_object"` \| `"enum"` | Yes | モデルの種類 |
| `description` | string | No | 説明 |
| `properties` | Property[] | No | プロパティ一覧 (`enum` 以外) |
| `values` | string[] | No | 列挙値 (`enum` のみ) |
| `children` | DomainModel[] | No | 子要素 |

#### Property

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `name` | string | Yes | プロパティ名 |
| `type` | string | Yes | 型名 |

## 3. 出力

### 3.1 HTML 構造

- 1 枚の自己完結した HTML ファイル
- `<style>` タグで CSS をインラインに含む
- 外部リソース (CDN, フォント, JS) への依存なし
- ダークモード / ライトモードは OS 設定に追従 (`prefers-color-scheme`)

### 3.2 レイアウト

**ファイルツリー風のレイアウト** を採用する。

```
ECサイト ドメインモデル
========================

📦 Order (注文集約)
├── 🔷 Order [Entity] ─────────────────────────
│     id: OrderId
│     status: OrderStatus
│     orderedAt: Date
│
├── 🔷 OrderItem [Entity] ─────────────────────
│     id: OrderItemId
│     quantity: number
│     unitPrice: Money
│   │
│   └── 💎 Money [Value Object] ───────────────
│         amount: number
│         currency: string
│
├── 📋 OrderStatus [Enum] ─────────────────────
│     PENDING | CONFIRMED | SHIPPED
│     DELIVERED | CANCELLED
│
└── 💎 OrderId [Value Object] ─────────────────
      value: string

📦 Customer (顧客集約)
├── 🔷 Customer [Entity] ──────────────────────
│     id: CustomerId
│     name: PersonName
│     email: Email
│
├── 💎 PersonName [Value Object] ──────────────
│     firstName: string
│     lastName: string
│
├── 💎 Email [Value Object] ───────────────────
│     value: string
│
└── 💎 CustomerId [Value Object] ──────────────
      value: string
```

#### レイアウトの原則

- 各 Aggregate がツリーのルートとなる
- Aggregate Root (Entity) がツリーの最初の子として表示される
- `children` に指定されたモデルが、そのモデルの子ノードとしてツリーに展開される
- ツリーの罫線はファイルツリーと同様に `├──`, `└──`, `│` を使って接続を表現する (CSS で描画)
- 各ノードはカード風のブロックとして表示され、プロパティ一覧を含む

#### 視覚的な区別

| モデル種別 | 色テーマ | アイコン |
|---|---|---|
| Aggregate | 濃いボーダー + 背景色 | 📦 |
| Entity | 青系 | 🔷 |
| Value Object | 紫/緑系 | 💎 |
| Enum | オレンジ/黄系 | 📋 |

## 4. CLI インターフェース

```
domaingraphics <input.yaml> [-o <output.html>]
```

### 4.1 引数

| 引数 | 説明 |
|---|---|
| `<input.yaml>` | 入力の YAML ファイルパス (必須) |

### 4.2 オプション

| オプション | デフォルト | 説明 |
|---|---|---|
| `-o, --output <path>` | stdout | 出力先ファイルパス。省略時は stdout に出力 |
| `--title <title>` | YAML の `title` | タイトルを上書き |
| `-v, --version` | - | バージョン表示 |
| `-h, --help` | - | ヘルプ表示 |

### 4.3 使用例

```bash
# ファイルに出力
npx domaingraphics domains.yaml -o output.html

# stdout に出力してパイプ
npx domaingraphics domains.yaml > output.html

# Deno で実行
deno run -A main.ts domains.yaml -o output.html
```

## 5. 技術スタック

| 項目 | 選択 |
|---|---|
| 言語 | TypeScript |
| 開発ランタイム | Deno |
| 実行ランタイム | Node / Deno / Bun (クロスランタイム) |
| パッケージ公開先 | npm |
| テスト | deno-test@1.0.1 (npm パッケージ) |
| YAML パース | yaml (npm パッケージ) |
| ビルド | なし (TypeScript をそのまま配布、または dnt でトランスパイル) |

## 6. プロジェクト構成

```
domaingraphics/
├── main.ts                # CLI エントリポイント
├── mod.ts                 # ライブラリエントリポイント
├── src/
│   ├── types.ts           # 内部型定義
│   ├── parser.ts          # YAML → 内部モデル変換
│   ├── renderer.ts        # 内部モデル → HTML 変換
│   └── template.ts        # HTML/CSS テンプレート
├── test/
│   ├── parser_test.ts     # パーサーテスト
│   └── renderer_test.ts   # レンダラーテスト
├── examples/
│   └── ec-site.yaml       # サンプル入力
├── deno.json              # Deno 設定 + タスク定義
├── spec.md                # この仕様書
└── README.md
```

## 7. テスト方針

- テストランナー: `deno-test@1.0.1` (npm) を使用
- `deno.json` の `tasks` にテスト実行コマンドを定義
- パーサー: YAML 入力 → 内部モデルの変換が正しいことを検証
- レンダラー: 内部モデル → HTML 出力に期待する要素が含まれることを検証
- E2E: サンプル YAML を食わせて、出力 HTML がバリッドであることを検証
