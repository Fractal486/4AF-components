import type { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sheet, SheetTitle, SheetTrigger } from "@/registry/ui/sheet/sheet";
import { SiteNavigationContent } from "./site-navigation-content";

function Navigation() {
  const actions = useRef<BaseDialog.Root.Actions | null>(null);
  return (
    <Sheet actionsRef={actions}>
      <SheetTrigger>Open navigation</SheetTrigger>
      <SiteNavigationContent>
        <SheetTitle>Navigation</SheetTitle>
        <button onClick={() => actions.current?.close()}>Navigate</button>
      </SiteNavigationContent>
    </Sheet>
  );
}

describe("site navigation drawer", () => {
  it("slides from the left and has no close button", async () => {
    const user = userEvent.setup();
    render(<Navigation />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const drawer = screen.getByRole("dialog", { name: "Navigation" });

    expect(drawer).toHaveClass("left-0", "w-72", "transition-[translate]", "data-[starting-style]:-translate-x-full", "data-[ending-style]:-translate-x-full");
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it.each(["Escape", "navigation"])("closes on %s and restores focus", async (dismissal) => {
    const user = userEvent.setup();
    render(<Navigation />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const drawer = screen.getByRole("dialog", { name: "Navigation" });

    if (dismissal === "Escape") fireEvent.keyDown(drawer, { key: "Escape" });
    else fireEvent.click(screen.getByRole("button", { name: "Navigate" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
