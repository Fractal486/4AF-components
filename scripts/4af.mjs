#!/usr/bin/env node

import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = resolve(repoRoot, "registry.json");
const publicRoot = resolve(repoRoot, "public");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const components = registry.items.filter((item) => item.type === "registry:ui");

const { command, positional, options } = parseArgs(process.argv.slice(2));

try {
  if (command === "list") {
    listComponents();
  } else if (command === "doctor") {
    await doctor(options);
  } else if (command === "install") {
    await installComponent(positional[0], options);
  } else {
    printHelp();
    if (command !== "help") process.exitCode = 1;
  }
} catch (error) {
  console.error(`4AF: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

function parseArgs(args) {
  const positional = [];
  const options = {};
  const command = args.shift() ?? "help";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      options[rawKey] = inlineValue;
      continue;
    }

    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      options[rawKey] = next;
      index += 1;
    } else {
      options[rawKey] = true;
    }
  }

  return { command, positional, options };
}

function listComponents() {
  for (const item of components) {
    console.log(`${item.name}\t${item.description ?? ""}`);
  }
}

function requireProject(options) {
  if (!options.project || typeof options.project !== "string") {
    throw new Error("Missing --project <path>. The target project must be explicit for agent use.");
  }

  const project = resolve(options.project);
  if (!existsSync(resolve(project, "package.json"))) {
    throw new Error(`No package.json found in ${project}.`);
  }

  return project;
}

async function doctor(options) {
  const project = requireProject(options);
  const componentsConfigPath = resolve(project, "components.json");
  const errors = [];
  const warnings = [];

  if (!existsSync(componentsConfigPath)) {
    errors.push("components.json is missing; initialize shadcn in the target project first.");
  } else {
    const config = JSON.parse(readFileSync(componentsConfigPath, "utf8"));
    for (const alias of ["ui", "lib"]) {
      if (!config.aliases?.[alias]) errors.push(`components.json is missing the ${alias} alias.`);
    }
    if (!config.tailwind?.css) warnings.push("components.json does not declare a global CSS file.");
  }

  console.log(`project\t${project}`);
  console.log(`registry\t${components.length} installable components`);
  for (const warning of warnings) console.log(`warning\t${warning}`);
  for (const error of errors) console.log(`error\t${error}`);
  if (errors.length) throw new Error("Target project is not ready for 4AF components.");
  console.log("status\tok");
  return existsSync(componentsConfigPath)
    ? JSON.parse(readFileSync(componentsConfigPath, "utf8"))
    : null;
}

async function installComponent(name, options) {
  if (!name) throw new Error("Missing component name. Run `pnpm 4af list` to see the options.");
  const component = components.find((item) => item.name === name);
  if (!component) {
    throw new Error(`Unknown component '${name}'. Run pnpm 4af list to see the options.`);
  }

  const project = requireProject(options);
  const config = await doctor({ project });
  const files = targetFiles(component, config, project);
  const conflicts = files.filter((filePath) => existsSync(filePath));

  const overwrite = Boolean(options.overwrite);
  const dryRun = Boolean(options["dry-run"]);
  const args = ["dlx", "shadcn@latest", "add", "REGISTRY_URL", "--yes"];
  if (overwrite) args.push("--overwrite");

  if (dryRun) {
    console.log(`component\t${component.name}`);
    console.log(`project\t${project}`);
    console.log(`files\t${files.length}`);
    if (conflicts.length) console.log(`conflicts\t${conflicts.join(", ")}`);
    console.log(`overwrite\t${overwrite}`);
    console.log("status\tdry-run");
    return;
  }

  if (conflicts.length && !overwrite) {
    throw new Error(
      `These target files already exist: ${conflicts.join(", ")}. Re-run with --overwrite only if replacement is intentional.`,
    );
  }

  await runCommand(pnpm, ["registry:build"], repoRoot);
  const server = await startRegistryServer();
  const registryUrl = `${server.origin}/r/${component.name}.json`;
  args[3] = registryUrl;

  try {
    console.log(`Installing ${component.name} into ${project}`);
    await runCommand(pnpm, args, project);
    console.log(`status\tinstalled ${component.name}`);
  } finally {
    await server.close();
  }
}

function targetFiles(component, config, project) {
  const names = new Set();
  collectRegistryFiles(component.name, names);
  return [...names].map((target) => resolveTarget(target, config, project));
}

function collectRegistryFiles(name, targets, visited = new Set()) {
  if (visited.has(name)) return;
  visited.add(name);
  const item = registry.items.find((entry) => entry.name === name);
  if (!item) return;

  for (const file of item.files ?? []) targets.add(file.target);
  for (const dependency of item.registryDependencies ?? []) {
    const dependencyName = dependency.split("/").pop()?.replace(/\.json$/, "");
    if (dependencyName) collectRegistryFiles(dependencyName, targets, visited);
  }
}

function resolveTarget(target, config, project) {
  const match = target.match(/^@([^/]+)\/(.+)$/);
  if (!match) return resolve(repoRoot, target);
  const alias = config.aliases?.[match[1]];
  if (!alias) throw new Error(`components.json is missing the ${match[1]} alias required by ${target}.`);

  const tsconfigPath = ["tsconfig.json", "tsconfig.app.json"]
    .map((name) => resolve(project, name))
    .find((path) => existsSync(path));
  const tsconfig = tsconfigPath ? JSON.parse(readFileSync(tsconfigPath, "utf8")) : null;
  const pathPattern = tsconfig?.compilerOptions?.paths?.["@/*"]?.[0] ?? "./*";
  const sourceRoot = pathPattern.replace(/\*.*$/, "").replace(/^\.\//, "");
  const aliasPath = alias.replace(/^@\//, "");
  return resolve(project, sourceRoot, aliasPath, match[2]);
}

function runCommand(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    // Windows exposes pnpm as a .cmd shim. Invoke it through cmd.exe explicitly
    // instead of enabling Node's shell option, which emits a security warning and
    // performs weaker argument handling. Arguments are generated by this script or
    // validated against registry.json.
    const windows = process.platform === "win32";
    const executable = windows ? "cmd.exe" : command;
    const childArgs = windows ? ["/d", "/s", "/c", [command, ...args].join(" ")] : args;
    const child = spawn(executable, childArgs, {
      cwd,
      stdio: "inherit",
      shell: false,
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with code ${code ?? "unknown"}.`));
    });
  });
}

