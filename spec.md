# domaintree Specification

A CLI tool that takes domain model definitions (YAML) and renders them as a
single self-contained HTML file.

## 1. Goals

- Visualize DDD domain models (Entity, Value Object) in a **file-tree-style
  layout**
- Output is a **single HTML file** (inline CSS, no external dependencies) that
  can be viewed simply by opening it in a browser
- Serve as an infographic that provides a bird's-eye view of the entire domain
- Automatically infer aggregate boundaries from model relationships

See [mock.html](./mock.html) for a mock of the expected output.

## 2. Input Format

A YAML file with a flat list of models:

```yaml
title: "EC Site Domain Model"

models:
  - name: Order
    type: entity
    description: "Order aggregate"
    properties:
      - name: id
        type: OrderId
      - name: items
        type: OrderItem
      - name: orderedAt
        type: Date

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

  - name: Money
    type: value_object
    properties:
      - name: amount
        type: number
      - name: currency
        type: string

  - name: OrderId
    type: value_object
    properties:
      - name: value
        type: string

  - name: Customer
    type: entity
    description: "Customer aggregate"
    properties:
      - name: id
        type: CustomerId
      - name: name
        type: PersonName
      - name: email
        type: Email

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

| Field    | Type    | Required | Description              |
| -------- | ------- | -------- | ------------------------ |
| `title`  | string  | Yes      | Title of the infographic |
| `models` | Model[] | Yes      | List of domain models    |

#### Model

| Field         | Type                           | Required | Description        |
| ------------- | ------------------------------ | -------- | ------------------ |
| `name`        | string                         | Yes      | Model name         |
| `type`        | `"entity"` \| `"value_object"` | Yes      | Model type         |
| `description` | string                         | No       | Description        |
| `properties`  | Property[]                     | No       | List of properties |

#### Property

| Field  | Type   | Required | Description   |
| ------ | ------ | -------- | ------------- |
| `name` | string | Yes      | Property name |
| `type` | string | Yes      | Type name     |

## 3. Aggregate Inference

The tool automatically determines aggregate boundaries from the model
relationships:

1. **Build a reference graph**: For each model, check if any of its property
   types match the name of another model in the list. This creates a parent →
   child reference.
2. **Find root models**: Models that are not referenced by any other model
   become root models.
3. **Determine display mode**:
   - If a root model has child references (directly or transitively), it is
     displayed as an **Aggregate** with a tree structure. The root model's
     `description` becomes the aggregate description.
   - If a root model has no child references, it is displayed as a standalone
     **Model** (no aggregate wrapper).
4. **Build trees recursively**: For each aggregate root, follow property type
   references to build the tree. Each referenced model becomes a child node, and
   its own references are expanded recursively.

### Example

Given the input above, the tool infers:

- **Order aggregate**: Order → OrderItem → Money, Order → OrderId (OrderItem
  also references Money)
- **Customer aggregate**: Customer → PersonName, Customer → Email, Customer →
  CustomerId

## 4. Output

### 4.1 HTML Structure

- A single self-contained HTML file
- CSS included inline via `<style>` tags
- No external resource dependencies (CDN, fonts, JS)
- Dark mode / light mode follows OS settings (`prefers-color-scheme`)

### 4.2 Layout

Uses a **file-tree-style layout**.

```
EC Site Domain Model
========================

📦 Order (Order aggregate)
├── 🔷 Order [Entity] ─────────────────────────
│     id: OrderId
│     items: OrderItem
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

- Each Aggregate root becomes a tree root with the 📦 header
- Standalone models (no children) are displayed without aggregate wrapper
- The Aggregate Root (Entity) is displayed as the first child of the tree
- Referenced models are expanded as child nodes of the referencing model
- Tree connectors use `├──`, `└──`, `│` just like a file tree (rendered via CSS)
- Each node is displayed as a card-style block containing a list of properties

#### Visual Distinction

| Model Type   | Color Theme                    | Icon |
| ------------ | ------------------------------ | ---- |
| Aggregate    | Dark border + background color | 📦   |
| Entity       | Blue                           | 🔷   |
| Value Object | Purple/Green                   | 💎   |

## 5. CLI Interface

```
domaintree <input.yaml> [-o <output.html>]
```

### 5.1 Arguments

| Argument       | Description                            |
| -------------- | -------------------------------------- |
| `<input.yaml>` | Path to the input YAML file (required) |

### 5.2 Options

| Option                | Default           | Description                                      |
| --------------------- | ----------------- | ------------------------------------------------ |
| `-o, --output <path>` | stdout            | Output file path. Outputs to stdout when omitted |
| `--title <title>`     | `title` from YAML | Override the title                               |
| `-v, --version`       | -                 | Show version                                     |
| `-h, --help`          | -                 | Show help                                        |

### 5.3 Examples

```bash
# Output to a file
npx domaintree domains.yaml -o output.html

# Output to stdout and pipe
npx domaintree domains.yaml > output.html

# Run with Deno
deno run -A main.ts domains.yaml -o output.html
```

## 6. Tech Stack

| Item                | Choice                                                    |
| ------------------- | --------------------------------------------------------- |
| Language            | TypeScript                                                |
| Development Runtime | Deno                                                      |
| Execution Runtime   | Node / Deno / Bun (cross-runtime)                         |
| Package Registry    | npm                                                       |
| Testing             | deno-test (npm package)                                   |
| YAML Parsing        | yaml (npm package)                                        |
| Build               | None (distribute TypeScript as-is, or transpile with dnt) |

## 7. Project Structure

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

## 8. Testing Strategy

- Test runner: `deno-test` (npm)
- Test execution commands defined in `deno.json` `tasks`
- Parser: Verify that YAML input is correctly converted to the internal model,
  including aggregate inference from flat model list
- Renderer: Verify that the HTML output from the internal model contains the
  expected elements
- E2E: Feed a sample YAML and verify that the output HTML is valid
