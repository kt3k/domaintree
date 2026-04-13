# domaintree

A CLI tool that takes DDD domain model definitions (YAML) and renders them as a
single self-contained HTML file with a file-tree-style layout.

## Features

- Visualize DDD domain models (Entity, Value Object)
- Automatically infer aggregate boundaries from model relationships
- Single HTML file output (inline CSS, no external dependencies)
- Dark mode / light mode support (`prefers-color-scheme`)
- Cross-runtime: works with Deno, Node.js, and Bun

## Usage

```bash
# Output to a file
deno run -A main.ts domains.yaml -o output.html

# Output to stdout
deno run -A main.ts domains.yaml > output.html

# With Node.js
npx domaintree domains.yaml -o output.html
```

### Options

| Option                | Default   | Description        |
| --------------------- | --------- | ------------------ |
| `-o, --output <path>` | stdout    | Output file path   |
| `--title <title>`     | from YAML | Override the title |
| `-v, --version`       | -         | Show version       |
| `-h, --help`          | -         | Show help          |

## Input Format

Define models in a flat list — the tool automatically infers aggregate
boundaries from property type references.

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

  - name: OrderItem
    type: entity
    properties:
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
```

See [spec.md](./spec.md) for the full schema definition.

## Development

```bash
# Run tests
deno test --allow-read --allow-env

# Format
deno fmt

# Lint
deno lint
```

## License

MIT
