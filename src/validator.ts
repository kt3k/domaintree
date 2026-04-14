import { inputSchema } from "./schema.ts";

export interface ValidationError {
  path: string;
  message: string;
}

interface SchemaNode {
  type?: string;
  required?: string[];
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  enum?: unknown[];
  additionalProperties?: boolean;
  description?: string;
}

export function validate(
  data: unknown,
  schema: SchemaNode = inputSchema as SchemaNode,
): ValidationError[] {
  const errors: ValidationError[] = [];
  validateNode(data, schema, "", errors);
  return errors;
}

function validateNode(
  data: unknown,
  schema: SchemaNode,
  path: string,
  errors: ValidationError[],
): void {
  const pathLabel = path || "(root)";

  if (schema.enum) {
    if (!schema.enum.includes(data)) {
      const allowed = schema.enum.map((v) => JSON.stringify(v)).join(", ");
      errors.push({
        path: pathLabel,
        message: `must be one of: ${allowed}`,
      });
      return;
    }
  }

  if (schema.type && !checkType(data, schema.type)) {
    errors.push({
      path: pathLabel,
      message: `expected ${schema.type}, got ${typeName(data)}`,
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

function checkType(data: unknown, type: string): boolean {
  switch (type) {
    case "object":
      return typeof data === "object" && data !== null && !Array.isArray(data);
    case "array":
      return Array.isArray(data);
    case "string":
      return typeof data === "string";
    case "number":
      return typeof data === "number";
    case "boolean":
      return typeof data === "boolean";
    case "null":
      return data === null;
    default:
      return true;
  }
}

function typeName(data: unknown): string {
  if (data === null) return "null";
  if (Array.isArray(data)) return "array";
  return typeof data;
}
