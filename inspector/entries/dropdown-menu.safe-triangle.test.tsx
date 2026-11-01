import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
import { SafeTriangleOverlay } from "./dropdown-menu.safe-triangle";

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;

describe("SafeTriangleOverlay", () => {
  it("previews on the row, bridges toward the panel, and clears off course or on landing", async () => {
    const user = userEvent.setup();
    render(
      <>
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        <SafeTriangleOverlay />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    const row = await screen.findByRole("menuitem", { name: "Share" });
    row.focus();
    await user.keyboard("{ArrowRight}");
    const item = await screen.findByRole("menuitem", { name: "Copy link" });

    expect(row).toHaveAttribute("data-popup-open");
    const positioner = document.getElementById(row.getAttribute("aria-controls")!)?.closest("[data-side]");
    expect(positioner).toHaveAttribute("data-side", "right");

    row.getBoundingClientRect = () => rect(0, 100, 200, 30);
    (positioner as HTMLElement).getBoundingClientRect = () => rect(208, 96, 180, 120);

    const move = (clientX: number, clientY: number) =>
      act(() => document.dispatchEvent(new PointerEvent("pointermove", { clientX, clientY })));
    const overlay = () => document.querySelector("[data-slot=safe-triangle-overlay]");

    // On the row: a preview from the cursor.
    move(150, 115);
    expect(overlay()?.querySelector("polygon")).toBeInTheDocument();

    // Left the row's right edge, heading for the panel: inside the area, drawn solid.
    move(202, 115);
    expect(overlay()?.querySelector("polygon")).toHaveClass("fill-ring/25");
    expect(overlay()?.querySelector("rect")).toBeInTheDocument();

    // Off course, below the row: Base UI would close the submenu, so nothing is drawn.
    move(150, 140);
    expect(overlay()).toBeNull();

    act(() => document.dispatchEvent(new PointerEvent("pointermove", { clientX: 250, clientY: 120 })));
    expect(document.querySelector("[data-slot=safe-triangle-overlay]")).toBeNull();
    expect(item).toBeInTheDocument();
  });
});
