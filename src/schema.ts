export const inputSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "DomainGraphInput",
  description: "Input schema for domaingraph JSON files",
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
                    "Type name. If it matches another model's name, a parent-child relationship is inferred",
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
