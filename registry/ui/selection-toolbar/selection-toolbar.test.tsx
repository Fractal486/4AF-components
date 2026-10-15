import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import {
  SelectionToolbar,
  SelectionToolbarActionButton,
  SelectionToolbarActionToggle,
  SelectionToolbarButton,
  SelectionToolbarSeparator,
  SelectionToolbarToggle,
  SelectionToolbarToggleGroup,
} from "./selection-toolbar";

const actions = (onAction: (text: string) => void) => (
  <>
    <SelectionToolbarButton onAction={onAction}>Copy</SelectionToolbarButton>
    <SelectionToolbarButton>Highlight</SelectionToolbarButton>
  </>
);

/** Selects the text of the element with the given test id, by drag or by shift-arrow. */
function selectText(testId: string, by: "pointer" | "keyboard" = "pointer") {
  const node = screen.getByTestId(testId).firstChild!;
  const range = document.createRange();
  range.selectNodeContents(node);

  const selection = document.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);

  if (by === "pointer") {
    fireEvent.pointerUp(document.body);
  } else {
    // Shift coming back up is what says the selection is finished; while it's still down
    // the arrows are extending and the bar would hop along with every character.
    fireEvent.keyUp(document.body, { key: "Shift", shiftKey: false });
  }
}

describe("SelectionToolbar", () => {
  it.each(["collapse", "action", "disable", "escape"])("notifies once when opening and closing by %s", (method) => {
    const onOpenChange = vi.fn();
    const example = (disabled = false) => (
      <StrictMode>
        <SelectionToolbar disabled={disabled} onOpenChange={onOpenChange} actions={actions(() => {})}>
          <p data-testid="prose">The quick brown fox</p>
        </SelectionToolbar>
      </StrictMode>
    );
    const { rerender } = render(example());
    expect(onOpenChange).not.toHaveBeenCalled();
    selectText("prose");
    expect(onOpenChange.mock.calls).toEqual([[true]]);
    fireEvent.pointerUp(document.body);
    fireEvent.mouseUp(screen.getByTestId("prose"));
    fireEvent.click(screen.getByTestId("prose"));
    expect(onOpenChange.mock.calls).toEqual([[true]]);
    if (method === "collapse") {
      document.getSelection()!.removeAllRanges();
      fireEvent(document, new Event("selectionchange"));
    } else if (method === "action") {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    } else if (method === "disable") {
      rerender(example(true));
      rerender(example(false));
    } else {
      fireEvent.keyDown(screen.getByRole("toolbar"), { key: "Escape" });
    }
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("uses the latest callback without replaying visibility on callback changes", () => {
    const first = vi.fn();
    const next = vi.fn();
    const example = (onOpenChange: (open: boolean) => void) => (
      <SelectionToolbar onOpenChange={onOpenChange} actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>
    );
    const { rerender } = render(example(first));
    selectText("prose");
    rerender(example(next));
    expect(first.mock.calls).toEqual([[true]]);
    expect(next).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(next.mock.calls).toEqual([[false]]);
  });

  it("stays out of the way until there is a selection", () => {
    render(
      <SelectionToolbar actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();

    selectText("prose");

    // One element, not a dialog wrapping a toolbar — the popup *is* the toolbar.
    expect(screen.getByRole("toolbar")).toHaveClass("rounded-[8px]");
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("survives the rest of the gesture that opened it", () => {
    render(
      <SelectionToolbar actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");

    // The bar opens on `pointerup`, so the `mouseup` and `click` of that same release
    // land on the text — outside a popup that appeared a moment ago. Base UI reads that
    // as an outside press and would close the bar in the frame after it opened, which
    // looks exactly like it never opened at all.
    fireEvent.mouseUp(screen.getByTestId("prose"));
    fireEvent.click(screen.getByTestId("prose"));

    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("ignores selections outside its region", () => {
    render(
      <>
        <SelectionToolbar actions={actions(() => {})}>
          <p data-testid="prose">The quick brown fox</p>
        </SelectionToolbar>
        <p data-testid="elsewhere">Somewhere else entirely</p>
      </>,
    );

    selectText("elsewhere");

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("hands the action the text that was selected, then dismisses", () => {
    const onAction = vi.fn();
    render(
      <SelectionToolbar actions={actions(onAction)}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(onAction).toHaveBeenCalledWith("The quick brown fox", expect.any(Range));
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("closes when the selection collapses", () => {
    render(
      <SelectionToolbar actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");
    expect(screen.getByRole("toolbar")).toBeInTheDocument();

    document.getSelection()!.removeAllRanges();
    fireEvent(document, new Event("selectionchange"));

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("never opens while disabled, and closes if it's turned off mid-selection", () => {
    const { rerender } = render(
      <SelectionToolbar disabled actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();

    rerender(
      <SelectionToolbar actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );
    selectText("prose");
    expect(screen.getByRole("toolbar")).toBeInTheDocument();

    rerender(
      <SelectionToolbar disabled actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("is still there after Escape's own keyup", () => {
    render(
      <SelectionToolbar actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose", "keyboard");
    // The selection outlives the dismissal, so a keyup handler that re-read it on every
    // key would put the bar straight back up on the way up from the press that closed it.
    fireEvent.keyUp(document.body, { key: "Escape" });

    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("lets Tab reach the bar after a keyboard selection, but not a pointer one", () => {
    render(
      <SelectionToolbar actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    // Someone who selected with the mouse means the next field by Tab, not the thing that
    // just appeared over their selection.
    selectText("prose", "pointer");
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Copy" })).not.toHaveFocus();

    selectText("prose", "keyboard");
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Copy" })).toHaveFocus();
  });

  // The inspector's demo doesn't group its two actions, so this part has no demo to keep
  // it honest — hence a test that it still renders as a real separator.
  it("separates groups of actions across the bar's own axis", () => {
    render(
      <SelectionToolbar
        actions={
          <>
            <SelectionToolbarButton>Copy</SelectionToolbarButton>
            <SelectionToolbarSeparator />
            <SelectionToolbarButton>Highlight</SelectionToolbarButton>
          </>
        }
      >
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");

    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator).toHaveAttribute("data-slot", "selection-toolbar-separator");
  });

  it("quiets a destructive action to red ink rather than a red slab", () => {
    render(
      <SelectionToolbar
        actions={<SelectionToolbarButton variant="destructive">Remove</SelectionToolbarButton>}
      >
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");

    const button = screen.getByRole("button", { name: "Remove" });
    expect(button).toHaveAttribute("data-variant", "ghost");
    expect(button).toHaveClass("text-destructive");
    expect(button).not.toHaveClass("bg-destructive");
  });

  it("holds a toggle's state without dismissing the bar", () => {
    const onAction = vi.fn();
    render(
      <SelectionToolbar
        actions={<SelectionToolbarToggle onAction={onAction}>Highlight</SelectionToolbarToggle>}
      >
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");
    const toggle = screen.getByRole("button", { name: "Highlight" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);

    // A toggle is something rather than does something: pressing it has to leave the bar
    // up, or you can never see the state you just set.
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onAction).toHaveBeenCalledWith(true, "The quick brown fox", expect.any(Range));
  });

  it("keeps a group of toggles exclusive", () => {
    render(
      <SelectionToolbar
        actions={
          <SelectionToolbarToggleGroup defaultValue={["amber"]}>
            <SelectionToolbarToggle value="amber">Amber</SelectionToolbarToggle>
            <SelectionToolbarToggle value="green">Green</SelectionToolbarToggle>
          </SelectionToolbarToggleGroup>
        }
      >
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");
    const amber = screen.getByRole("button", { name: "Amber" });
    const green = screen.getByRole("button", { name: "Green" });
    expect(amber).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(green);

    expect(green).toHaveAttribute("aria-pressed", "true");
    expect(amber).toHaveAttribute("aria-pressed", "false");
  });

  it("runs an async action in place and leaves the bar up to show how it went", async () => {
    const action = vi.fn(() => Promise.resolve());
    render(
      <SelectionToolbar
        actions={<SelectionToolbarActionButton action={action}>Save</SelectionToolbarActionButton>}
      >
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    expect(action).toHaveBeenCalledWith("The quick brown fox", expect.any(Range));
    // The bar is where the outcome is drawn, so it has to outlive the press.
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  // No demo keeps this one honest, so the test has to: the state must not move until the
  // work has settled, which is the whole difference from a plain toggle.
  it("holds a deferred toggle's state until its action succeeds", async () => {
    let settle: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );

    render(
      <SelectionToolbar
        actions={
          <SelectionToolbarActionToggle action={action}>Highlight</SelectionToolbarActionToggle>
        }
      >
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");
    const toggle = screen.getByRole("button", { name: "Highlight" });
    fireEvent.click(toggle);

    expect(action).toHaveBeenCalledWith(true, "The quick brown fox", expect.any(Range));
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await act(async () => settle!());

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("dismisses after an async action when asked to", async () => {
    render(
      <SelectionToolbar
        actions={
          <SelectionToolbarActionButton action={() => Promise.resolve()} closeOnSuccess>
            Save
          </SelectionToolbarActionButton>
        }
      >
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("swallows mousedown so the press can't collapse the selection", () => {
    render(
      <SelectionToolbar actions={actions(() => {})}>
        <p data-testid="prose">The quick brown fox</p>
      </SelectionToolbar>,
    );

    selectText("prose");

    const prevented = !fireEvent.mouseDown(screen.getByRole("button", { name: "Copy" }));
    expect(prevented).toBe(true);
  });
});
