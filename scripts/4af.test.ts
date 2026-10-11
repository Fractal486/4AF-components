import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { vi } from "vitest";
import { collectRegistryItems, installComponent, installPlan, parseArgs, runCommand } from "./4af";

const temporaryProjects: string[] = [];

afterEach(() => {
  for (const project of temporaryProjects.splice(0)) {
    rmSync(project, { recursive: true, force: true });
  }
});

describe("4AF CLI", () => {
  it.each([[], ["help"], ["--help"], ["-h"], ["install", "--help"]])("prints help successfully for %j", (...args) => {
    const result = spawnSync(process.execPath, [resolve("scripts/4af.ts"), ...args], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4AF component CLI");
    expect(result.stderr).toBe("");
  });

  it("explains an unknown command and exits unsuccessfully", () => {
    const result = spawnSync(process.execPath, [resolve("scripts/4af.ts"), "unknown"], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown command 'unknown'. Run pnpm 4af help.");
  });

  it.each(["overwrite", "dry-run"])("parses --%s as a boolean without consuming the component name", (flag) => {
    expect(parseArgs(["install", `--${flag}`, "button"]).positional).toEqual(["button"]);
    expect(parseArgs(["install", "button"]).options[flag]).toBeUndefined();
    expect(parseArgs(["install", `--${flag}`, "button"]).options[flag]).toBe(true);
    for (const value of ["true", "false"]) {
      expect(parseArgs(["install", "button", `--${flag}=${value}`]).options[flag]).toBe(value === "true");
      expect(parseArgs(["install", "button", `--${flag}`, value]).options[flag]).toBe(value === "true");
    }
    for (const value of ["0", "yes", "", "false=extra"]) {
      expect(() => parseArgs(["install", "button", `--${flag}=${value}`])).toThrow("accepts only true or false");
    }
  });

  it.each([true, false])("plans actual target extensions and refuses existing files with tsx=%s", async (tsx) => {
    const project = mkdtempSync(join(tmpdir(), "4af-cli-extensions-"));
    temporaryProjects.push(project);
    mkdirSync(resolve(project, "src/components/ui"), { recursive: true });
    writeFileSync(resolve(project, "package.json"), JSON.stringify({
      name: "fixture", dependencies: { "tailwind-merge": "^2.6.0" },
    }));
    const config = { tsx, aliases: { ui: "@/components/ui", lib: "@/lib" }, tailwind: { css: "src/globals.css" } };
    writeFileSync(resolve(project, "components.json"), JSON.stringify(config));
    writeFileSync(resolve(project, tsx ? "tsconfig.json" : "jsconfig.json"),
      '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}');
    const component = collectRegistryItems("button")[0]!;
    const plan = installPlan(component, config, project);
    const buttonPath = resolve(project, `src/components/ui/button.${tsx ? "tsx" : "jsx"}`);
    expect(plan.files.map((file) => file.target)).toContain(buttonPath);
    expect(plan.files.map((file) => file.target)).toContain(resolve(project, `src/lib/cn.${tsx ? "ts" : "js"}`));
    expect(plan.dependencies.add).toContain("tailwind-merge@^3.7.0");
    writeFileSync(buttonPath, "// consumer customization\n");

    const preview = spawnSync(process.execPath,
      [resolve("scripts/4af.ts"), "install", "button", "--project", project, "--dry-run", "--overwrite=false"],
      { encoding: "utf8" });
    expect(preview.status).toBe(0);
    expect(preview.stdout).toContain(`write\t${buttonPath}`);
    expect(preview.stdout).toContain(`conflict\t${buttonPath}`);
    expect(preview.stdout).toContain("overwrite\tfalse");

    const buildRegistry = vi.fn(async () => {});
    const startServer = vi.fn(async () => ({ origin: "http://127.0.0.1", close: async () => {} }));
    const runInstaller = vi.fn(async () => {});
    await expect(installComponent("button", { project, overwrite: "false" }, {
      buildRegistry, startServer, runInstaller,
    })).rejects.toThrow("already exist");
    expect(buildRegistry).not.toHaveBeenCalled();
    expect(startServer).not.toHaveBeenCalled();
    expect(runInstaller).not.toHaveBeenCalled();
    expect(readFileSync(buttonPath, "utf8")).toBe("// consumer customization\n");
  });

  it("launches executables whose Windows paths contain spaces without shell splitting", async () => {
    if (process.platform !== "win32" || !process.execPath.includes(" ")) return;

    await runCommand(process.execPath, ["-e", "process.exit(0)"], process.cwd());
  });

  it("discloses every dry-run mutation through a referenced tsconfig and a non-@ alias", () => {
    const project = mkdtempSync(join(tmpdir(), "4af-cli-"));
    temporaryProjects.push(project);
    const buttonPath = resolve(project, "src/components/ui/button.tsx");

    mkdirSync(resolve(project, "src/components/ui"), { recursive: true });
    writeFileSync(resolve(project, "package.json"), '{"name":"fixture"}');
    writeFileSync(
      resolve(project, "components.json"),
      JSON.stringify({
        aliases: { ui: "~/components/ui", lib: "~/lib" },
        tailwind: { css: "src/globals.css" },
      }),
    );
    mkdirSync(resolve(project, "configs/app"), { recursive: true });
    mkdirSync(resolve(project, "node_modules/@fixture/tsconfig"), { recursive: true });
    writeFileSync(resolve(project, "tsconfig.json"), '{"references":[{"path":"./configs/app"}]}');
    writeFileSync(
      resolve(project, "configs/app/tsconfig.json"),
      `{
        // Vite creates commented JSONC tsconfig files.
        "extends": ["@fixture/tsconfig", "../../tsconfig.shared.json"],
      }`,
    );
    writeFileSync(resolve(project, "tsconfig.shared.json"), '{"compilerOptions":{"strict":true}}');
    writeFileSync(
      resolve(project, "node_modules/@fixture/tsconfig/package.json"),
      '{"name":"@fixture/tsconfig","version":"1.0.0","main":"tsconfig.json"}',
    );
    writeFileSync(
      resolve(project, "node_modules/@fixture/tsconfig/tsconfig.json"),
      '{"compilerOptions":{"baseUrl":"../../..","paths":{"~/*":["src/*"]}}}',
    );
    writeFileSync(buttonPath, "export {};\n");

    const result = spawnSync(
      process.execPath,
      [resolve("scripts/4af.ts"), "install", "button", "--project", project, "--dry-run"],
      { encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`write\t${buttonPath}\t(registry/ui/button/button.tsx)`);
    expect(result.stdout).toContain(`merge-css\t${resolve(project, "src/globals.css")}\t(4AF theme)`);
    expect(result.stdout).toContain("package-add\t@base-ui/react");
    expect(result.stdout).toContain(`conflict\t${buttonPath}`);
  });

  it("executes the non-dry-run mutation path and always closes its registry server", async () => {
    const project = mkdtempSync(join(tmpdir(), "4af-cli-install-"));
    temporaryProjects.push(project);
    const buttonPath = resolve(project, "src/components/ui/button.tsx");

    mkdirSync(resolve(project, "src"), { recursive: true });
    writeFileSync(resolve(project, "package.json"), '{"name":"fixture"}');
    writeFileSync(
      resolve(project, "components.json"),
      JSON.stringify({
        aliases: { ui: "@/components/ui", lib: "@/lib" },
        tailwind: { css: "src/globals.css" },
      }),
    );
    writeFileSync(
      resolve(project, "tsconfig.json"),
      '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}',
    );

    const close = vi.fn(async () => {});
    const buildRegistry = vi.fn(async () => {});
    const runInstaller = vi.fn(async (_url: string, targetProject: string) => {
      mkdirSync(resolve(targetProject, "src/components/ui"), { recursive: true });
      writeFileSync(buttonPath, "export const installed = true;\n");
      writeFileSync(resolve(targetProject, "src/globals.css"), `
@theme inline {
  --animate-text-shimmer: text-shimmer 2.5s linear infinite;
  @keyframes text-shimmer { to { background-position: -200% 0; } }
}`);
    });

    await installComponent("button", { project }, {
      buildRegistry,
      startServer: async () => ({ origin: "http://127.0.0.1:43123", close }),
      runInstaller,
    });

    expect(buildRegistry).toHaveBeenCalledOnce();
    expect(runInstaller).toHaveBeenCalledWith(
      "http://127.0.0.1:43123/r/button.json",
      project,
      false,
    );
    expect(existsSync(buttonPath)).toBe(true);
    const css = readFileSync(resolve(project, "src/globals.css"), "utf8");
    expect(css).not.toContain("--animate-text-shimmer:");
    expect(css).not.toContain("background-position");
    expect(css).toContain("translate: -100% 0");
    expect(close).toHaveBeenCalledOnce();
  });

  it("closes the registry server when the installer fails", async () => {
    const project = mkdtempSync(join(tmpdir(), "4af-cli-failure-"));
    temporaryProjects.push(project);
    writeFileSync(resolve(project, "package.json"), '{"name":"fixture"}');
    writeFileSync(
      resolve(project, "components.json"),
      JSON.stringify({ aliases: { ui: "@/ui", lib: "@/lib" } }),
    );
    writeFileSync(
      resolve(project, "tsconfig.json"),
      '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}',
    );
    const close = vi.fn(async () => {});

    await expect(
      installComponent("button", { project }, {
        buildRegistry: async () => {},
        startServer: async () => ({ origin: "http://127.0.0.1:43123", close }),
        runInstaller: async () => {
          throw new Error("fixture installer failed");
        },
      }),
    ).rejects.toThrow("fixture installer failed");
    expect(close).toHaveBeenCalledOnce();
  });
});
