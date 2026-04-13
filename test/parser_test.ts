import "deno-test";
import { parse } from "../src/parser.ts";

Deno.test("parse: converts valid YAML to DomainDocument", () => {
  const yaml = `
title: "Test Domain"
aggregates:
  - name: Order
    description: "Order aggregate"
    root:
      name: Order
      type: entity
      properties:
        - name: id
          type: OrderId
      children:
        - name: OrderId
          type: value_object
          properties:
            - name: value
              type: string
        - name: Status
          type: enum
          values:
            - PENDING
            - CONFIRMED
`;

  const doc = parse(yaml);

  if (doc.title !== "Test Domain") throw new Error("title mismatch");
  if (doc.aggregates.length !== 1) throw new Error("aggregates length mismatch");

  const agg = doc.aggregates[0];
  if (agg.name !== "Order") throw new Error("aggregate name mismatch");
  if (agg.description !== "Order aggregate") throw new Error("aggregate description mismatch");
  if (agg.root.name !== "Order") throw new Error("root name mismatch");
  if (agg.root.type !== "entity") throw new Error("root type mismatch");
  if (agg.root.properties?.length !== 1) throw new Error("root properties length mismatch");
  if (agg.root.properties?.[0].name !== "id") throw new Error("root property name mismatch");
  if (agg.root.children?.length !== 2) throw new Error("root children length mismatch");

  const vo = agg.root.children![0];
  if (vo.name !== "OrderId") throw new Error("child VO name mismatch");
  if (vo.type !== "value_object") throw new Error("child VO type mismatch");
  if (vo.properties?.length !== 1) throw new Error("child VO properties length mismatch");

  const enumModel = agg.root.children![1];
  if (enumModel.name !== "Status") throw new Error("child enum name mismatch");
  if (enumModel.type !== "enum") throw new Error("child enum type mismatch");
  if (enumModel.values?.length !== 2) throw new Error("child enum values length mismatch");
  if (enumModel.values![0] !== "PENDING") throw new Error("enum value[0] mismatch");
});

Deno.test("parse: throws on missing title", () => {
  const yaml = `
aggregates:
  - name: Order
    root:
      name: Order
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

Deno.test("parse: throws on missing aggregates", () => {
  const yaml = `title: "Test"`;
  let threw = false;
  try {
    parse(yaml);
  } catch (e) {
    threw = true;
    if (!(e instanceof Error) || !e.message.includes("aggregates")) {
      throw new Error("Expected error about missing aggregates");
    }
  }
  if (!threw) throw new Error("Expected parse to throw");
});

Deno.test("parse: throws on missing root", () => {
  const yaml = `
title: "Test"
aggregates:
  - name: Order
`;
  let threw = false;
  try {
    parse(yaml);
  } catch (e) {
    threw = true;
    if (!(e instanceof Error) || !e.message.includes("root")) {
      throw new Error("Expected error about missing root");
    }
  }
  if (!threw) throw new Error("Expected parse to throw");
});

Deno.test("parse: throws on invalid model type", () => {
  const yaml = `
title: "Test"
aggregates:
  - name: Order
    root:
      name: Order
      type: invalid_type
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
