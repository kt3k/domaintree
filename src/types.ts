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
  /**
   * True when this node represents a reference to an aggregate root that
   * lives in a different aggregate. The node is rendered as a leaf with no
   * properties, indicating the cross-aggregate link without re-displaying
   * the target's body.
   */
  isExternalReference?: boolean;
}

export interface DomainDocument {
  title: string;
  roots: DomainObjectNode[];
}
