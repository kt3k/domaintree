import { readFileSync, writeFileSync } from "node:fs";
import { exit } from "node:process";
import { defineCommand, runMain } from "citty";
import { buildAction, validateAction } from "./actions.ts";
import { inputSchema } from "./schema.ts";

const VERSION = "0.1.0";

const readFile = (path: string) => readFileSync(path, "utf-8");

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
    const result = buildAction(readFile, args);
    if (!result.ok) {
      console.error(result.error);
      exit(1);
    }

    if (args.output) {
      try {
        writeFileSync(args.output, result.html);
        console.error(`Written to ${args.output}`);
      } catch {
        console.error(`Cannot write to: ${args.output}`);
        exit(1);
      }
    } else {
      console.log(result.html);
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
    const result = validateAction(readFile, args);
    if (result.ok) {
      console.log(`OK: ${args.input}`);
      return;
    }

    if (result.kind === "schema") {
      for (const err of result.errors) {
        console.error(`${err.path}: ${err.message}`);
      }
      console.error(`\n${result.errors.length} error(s)`);
    } else {
      console.error(result.error);
    }
    exit(1);
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
