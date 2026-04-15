import { defineCommand, runMain } from "citty";
import { parse } from "./src/parser.ts";
import { render } from "./src/renderer.ts";
import { inputSchema } from "./src/schema.ts";
import { validate } from "./src/validator.ts";

const VERSION = "0.1.0";

const buildCommand = defineCommand({
  meta: {
    name: "build",
    description: "Build HTML from a JSON domain model file",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to the input JSON file",
      required: true,
    },
    output: {
      type: "string",
      description: "Output file path (default: stdout)",
      alias: ["o"],
    },
    title: {
      type: "string",
      description: "Override the title from JSON",
    },
  },
  run({ args }) {
    let jsonContent: string;
    try {
      jsonContent = Deno.readTextFileSync(args.input);
    } catch {
      console.error(`Error: Cannot read file: ${args.input}`);
      Deno.exit(1);
    }

    let doc;
    try {
      doc = parse(jsonContent);
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
    description: "Print the expected JSON input schema as JSON Schema",
  },
  run() {
    console.log(JSON.stringify(inputSchema, null, 2));
  },
});

const validateCommand = defineCommand({
  meta: {
    name: "validate",
    description: "Validate a JSON input file against the schema",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to the input JSON file",
      required: true,
    },
  },
  run({ args }) {
    let jsonContent: string;
    try {
      jsonContent = Deno.readTextFileSync(args.input);
    } catch {
      console.error(`Error: Cannot read file: ${args.input}`);
      Deno.exit(1);
    }

    let data: unknown;
    try {
      data = JSON.parse(jsonContent);
    } catch (e) {
      console.error(`Invalid JSON: ${(e as Error).message}`);
      Deno.exit(1);
    }

    const errors = validate(data);
    if (errors.length === 0) {
      console.log(`OK: ${args.input}`);
      return;
    }

    for (const err of errors) {
      console.error(`${err.path}: ${err.message}`);
    }
    console.error(`\n${errors.length} error(s)`);
    Deno.exit(1);
  },
});

const main = defineCommand({
  meta: {
    name: "domainchart",
    version: VERSION,
    description: "Visualize DDD domain models as HTML",
  },
  subCommands: {
    build: buildCommand,
    types: typesCommand,
    validate: validateCommand,
  },
});

runMain(main);
