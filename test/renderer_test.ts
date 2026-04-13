import "deno-test";
import { render } from "../src/renderer.ts";
import type { DomainDocument } from "../src/types.ts";

function makeDoc(): DomainDocument {
  return {
    title: "Test Domain",
    groups: [
      {
        kind: "aggregate",
        description: "Order aggregate",
        root: {
          model: {
            name: "Order",
            type: "entity",
            description: "Order aggregate",
            properties: [
              { name: "id", type: "OrderId" },
              { name: "items", type: "OrderItem" },
            ],
          },
          children: [
            {
              model: {
                name: "OrderItem",
                type: "entity",
                properties: [{ name: "quantity", type: "number" }],
              },
              children: [
                {
                  model: {
                    name: "Money",
                    type: "value_object",
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
              model: {
                name: "OrderId",
                type: "value_object",
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
  if (!html.includes("<!DOCTYPE html>")) throw new Error("Missing DOCTYPE");
  if (!html.includes("<html")) throw new Error("Missing html tag");
  if (!html.includes("</html>")) throw new Error("Missing closing html tag");
  if (!html.includes("<style>")) throw new Error("Missing style tag");
});

Deno.test("render: includes title", () => {
  const html = render(makeDoc());
  if (!html.includes("<title>Test Domain</title>")) {
    throw new Error("Missing title in head");
  }
  if (!html.includes("<h1>Test Domain</h1>")) {
    throw new Error("Missing h1 title");
  }
});

Deno.test("render: renders aggregate header", () => {
  const html = render(makeDoc());
  if (!html.includes("📦")) throw new Error("Missing aggregate icon");
  if (!html.includes("Order")) throw new Error("Missing aggregate name");
  if (!html.includes("Order aggregate")) {
    throw new Error("Missing aggregate description");
  }
  if (!html.includes("aggregate-header")) {
    throw new Error("Missing aggregate-header class");
  }
});

Deno.test("render: renders entity card", () => {
  const html = render(makeDoc());
  if (!html.includes('class="card entity"')) {
    throw new Error("Missing entity card class");
  }
  if (!html.includes("🔷")) throw new Error("Missing entity icon");
  if (!html.includes(">Entity<")) throw new Error("Missing Entity badge");
});

Deno.test("render: renders value object card", () => {
  const html = render(makeDoc());
  if (!html.includes('class="card value-object"')) {
    throw new Error("Missing value-object card class");
  }
  if (!html.includes("💎")) throw new Error("Missing value object icon");
  if (!html.includes(">Value Object<")) {
    throw new Error("Missing Value Object badge");
  }
});

Deno.test("render: renders properties", () => {
  const html = render(makeDoc());
  if (!html.includes("id:")) throw new Error("Missing property name 'id'");
  if (!html.includes("OrderId")) {
    throw new Error("Missing property type 'OrderId'");
  }
  if (!html.includes("prop-name")) throw new Error("Missing prop-name class");
  if (!html.includes("prop-type")) throw new Error("Missing prop-type class");
});

Deno.test("render: renders nested children as subtree", () => {
  const html = render(makeDoc());
  if (!html.includes("Money")) throw new Error("Missing nested child Money");
  if (!html.includes("amount:")) {
    throw new Error("Missing nested property amount");
  }
});

Deno.test("render: renders subtitle with stats", () => {
  const html = render(makeDoc());
  if (!html.includes("1 Aggregate")) throw new Error("Missing aggregate count");
  if (!html.includes("2 Entities")) throw new Error("Missing entity count");
  if (!html.includes("2 Value Objects")) {
    throw new Error("Missing value object count");
  }
});

Deno.test("render: includes dark mode CSS", () => {
  const html = render(makeDoc());
  if (!html.includes("prefers-color-scheme: dark")) {
    throw new Error("Missing dark mode media query");
  }
});

Deno.test("render: standalone model (no aggregate wrapper)", () => {
  const doc: DomainDocument = {
    title: "Test",
    groups: [
      {
        kind: "standalone",
        root: {
          model: {
            name: "Config",
            type: "value_object",
            properties: [{ name: "key", type: "string" }],
          },
          children: [],
        },
      },
    ],
  };
  const html = render(doc);
  if (!html.includes("Config")) throw new Error("Missing standalone model");
  if (!html.includes("standalone")) {
    throw new Error("Missing standalone class");
  }
  if (html.includes('class="aggregate-header"')) {
    throw new Error("Standalone should not have aggregate header");
  }
});
