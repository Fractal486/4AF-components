import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DrawerNav } from "./drawer-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/docs/button" }));

const NAV = [
  { items: [{ title: "Overview", href: "/" }] },
  { label: "Actions", items: [{ title: "Button", href: "/docs/button" }, { title: "Toggle", href: "/docs/toggle" }] },
];

describe("DrawerNav", () => {
  // jsdom has no scrolling; the drawer brings the current page into view on open.
  beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); });

  it("lists each labelled group as a section of icon rows and marks the current page", () => {
    render(<DrawerNav nav={NAV} />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("region", { name: "Actions" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Button" }).querySelector("svg")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Toggle" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Toggle" })).toHaveClass("p-2");
  });

  it("reports a navigation so the drawer can close", async () => {
    const onNavigate = vi.fn();
    render(<DrawerNav nav={NAV} onNavigate={onNavigate} />);

    await userEvent.setup().click(screen.getByRole("link", { name: "Toggle" }));
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