function startRegistryServer() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer((request, response) => {
      void serveRegistryFile(request, response).catch((error) => {
        response.statusCode = 500;
        response.end(error instanceof Error ? error.message : String(error));
      });
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not determine the local registry address."));
        return;
      }

      const origin = `http://127.0.0.1:${address.port}`;
      resolvePromise({
        origin,
        close: () => new Promise((resolveClose) => server.close(() => resolveClose())),
      });
    });
  });
}

async function serveRegistryFile(request, response) {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (!pathname.startsWith("/r/") || request.method !== "GET") {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }

  const filePath = resolve(publicRoot, `.${pathname}`);
  const relativePath = relative(publicRoot, filePath);
  const withinPublic = relativePath && !relativePath.startsWith("..") && !relativePath.startsWith("/");
  if (!withinPublic || !existsSync(filePath)) {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }

  const json = JSON.parse(readFileSync(filePath, "utf8"));
  const origin = `http://${request.headers.host}`;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(rewriteRegistryUrls(json, origin)));
}

function rewriteRegistryUrls(value, origin) {
  if (typeof value === "string") return value.replaceAll("http://localhost:3000", origin);
  if (Array.isArray(value)) return value.map((entry) => rewriteRegistryUrls(entry, origin));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, rewriteRegistryUrls(entry, origin)]),
    );
  }
  return value;
}

function printHelp() {
  console.log(`4AF component CLI

Commands:
  pnpm 4af list
  pnpm 4af doctor --project <path>
  pnpm 4af install <component> --project <path> [--overwrite] [--dry-run]

The install command builds and serves the private registry automatically, then invokes
shadcn non-interactively in the target project. The 4AF theme is included by dependencies.
`);
}
