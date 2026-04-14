import { assertEquals, assertThrows } from "@std/assert";
import { parse } from "./parser.ts";

Deno.test("parse: converts flat models JSON to DomainDocument", () => {
  const json = JSON.stringify({
    title: "Test Domain",
    models: [
      {
        name: "Order",
        type: "entity",
        description: "Order aggregate",
        properties: [
          { name: "id", type: "OrderId" },
          { name: "items", type: "OrderItem" },
        ],
      },
      {
        name: "OrderItem",
        type: "entity",
        properties: [{ name: "quantity", type: "number" }],
      },
      {
        name: "OrderId",
        type: "value_object",
        properties: [{ name: "value", type: "string" }],
      },
    ],
  });

  const doc = parse(json);

  assertEquals(doc.title, "Test Domain");
  assertEquals(doc.groups.length, 1);

  const group = doc.groups[0];
  assertEquals(group.kind, "aggregate");
  assertEquals(group.root.model.name, "Order");
  assertEquals(group.description, "Order aggregate");
  assertEquals(group.root.children.length, 2);
  // Children follow property order: id (OrderId) then items (OrderItem)
  assertEquals(group.root.children[0].model.name, "OrderId");
  assertEquals(group.root.children[1].model.name, "OrderItem");
});

Deno.test("parse: infers multiple aggregates", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [
      {
        name: "Order",
        type: "entity",
        properties: [{ name: "id", type: "OrderId" }],
      },
      {
        name: "OrderId",
        type: "value_object",
        properties: [{ name: "value", type: "string" }],
      },
      {
        name: "Customer",
        type: "entity",
        properties: [{ name: "id", type: "CustomerId" }],
      },
      {
        name: "CustomerId",
        type: "value_object",
        properties: [{ name: "value", type: "string" }],
      },
    ],
  });

  const doc = parse(json);
  assertEquals(doc.groups.length, 2);
  assertEquals(doc.groups[0].root.model.name, "Order");
  assertEquals(doc.groups[1].root.model.name, "Customer");
});

Deno.test("parse: standalone model (no children)", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [
      {
        name: "Config",
        type: "value_object",
        properties: [{ name: "key", type: "string" }],
      },
    ],
  });

  const doc = parse(json);
  assertEquals(doc.groups.length, 1);
  assertEquals(doc.groups[0].kind, "standalone");
});

Deno.test("parse: nested children (transitive references)", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [
      {
        name: "Order",
        type: "entity",
        properties: [{ name: "item", type: "OrderItem" }],
      },
      {
        name: "OrderItem",
        type: "entity",
        properties: [{ name: "price", type: "Money" }],
      },
      {
        name: "Money",
        type: "value_object",
        properties: [{ name: "amount", type: "number" }],
      },
    ],
  });

  const doc = parse(json);
  assertEquals(doc.groups.length, 1);
  const root = doc.groups[0].root;
  assertEquals(root.children.length, 1);
  const orderItem = root.children[0];
  assertEquals(orderItem.children.length, 1);
  assertEquals(orderItem.children[0].model.name, "Money");
});

Deno.test("parse: throws on missing title", () => {
  const json = JSON.stringify({
    models: [{ name: "Foo", type: "entity" }],
  });
  assertThrows(() => parse(json), Error, "title");
});

Deno.test("parse: throws on missing models", () => {
  const json = JSON.stringify({ title: "Test" });
  assertThrows(() => parse(json), Error, "models");
});

Deno.test("parse: throws on invalid model type", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [{ name: "Foo", type: "enum" }],
  });
  assertThrows(() => parse(json), Error, "type");
});

Deno.test("parse: throws on invalid JSON", () => {
  assertThrows(() => parse("not json"), Error, "Invalid JSON");
});
