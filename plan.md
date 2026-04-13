# Task Breakdown: Implement domaintree CLI Tool

## Specifications

- A CLI tool that takes domain model definitions (YAML) and renders them as a
  single self-contained HTML file with a file-tree-style layout
- Output HTML uses inline CSS only, no external dependencies, supports
  dark/light mode (`prefers-color-scheme`)
- Four model types visually distinguished by color and icon: Aggregate (📦),
  Entity (🔷), Value Object (💎), Enum (📋)
- Tree structure supports recursive nesting via `children`
- CLI: `domaintree <input.yaml> [-o output.html] [--title] [-v] [-h]`
- Tech Stack: TypeScript / Deno / npm `yaml` package / `deno-test@1.0.1`
- `mock.html` serves as the reference for expected output

## Subtasks

- [x] **1. Project foundation setup** [M]
  - [x] 1.1 Create `deno.json` (imports, tasks) [S]
  - [x] 1.2 `src/types.ts` — Internal type definitions [S]
- [x] **2. YAML parser implementation** [M]
  - [x] 2.1 `src/parser.ts` — YAML to internal model conversion [M]
  - [x] 2.2 `test/parser_test.ts` — Parser tests [S]
- [x] **3. HTML renderer implementation** [L]
  - [x] 3.1 `src/template.ts` — HTML/CSS templates [M]
  - [x] 3.2 `src/renderer.ts` — Internal model to HTML conversion [M]
  - [x] 3.3 `test/renderer_test.ts` — Renderer tests [S]
- [x] **4. CLI and entry points** [M]
  - [x] 4.1 `main.ts` — CLI entry point [M]
  - [x] 4.2 `mod.ts` — Library entry point [XS]
- [x] **5. Sample input and E2E verification** [S]
  - [x] 5.1 `examples/ec-site.yaml` — Sample YAML [S]
  - [x] 5.2 E2E verification — Run with sample and compare against mock.html [S]

## Subtask Details

### 1. Project foundation setup

Set up the development environment and type definitions as the foundation for
all subsequent tasks.

#### 1.1 Create `deno.json`

- Define `imports` for `yaml` and `deno-test@1.0.1`
- Define `tasks` for `test`, `build`, etc.
- Configure `compilerOptions` as needed

#### 1.2 `src/types.ts` — Internal type definitions

- `DomainDocument` (top-level: title, aggregates)
- `Aggregate` (name, description, root)
- `DomainModel` (name, type, description, properties, values, children)
- `Property` (name, type)
- TypeScript interfaces/types based on the schema defined in spec.md

### 2. YAML parser implementation

Module to convert YAML input into the internal model.

#### 2.1 `src/parser.ts`

- Parse YAML string using the `yaml` package
- Convert parsed result to `DomainDocument` type
- Validate required fields (title, aggregates, root, etc.)
- Return clear error messages on failure

#### 2.2 `test/parser_test.ts`

- Happy path: verify YAML to internal model conversion
- Error cases: verify errors on missing required fields
- Verify recursive conversion of nested children

### 3. HTML renderer implementation

Core module that generates HTML equivalent to mock.html from the internal model.

#### 3.1 `src/template.ts`

- CSS custom properties (light/dark mode)
- Base styles (body, h1, subtitle)
- Tree structure styles (.tree, .tree-node, connector lines)
- Card styles (.card, .card-header, .card-body)
- Model type-specific styles (.entity, .value-object, .enum)
- HTML header/footer template functions

#### 3.2 `src/renderer.ts`

- `render(doc: DomainDocument): string` — Main render function
- Render aggregate headers (📦 icon, name, description)
- Render aggregate root as the first child node
- Recursively render `children` as tree nodes
- Render type-specific cards (Entity/Value Object → properties, Enum → values)
- Generate subtitle statistics (aggregate count, entity count, etc.)

#### 3.3 `test/renderer_test.ts`

- Verify each model type's card HTML contains expected elements
- Verify nested tree structure renders correctly
- Verify dark mode CSS variables are included

### 4. CLI and entry points

#### 4.1 `main.ts` — CLI entry point

- Argument parsing: `<input.yaml>`, `-o/--output`, `--title`, `-v/--version`,
  `-h/--help`
- Read YAML file → parser → renderer → output
- Write to file when `-o` is specified, stdout otherwise
- Error handling (file not found, YAML parse errors, etc.)

#### 4.2 `mod.ts` — Library entry point

- Re-export `parse` and `render` functions
- Enable programmatic usage

### 5. Sample input and E2E verification

#### 5.1 `examples/ec-site.yaml`

- Place the sample YAML from spec.md as-is

#### 5.2 E2E verification

- Run `deno run -A main.ts examples/ec-site.yaml -o output.html`
- Verify the generated HTML has equivalent layout/structure to mock.html
- Open in browser for visual confirmation
