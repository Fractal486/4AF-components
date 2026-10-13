import type { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sheet, SheetTitle, SheetTrigger } from "@/registry/ui/sheet/sheet";
import { SiteNavigationContent } from "./site-navigation-content";

function Navigation() {
  const [open, setOpen] = useState(false);
  const actions = useRef<BaseDialog.Root.Actions | null>(null);
  return (
    <Sheet open={open} actionsRef={actions} onOpenChange={(next, details) => {
      if (!next) details.preventUnmountOnClose();
      setOpen(next);
    }}>
      <SheetTrigger>Open navigation</SheetTrigger>
      <SiteNavigationContent open={open} onExitComplete={() => actions.current?.unmount()}>
        <SheetTitle>Navigation</SheetTitle>
        <button onClick={() => actions.current?.close()}>Navigate</button>
      </SiteNavigationContent>
    </Sheet>
  );
}

describe("site navigation drawer", () => {
  it.each(["close button", "Escape", "navigation"])("stays visible during the %s exit, then unmounts and restores focus", async (dismissal) => {
    const user = userEvent.setup();
    render(<Navigation />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const drawer = screen.getByRole("dialog", { name: "Navigation" });
    expect(drawer).toBeVisible();
    // Close a fully opened drawer, so there is visible distance left to animate.
    await waitFor(() => expect(drawer.style.transform).toBe("none"));

    if (dismissal === "Escape") await user.keyboard("{Escape}");
    else if (dismissal === "navigation") await user.click(screen.getByRole("button", { name: "Navigate" }));
    else await user.click(screen.getByRole("button", { name: "Close" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(drawer).not.toHaveAttribute("hidden");
    expect(drawer).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
