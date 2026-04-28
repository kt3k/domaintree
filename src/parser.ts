import type {
  DisplayGroup,
  DomainDocument,
  DomainObject,
  DomainObjectNode,
  Property,
} from "./types.ts";

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

  const groups = inferGroups(objects);

  return { title: doc.title, groups };
}

function parseDomainObject(raw: unknown, path: string): DomainObject {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${path}: expected an object`);
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.trim() === "") {
    throw new Error(`${path}: missing required field "name"`);
  }

  const validKinds = ["entity", "value_object"];
  if (typeof obj.kind !== "string" || !validKinds.includes(obj.kind)) {
    throw new Error(
      `${path} (${obj.name}): "kind" must be one of: ${validKinds.join(", ")}`,
    );
  }

  const domainObject: DomainObject = {
    name: obj.name,
    kind: obj.kind as DomainObject["kind"],
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

  if (typeof obj.name !== "string" || obj.name.trim() === "") {
    throw new Error(`${path}: missing required field "name"`);
  }

  if (typeof obj.type !== "string" || obj.type.trim() === "") {
    throw new Error(`${path}: missing required field "type"`);
  }

  return { name: obj.name, type: obj.type };
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
    const m = s.match(/^(?:Array|Set)<(.+)>$/);
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
 * 2. Find roots: domain objects with an explicit `isAggregateRoot` flag, plus
 *    any domain objects not referenced by another.
 * 3. Roots with children → aggregate, roots without → standalone.
 *
 * Explicit roots are excluded from being children of other trees, even if
 * they are referenced.
 */
function inferGroups(objects: DomainObject[]): DisplayGroup[] {
  const objectMap = new Map<string, DomainObject>();
  for (const obj of objects) {
    objectMap.set(obj.name, obj);
  }

  // Track which domain objects are referenced by others
  const referenced = new Set<string>();
  for (const obj of objects) {
    if (obj.properties) {
      for (const prop of obj.properties) {
        for (const name of extractTypeNames(prop.type)) {
          if (objectMap.has(name)) {
            referenced.add(name);
          }
        }
      }
    }
  }

  const explicitRoots = new Set<string>(
    objects.filter((o) => o.isAggregateRoot).map((o) => o.name),
  );

  // Roots: explicitly flagged OR not referenced by any other
  const roots = objects.filter(
    (o) => explicitRoots.has(o.name) || !referenced.has(o.name),
  );

  return roots.map((root) => {
    // Block other explicit roots from being absorbed as children of this tree.
    const blocked = new Set<string>(explicitRoots);
    blocked.delete(root.name);
    const node = buildTree(root, objectMap, blocked);
    const hasChildren = node.children.length > 0;
    return {
      kind: hasChildren ? "aggregate" : "standalone",
      root: node,
      description: hasChildren ? root.description : undefined,
    } as DisplayGroup;
  });
}

function buildTree(
  object: DomainObject,
  objectMap: Map<string, DomainObject>,
  visited: Set<string>,
): DomainObjectNode {
  visited.add(object.name);
  const children: DomainObjectNode[] = [];

  if (object.properties) {
    for (const prop of object.properties) {
      for (const name of extractTypeNames(prop.type)) {
        const child = objectMap.get(name);
        if (child && !visited.has(child.name)) {
          children.push(buildTree(child, objectMap, visited));
        }
      }
    }
  }

  return { object, children };
}
