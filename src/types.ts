export interface Property {
  name: string;
  type: string;
}

/** Input model as defined in the JSON file */
export interface Model {
  name: string;
  type: "entity" | "value_object";
  description?: string;
  properties?: Property[];
}

/** Internal tree node built from aggregate inference */
export interface ModelNode {
  model: Model;
  children: ModelNode[];
}

/** A display group: either an aggregate (with children) or a standalone model */
export interface DisplayGroup {
  /** "aggregate" if the root has children, "standalone" otherwise */
  kind: "aggregate" | "standalone";
  root: ModelNode;
  description?: string;
}

export interface DomainDocument {
  title: string;
  groups: DisplayGroup[];
}
