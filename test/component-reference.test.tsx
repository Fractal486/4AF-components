import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import { componentReferences } from "../lib/component-reference";
import * as alertDialog from "../registry/ui/alert-dialog/alert-dialog";
import * as dropdownMenu from "../registry/ui/dropdown-menu/dropdown-menu";
import * as dialog from "../registry/ui/dialog/dialog";
import * as radio from "../registry/ui/radio/radio";
import * as sheet from "../registry/ui/sheet/sheet";

// Execute the actual published snippets, so a working hand-copied fixture cannot mask
// a missing content wrapper in the website and CLI examples.
function usageComponent(name: "alert-dialog" | "dropdown-menu" | "dialog" | "radio" | "sheet"): ComponentType {
  const usage = componentReferences[name].usage;
  const split = usage.indexOf("\n\n");
  const source = `${usage.slice(0, split)}\nexport default function Example() { return (${usage.slice(split).trim()}); }`;
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  });
  const modules: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "@/components/ui/alert-dialog": alertDialog,
    "@/components/ui/dropdown-menu": dropdownMenu,
    "@/components/ui/dialog": dialog,
    "@/components/ui/radio": radio,
    "@/components/ui/sheet": sheet,
  };
  const exports: { default?: ComponentType } = {};
  new Function("require", "exports", outputText)((specifier: string) => {
    if (!(specifier in modules)) throw new Error(`Unexpected example import: ${specifier}`);
    return modules[specifier];
  }, exports);
  return exports.default!;
}

describe("published usage examples", () => {
  it("names the radio and its group in the canonical snippet", () => {
    const Example = usageComponent("radio");
    render(<Example />);
    expect(screen.getByRole("radiogroup", { name: "Density" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Comfortable" })).toBeChecked();
  });

  it.each(["dialog", "sheet"] as const)("names the %s in its canonical snippet", async (name) => {
    const user = userEvent.setup();
    const Example = usageComponent(name);
    render(<Example />);
    await user.click(screen.getByRole("button", { name: `Open ${name}` }));
    expect(await screen.findByRole("dialog", { name: "Edit project" })).toBeInTheDocument();
  });

  it("opens and cancels the alert dialog from its canonical snippet", async () => {
    const user = userEvent.setup();
    const Example = usageComponent("alert-dialog");
    render(<Example />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    expect(await screen.findByRole("alertdialog", { name: "Delete project?" })).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveAccessibleDescription("This cannot be undone.");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("opens a menu and activates a row from its canonical snippet", async () => {
    const user = userEvent.setup();
    const Example = usageComponent("dropdown-menu");
    render(<Example />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Billing" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
