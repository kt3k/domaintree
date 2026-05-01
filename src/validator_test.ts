import { assertEquals, assertStringIncludes } from "@std/assert";
import { validate } from "./validator.ts";

Deno.test("validate: accepts a valid document", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Order",
        kind: "entity",
        properties: [{ name: "id", type: "string" }],
      },
    ],
  };
  assertEquals(validate(doc), []);
});

Deno.test("validate: reports missing required fields", () => {
  const errors = validate({ models: [] });
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "(root)");
  assertStringIncludes(errors[0].message, "title");
});

Deno.test("validate: reports wrong top-level type", () => {
  const errors = validate("not an object");
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "(root)");
  assertStringIncludes(errors[0].message, "object");
  assertStringIncludes(errors[0].message, "string");
});

Deno.test("validate: reports invalid enum value", () => {
  const doc = {
    title: "Test",
    models: [{ name: "Foo", kind: "enum" }],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "models[0].kind");
});

Deno.test("validate: reports unknown property when additionalProperties is false", () => {
  const doc = {
    title: "Test",
    models: [{ name: "Foo", kind: "entity", extra: 1 }],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "models[0]");
  assertStringIncludes(errors[0].message, "extra");
});

Deno.test("validate: reports nested property errors with full path", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Foo",
        kind: "entity",
        properties: [{ name: "id" }],
      },
    ],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "models[0].properties[0]");
  assertStringIncludes(errors[0].message, "type");
});

Deno.test("validate: accepts isAggregateRoot boolean", () => {
  const doc = {
    title: "Test",
    models: [
      { name: "Order", kind: "entity", isAggregateRoot: true },
      { name: "OrderItem", kind: "entity", isAggregateRoot: false },
    ],
  };
  assertEquals(validate(doc), []);
});

Deno.test("validate: rejects non-boolean isAggregateRoot", () => {
  const doc = {
    title: "Test",
    models: [{ name: "Order", kind: "entity", isAggregateRoot: "yes" }],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "models[0].isAggregateRoot");
  assertStringIncludes(errors[0].message, "boolean");
  assertStringIncludes(errors[0].message, "string");
});

Deno.test("validate: accumulates multiple errors", () => {
  const doc = {
    title: 123,
    models: [{ name: "Foo", kind: "bogus" }],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 2);
});

Deno.test("validate: warns when type contains a known model in an unsupported wrapper", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Order",
        kind: "entity",
        properties: [{ name: "lookup", type: "Map<string, OrderItem>" }],
      },
      { name: "OrderItem", kind: "entity" },
    ],
  };
  const issues = validate(doc);
  assertEquals(issues.length, 1);
  assertEquals(issues[0].severity, "warning");
  assertEquals(issues[0].path, "models[0].properties[0].type");
  assertStringIncludes(issues[0].message, "OrderItem");
});

Deno.test("validate: does not warn for supported wrappers", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Order",
        kind: "entity",
        isAggregateRoot: true,
        properties: [
          { name: "items", type: "OrderItem[]" },
          { name: "primary", type: "OrderItem?" },
          { name: "set", type: "Set<OrderItem>" },
          { name: "wrapped", type: "Array<OrderItem | Order>" },
        ],
      },
      { name: "OrderItem", kind: "entity" },
    ],
  };
  assertEquals(validate(doc), []);
});

Deno.test("validate: does not warn when type only contains primitive names", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Order",
        kind: "entity",
        properties: [{ name: "memo", type: "string" }],
      },
    ],
  };
  assertEquals(validate(doc), []);
});

Deno.test("validate: does not match model names as substrings of unrelated tokens", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Order",
        kind: "entity",
        properties: [{ name: "memo", type: "PreorderTag" }],
      },
    ],
  };
  assertEquals(validate(doc), []);
});

Deno.test('validate: errors carry severity "error"', () => {
  const errors = validate({ models: [] });
  assertEquals(errors[0].severity, "error");
});

Deno.test("validate: errors on a 2-cycle with no aggregate root", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "A",
        kind: "entity",
        properties: [{ name: "b", type: "B" }],
      },
      {
        name: "B",
        kind: "entity",
        properties: [{ name: "a", type: "A" }],
      },
    ],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 2);
  assertEquals(errors[0].severity, "error");
  assertEquals(errors[0].path, "models[0]");
  assertStringIncludes(errors[0].message, "unreachable");
  assertStringIncludes(errors[0].message, "A");
  assertEquals(errors[1].path, "models[1]");
  assertStringIncludes(errors[1].message, "B");
});

Deno.test("validate: cycle is OK when one member is an explicit aggregate root", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "A",
        kind: "entity",
        isAggregateRoot: true,
        properties: [{ name: "b", type: "B" }],
      },
      {
        name: "B",
        kind: "entity",
        properties: [{ name: "a", type: "A" }],
      },
    ],
  };
  assertEquals(validate(doc), []);
});

Deno.test("validate: errors only on the cycle members, not on reachable models", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Root",
        kind: "entity",
        properties: [{ name: "child", type: "Child" }],
      },
      { name: "Child", kind: "entity" },
      {
        name: "A",
        kind: "entity",
        properties: [{ name: "b", type: "B" }],
      },
      {
        name: "B",
        kind: "entity",
        properties: [{ name: "a", type: "A" }],
      },
    ],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 2);
  assertEquals(errors.map((e) => e.path), ["models[2]", "models[3]"]);
});

Deno.test("validate: self-reference without explicit root is unreachable", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Node",
        kind: "entity",
        properties: [{ name: "parent", type: "Node?" }],
      },
    ],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].severity, "error");
  assertStringIncludes(errors[0].message, "Node");
});

Deno.test("validate: self-reference with explicit root is OK", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Node",
        kind: "entity",
        isAggregateRoot: true,
        properties: [{ name: "parent", type: "Node?" }],
      },
    ],
  };
  assertEquals(validate(doc), []);
});
