import { defineCommand, runMain } from "citty";
import { parse } from "./src/parser.ts";
import { render } from "./src/renderer.ts";
import { inputSchema } from "./src/schema.ts";

const VERSION = "0.1.0";

const renderCommand = defineCommand({
  meta: {
    name: "render",
    description: "Render a YAML domain model file as HTML",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to the input YAML file",
      required: true,
    },
    output: {
      type: "string",
      description: "Output file path (default: stdout)",
      alias: ["o"],
    },
    title: {
      type: "string",
      description: "Override the title from YAML",
    },
  },
  run({ args }) {
    let yamlContent: string;
    try {
      yamlContent = Deno.readTextFileSync(args.input);
    } catch {
      console.error(`Error: Cannot read file: ${args.input}`);
      Deno.exit(1);
    }

    let doc;
    try {
      doc = parse(yamlContent);
    } catch (e) {
      console.error(`Error: ${(e as Error).message}`);
      Deno.exit(1);
    }

    if (args.title) {
      doc.title = args.title;
    }

    const html = render(doc);

    if (args.output) {
      try {
        Deno.writeTextFileSync(args.output, html);
        console.error(`Written to ${args.output}`);
      } catch {
        console.error(`Error: Cannot write to: ${args.output}`);
        Deno.exit(1);
      }
    } else {
      console.log(html);
    }
  },
});

const typesCommand = defineCommand({
  meta: {
    name: "types",
    description: "Print the expected YAML input schema as JSON Schema",
  },
  run() {
    console.log(JSON.stringify(inputSchema, null, 2));
  },
});

const main = defineCommand({
  meta: {
    name: "domaintree",
    version: VERSION,
    description: "Visualize DDD domain models as HTML",
  },
  subCommands: {
    render: renderCommand,
    types: typesCommand,
  },
});

runMain(main);
