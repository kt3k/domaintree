export const inputSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "DomainTreeInput",
  description: "Input schema for domaintree YAML files",
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
        required: ["name", "type"],
        properties: {
          name: {
            type: "string",
            description: "Model name",
          },
          type: {
            type: "string",
            enum: ["entity", "value_object"],
            description: "Model type",
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
