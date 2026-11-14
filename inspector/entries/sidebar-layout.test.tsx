import { render, screen } from "@testing-library/react";
import { initialValues } from "../schema";
import { sidebarLayoutEntry } from "./sidebar-layout";

const defaults = initialValues(sidebarLayoutEntry.controls);
const renderWith = (values: Partial<typeof defaults> = {}) =>
  render(<>{sidebarLayoutEntry.render({ ...defaults, ...values })}</>);

describe("Sidebar Layout blueprint", () => {
  it("draws the layout with its default header", () => {
    renderWith();
    expect(document.querySelector("[data-slot=sidebar-trigger]")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alerts" })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute("data-variant", "sidebar");
  });

  it("wires every setting into the layout", async () => {
    renderWith({ layout: "split", variant: "inset", headerActions: false, collapseControl: false, detailRail: true });
    expect(document.querySelector("[data-slot=sidebar-trigger]")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Alerts" })).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="sidebar"][data-variant]')).toHaveAttribute("data-variant", "split-inset");
    // The detail panel portals in once the rail slot has committed.
    expect(await screen.findByRole("complementary", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Details" }).parentElement).toHaveAttribute("data-slot", "sidebar-layout-rail");
  });
});
