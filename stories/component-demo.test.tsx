import { act, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { DemoCanvas, useComponentDemo, type ComponentDemoName } from "./component-demo";

vi.mock("@/inspector/entries/input", () => { throw new Error("Download failed"); });
vi.mock("@/inspector/entries/action-button", () => { throw new Error("Background download failed"); });
vi.mock("@/inspector/entries/action-toggle", () => ({
  actionToggleEntry: { slug: "action-toggle", name: "Toggle", controls: {}, render: () => "Downloaded toggle" },
}));

afterEach(() => vi.unstubAllGlobals());

function Canvas({ name }: { name: ComponentDemoName }) {
  return <DemoCanvas demo={useComponentDemo(name)} />;
}

describe("Component demo downloads", () => {
  it("replaces a failed foreground download with an error and reload action", async () => {
    render(<Canvas name="input" />);
    expect(screen.getByRole("status", { name: "Loading component demo" })).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("This demo couldn’t load");
    expect(screen.getByRole("button", { name: "Reload page" })).toBeEnabled();
    expect(screen.queryByRole("status", { name: "Loading component demo" })).not.toBeInTheDocument();
  });

  it("continues background downloads after a rejection and caches successful demos", async () => {
    const idleTasks: Array<() => void> = [];
    vi.stubGlobal("requestIdleCallback", (task: () => void) => idleTasks.push(task));
    const { rerender } = render(<Canvas key="ascii-loader" name="ascii-loader" />);
    await waitFor(() => expect(idleTasks).toHaveLength(1));
    // The first remaining demo rejects. Its rejection must be handled and the next scheduled.
    await act(async () => { idleTasks.shift()!(); });
    await waitFor(() => expect(idleTasks).toHaveLength(1));
    await act(async () => { idleTasks.shift()!(); });
    await waitFor(() => expect(idleTasks).toHaveLength(1));
    rerender(<Canvas key="action-toggle" name="action-toggle" />);
    expect(screen.getByText("Downloaded toggle")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
