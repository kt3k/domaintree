import { assertFalse, assertStringIncludes } from "@std/assert";
import { render } from "./renderer.ts";
import type { DomainDocument } from "./types.ts";

function makeDoc(): DomainDocument {
  return {
    title: "Test Domain",
    groups: [
      {
        kind: "aggregate",
        description: "Order aggregate",
        root: {
          object: {
            name: "Order",
            kind: "entity",
            description: "Order aggregate",
            properties: [
              { name: "id", type: "OrderId" },
              { name: "items", type: "OrderItem" },
            ],
          },
          children: [
            {
              object: {
                name: "OrderItem",
                kind: "entity",
                properties: [{ name: "quantity", type: "number" }],
              },
              children: [
                {
                  object: {
                    name: "Money",
                    kind: "value_object",
                    properties: [
                      { name: "amount", type: "number" },
                      { name: "currency", type: "string" },
                    ],
                  },
                  children: [],
                },
              ],
            },
            {
              object: {
                name: "OrderId",
                kind: "value_object",
                properties: [{ name: "value", type: "string" }],
              },
              children: [],
            },
          ],
        },
      },
    ],
  };
}

Deno.test("render: produces valid HTML structure", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "<html");
  assertStringIncludes(html, "</html>");
  assertStringIncludes(html, "<style>");
});

Deno.test("render: includes title", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, "<title>Test Domain</title>");
  assertStringIncludes(html, "<h1>Test Domain</h1>");
});

Deno.test("render: renders aggregate header", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, "📦");
  assertStringIncludes(html, "Order");
  assertStringIncludes(html, "Order aggregate");
  assertStringIncludes(html, "aggregate-header");
});

Deno.test("render: renders entity card", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, 'class="card entity"');
  assertStringIncludes(html, "🔷");
  assertStringIncludes(html, ">Entity<");
});

Deno.test("render: renders value object card", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, 'class="card value-object"');
  assertStringIncludes(html, "💎");
  assertStringIncludes(html, ">Value Object<");
});

Deno.test("render: renders properties", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, "id:");
  assertStringIncludes(html, "OrderId");
  assertStringIncludes(html, "prop-name");
  assertStringIncludes(html, "prop-type");
});

Deno.test("render: renders nested children as subtree", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, "Money");
  assertStringIncludes(html, "amount:");
});

Deno.test("render: renders subtitle with stats", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, "1 Aggregate");
  assertStringIncludes(html, "2 Entities");
  assertStringIncludes(html, "2 Value Objects");
});

Deno.test("render: includes dark mode CSS", () => {
  const html = render(makeDoc());
  assertStringIncludes(html, "prefers-color-scheme: dark");
});

Deno.test("render: standalone object (no aggregate wrapper)", () => {
  const doc: DomainDocument = {
    title: "Test",
    groups: [
      {
        kind: "standalone",
        root: {
          object: {
            name: "Config",
            kind: "value_object",
            properties: [{ name: "key", type: "string" }],
          },
          children: [],
        },
      },
    ],
  };
  const html = render(doc);
  assertStringIncludes(html, "Config");
  assertStringIncludes(html, "standalone");
  assertFalse(html.includes('class="aggregate-header"'));
});
