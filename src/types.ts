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
  isAggregateRoot?: boolean;
}

/** Internal tree node built from aggregate inference */
export interface DomainObjectNode {
  object: DomainObject;
  children: DomainObjectNode[];
}

export interface DomainDocument {
  title: string;
  roots: DomainObjectNode[];
}
