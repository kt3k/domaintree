import { parse as parseYaml } from "yaml";
import type {
  DisplayGroup,
  DomainDocument,
  Model,
  ModelNode,
  Property,
} from "./types.ts";

export function parse(yamlString: string): DomainDocument {
  const raw = parseYaml(yamlString);
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid YAML: expected an object at the top level");
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

  const models = doc.models.map((m: unknown, i: number) =>
    parseModel(m, `models[${i}]`)
  );

  const groups = inferGroups(models);

  return { title: doc.title, groups };
}

function parseModel(raw: unknown, path: string): Model {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${path}: expected an object`);
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.trim() === "") {
    throw new Error(`${path}: missing required field "name"`);
  }

  const validTypes = ["entity", "value_object"];
  if (typeof obj.type !== "string" || !validTypes.includes(obj.type)) {
    throw new Error(
      `${path} (${obj.name}): "type" must be one of: ${validTypes.join(", ")}`,
    );
  }

  const model: Model = {
    name: obj.name,
    type: obj.type as Model["type"],
  };

  if (typeof obj.description === "string") {
    model.description = obj.description;
  }

  if (Array.isArray(obj.properties)) {
    model.properties = obj.properties.map((p: unknown, i: number) =>
      parseProperty(p, `${path}.properties[${i}]`)
    );
  }

  return model;
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
 * Infer aggregate boundaries from flat model list.
 *
 * 1. Build a reference graph: property types that match model names.
 * 2. Find roots: models not referenced by any other model.
 * 3. Roots with children → aggregate, roots without → standalone.
 */
function inferGroups(models: Model[]): DisplayGroup[] {
  const modelMap = new Map<string, Model>();
  for (const model of models) {
    modelMap.set(model.name, model);
  }

  // Track which models are referenced by others
  const referenced = new Set<string>();
  for (const model of models) {
    if (model.properties) {
      for (const prop of model.properties) {
        if (modelMap.has(prop.type)) {
          referenced.add(prop.type);
        }
      }
    }
  }

  // Root models: not referenced by any other model
  const roots = models.filter((m) => !referenced.has(m.name));

  return roots.map((root) => {
    const node = buildTree(root, modelMap, new Set());
    const hasChildren = node.children.length > 0;
    return {
      kind: hasChildren ? "aggregate" : "standalone",
      root: node,
      description: hasChildren ? root.description : undefined,
    } as DisplayGroup;
  });
}

function buildTree(
  model: Model,
  modelMap: Map<string, Model>,
  visited: Set<string>,
): ModelNode {
  visited.add(model.name);
  const children: ModelNode[] = [];

  if (model.properties) {
    for (const prop of model.properties) {
      const child = modelMap.get(prop.type);
      if (child && !visited.has(child.name)) {
        children.push(buildTree(child, modelMap, visited));
      }
    }
  }

  return { model, children };
}
