import type {
  DomainDocument,
  DomainObject,
  DomainObjectNode,
  Property,
} from "./types.ts";

const KINDS = ["entity", "value_object"] as const;

const WRAPPER_RE = /^(?:Array|Set)<(.+)>$/;

function isKind(value: unknown): value is DomainObject["kind"] {
  return typeof value === "string" &&
    (KINDS as readonly string[]).includes(value);
}

function requireNonEmptyString(
  value: unknown,
  path: string,
  field: string,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${path}: missing required field "${field}"`);
  }
  return value;
}

export function parse(jsonString: string): DomainDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid JSON: expected an object at the top level");
  }

  const doc = raw as Record<string, unknown>;

  if (typeof doc.title !== "string" || doc.title.trim() === "") {
    throw new Error("Missing required field: title");
  }

  if (!Array.isArray(doc.models) || doc.models.length === 0) {
    throw new Error(
      "Missing required field: models (must be a non-empty array)",
    );
  }

  const objects = doc.models.map((m: unknown, i: number) =>
    parseDomainObject(m, `models[${i}]`)
  );

  const roots = inferAggregateRoots(objects);

  return { title: doc.title, roots };
}

function parseDomainObject(raw: unknown, path: string): DomainObject {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${path}: expected an object`);
  }

  const obj = raw as Record<string, unknown>;
  const name = requireNonEmptyString(obj.name, path, "name");

  if (!isKind(obj.kind)) {
    throw new Error(
      `${path} (${name}): "kind" must be one of: ${KINDS.join(", ")}`,
    );
  }

  const domainObject: DomainObject = {
    name,
    kind: obj.kind,
  };

  if (typeof obj.description === "string") {
    domainObject.description = obj.description;
  }

  if (typeof obj.isAggregateRoot === "boolean") {
    domainObject.isAggregateRoot = obj.isAggregateRoot;
  }

  if (Array.isArray(obj.properties)) {
    domainObject.properties = obj.properties.map((p: unknown, i: number) =>
      parseProperty(p, `${path}.properties[${i}]`)
    );
  }

  return domainObject;
}

function parseProperty(raw: unknown, path: string): Property {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${path}: expected an object`);
  }

  const obj = raw as Record<string, unknown>;
  const name = requireNonEmptyString(obj.name, path, "name");
  const type = requireNonEmptyString(obj.type, path, "type");
  return { name, type };
}

/**
 * Extract inner type names from a property type string for reference
 * resolution. Supports wrapper notations `T[]`, `T?`, `Array<T>`, `Set<T>`,
 * union types `A | B` (any arity), and their compositions (e.g. `A[] | B?`,
 * `Array<A | B>`). The original type string is preserved on the property
 * for display.
 */
function extractTypeNames(type: string): string[] {
  const t = type.trim();
  if (t === "") return [];

  const parts = splitTopLevelUnion(t);
  if (parts.length > 1) {
    return parts.flatMap(extractTypeNames);
  }

  let s = t;
  for (;;) {
    const before = s;
    if (s.endsWith("?")) s = s.slice(0, -1).trimEnd();
    if (s.endsWith("[]")) s = s.slice(0, -2).trimEnd();
    const m = s.match(WRAPPER_RE);
    if (m) return extractTypeNames(m[1]);
    if (s === before) break;
  }
  return [s];
}

function splitTopLevelUnion(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of s) {
    if (ch === "<") depth++;
    else if (ch === ">") depth--;
    else if (ch === "|" && depth === 0) {
      const trimmed = buf.trim();
      if (trimmed !== "") parts.push(trimmed);
      buf = "";
      continue;
    }
    buf += ch;
  }
  const trimmed = buf.trim();
  if (trimmed !== "") parts.push(trimmed);
  return parts;
}

/**
 * Infer aggregate boundaries from flat domain object list.
 *
 * 1. Build a reference graph: property types that match domain object names.
 * 2. Roots: domain objects with an explicit `isAggregateRoot` flag, plus any
 *    domain objects not referenced by another. Explicit roots are excluded
 *    from being children of other trees, even if they are referenced.
 * 3. A root with children renders as an aggregate; without children, as a
 *    standalone object.
 */
function inferAggregateRoots(objects: DomainObject[]): DomainObjectNode[] {
  const objectMap = new Map<string, DomainObject>();
  const explicitRoots = new Set<string>();
  for (const obj of objects) {
    objectMap.set(obj.name, obj);
    if (obj.isAggregateRoot) explicitRoots.add(obj.name);
  }

  const referenced = new Set<string>();
  for (const obj of objects) {
    if (!obj.properties) continue;
    for (const prop of obj.properties) {
      for (const name of extractTypeNames(prop.type)) {
        if (objectMap.has(name)) referenced.add(name);
      }
    }
  }

  const roots = objects.filter(
    (o) => explicitRoots.has(o.name) || !referenced.has(o.name),
  );

  return roots.map((root) => {
    // Block other explicit roots from being absorbed as children of this tree.
    const blocked = new Set<string>(explicitRoots);
    blocked.delete(root.name);
    return buildTree(root, objectMap, blocked);
  });
}

function buildTree(
  object: DomainObject,
  objectMap: Map<string, DomainObject>,
  blocked: Set<string>,
): DomainObjectNode {
  blocked.add(object.name);
  const children: DomainObjectNode[] = [];

  if (object.properties) {
    for (const prop of object.properties) {
      for (const name of extractTypeNames(prop.type)) {
        const child = objectMap.get(name);
        if (child && !blocked.has(child.name)) {
          children.push(buildTree(child, objectMap, blocked));
        }
      }
    }
  }

  return { object, children };
}
