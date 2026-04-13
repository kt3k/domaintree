# domaintree Specification

A CLI tool that takes domain model definitions (YAML) and renders them as a
single self-contained HTML file.

## 1. Goals

- Visualize DDD domain models (Aggregate, Entity, Value Object, Enum) in a
  **file-tree-style layout**
- Output is a **single HTML file** (inline CSS, no external dependencies) that
  can be viewed simply by opening it in a browser
- Serve as an infographic that provides a bird's-eye view of the entire domain

See [mock.html](./mock.html) for a mock of the expected output.

## 2. Input Format

A YAML file with the following structure:

```yaml
title: "EC Site Domain Model"

aggregates:
  - name: Order
    description: "Order aggregate"
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
          description: "Order line item"
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
    description: "Customer aggregate"
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

### 2.1 Schema Definition

#### Top Level

| Field        | Type        | Required | Description              |
| ------------ | ----------- | -------- | ------------------------ |
| `title`      | string      | Yes      | Title of the infographic |
| `aggregates` | Aggregate[] | Yes      | List of aggregates       |

#### Aggregate

| Field         | Type        | Required | Description             |
| ------------- | ----------- | -------- | ----------------------- |
| `name`        | string      | Yes      | Aggregate name          |
| `description` | string      | No       | Description             |
| `root`        | DomainModel | Yes      | Aggregate root (Entity) |

#### DomainModel

| Field         | Type                                       | Required | Description                        |
| ------------- | ------------------------------------------ | -------- | ---------------------------------- |
| `name`        | string                                     | Yes      | Model name                         |
| `type`        | `"entity"` \| `"value_object"` \| `"enum"` | Yes      | Model type                         |
| `description` | string                                     | No       | Description                        |
| `properties`  | Property[]                                 | No       | List of properties (except `enum`) |
| `values`      | string[]                                   | No       | Enum values (`enum` only)          |
| `children`    | DomainModel[]                              | No       | Child elements                     |

#### Property

| Field  | Type   | Required | Description   |
| ------ | ------ | -------- | ------------- |
| `name` | string | Yes      | Property name |
| `type` | string | Yes      | Type name     |

## 3. Output

### 3.1 HTML Structure

- A single self-contained HTML file
- CSS included inline via `<style>` tags
- No external resource dependencies (CDN, fonts, JS)
- Dark mode / light mode follows OS settings (`prefers-color-scheme`)

### 3.2 Layout

Uses a **file-tree-style layout**.

```
EC Site Domain Model
========================

📦 Order (Order aggregate)
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

📦 Customer (Customer aggregate)
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

#### Layout Principles

- Each Aggregate becomes a tree root
- The Aggregate Root (Entity) is displayed as the first child of the tree
- Models specified in `children` are expanded as child nodes of that model in
  the tree
- Tree connectors use `├──`, `└──`, `│` just like a file tree (rendered via CSS)
- Each node is displayed as a card-style block containing a list of properties

#### Visual Distinction

| Model Type   | Color Theme                    | Icon |
| ------------ | ------------------------------ | ---- |
| Aggregate    | Dark border + background color | 📦   |
| Entity       | Blue                           | 🔷   |
| Value Object | Purple/Green                   | 💎   |
| Enum         | Orange/Yellow                  | 📋   |

## 4. CLI Interface

```
domaintree <input.yaml> [-o <output.html>]
```

### 4.1 Arguments

| Argument       | Description                            |
| -------------- | -------------------------------------- |
| `<input.yaml>` | Path to the input YAML file (required) |

### 4.2 Options

| Option                | Default           | Description                                      |
| --------------------- | ----------------- | ------------------------------------------------ |
| `-o, --output <path>` | stdout            | Output file path. Outputs to stdout when omitted |
| `--title <title>`     | `title` from YAML | Override the title                               |
| `-v, --version`       | -                 | Show version                                     |
| `-h, --help`          | -                 | Show help                                        |

### 4.3 Examples

```bash
# Output to a file
npx domaintree domains.yaml -o output.html

# Output to stdout and pipe
npx domaintree domains.yaml > output.html

# Run with Deno
deno run -A main.ts domains.yaml -o output.html
```

## 5. Tech Stack

| Item                | Choice                                                    |
| ------------------- | --------------------------------------------------------- |
| Language            | TypeScript                                                |
| Development Runtime | Deno                                                      |
| Execution Runtime   | Node / Deno / Bun (cross-runtime)                         |
| Package Registry    | npm                                                       |
| Testing             | deno-test@1.0.1 (npm package)                             |
| YAML Parsing        | yaml (npm package)                                        |
| Build               | None (distribute TypeScript as-is, or transpile with dnt) |

## 6. Project Structure

```
domaintree/
├── main.ts                # CLI entry point
├── mod.ts                 # Library entry point
├── src/
│   ├── types.ts           # Internal type definitions
│   ├── parser.ts          # YAML → internal model conversion
│   ├── renderer.ts        # Internal model → HTML conversion
│   └── template.ts        # HTML/CSS templates
├── test/
│   ├── parser_test.ts     # Parser tests
│   └── renderer_test.ts   # Renderer tests
├── examples/
│   └── ec-site.yaml       # Sample input
├── deno.json              # Deno config + task definitions
├── spec.md                # This specification
└── README.md
```

## 7. Testing Strategy

- Test runner: `deno-test@1.0.1` (npm)
- Test execution commands defined in `deno.json` `tasks`
- Parser: Verify that YAML input is correctly converted to the internal model
- Renderer: Verify that the HTML output from the internal model contains the
  expected elements
- E2E: Feed a sample YAML and verify that the output HTML is valid
