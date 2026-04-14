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
 * Infer aggregate boundaries from flat domain object list.
 *
 * 1. Build a reference graph: property types that match domain object names.
 * 2. Find roots: domain objects not referenced by any other.
 * 3. Roots with children → aggregate, roots without → standalone.
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
        if (objectMap.has(prop.type)) {
          referenced.add(prop.type);
        }
      }
    }
  }

  // Root domain objects: not referenced by any other
  const roots = objects.filter((o) => !referenced.has(o.name));

  return roots.map((root) => {
    const node = buildTree(root, objectMap, new Set());
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
      const child = objectMap.get(prop.type);
      if (child && !visited.has(child.name)) {
        children.push(buildTree(child, objectMap, visited));
      }
    }
  }

  return { object, children };
}
