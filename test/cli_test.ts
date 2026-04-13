import { assertEquals, assertStringIncludes } from "@std/assert";
import { execFile } from "node:child_process";

function run(...args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      "deno",
      ["run", "-A", "main.ts", ...args],
      (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve({ stdout, stderr });
      },
    );
  });
}

Deno.test("cli: build produces HTML", async () => {
  const { stdout } = await run("build", "examples/ec-site.yaml");
  assertStringIncludes(stdout, "<!DOCTYPE html>");
  assertStringIncludes(stdout, "EC Site Domain Model");
});

Deno.test("cli: build with --title overrides title", async () => {
  const { stdout } = await run(
    "build",
    "examples/ec-site.yaml",
    "--title",
    "Custom",
  );
  assertStringIncludes(stdout, "<title>Custom</title>");
});

Deno.test("cli: types outputs JSON Schema", async () => {
  const { stdout } = await run("types");
  const schema = JSON.parse(stdout);
  assertEquals(schema.title, "DomainTreeInput");
  assertEquals(typeof schema.properties?.models, "object");
});

Deno.test("cli: --help shows usage", async () => {
  const { stdout } = await run("--help");
  assertStringIncludes(stdout, "domaintree");
  assertStringIncludes(stdout, "build");
  assertStringIncludes(stdout, "types");
});
