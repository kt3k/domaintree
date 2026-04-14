export interface Property {
  name: string;
  type: string;
}

/** Input domain object as defined in the JSON file */
export interface DomainObject {
  name: string;
  kind: "entity" | "value_object";
  description?: string;
  properties?: Property[];
}

/** Internal tree node built from aggregate inference */
export interface DomainObjectNode {
  object: DomainObject;
  children: DomainObjectNode[];
}

/** A display group: either an aggregate (with children) or a standalone object */
export interface DisplayGroup {
  /** "aggregate" if the root has children, "standalone" otherwise */
  kind: "aggregate" | "standalone";
  root: DomainObjectNode;
  description?: string;
}

export interface DomainDocument {
  title: string;
  groups: DisplayGroup[];
}
