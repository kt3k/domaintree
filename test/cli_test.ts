import "deno-test";
import { execFile } from "node:child_process";

function run(...args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile("deno", ["run", "-A", "main.ts", ...args], (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}

Deno.test("cli: build produces HTML", async () => {
  const { stdout } = await run("build", "examples/ec-site.yaml");
  if (!stdout.includes("<!DOCTYPE html>")) {
    throw new Error("Expected HTML output");
  }
  if (!stdout.includes("EC Site Domain Model")) {
    throw new Error("Expected title in output");
  }
});

Deno.test("cli: build with --title overrides title", async () => {
  const { stdout } = await run("build", "examples/ec-site.yaml", "--title", "Custom");
  if (!stdout.includes("<title>Custom</title>")) {
    throw new Error("Expected overridden title");
  }
});

Deno.test("cli: types outputs JSON Schema", async () => {
  const { stdout } = await run("types");
  const schema = JSON.parse(stdout);
  if (schema.title !== "DomainTreeInput") {
    throw new Error("Expected DomainTreeInput schema");
  }
  if (!schema.properties?.models) {
    throw new Error("Expected models property in schema");
  }
});

Deno.test("cli: --help shows usage", async () => {
  const { stdout } = await run("--help");
  if (!stdout.includes("domaintree")) {
    throw new Error("Expected domaintree in help");
  }
  if (!stdout.includes("build")) {
    throw new Error("Expected build subcommand in help");
  }
  if (!stdout.includes("types")) {
    throw new Error("Expected types subcommand in help");
  }
});
