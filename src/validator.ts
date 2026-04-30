import { extractTypeNames } from "./parser.ts";
import { inputSchema } from "./schema.ts";

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

interface SchemaNode {
  type?: string;
  required?: string[];
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  enum?: unknown[];
  additionalProperties?: boolean;
}

export function validate(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  validateNode(data, inputSchema as SchemaNode, "", errors);
  lintModelReferences(data, errors);
  return errors;
}

function validateNode(
  data: unknown,
  schema: SchemaNode,
  path: string,
  errors: ValidationError[],
): void {
  const pathLabel = path || "(root)";

  if (schema.enum && !schema.enum.includes(data)) {
    const allowed = schema.enum.map((v) => JSON.stringify(v)).join(", ");
    errors.push({
      path: pathLabel,
      message: `must be one of: ${allowed}`,
      severity: "error",
    });
    return;
  }

  const actualType = typeName(data);
  if (schema.type && actualType !== schema.type) {
    errors.push({
      path: pathLabel,
      message: `expected ${schema.type}, got ${actualType}`,
      severity: "error",
    });
    return;
  }

  if (schema.type === "object") {
    const obj = data as Record<string, unknown>;

    for (const key of schema.required ?? []) {
      if (!(key in obj)) {
        errors.push({
          path: pathLabel,
          message: `missing required property "${key}"`,
          severity: "error",
        });
      }
    }

    const properties = schema.properties ?? {};
    for (const key of Object.keys(obj)) {
      const childSchema = properties[key];
      const childPath = path ? `${path}.${key}` : key;
      if (childSchema) {
        validateNode(obj[key], childSchema, childPath, errors);
      } else if (schema.additionalProperties === false) {
        errors.push({
          path: pathLabel,
          message: `unknown property "${key}"`,
          severity: "error",
        });
      }
    }
  }

  if (schema.type === "array" && schema.items) {
    const arr = data as unknown[];
    arr.forEach((item, i) => {
      validateNode(item, schema.items!, `${path}[${i}]`, errors);
    });
  }
}

function typeName(data: unknown): string {
  if (data === null) return "null";
  if (Array.isArray(data)) return "array";
  return typeof data;
}

/**
 * Emit a warning when a property type contains a known model name as a token
 * but the parser's wrapper-pattern extraction does not surface it (e.g.
 * `Map<string, Order>` where `Order` is a model). Such references are
 * silently dropped from the aggregate graph, which is rarely intended.
 */
function lintModelReferences(
  data: unknown,
  errors: ValidationError[],
): void {
  if (!data || typeof data !== "object") return;
  const models = (data as Record<string, unknown>).models;
  if (!Array.isArray(models)) return;

  const modelNames: string[] = [];
  for (const m of models) {
    if (m && typeof m === "object") {
      const name = (m as Record<string, unknown>).name;
      if (typeof name === "string" && name.trim() !== "") {
        modelNames.push(name);
      }
    }
  }
  if (modelNames.length === 0) return;

  models.forEach((model, mi) => {
    if (!model || typeof model !== "object") return;
    const props = (model as Record<string, unknown>).properties;
    if (!Array.isArray(props)) return;

    props.forEach((prop, pi) => {
      if (!prop || typeof prop !== "object") return;
      const type = (prop as Record<string, unknown>).type;
      if (typeof type !== "string") return;

      const extracted = new Set(extractTypeNames(type));
      for (const name of modelNames) {
        if (extracted.has(name)) continue;
        if (!containsAsToken(type, name)) continue;
        errors.push({
          path: `models[${mi}].properties[${pi}].type`,
          message: `type "${type}" appears to reference model "${name}" but ` +
            `cannot be resolved; supported forms are T, T?, T[], ` +
            `Array<T>, Set<T>, and unions A | B`,
          severity: "warning",
        });
      }
    });
  });
}

function containsAsToken(haystack: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}
