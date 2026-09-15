import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs";

describe("Tabs", () => {
  it("keeps its internal measurement ref when a consumer supplies one", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <Tabs defaultValue="one">
        <TabsList ref={ref} aria-label="Examples">
          <TabsTab value="one">One</TabsTab>
        </TabsList>
      </Tabs>,
    );

    expect(ref.current).toHaveAttribute("role", "tablist");
  });

  it("uses concentric radii for the segment track and selected tab", () => {
    const { container } = render(
      <Tabs defaultValue="one">
        <TabsList aria-label="Examples">
          <TabsTab value="one">One</TabsTab>
        </TabsList>
      </Tabs>,
    );

    expect(container.querySelector('[role="tablist"]')).toHaveClass("rounded-[8px]", "p-0.5");
    expect(screen.getByRole("tab", { name: "One" })).toHaveClass("rounded-[6px]");
  });

  it("keeps the radii concentric at the small size too", () => {
    const { container } = render(
      <Tabs size="sm" defaultValue="one">
        <TabsList aria-label="Examples">
          <TabsTab value="one">One</TabsTab>
        </TabsList>
      </Tabs>,
    );

    // 5px tab inside 2px of padding wants a 7px track — reusing the md pair would leave the
    // corners visibly disagreeing.
    expect(container.querySelector('[role="tablist"]')).toHaveClass("rounded-[7px]", "p-0.5");
    expect(screen.getByRole("tab", { name: "One" })).toHaveClass("rounded-[5px]", "text-xs");
  });

  it("tightens the pill track at the small size so it lands on a control height", () => {
    const { container } = render(
      <Tabs variant="pill" size="sm" defaultValue="one">
        <TabsList aria-label="Examples">
          <TabsTab value="one">One</TabsTab>
        </TabsList>
      </Tabs>,
    );

    // 16px of line box + 12px of padding inside a 4px track: 32px, the height of an Input.
    expect(container.querySelector('[role="tablist"]')).toHaveClass("p-0.5", "gap-0.5");
    expect(screen.getByRole("tab", { name: "One" })).toHaveClass("px-2.5", "py-1.5", "text-xs");
  });

  it("does not force a pointer cursor on tabs", () => {
    render(
      <Tabs defaultValue="one">
        <TabsList aria-label="Examples">
          <TabsTab value="one">One</TabsTab>
        </TabsList>
      </Tabs>,
    );

    expect(screen.getByRole("tab", { name: "One" })).not.toHaveClass("cursor-pointer");
  });

  it("keeps inactive panels mounted and switches with keyboard navigation", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="one">
        <TabsList aria-label="Examples">
          <TabsTab value="one">One</TabsTab>
          <TabsTab value="two">Two</TabsTab>
        </TabsList>
        <TabsPanel value="one">First panel</TabsPanel>
        <TabsPanel value="two">Second panel</TabsPanel>
      </Tabs>,
    );

    const firstTab = screen.getByRole("tab", { name: "One" });
    firstTab.focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    expect(screen.getByText("First panel")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Second panel")).toBeVisible());
  });
});
