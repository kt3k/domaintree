import { parse as parseYaml } from "yaml";
import type { Aggregate, DomainDocument, DomainModel, Property } from "./types.ts";

export function parse(yamlString: string): DomainDocument {
  const raw = parseYaml(yamlString);
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid YAML: expected an object at the top level");
  }

  const doc = raw as Record<string, unknown>;

  if (typeof doc.title !== "string" || doc.title.trim() === "") {
    throw new Error("Missing required field: title");
  }

  if (!Array.isArray(doc.aggregates) || doc.aggregates.length === 0) {
    throw new Error("Missing required field: aggregates (must be a non-empty array)");
  }

  const aggregates = doc.aggregates.map(parseAggregate);

  return { title: doc.title, aggregates };
}

function parseAggregate(raw: unknown, index: number): Aggregate {
  if (!raw || typeof raw !== "object") {
    throw new Error(`aggregates[${index}]: expected an object`);
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.trim() === "") {
    throw new Error(`aggregates[${index}]: missing required field "name"`);
  }

  if (!obj.root || typeof obj.root !== "object") {
    throw new Error(`aggregates[${index}] (${obj.name}): missing required field "root"`);
  }

  const root = parseDomainModel(obj.root, `aggregates[${index}].root`);

  return {
    name: obj.name,
    description: typeof obj.description === "string" ? obj.description : undefined,
    root,
  };
}

function parseDomainModel(raw: unknown, path: string): DomainModel {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${path}: expected an object`);
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.trim() === "") {
    throw new Error(`${path}: missing required field "name"`);
  }

  const validTypes = ["entity", "value_object", "enum"];
  if (typeof obj.type !== "string" || !validTypes.includes(obj.type)) {
    throw new Error(`${path} (${obj.name}): "type" must be one of: ${validTypes.join(", ")}`);
  }

  const model: DomainModel = {
    name: obj.name,
    type: obj.type as DomainModel["type"],
  };

  if (typeof obj.description === "string") {
    model.description = obj.description;
  }

  if (Array.isArray(obj.properties)) {
    model.properties = obj.properties.map((p: unknown, i: number) =>
      parseProperty(p, `${path}.properties[${i}]`)
    );
  }

  if (Array.isArray(obj.values)) {
    model.values = obj.values.map((v: unknown, i: number) => {
      if (typeof v !== "string") {
        throw new Error(`${path}.values[${i}]: expected a string`);
      }
      return v;
    });
  }

  if (Array.isArray(obj.children)) {
    model.children = obj.children.map((c: unknown, i: number) =>
      parseDomainModel(c, `${path}.children[${i}]`)
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
