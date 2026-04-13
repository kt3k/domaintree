export interface Property {
  name: string;
  type: string;
}

export interface DomainModel {
  name: string;
  type: "entity" | "value_object" | "enum";
  description?: string;
  properties?: Property[];
  values?: string[];
  children?: DomainModel[];
}

export interface Aggregate {
  name: string;
  description?: string;
  root: DomainModel;
}

export interface DomainDocument {
  title: string;
  aggregates: Aggregate[];
}
