import { assertEquals, assertStringIncludes } from "@std/assert";
import { buildAction, validateAction } from "./actions.ts";

const validJson = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    title: "Test",
    models: [{ name: "Order", kind: "entity" }],
    ...overrides,
  });

const throwingReader = () => {
  throw new Error("ENOENT");
};

Deno.test("buildAction: returns error when file cannot be read", () => {
  const result = buildAction(throwingReader, { input: "missing.json" });
  if (result.ok) throw new Error("expected failure");
  assertStringIncludes(result.error, "Cannot read file");
  assertStringIncludes(result.error, "missing.json");
});

Deno.test("buildAction: returns error on invalid JSON", () => {
  const result = buildAction(() => "not json", { input: "x.json" });
  if (result.ok) throw new Error("expected failure");
  assertStringIncludes(result.error, "Invalid JSON");
});

Deno.test("buildAction: returns error on missing title", () => {
  const result = buildAction(
    () => JSON.stringify({ models: [{ name: "X", kind: "entity" }] }),
    { input: "x.json" },
  );
  if (result.ok) throw new Error("expected failure");
  assertStringIncludes(result.error, "title");
});

Deno.test("buildAction: returns HTML on success", () => {
  const result = buildAction(() => validJson(), { input: "x.json" });
  if (!result.ok) throw new Error(`expected success, got: ${result.error}`);
  assertStringIncludes(result.html, "<!DOCTYPE html>");
  assertStringIncludes(result.html, "<title>Test</title>");
});

Deno.test("buildAction: applies title override", () => {
  const result = buildAction(() => validJson(), {
    input: "x.json",
    title: "Override",
  });
  if (!result.ok) throw new Error("expected success");
  assertStringIncludes(result.html, "<title>Override</title>");
});

Deno.test("validateAction: returns ok for valid input", () => {
  const result = validateAction(() => validJson(), { input: "x.json" });
  assertEquals(result.ok, true);
});

Deno.test("validateAction: returns io error when file cannot be read", () => {
  const result = validateAction(throwingReader, { input: "missing.json" });
  if (result.ok) throw new Error("expected failure");
  assertEquals(result.kind, "io");
  if (result.kind === "io") {
    assertStringIncludes(result.error, "Cannot read file");
    assertStringIncludes(result.error, "missing.json");
  }
});

Deno.test("validateAction: returns io error on invalid JSON", () => {
  const result = validateAction(() => "not json", { input: "x.json" });
  if (result.ok) throw new Error("expected failure");
  assertEquals(result.kind, "io");
  if (result.kind === "io") assertStringIncludes(result.error, "Invalid JSON");
});

Deno.test("validateAction: returns schema errors on invalid input", () => {
  const result = validateAction(
    () => JSON.stringify({ models: [] }),
    { input: "x.json" },
  );
  if (result.ok) throw new Error("expected failure");
  assertEquals(result.kind, "schema");
  if (result.kind === "schema") {
    assertEquals(result.errors.length > 0, true);
  }
});
