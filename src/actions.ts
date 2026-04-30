import { parse } from "./parser.ts";
import { render } from "./renderer.ts";
import { validate, type ValidationError } from "./validator.ts";

export type ReadFile = (path: string) => string;

export type BuildResult =
  | { ok: true; html: string }
  | { ok: false; error: string };

export function buildAction(
  readFile: ReadFile,
  args: { input: string; title?: string },
): BuildResult {
  let jsonContent: string;
  try {
    jsonContent = readFile(args.input);
  } catch {
    return { ok: false, error: `Cannot read file: ${args.input}` };
  }

  try {
    const doc = parse(jsonContent);
    if (args.title) doc.title = args.title;
    return { ok: true, html: render(doc) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type ValidateResult =
  | { ok: true }
  | { ok: false; kind: "io"; error: string }
  | { ok: false; kind: "schema"; errors: ValidationError[] };

export function validateAction(
  readFile: ReadFile,
  args: { input: string },
): ValidateResult {
  let jsonContent: string;
  try {
    jsonContent = readFile(args.input);
  } catch {
    return {
      ok: false,
      kind: "io",
      error: `Cannot read file: ${args.input}`,
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(jsonContent);
  } catch (e) {
    return {
      ok: false,
      kind: "io",
      error: `Invalid JSON: ${(e as Error).message}`,
    };
  }

  const errors = validate(data);
  if (errors.length === 0) return { ok: true };
  return { ok: false, kind: "schema", errors };
}
