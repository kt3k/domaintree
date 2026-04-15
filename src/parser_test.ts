import { assertEquals, assertThrows } from "@std/assert";
import { parse } from "./parser.ts";

Deno.test("parse: converts flat models JSON to DomainDocument", () => {
  const json = JSON.stringify({
    title: "Test Domain",
    models: [
      {
        name: "Order",
        kind: "entity",
        description: "Order aggregate",
        properties: [
          { name: "id", type: "OrderId" },
          { name: "items", type: "OrderItem" },
        ],
      },
      {
        name: "OrderItem",
        kind: "entity",
        properties: [{ name: "quantity", type: "number" }],
      },
      {
        name: "OrderId",
        kind: "value_object",
        properties: [{ name: "value", type: "string" }],
      },
    ],
  });

  const doc = parse(json);

  assertEquals(doc.title, "Test Domain");
  assertEquals(doc.groups.length, 1);

  const group = doc.groups[0];
  assertEquals(group.kind, "aggregate");
  assertEquals(group.root.object.name, "Order");
  assertEquals(group.description, "Order aggregate");
  assertEquals(group.root.children.length, 2);
  // Children follow property order: id (OrderId) then items (OrderItem)
  assertEquals(group.root.children[0].object.name, "OrderId");
  assertEquals(group.root.children[1].object.name, "OrderItem");
});

Deno.test("parse: infers multiple aggregates", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [
      {
        name: "Order",
        kind: "entity",
        properties: [{ name: "id", type: "OrderId" }],
      },
      {
        name: "OrderId",
        kind: "value_object",
        properties: [{ name: "value", type: "string" }],
      },
      {
        name: "Customer",
        kind: "entity",
        properties: [{ name: "id", type: "CustomerId" }],
      },
      {
        name: "CustomerId",
        kind: "value_object",
        properties: [{ name: "value", type: "string" }],
      },
    ],
  });

  const doc = parse(json);
  assertEquals(doc.groups.length, 2);
  assertEquals(doc.groups[0].root.object.name, "Order");
  assertEquals(doc.groups[1].root.object.name, "Customer");
});

Deno.test("parse: standalone model (no children)", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [
      {
        name: "Config",
        kind: "value_object",
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
        kind: "entity",
        properties: [{ name: "item", type: "OrderItem" }],
      },
      {
        name: "OrderItem",
        kind: "entity",
        properties: [{ name: "price", type: "Money" }],
      },
      {
        name: "Money",
        kind: "value_object",
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
  assertEquals(orderItem.children[0].object.name, "Money");
});

Deno.test("parse: throws on missing title", () => {
  const json = JSON.stringify({
    models: [{ name: "Foo", kind: "entity" }],
  });
  assertThrows(() => parse(json), Error, "title");
});

Deno.test("parse: throws on missing models", () => {
  const json = JSON.stringify({ title: "Test" });
  assertThrows(() => parse(json), Error, "models");
});

Deno.test("parse: throws on invalid model kind", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [{ name: "Foo", kind: "enum" }],
  });
  assertThrows(() => parse(json), Error, "kind");
});

Deno.test("parse: throws on invalid JSON", () => {
  assertThrows(() => parse("not json"), Error, "Invalid JSON");
});

Deno.test("parse: resolves wrapper notations ([], ?, Array<T>, Set<T>)", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [
      {
        name: "Order",
        kind: "entity",
        properties: [
          { name: "items", type: "OrderItem[]" },
          { name: "coupon", type: "Coupon?" },
          { name: "tags", type: "Array<Tag>" },
          { name: "notes", type: "Set<Note>" },
        ],
      },
      { name: "OrderItem", kind: "entity" },
      { name: "Coupon", kind: "value_object" },
      { name: "Tag", kind: "value_object" },
      { name: "Note", kind: "value_object" },
    ],
  });

  const doc = parse(json);
  assertEquals(doc.groups.length, 1);
  const root = doc.groups[0].root;
  assertEquals(root.object.name, "Order");
  assertEquals(root.children.map((c) => c.object.name), [
    "OrderItem",
    "Coupon",
    "Tag",
    "Note",
  ]);
  // Original type strings preserved for display
  assertEquals(root.object.properties?.[0].type, "OrderItem[]");
  assertEquals(root.object.properties?.[2].type, "Array<Tag>");
});

Deno.test("parse: resolves composed wrappers (Array<T>?, Set<T>[])", () => {
  const json = JSON.stringify({
    title: "Test",
    models: [
      {
        name: "Order",
        kind: "entity",
        properties: [
          { name: "items", type: "Array<OrderItem>?" },
          { name: "tags", type: "Set<Tag>[]" },
        ],
      },
      { name: "OrderItem", kind: "entity" },
      { name: "Tag", kind: "value_object" },
    ],
  });

  const doc = parse(json);
  const root = doc.groups[0].root;
  assertEquals(root.children.map((c) => c.object.name), ["OrderItem", "Tag"]);
});
