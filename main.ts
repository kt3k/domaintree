import { parse } from "./src/parser.ts";
import { render } from "./src/renderer.ts";

const VERSION = "0.1.0";

function printHelp(): void {
  console.log(`domaintree - Visualize DDD domain models as HTML

Usage:
  domaintree <input.yaml> [options]

Arguments:
  <input.yaml>          Path to the input YAML file

Options:
  -o, --output <path>   Output file path (default: stdout)
  --title <title>       Override the title from YAML
  --types               Print the expected YAML input schema as TypeScript types
  -v, --version         Show version
  -h, --help            Show help`);
}

function printTypes(): void {
  const schema = {
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
  console.log(JSON.stringify(schema, null, 2));
}

function main(): void {
  const args = [...Deno.args];

  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    Deno.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log(`domaintree ${VERSION}`);
    Deno.exit(0);
  }

  if (args.includes("--types")) {
    printTypes();
    Deno.exit(0);
  }

  let outputPath: string | undefined;
  let titleOverride: string | undefined;
  let inputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-o" || arg === "--output") {
      outputPath = args[++i];
      if (!outputPath) {
        console.error("Error: --output requires a path argument");
        Deno.exit(1);
      }
    } else if (arg === "--title") {
      titleOverride = args[++i];
      if (!titleOverride) {
        console.error("Error: --title requires a value");
        Deno.exit(1);
      }
    } else if (!arg.startsWith("-")) {
      inputPath = arg;
    } else {
      console.error(`Error: Unknown option: ${arg}`);
      Deno.exit(1);
    }
  }

  if (!inputPath) {
    console.error("Error: No input file specified\n");
    printHelp();
    Deno.exit(1);
  }

  let yamlContent: string;
  try {
    yamlContent = Deno.readTextFileSync(inputPath);
  } catch {
    console.error(`Error: Cannot read file: ${inputPath}`);
    Deno.exit(1);
  }

  let doc;
  try {
    doc = parse(yamlContent);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    Deno.exit(1);
  }

  if (titleOverride) {
    doc.title = titleOverride;
  }

  const html = render(doc);

  if (outputPath) {
    try {
      Deno.writeTextFileSync(outputPath, html);
      console.error(`Written to ${outputPath}`);
    } catch {
      console.error(`Error: Cannot write to: ${outputPath}`);
      Deno.exit(1);
    }
  } else {
    console.log(html);
  }
}

main();
