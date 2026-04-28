export const inputSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "DomainChartInput",
  description: "Input schema for domainchart JSON files",
  type: "object",
  required: ["title", "models"],
  properties: {
    title: {
      type: "string",
      description: "Title of the infographic",
    },
    models: {
      type: "array",
      description: "List of domain models",
      items: {
        type: "object",
        required: ["name", "kind"],
        properties: {
          name: {
            type: "string",
            description: "Model name",
          },
          kind: {
            type: "string",
            enum: ["entity", "value_object"],
            description: "Model kind",
          },
          description: {
            type: "string",
            description:
              "Description (used as aggregate description for root entities)",
          },
          isAggregateRoot: {
            type: "boolean",
            description:
              "If true, this model is forced to be an aggregate root. Models without this flag still fall back to inference (unreferenced models become roots).",
          },
          properties: {
            type: "array",
            description: "List of properties",
            items: {
              type: "object",
              required: ["name", "type"],
              properties: {
                name: {
                  type: "string",
                  description: "Property name",
                },
                type: {
                  type: "string",
                  description:
                    "Type name. If it matches another model's name, a parent-child relationship is inferred. Wrapper notations are stripped before matching: `T[]`, `T?`, `Array<T>`, `Set<T>`, and their compositions (e.g. `Array<T>?`, `Set<T>[]`). Union types `A | B` are supported and treat each member as a reference (e.g. `Foo | Bar`, `Array<Foo | Bar>`).",
                },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};
