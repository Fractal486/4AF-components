import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

describe("Collapsible", () => {
  it("keeps the panel out of the tree until the row is opened", async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Hidden body</CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Hidden body")).not.toBeInTheDocument();

    await user.click(trigger);

    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    expect(screen.getByText("Hidden body")).toBeInTheDocument();
  });

  it("opens from the keyboard and marks the trigger for the chevron rotation", async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole("button", { name: "Details" });
    trigger.focus();
    await user.keyboard("{Enter}");

    // The chevron rotates off this attribute rather than off a prop, so losing it would
    // silently freeze the glyph pointing right on an open row.
    await waitFor(() => expect(trigger).toHaveAttribute("data-panel-open"));
  });

  it("is controllable, and reports the reason it changed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Collapsible open={false} onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>,
    );

    await user.click(screen.getByRole("button", { name: "Details" }));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    // Controlled, and the parent said no: the panel stays closed.
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("takes the card variant through context, so the parts stay in step", () => {
    render(
      <Collapsible variant="card" defaultOpen>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByRole("button", { name: "Details" })).toHaveClass("rounded-[8px]");
    expect(screen.getByText("Body")).toHaveClass("pb-2.5");
  });

  it("drops the chevron when a row supplies its own indicator", () => {
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger chevron={false}>Details</CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>,
    );

    expect(container.querySelector('[data-slot="collapsible-chevron"]')).toBeNull();
  });
});
