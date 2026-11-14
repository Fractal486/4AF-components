import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { componentReferences, type ComponentReferenceName } from "../lib/component-reference";
import tsconfig from "../tsconfig.json";

const registry = JSON.parse(readFileSync(resolve("registry.json"), "utf8")) as {
  items: { name: string; type: string; files?: { path: string; target?: string }[] }[];
};

// Supply only application-owned state/data, never replacement component declarations.
// The actual published imports, props and callbacks are checked against shipped source.
const loadingContext = "declare const isLoading: boolean;";
const openContext = "declare const open: boolean; declare function setOpen(open: boolean): void;";
const tocContext = `
  declare const tocRef: import("react").RefObject<HTMLElement | null>;
  declare const articleRef: import("react").RefObject<HTMLElement | null>;
  const headings = [{ id: "overview", title: "Overview", level: 2 }];
`;
const applicationContext: Partial<Record<ComponentReferenceName, string>> = {
  "action-button": "declare function saveChanges(): Promise<void>;",
  "action-toggle": `
    declare const following: boolean;
    declare function saveFollowing(next: boolean): Promise<void>;
    declare function setFollowing(next: boolean): void;
  `,
  alert: openContext,
  "alert-dialog": "declare const projectId: string; declare function deleteProject(id: string): Promise<void>;",
  "ascii-loader": loadingContext,
  "matrix-loader": loadingContext,
  "classic-loader": loadingContext,
  breadcrumb: "declare const pathExpanded: boolean; declare function setPathExpanded(next: boolean): void;",
  "number-animation": "declare const total: number;",
  badge: `${openContext} declare const unread: number;`,
  button: "declare const menuOpen: boolean; declare function setMenuOpen(next: boolean): void;",
  "command-palette": "declare function deleteProject(): Promise<void>;",
  "delete-button": "declare const id: string; declare function removeItem(id: string): void;",
  input: "declare const name: string; declare function setName(next: string): void;",
  morph: "declare const copied: boolean;",
  "date-picker": `
    declare const date: Date | null;
    declare function setDate(next: Date | null): void;
    declare const range: import("@/components/ui/date-picker").DateRange | null;
    declare function setRange(next: typeof range): void;
  `,
  progress: "declare const progress: number;",
  "select-aligned": "declare const city: string; declare function setCity(next: string | null): void;",
  "select-search": 'const groups = [{ label: "Fruit", items: [{ value: "apple", label: "Apple" }] }];',
  "selection-toolbar": "declare function annotateSelection(text: string, range: Range | null): void;",
  field: "declare const serverErrors: string[];",
  skeleton: loadingContext,
  slider: "declare function saveVolume(value: number | readonly number[]): void;",
  "scrub-slider": "declare const opacity: number; declare function setOpacity(next: number): void;",
  switch: "declare const canEnableNotifications: boolean; declare function saveNotifications(next: boolean): Promise<void>;",
  table: "declare const people: { id: string; name: string; role: string }[];",
  "table-of-contents": tocContext,
  "table-of-contents-lines": tocContext,
  "text-shimmer": "declare const isSyncing: boolean;",
};

const names = Object.keys(componentReferences) as ComponentReferenceName[];
const virtualPath = (name: string) => resolve("test/.component-reference-examples", `${name}.tsx`);
const sources = new Map<string, string>(names.map((name) => {
  const usage = componentReferences[name].usage;
  const split = usage.indexOf("\n\n");
  const imports = usage.slice(0, split);
  const body = usage.slice(split).trim();
  // Data Table publishes a complete module; other references show one or more JSX trees.
  const example = name === "data-table" ? body
    : `export default function Example() { return <>\n${body.replace(/^\/\/(.*)$/gm, "{/*$1*/}")}\n</>; }`;
  return [virtualPath(name), `${imports}\n${applicationContext[name] ?? ""}\n${example}`] as const;
}));
// Negative controls prove unresolved exports and invalid props cannot silently become any.
sources.set(virtualPath("invalid-export"), 'import { MissingButtonExport } from "@/components/ui/button";');
sources.set(virtualPath("invalid-prop"), 'import { Button } from "@/components/ui/button"; const example = <Button variant="missing-variant" />;');

let program: ts.Program;
beforeAll(() => {
  const { options } = ts.convertCompilerOptionsFromJson(tsconfig.compilerOptions, process.cwd());
  const paths = { ...options.paths };
  for (const item of registry.items) {
    for (const file of item.files ?? []) {
      if (!file.target?.startsWith("@ui/")) continue;
      const moduleSpecifier = file.target.replace("@ui/", "@/components/ui/").replace(/\.tsx?$/, "");
      paths[moduleSpecifier] = [resolve(file.path)];
    }
  }
  const compilerOptions = { ...options, paths, incremental: false };
  const host = ts.createCompilerHost(compilerOptions);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, languageVersion, ...rest) => {
    const source = sources.get(resolve(file));
    return source === undefined ? getSourceFile(file, languageVersion, ...rest)
      : ts.createSourceFile(file, source, languageVersion, true, ts.ScriptKind.TSX);
  };
  program = ts.createProgram([...sources.keys()], compilerOptions, host);
  // Building one program over every snippet takes ~5s alone and several times that
  // while the full suite saturates every core.
}, 60_000);

describe("published usage types", () => {
  it("rejects missing exports and invalid props", () => {
    for (const [name, code] of [["invalid-export", 2305], ["invalid-prop", 2322]] as const) {
      const diagnostics = program.getSemanticDiagnostics(program.getSourceFile(virtualPath(name))!);
      expect(diagnostics.map((diagnostic) => diagnostic.code), name).toContain(code);
    }
  });

  it("covers every installable component", () => {
    expect([...names].sort()).toEqual(registry.items.filter((item) => item.type === "registry:ui").map((item) => item.name).sort());
  });

  it.each(names)("resolves imports and type-checks the %s snippet", (name) => {
    const source = program.getSourceFile(virtualPath(name))!;
    const diagnostics = [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)];
    expect(diagnostics.map((diagnostic) => {
      const position = source.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
      return `${name}:${position.line + 1}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`;
    })).toEqual([]);
  });
});
