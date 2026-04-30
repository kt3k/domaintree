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
