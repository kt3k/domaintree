import "deno-test";
import { render } from "../src/renderer.ts";
import type { DomainDocument } from "../src/types.ts";

function makeDoc(): DomainDocument {
  return {
    title: "Test Domain",
    aggregates: [
      {
        name: "Order",
        description: "Order aggregate",
        root: {
          name: "Order",
          type: "entity",
          properties: [
            { name: "id", type: "OrderId" },
            { name: "status", type: "OrderStatus" },
          ],
          children: [
            {
              name: "OrderItem",
              type: "entity",
              properties: [{ name: "quantity", type: "number" }],
              children: [
                {
                  name: "Money",
                  type: "value_object",
                  properties: [
                    { name: "amount", type: "number" },
                    { name: "currency", type: "string" },
                  ],
                },
              ],
            },
            {
              name: "OrderStatus",
              type: "enum",
              values: ["PENDING", "CONFIRMED", "SHIPPED"],
            },
            {
              name: "OrderId",
              type: "value_object",
              properties: [{ name: "value", type: "string" }],
            },
          ],
        },
      },
    ],
  };
}

Deno.test("render: produces valid HTML structure", () => {
  const html = render(makeDoc());
  if (!html.includes("<!DOCTYPE html>")) throw new Error("Missing DOCTYPE");
  if (!html.includes("<html")) throw new Error("Missing html tag");
  if (!html.includes("</html>")) throw new Error("Missing closing html tag");
  if (!html.includes("<style>")) throw new Error("Missing style tag");
});

Deno.test("render: includes title", () => {
  const html = render(makeDoc());
  if (!html.includes("<title>Test Domain</title>")) throw new Error("Missing title in head");
  if (!html.includes("<h1>Test Domain</h1>")) throw new Error("Missing h1 title");
});

Deno.test("render: renders aggregate header", () => {
  const html = render(makeDoc());
  if (!html.includes("📦")) throw new Error("Missing aggregate icon");
  if (!html.includes("Order")) throw new Error("Missing aggregate name");
  if (!html.includes("Order aggregate")) throw new Error("Missing aggregate description");
  if (!html.includes("aggregate-header")) throw new Error("Missing aggregate-header class");
});

Deno.test("render: renders entity card", () => {
  const html = render(makeDoc());
  if (!html.includes('class="card entity"')) throw new Error("Missing entity card class");
  if (!html.includes("🔷")) throw new Error("Missing entity icon");
  if (!html.includes(">Entity<")) throw new Error("Missing Entity badge");
});

Deno.test("render: renders value object card", () => {
  const html = render(makeDoc());
  if (!html.includes('class="card value-object"')) throw new Error("Missing value-object card class");
  if (!html.includes("💎")) throw new Error("Missing value object icon");
  if (!html.includes(">Value Object<")) throw new Error("Missing Value Object badge");
});

Deno.test("render: renders enum card with values", () => {
  const html = render(makeDoc());
  if (!html.includes('class="card enum"')) throw new Error("Missing enum card class");
  if (!html.includes("📋")) throw new Error("Missing enum icon");
  if (!html.includes(">Enum<")) throw new Error("Missing Enum badge");
  if (!html.includes("PENDING")) throw new Error("Missing enum value PENDING");
  if (!html.includes("CONFIRMED")) throw new Error("Missing enum value CONFIRMED");
  if (!html.includes("enum-value")) throw new Error("Missing enum-value class");
});

Deno.test("render: renders properties", () => {
  const html = render(makeDoc());
  if (!html.includes("id:")) throw new Error("Missing property name 'id'");
  if (!html.includes("OrderId")) throw new Error("Missing property type 'OrderId'");
  if (!html.includes("prop-name")) throw new Error("Missing prop-name class");
  if (!html.includes("prop-type")) throw new Error("Missing prop-type class");
});

Deno.test("render: renders nested children as subtree", () => {
  const html = render(makeDoc());
  // Money is a child of OrderItem, should appear in a nested .tree
  if (!html.includes("Money")) throw new Error("Missing nested child Money");
  if (!html.includes("amount:")) throw new Error("Missing nested property amount");
});

Deno.test("render: renders subtitle with stats", () => {
  const html = render(makeDoc());
  if (!html.includes("1 Aggregate")) throw new Error("Missing aggregate count");
  if (!html.includes("2 Entities")) throw new Error("Missing entity count");
  if (!html.includes("2 Value Objects")) throw new Error("Missing value object count");
  if (!html.includes("1 Enum")) throw new Error("Missing enum count");
});

Deno.test("render: includes dark mode CSS", () => {
  const html = render(makeDoc());
  if (!html.includes("prefers-color-scheme: dark")) throw new Error("Missing dark mode media query");
});
