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
  checkUnreachableModels(data, errors);
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

/**
 * Emit an error for models that cannot be reached from any aggregate root.
 * This happens when a set of models reference each other in a cycle and none
 * of them is marked `isAggregateRoot: true`: each is "referenced" so none is
 * inferred as a root, and the whole cycle is silently dropped from the
 * rendered output.
 */
function checkUnreachableModels(
  data: unknown,
  errors: ValidationError[],
): void {
  if (!data || typeof data !== "object") return;
  const models = (data as Record<string, unknown>).models;
  if (!Array.isArray(models) || models.length === 0) return;

  const names: string[] = [];
  const explicitRoots = new Set<string>();
  const indexByName = new Map<string, number>();
  for (let i = 0; i < models.length; i++) {
    const m = models[i];
    if (!m || typeof m !== "object") return;
    const obj = m as Record<string, unknown>;
    const name = obj.name;
    if (typeof name !== "string" || name.trim() === "") return;
    if (indexByName.has(name)) return;
    names.push(name);
    indexByName.set(name, i);
    if (obj.isAggregateRoot === true) explicitRoots.add(name);
  }
  const nameSet = new Set(names);

  const edges = new Map<string, Set<string>>();
  const referenced = new Set<string>();
  for (const m of models) {
    const obj = m as Record<string, unknown>;
    const from = obj.name as string;
    const out = new Set<string>();
    edges.set(from, out);
    const props = obj.properties;
    if (!Array.isArray(props)) continue;
    for (const prop of props) {
      if (!prop || typeof prop !== "object") continue;
      const type = (prop as Record<string, unknown>).type;
      if (typeof type !== "string") continue;
      for (const target of extractTypeNames(type)) {
        if (nameSet.has(target)) {
          out.add(target);
          referenced.add(target);
        }
      }
    }
  }

  const roots = names.filter((n) => explicitRoots.has(n) || !referenced.has(n));
  const reachable = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (reachable.has(cur)) continue;
    reachable.add(cur);
    const out = edges.get(cur);
    if (!out) continue;
    for (const next of out) {
      if (!reachable.has(next)) stack.push(next);
    }
  }

  for (const name of names) {
    if (reachable.has(name)) continue;
    errors.push({
      path: `models[${indexByName.get(name)}]`,
      message: `model "${name}" is unreachable; it is part of a reference ` +
        `cycle with no aggregate root. Add isAggregateRoot: true to one ` +
        `of the models in the cycle.`,
      severity: "error",
    });
  }
}
