import "deno-test";
import { parse } from "../src/parser.ts";

Deno.test("parse: converts flat models YAML to DomainDocument", () => {
  const yaml = `
title: "Test Domain"
models:
  - name: Order
    type: entity
    description: "Order aggregate"
    properties:
      - name: id
        type: OrderId
      - name: items
        type: OrderItem
  - name: OrderItem
    type: entity
    properties:
      - name: quantity
        type: number
  - name: OrderId
    type: value_object
    properties:
      - name: value
        type: string
`;

  const doc = parse(yaml);

  if (doc.title !== "Test Domain") throw new Error("title mismatch");
  if (doc.groups.length !== 1) {
    throw new Error(`expected 1 group, got ${doc.groups.length}`);
  }

  const group = doc.groups[0];
  if (group.kind !== "aggregate") {
    throw new Error(`expected aggregate, got ${group.kind}`);
  }
  if (group.root.model.name !== "Order") {
    throw new Error("root name mismatch");
  }
  if (group.description !== "Order aggregate") {
    throw new Error("description mismatch");
  }
  if (group.root.children.length !== 2) {
    throw new Error(
      `expected 2 children, got ${group.root.children.length}`,
    );
  }
  // Children follow property order: id (OrderId) then items (OrderItem)
  if (group.root.children[0].model.name !== "OrderId") {
    throw new Error("first child should be OrderId");
  }
  if (group.root.children[1].model.name !== "OrderItem") {
    throw new Error("second child should be OrderItem");
  }
});

Deno.test("parse: infers multiple aggregates", () => {
  const yaml = `
title: "Test"
models:
  - name: Order
    type: entity
    properties:
      - name: id
        type: OrderId
  - name: OrderId
    type: value_object
    properties:
      - name: value
        type: string
  - name: Customer
    type: entity
    properties:
      - name: id
        type: CustomerId
  - name: CustomerId
    type: value_object
    properties:
      - name: value
        type: string
`;

  const doc = parse(yaml);
  if (doc.groups.length !== 2) {
    throw new Error(`expected 2 groups, got ${doc.groups.length}`);
  }
  if (doc.groups[0].root.model.name !== "Order") {
    throw new Error("first group root should be Order");
  }
  if (doc.groups[1].root.model.name !== "Customer") {
    throw new Error("second group root should be Customer");
  }
});

Deno.test("parse: standalone model (no children)", () => {
  const yaml = `
title: "Test"
models:
  - name: Config
    type: value_object
    properties:
      - name: key
        type: string
`;

  const doc = parse(yaml);
  if (doc.groups.length !== 1) {
    throw new Error(`expected 1 group, got ${doc.groups.length}`);
  }
  if (doc.groups[0].kind !== "standalone") {
    throw new Error(`expected standalone, got ${doc.groups[0].kind}`);
  }
});

Deno.test("parse: nested children (transitive references)", () => {
  const yaml = `
title: "Test"
models:
  - name: Order
    type: entity
    properties:
      - name: item
        type: OrderItem
  - name: OrderItem
    type: entity
    properties:
      - name: price
        type: Money
  - name: Money
    type: value_object
    properties:
      - name: amount
        type: number
`;

  const doc = parse(yaml);
  if (doc.groups.length !== 1) {
    throw new Error(`expected 1 group, got ${doc.groups.length}`);
  }
  const root = doc.groups[0].root;
  if (root.children.length !== 1) {
    throw new Error("Order should have 1 child (OrderItem)");
  }
  const orderItem = root.children[0];
  if (orderItem.children.length !== 1) {
    throw new Error("OrderItem should have 1 child (Money)");
  }
  if (orderItem.children[0].model.name !== "Money") {
    throw new Error("OrderItem's child should be Money");
  }
});

Deno.test("parse: throws on missing title", () => {
  const yaml = `
models:
  - name: Foo
    type: entity
`;
  let threw = false;
  try {
    parse(yaml);
  } catch (e) {
    threw = true;
    if (!(e instanceof Error) || !e.message.includes("title")) {
      throw new Error("Expected error about missing title");
    }
  }
  if (!threw) throw new Error("Expected parse to throw");
});

Deno.test("parse: throws on missing models", () => {
  const yaml = `title: "Test"`;
  let threw = false;
  try {
    parse(yaml);
  } catch (e) {
    threw = true;
    if (!(e instanceof Error) || !e.message.includes("models")) {
      throw new Error("Expected error about missing models");
    }
  }
  if (!threw) throw new Error("Expected parse to throw");
});

Deno.test("parse: throws on invalid model type", () => {
  const yaml = `
title: "Test"
models:
  - name: Foo
    type: enum
`;
  let threw = false;
  try {
    parse(yaml);
  } catch (e) {
    threw = true;
    if (!(e instanceof Error) || !e.message.includes("type")) {
      throw new Error("Expected error about invalid type");
    }
  }
  if (!threw) throw new Error("Expected parse to throw");
});
