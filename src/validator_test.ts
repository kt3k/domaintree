import { assertEquals } from "@std/assert";
import { validate } from "./validator.ts";

Deno.test("validate: accepts a valid document", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Order",
        type: "entity",
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
  assertEquals(errors[0].message, 'missing required property "title"');
});

Deno.test("validate: reports wrong top-level type", () => {
  const errors = validate("not an object");
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "(root)");
  assertEquals(errors[0].message, "expected object, got string");
});

Deno.test("validate: reports invalid enum value", () => {
  const doc = {
    title: "Test",
    models: [{ name: "Foo", type: "enum" }],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "models[0].type");
});

Deno.test("validate: reports unknown property when additionalProperties is false", () => {
  const doc = {
    title: "Test",
    models: [{ name: "Foo", type: "entity", extra: 1 }],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "models[0]");
  assertEquals(errors[0].message, 'unknown property "extra"');
});

Deno.test("validate: reports nested property errors with full path", () => {
  const doc = {
    title: "Test",
    models: [
      {
        name: "Foo",
        type: "entity",
        properties: [{ name: "id" }],
      },
    ],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].path, "models[0].properties[0]");
  assertEquals(errors[0].message, 'missing required property "type"');
});

Deno.test("validate: accumulates multiple errors", () => {
  const doc = {
    title: 123,
    models: [{ name: "Foo", type: "bogus" }],
  };
  const errors = validate(doc);
  assertEquals(errors.length, 2);
});
