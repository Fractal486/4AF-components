import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, relative, dirname, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import ts from "typescript";
import { normalizeShimmerCss } from "./shimmer-css.ts";

type CliOptions = Record<string, string | boolean>;

interface RegistryFile {
  path: string;
  type: string;
  target: string;
}

interface RegistryItem {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
  css?: Record<string, unknown>;
}

interface Registry {
  items: RegistryItem[];
}

interface ComponentsConfig {
  tsx?: boolean;
  aliases?: Record<string, string>;
  tailwind?: { css?: string };
}

interface InstallRuntime {
  buildRegistry: () => Promise<void>;
  startServer: () => Promise<RegistryServer>;
  runInstaller: (registryUrl: string, project: string, overwrite: boolean) => Promise<void>;
}

interface RegistryServer {
  origin: string;
  close: () => Promise<void>;
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = resolve(repoRoot, "registry.json");
const publicRoot = resolve(repoRoot, "public");
const docsRoot = resolve(repoRoot, "content", "docs");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const SHADCN_VERSION = "4.13.1";
const shadcnPackagePath = resolve(repoRoot, "node_modules/shadcn/package.json");

const registry = JSON.parse(readFileSync(registryPath, "utf8")) as Registry;
const components = registry.items.filter((item) => item.type === "registry:ui");

const defaultInstallRuntime: InstallRuntime = {
  buildRegistry: () => runCommand(pnpm, ["registry:build"], repoRoot),
  startServer: startRegistryServer,
  runInstaller: async (registryUrl, project, overwrite) => {
    const args = [resolveShadcnCli(), "add", registryUrl, "--yes"];
    if (overwrite) args.push("--overwrite");
    await runCommand(process.execPath, args, project);
  },
};

function resolveShadcnCli() {
  if (!existsSync(shadcnPackagePath)) {
    throw new Error("The pinned shadcn CLI is missing. Run `pnpm install` in the 4AF repository.");
  }
  const manifest = JSON.parse(readFileSync(shadcnPackagePath, "utf8")) as {
    bin?: string | Record<string, string>;
  };
  const relativeBin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.shadcn;
  if (!relativeBin) throw new Error("The installed shadcn package does not expose its CLI.");
  return resolve(dirname(shadcnPackagePath), relativeBin);
}

export function parseArgs(args: string[]) {
  const positional: string[] = [];
  const options: CliOptions = {};
  const command = args.shift() ?? "help";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const separator = arg.indexOf("=");
    const rawKey = arg.slice(2, separator < 0 ? undefined : separator);
    const inlineValue = separator < 0 ? undefined : arg.slice(separator + 1);
    if (!rawKey) continue;
    if (rawKey === "overwrite" || rawKey === "dry-run") {
      const next = args[index + 1];
      const separateValue = inlineValue === undefined && (next === "true" || next === "false");
      options[rawKey] = booleanOption(inlineValue ?? (separateValue ? next : true), rawKey);
      if (separateValue) index += 1;
      continue;
    }
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

function booleanOption(value: string | boolean | undefined, name: string) {
  if (value === undefined || value === false || value === "false") return false;
  if (value === true || value === "true") return true;
  throw new Error(`--${name} accepts only true or false.`);
}

export function listComponents() {
  // Sorted here rather than in registry.json: this is a lookup table, and whoever is
  // reading it already knows the name and only needs to confirm it. The file itself keeps
  // related items adjacent, which is what helps when editing it.
  const sorted = [...components].sort((a, b) => a.name.localeCompare(b.name));
  for (const item of sorted) {
    console.log(`${item.name}\t${item.description ?? ""}`);
  }
}

function requireProject(options: CliOptions) {
  if (!options.project || typeof options.project !== "string") {
    throw new Error("Missing --project <path>. The target project must be explicit for agent use.");
  }

  const project = resolve(options.project);
  if (!existsSync(resolve(project, "package.json"))) {
    throw new Error(`No package.json found in ${project}.`);
  }

  return project;
}

export async function doctor(options: CliOptions): Promise<ComponentsConfig> {
  const project = requireProject(options);
  const componentsConfigPath = resolve(project, "components.json");
  const errors = [];
  const warnings = [];

  if (!existsSync(componentsConfigPath)) {
    errors.push("components.json is missing; initialize shadcn in the target project first.");
  } else {
    const config = readJson<ComponentsConfig>(componentsConfigPath);
    for (const alias of ["ui", "lib"]) {
      if (!config.aliases?.[alias]) errors.push(`components.json is missing the ${alias} alias.`);
    }
    if (!config.tailwind?.css) warnings.push("components.json does not declare a global CSS file.");
  }

  console.log(`project\t${project}`);
  console.log(`registry\t${components.length} installable components`);
  for (const warning of warnings) console.log(`warning\t${warning}`);
  for (const error of errors) console.log(`error\t${error}`);
  if (errors.length) throw new Error("Target project is missing required 4AF configuration.");
  console.log("status\tok");
  return readJson<ComponentsConfig>(componentsConfigPath);
}

export async function installComponent(
  name: string | undefined,
  options: CliOptions,
  runtime: InstallRuntime = defaultInstallRuntime,
) {
  if (!name) throw new Error("Missing component name. Run `pnpm 4af list` to see the options.");
  const component = components.find((item) => item.name === name);
  if (!component) {
    throw new Error(`Unknown component '${name}'. Run pnpm 4af list to see the options.`);
  }

  const project = requireProject(options);
  const config = await doctor({ project });
  const plan = installPlan(component, config, project);
  const conflicts = plan.files.filter(({ target }) => existsSync(target));

  const overwrite = booleanOption(options.overwrite, "overwrite");
  const dryRun = booleanOption(options["dry-run"], "dry-run");
  if (dryRun) {
    console.log(`component\t${component.name}`);
    console.log(`project\t${project}`);
    for (const file of plan.files) console.log(`write\t${file.target}\t(${file.source})`);
    for (const cssPath of plan.cssMerges) console.log(`merge-css\t${cssPath}\t(4AF theme)`);
    for (const dependency of plan.dependencies.add) console.log(`package-add\t${dependency}`);
    for (const dependency of plan.dependencies.existing) console.log(`package-existing\t${dependency}`);
    for (const conflict of conflicts) console.log(`conflict\t${conflict.target}`);
    console.log(`overwrite\t${overwrite}`);
    console.log("status\tdry-run");
    return;
  }

  if (conflicts.length && !overwrite) {
    throw new Error(
      `These target files already exist: ${conflicts.map(({ target }) => target).join(", ")}. Re-run with --overwrite only if replacement is intentional.`,
    );
  }

  await runtime.buildRegistry();
  const server = await runtime.startServer();
  const registryUrl = `${server.origin}/r/${component.name}.json`;

  try {
    console.log(`Installing ${component.name} into ${project}`);
    await runtime.runInstaller(registryUrl, project, overwrite);
    const frames = registry.items.find((item) => item.name === "4af-theme")
      ?.css?.["@keyframes text-shimmer"] as Record<string, Record<string, string>>;
    for (const cssPath of plan.cssMerges) {
      if (existsSync(cssPath)) {
        writeFileSync(cssPath, normalizeShimmerCss(readFileSync(cssPath, "utf8"), frames));
      }
    }
    console.log(`status\tinstalled ${component.name}`);
  } finally {
    await server.close();
  }
}

export function installPlan(
  component: RegistryItem,
  config: ComponentsConfig,
  project: string,
) {
  const items = collectRegistryItems(component.name);
  const files = items.flatMap((item) =>
    (item.files ?? []).map((file) => ({
      source: file.path,
      target: config.tsx === false
        ? resolveTarget(file.target, config, project).replace(/\.tsx?$/, (extension) =>
            extension === ".tsx" ? ".jsx" : ".js",
          )
        : resolveTarget(file.target, config, project),
    })),
  );
  const requestedDependencies = [...new Set(items.flatMap((item) => item.dependencies ?? []))].sort();
  const packageJson = readJson<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>(resolve(project, "package.json"));
  const installedDependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };
  const alreadyDeclared = (dependency: string) => {
    const version = dependency.lastIndexOf("@");
    if (version <= 0) return Boolean(installedDependencies[dependency]);
    const name = dependency.slice(0, version);
    return installedDependencies[name] === dependency.slice(version + 1);
  };
  const themeIncluded = items.some((item) => item.type === "registry:theme");
  const cssPath = config.tailwind?.css;

  return {
    files,
    cssMerges: themeIncluded && typeof cssPath === "string" ? [resolve(project, cssPath)] : [],
    dependencies: {
      add: requestedDependencies.filter((dependency) => !alreadyDeclared(dependency)),
      existing: requestedDependencies.filter(alreadyDeclared),
    },
  };
}

export function collectRegistryItems(
  name: string,
  visited = new Set<string>(),
  items: RegistryItem[] = [],
): RegistryItem[] {
  if (visited.has(name)) return items;
  visited.add(name);
  const item = registry.items.find((entry) => entry.name === name);
  if (!item) return items;

  items.push(item);
  for (const dependency of item.registryDependencies ?? []) {
    const dependencyName = dependency.split("/").pop()?.replace(/\.json$/, "");
    if (dependencyName) collectRegistryItems(dependencyName, visited, items);
  }
  return items;
}

function resolveTarget(target: string, config: ComponentsConfig, project: string) {
  const match = target.match(/^@([^/]+)\/(.+)$/);
  if (!match) return resolve(repoRoot, target);
  const aliasName = match[1]!;
  const suffix = match[2]!;
  const alias = config.aliases?.[aliasName];
  if (!alias) {
    throw new Error(`components.json is missing the ${aliasName} alias required by ${target}.`);
  }

  return resolve(resolveProjectAlias(alias, project), suffix);
}

function readJson<T>(path: string): T {
  const parsed = ts.parseConfigFileTextToJson(path, readFileSync(path, "utf8"));
  if (parsed.error) {
    const message = ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n");
    throw new Error(`Could not parse ${path}: ${message}`);
  }
  return parsed.config as T;
}

export function resolveProjectAlias(alias: string, project: string) {
  const matches: { pattern: string; target: string; base: string }[] = [];

  for (const { path, parsed } of projectTsconfigs(project)) {
    for (const [pattern, targets] of Object.entries(parsed.options.paths ?? {})) {
      const wildcard = matchPathPattern(alias, pattern);
      if (wildcard === null || !Array.isArray(targets) || typeof targets[0] !== "string") continue;
      const internalOptions = parsed.options as ts.CompilerOptions & { pathsBasePath?: string };
      const configuredBase =
        parsed.options.baseUrl ?? internalOptions.pathsBasePath ?? dirname(path);
      matches.push({
        pattern,
        target: targets[0].replace("*", wildcard),
        base: isAbsolute(configuredBase)
          ? configuredBase
          : resolve(dirname(path), configuredBase),
      });
    }
  }

  matches.sort((a, b) => b.pattern.length - a.pattern.length);
  const match = matches[0];
  if (match) return resolve(match.base, match.target);

  if (alias.startsWith("./") || alias.startsWith("../")) return resolve(project, alias);
  throw new Error(
    `Could not resolve the ${alias} alias from components.json. Add a matching compilerOptions.paths entry to the target project's tsconfig.`,
  );
}

function matchPathPattern(value: string, pattern: string): string | null {
  const star = pattern.indexOf("*");
  if (star < 0) return value === pattern ? "" : null;

  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  if (!value.startsWith(prefix) || !value.endsWith(suffix)) return null;
  return value.slice(prefix.length, value.length - suffix.length);
}

function projectTsconfigs(project: string) {
  const configs: { path: string; parsed: ts.ParsedCommandLine }[] = [];
  const visited = new Set<string>();

  const visit = (path: string) => {
    if (visited.has(path) || !existsSync(path)) return;
    visited.add(path);

    const parsed = ts.getParsedCommandLineOfConfigFile(path, {}, {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic(diagnostic) {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        throw new Error(`Could not parse ${path}: ${message}`);
      },
    });
    if (!parsed) throw new Error(`Could not parse ${path}.`);
    configs.push({ path, parsed });

    for (const reference of parsed.projectReferences ?? []) {
      const referencePath = reference.path;
      const candidates = existsSync(referencePath) && statSync(referencePath).isDirectory()
        ? [resolve(referencePath, "tsconfig.json")]
        : [referencePath, `${referencePath}.json`];
      const next = candidates.find((candidate) => existsSync(candidate));
      if (next) visit(next);
    }
  };

  visit(resolve(project, "tsconfig.json"));
  visit(resolve(project, "tsconfig.app.json"));
  visit(resolve(project, "jsconfig.json"));
  return configs;
}

export function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise<void>((resolvePromise, reject) => {
    const windows = process.platform === "win32";
    const commandShim = windows && /\.(?:cmd|bat)$/iu.test(command);
    // Windows exposes pnpm as a .cmd shim, which needs cmd.exe. Real executables —
    // especially Node under "C:\\Program Files" — must be spawned directly so the
    // executable path and each argument stay separate instead of being split by cmd.
    const executable = commandShim ? (process.env.ComSpec ?? "cmd.exe") : command;
    const childArgs = commandShim
      ? ["/d", "/s", "/c", [quoteWindowsArg(command), ...args.map(quoteWindowsArg)].join(" ")]
      : args;
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

interface ComponentDocsModule {
  renderComponentPageMarkdown: (source: string, name: string) => string;
}

async function componentDocumentation(name: string | undefined) {
  if (!name) throw new Error("Missing component name. Run `pnpm 4af list` to see the options.");
  if (!components.some((item) => item.name === name)) {
    throw new Error(`Unknown component '${name}'. Run pnpm 4af list to see the options.`);
  }

  const pagePath = resolve(docsRoot, `${name}.mdx`);
  if (!existsSync(pagePath)) {
    throw new Error(`No documentation page found for '${name}'.`);
  }

  const docsModule = (await import(
    pathToFileURL(resolve(repoRoot, "lib", "component-docs.ts")).href
  )) as ComponentDocsModule;
  return docsModule.renderComponentPageMarkdown(readFileSync(pagePath, "utf8"), name);
}

export async function docsComponent(name: string | undefined) {
  process.stdout.write(`${await componentDocumentation(name)}\n`);
}

function quoteWindowsArg(value: string) {
  if (!/[\s"]/u.test(value)) return value;
  return `"${value.replace(/(\\*)"/gu, "$1$1\\\"").replace(/(\\*)$/u, "$1$1")}"`;
}

export function startRegistryServer(): Promise<RegistryServer> {
  return new Promise<RegistryServer>((resolvePromise, reject) => {
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
        close: () => new Promise<void>((resolveClose) => server.close(() => resolveClose())),
      });
    });
  });
}

async function serveRegistryFile(request: IncomingMessage, response: ServerResponse) {
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

export function rewriteRegistryUrls(value: unknown, origin: string): unknown {
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
  pnpm 4af help
  pnpm 4af list
  pnpm 4af docs <component>
  pnpm 4af doctor --project <path>
  pnpm 4af install <component> --project <path> [--overwrite] [--dry-run]

The docs command prints one component's complete Markdown reference, including separate
install and usage blocks plus the API and notes from its Fumadocs page.
The install command builds and serves the private registry automatically, then invokes
shadcn ${SHADCN_VERSION} non-interactively in the target project. The 4AF theme is included by dependencies.
`);
}

export async function main(args = process.argv.slice(2)) {
  try {
    const { command, positional, options } = parseArgs([...args]);
    if (command === "help" || command === "--help" || command === "-h" || options.help || options.h) {
      printHelp();
    } else if (command === "list") {
      listComponents();
    } else if (command === "docs") {
      await docsComponent(positional[0]);
    } else if (command === "doctor") {
      await doctor(options);
    } else if (command === "install") {
      await installComponent(positional[0], options);
    } else {
      console.error(`4AF: Unknown command '${command}'. Run pnpm 4af help.`);
      printHelp();
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`4AF: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

const entryPoint = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPoint === fileURLToPath(import.meta.url)) await main();
