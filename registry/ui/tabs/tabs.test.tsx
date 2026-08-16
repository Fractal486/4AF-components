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

    expect(container.querySelector('[role="tablist"]')).toHaveClass("rounded-md", "p-0.5");
    expect(screen.getByRole("tab", { name: "One" })).toHaveClass("rounded-sm");
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
