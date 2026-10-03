import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { vi } from "vitest";
import { installComponent, runCommand } from "./4af";

const temporaryProjects: string[] = [];

afterEach(() => {
  for (const project of temporaryProjects.splice(0)) {
    rmSync(project, { recursive: true, force: true });
  }
});

describe("4AF CLI", () => {
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
