import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const temporaryProjects: string[] = [];

afterEach(() => {
  for (const project of temporaryProjects.splice(0)) {
    rmSync(project, { recursive: true, force: true });
  }
});

describe("4AF CLI", () => {
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
    writeFileSync(resolve(project, "tsconfig.json"), '{"references":[{"path":"./tsconfig.app.json"}]}');
    writeFileSync(
      resolve(project, "tsconfig.app.json"),
      '{"compilerOptions":{"paths":{"~/*":["./src/*"]}}}',
    );
    writeFileSync(buttonPath, "export {};\n");

    const result = spawnSync(
      process.execPath,
      [resolve("scripts/4af.mjs"), "install", "button", "--project", project, "--dry-run"],
      { encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`write\t${buttonPath}\t(registry/ui/button/button.tsx)`);
    expect(result.stdout).toContain(`merge-css\t${resolve(project, "src/globals.css")}\t(4AF theme)`);
    expect(result.stdout).toContain("package-add\t@base-ui/react");
    expect(result.stdout).toContain(`conflict\t${buttonPath}`);
  });
});
