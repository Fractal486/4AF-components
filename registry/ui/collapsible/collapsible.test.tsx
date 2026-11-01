import { createRef, type CSSProperties } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, CollapsibleTriggerIcon } from "./collapsible";

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


describe("Collapsible composition and layout", () => {
  it("merges state-based classes on the root, trigger, and outer panel", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Collapsible className={({ open }) => open ? "root-open" : "root-closed"}>
        <CollapsibleTrigger className={({ open }) => open ? "trigger-open" : "trigger-closed"}>Details</CollapsibleTrigger>
        <CollapsibleContent keepMounted panelClassName={({ open }) => open ? "panel-open" : "panel-closed"} className="inner">Body</CollapsibleContent>
      </Collapsible>,
    );
    const root = container.querySelector('[data-slot="collapsible"]');
    const trigger = screen.getByRole("button", { name: "Details" });
    const panel = container.querySelector('[data-slot="collapsible-panel"]');
    expect(root).toHaveClass("root-closed");
    expect(trigger).toHaveClass("trigger-closed", "flex");
    expect(panel).toHaveClass("panel-closed", "overflow-clip");
    await user.click(trigger);
    expect(root).toHaveClass("root-open");
    expect(trigger).toHaveClass("trigger-open", "flex");
    expect(panel).toHaveClass("panel-open", "overflow-clip");
    expect(screen.getByText("Body")).toHaveClass("inner");
  });

  it.each(["render", "asChild"] as const)("supports a custom icon through %s with refs and merged props", (mode) => {
    const ref = createRef<HTMLElement>();
    const { container, unmount } = render(
      <Collapsible>
        <CollapsibleTrigger chevron={false}>
          Details
          {mode === "render"
            ? <CollapsibleTriggerIcon render={<em data-custom="true" />} ref={ref} className="custom-icon"><svg data-testid="custom-symbol" /></CollapsibleTriggerIcon>
            : <CollapsibleTriggerIcon asChild ref={ref} className="custom-icon"><em data-custom="true"><svg data-testid="custom-symbol" /></em></CollapsibleTriggerIcon>}
        </CollapsibleTrigger>
      </Collapsible>,
    );
    expect(ref.current?.tagName).toBe("EM");
    expect(ref.current).toHaveAttribute("aria-hidden", "true");
    expect(ref.current).toHaveAttribute("data-custom", "true");
    expect(ref.current).toHaveClass("custom-icon", "inline-flex");
    expect(container.querySelector('[data-slot="collapsible-chevron"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Details" })).toBeInTheDocument();
    unmount();
    expect(ref.current).toBeNull();
  });

  it.each([
    { display: "flex", flexDirection: "column", first: false, start: 12, end: 0 },
    { display: "flex", flexDirection: "column-reverse", first: false, start: 0, end: 12 },
    { display: "flex", flexDirection: "column", first: true, start: 0, end: 12 },
    { display: "flex", flexDirection: "column-reverse", first: true, start: 12, end: 0 },
    { display: "grid", gridTemplateColumns: "1fr", first: false, start: 0, end: 0 },
    { display: "grid", gridTemplateColumns: "1fr 1fr", first: false, start: 0, end: 0 },
    { display: "flex", flexDirection: "row", first: false, start: 0, end: 0 },
  ])("measures one adjoining gap for $display/$flexDirection/$gridTemplateColumns, panel first=$first", ({ first, start, end, ...layout }) => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Collapsible defaultOpen style={{ ...layout, rowGap: "12px" } as CSSProperties}>
        {!first && <CollapsibleTrigger>Details</CollapsibleTrigger>}
        <CollapsibleContent ref={ref}>Body</CollapsibleContent>
        {first && <CollapsibleTrigger>Details</CollapsibleTrigger>}
      </Collapsible>,
    );
    expect(ref.current?.style.getPropertyValue("--collapsible-gap-start")).toBe(start + "px");
    expect(ref.current?.style.getPropertyValue("--collapsible-gap-end")).toBe(end + "px");
  });

  it("finds layout siblings through display:contents and ignores hidden siblings", async () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <Collapsible defaultOpen style={{ display: "flex", flexDirection: "column", rowGap: "12px" }}>
        <div style={{ display: "contents" }}>
          <CollapsibleTrigger>Details</CollapsibleTrigger>
          <CollapsibleContent ref={ref}>Body</CollapsibleContent>
        </div>
      </Collapsible>,
    );
    expect(ref.current?.style.getPropertyValue("--collapsible-gap-start")).toBe("12px");
    rerender(
      <Collapsible defaultOpen style={{ display: "flex", flexDirection: "column", rowGap: "20px" }}>
        <div style={{ display: "contents" }}>
          <CollapsibleTrigger style={{ display: "none" }}>Details</CollapsibleTrigger>
          <CollapsibleContent ref={ref}>Body</CollapsibleContent>
        </div>
      </Collapsible>,
    );
    await waitFor(() => expect(ref.current?.style.getPropertyValue("--collapsible-gap-start")).toBe("0px"));
  });

  it("reserves the right compensation when a closed panel stays mounted", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <Collapsible style={{ display: "flex", flexDirection: "column", rowGap: "12px" }}>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent ref={ref} keepMounted>Body</CollapsibleContent>
      </Collapsible>,
    );
    expect(ref.current).not.toHaveAttribute("data-settled");
    expect(ref.current?.style.getPropertyValue("--collapsible-gap-start")).toBe("12px");
    await user.click(screen.getByRole("button", { name: "Details" }));
    await waitFor(() => expect(ref.current).toHaveAttribute("data-settled"));
    expect(ref.current?.style.getPropertyValue("--collapsible-gap-start")).toBe("12px");
  });

  it("restores overflow only after the panel's own layout transitions finish", async () => {
    const ref = createRef<HTMLDivElement>();
    const { unmount } = render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent ref={ref}><span>Body</span></CollapsibleContent>
      </Collapsible>,
    );
    const panel = ref.current!;
    await waitFor(() => expect(panel).toHaveAttribute("data-settled"));
    const animations = vi.spyOn(panel, "getAnimations").mockReturnValue([
      { transitionProperty: "height", playState: "running" } as unknown as Animation,
    ]);
    fireEvent(panel, new Event("transitionrun", { bubbles: true }));
    expect(panel).not.toHaveAttribute("data-settled");
    animations.mockReturnValue([]);
    // A nested transition must not mark the containing disclosure settled.
    fireEvent(screen.getByText("Body"), new Event("transitionend", { bubbles: true }));
    expect(panel).not.toHaveAttribute("data-settled");
    fireEvent(panel, new Event("transitionend", { bubbles: true }));
    expect(panel).toHaveAttribute("data-settled");
    animations.mockRestore();
    unmount();
    expect(ref.current).toBeNull();
    expect(panel).not.toHaveAttribute("data-settled");
  });

  it("preserves callback ref cleanup when the panel unmounts", () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const { unmount } = render(
      <Collapsible defaultOpen><CollapsibleContent ref={ref}>Body</CollapsibleContent></Collapsible>,
    );
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
