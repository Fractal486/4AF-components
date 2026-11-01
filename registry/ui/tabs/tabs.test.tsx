import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs";

/** The selected tab's measured box in the list's own CSS pixels. */
function indicatorBox(list: HTMLElement) {
  const indicator = list.querySelector<HTMLElement>('[data-slot="tabs-indicator"]');
  return {
    left: parseFloat(indicator?.style.getPropertyValue("--active-tab-left") ?? ""),
    width: parseFloat(indicator?.style.getPropertyValue("--active-tab-width") ?? ""),
  };
}

function layoutBox(element: HTMLElement, left: number, width: number, height = 30) {
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  Object.defineProperties(element, {
    offsetLeft: { configurable: true, value: left },
    offsetTop: { configurable: true, value: 0 },
    offsetWidth: { configurable: true, value: width },
    offsetHeight: { configurable: true, value: height },
  });
}

describe("Tabs", () => {
  it.each(["segment", "pill", "underline"] as const)("fades only hidden edges and scrolls clicked tabs in %s", async (variant) => {
    render(
      <Tabs variant={variant} defaultValue="one">
        <TabsList aria-label="Scrollable">
          <TabsTab value="one">One</TabsTab>
          <TabsTab value="two">Two</TabsTab>
          <TabsTab value="three">Three</TabsTab>
        </TabsList>
      </Tabs>,
    );
    const list = screen.getByRole("tablist");
    Object.defineProperties(list, {
      clientWidth: { configurable: true, value: 200 },
      scrollWidth: { configurable: true, value: 400 },
    });
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue({ left: 0, right: 200, width: 200 } as DOMRect);
    const one = screen.getByRole("tab", { name: "One" });
    const two = screen.getByRole("tab", { name: "Two" });
    layoutBox(list, 0, 200);
    layoutBox(one, 0, 80);
    layoutBox(two, 140, 80);
    vi.spyOn(one, "getBoundingClientRect").mockImplementation(() => ({ left: 0 - list.scrollLeft, right: 80 - list.scrollLeft, width: 80 }) as DOMRect);
    vi.spyOn(two, "getBoundingClientRect").mockImplementation(() => ({ left: 140 - list.scrollLeft, right: 220 - list.scrollLeft, width: 80 }) as DOMRect);
    const scrollTo = vi.fn();
    list.scrollTo = scrollTo;

    fireEvent.scroll(list);
    expect(list).not.toHaveAttribute("data-overflow-left");
    expect(list).toHaveAttribute("data-overflow-right");
    fireEvent.click(two);
    expect(scrollTo).toHaveBeenCalledWith({ left: 80, behavior: "smooth" });

    act(() => { list.scrollLeft = 80; fireEvent.scroll(list); });
    expect(list).toHaveAttribute("data-overflow-left");
    expect(list).toHaveAttribute("data-overflow-right");
    // Measuring after a scroll must keep the indicator in content coordinates.
    await waitFor(() => expect(indicatorBox(list).left).toBe(140));
    scrollTo.mockClear();
    fireEvent.click(one);
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "smooth" });

    act(() => { list.scrollLeft = 200; fireEvent.scroll(list); });
    expect(list).toHaveAttribute("data-overflow-left");
    expect(list).not.toHaveAttribute("data-overflow-right");
    Object.defineProperty(list, "scrollWidth", { value: 200 });
    act(() => { list.scrollLeft = 0; fireEvent.scroll(list); });
    expect(list).not.toHaveAttribute("data-overflow-left");
    expect(list).not.toHaveAttribute("data-overflow-right");
  });

  it("measures the indicator in the list's own pixels under a scaled ancestor", async () => {
    render(
      <Tabs defaultValue="two">
        <TabsList aria-label="Scaled">
          <TabsTab value="one">One</TabsTab>
          <TabsTab value="two">Two</TabsTab>
        </TabsList>
      </Tabs>,
    );
    const list = screen.getByRole("tablist");
    // Laid out 200px wide, drawn at half size.
    layoutBox(list, 0, 200);
    layoutBox(screen.getByRole("tab", { name: "Two" }), 80, 80);
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue({ left: 10, right: 110, width: 100 } as DOMRect);
    vi.spyOn(screen.getByRole("tab", { name: "Two" }), "getBoundingClientRect")
      .mockReturnValue({ left: 50, right: 90, width: 40 } as DOMRect);

    fireEvent.click(screen.getByRole("tab", { name: "One" }));
    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    await waitFor(() => expect(indicatorBox(list)).toEqual({ left: 80, width: 80 }));
  });

  it("measures from layout under a 3D-tilted ancestor", async () => {
    render(
      <Tabs defaultValue="two">
        <TabsList aria-label="Tilted">
          <TabsTab value="one">One</TabsTab>
          <TabsTab value="two">Two</TabsTab>
        </TabsList>
      </Tabs>,
    );
    const list = screen.getByRole("tablist");
    const two = screen.getByRole("tab", { name: "Two" });
    layoutBox(list, 0, 200);
    layoutBox(two, 82, 79.5);
    // Laid out 200 x 30, projected as a box squashed vertically and widened.
    Object.defineProperty(list, "offsetWidth", { configurable: true, value: 200 });
    Object.defineProperty(list, "offsetHeight", { configurable: true, value: 30 });
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue({ left: 0, right: 260, width: 260, height: 18 } as DOMRect);
    vi.spyOn(two, "getBoundingClientRect").mockReturnValue({ left: 90, right: 200, width: 110, height: 20 } as DOMRect);
    Object.defineProperty(two, "offsetLeft", { configurable: true, value: 82 });
    two.style.width = "79.5px";

    fireEvent.click(screen.getByRole("tab", { name: "One" }));
    fireEvent.click(two);
    await waitFor(() => expect(indicatorBox(list)).toEqual({ left: 82, width: 79.5 }));
  });

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

    // 16px of line box + 12px of padding inside a 4px track: 32px.
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
    expect(screen.getByRole("tabpanel", { name: "Two" })).toHaveTextContent("Second panel");
    expect(screen.getByText("First panel").closest('[role="tabpanel"]')).toHaveAttribute("hidden");
  });
});

describe("Tabs appearance", () => {
  function setup(variant: "segment" | "pill" | "underline", props: { solid?: boolean; appearance?: "default" | "solid" | "outline" } = {}) {
    render(
      <Tabs variant={variant} defaultValue="one" {...props}>
        <TabsList aria-label="Outline">
          <TabsTab value="one">One</TabsTab>
          <TabsTab value="two">Two</TabsTab>
        </TabsList>
      </Tabs>,
    );
    return screen.getByRole("tablist");
  }

  it.each(["segment", "pill"] as const)("borders the %s track instead of filling it", async (variant) => {
    const list = setup(variant, { appearance: "outline" });
    expect(list).toHaveClass("border", "border-border");
    expect(list).not.toHaveClass("bg-muted", "bg-border");
    await waitFor(() => expect(list.querySelector('[aria-hidden="true"]')).toHaveClass("bg-muted"));
    expect(list.querySelector('[aria-hidden="true"]')).not.toHaveClass("bg-surface");
  });

  it("keeps the tuned 3px inset and corners on an outlined segment", async () => {
    const list = setup("segment", { appearance: "outline" });
    expect(list).toHaveClass("p-[3px]", "gap-[3px]", "rounded-[8px]");
    expect(screen.getByRole("tab", { name: "One" })).toHaveClass("py-[3px]", "rounded-[4px]");
    await waitFor(() =>
      expect(list.querySelector('[data-slot="tabs-indicator"]')).toHaveClass("rounded-[4px]"),
    );
    expect(list.querySelector('[aria-hidden="true"]')).not.toHaveClass("inset-y-0.5");
  });

  it("gives the outlined pill's border a pixel of the tab's padding", () => {
    setup("pill", { appearance: "outline" });
    expect(screen.getByRole("tab", { name: "One" })).toHaveClass("py-[5px]");
  });

  it("still accepts the deprecated solid boolean", () => {
    expect(setup("segment", { solid: true })).toHaveClass("bg-border");
  });

  it("lets appearance win over the deprecated solid boolean", () => {
    const list = setup("segment", { solid: true, appearance: "outline" });
    expect(list).not.toHaveClass("bg-border");
    expect(list).toHaveClass("border");
  });

  it("is ignored by underline", () => {
    const list = setup("underline", { appearance: "outline" });
    expect(list).toHaveClass("border-b");
    expect(list).not.toHaveClass("p-[3px]");
    expect(list.className).not.toMatch(/(^| )border( |$)/);
  });
});


describe("Tabs composition and orientation", () => {
  it("navigates vertically and exposes state to all part classes", async () => {
    const user = userEvent.setup();
    render(
      <Tabs orientation="vertical" defaultValue="one" className={(state) => state.orientation === "vertical" ? "vertical-root" : ""}>
        <TabsList aria-label="Sections" className={(state) => state.orientation === "vertical" ? "vertical-list" : ""}>
          <TabsTab value="one" className={(state) => state.active ? "selected" : "resting"}>One</TabsTab>
          <TabsTab value="disabled" disabled className={(state) => state.disabled ? "unavailable" : ""}>Disabled</TabsTab>
          <TabsTab value="two" className={(state) => state.active ? "selected" : "resting"}>Two</TabsTab>
        </TabsList>
        <TabsPanel value="one" className={(state) => state.hidden ? "inactive" : "visible"}>First</TabsPanel>
        <TabsPanel value="two">Second</TabsPanel>
      </Tabs>,
    );
    const list = screen.getByRole("tablist", { name: "Sections" });
    expect(list).toHaveAttribute("aria-orientation", "vertical");
    expect(list).toHaveClass("vertical-list", "flex-col");
    expect(list.parentElement).toHaveClass("vertical-root", "flex-row");
    expect(screen.getByRole("tab", { name: "Disabled" })).toHaveClass("unavailable");
    act(() => screen.getByRole("tab", { name: "One" }).focus());
    await user.keyboard("{End}{Enter}");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveClass("selected");
    expect(screen.getByRole("tab", { name: "One" })).toHaveClass("resting");
    expect(screen.getByText("First").closest('[role="tabpanel"]')).toHaveClass("inactive");
    expect(screen.getByRole("tabpanel", { name: "Two" })).toHaveTextContent("Second");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
  });

  it("merges panel element refs and events while retaining panel semantics and mounted content", async () => {
    const user = userEvent.setup();
    const panelRef = createRef<HTMLDivElement>();
    const surfaceRef = createRef<HTMLElement>();
    const panelClick = vi.fn();
    const surfaceClick = vi.fn();
    render(
      <Tabs defaultValue="one">
        <TabsList><TabsTab value="one">One</TabsTab><TabsTab value="two">Two</TabsTab></TabsList>
        <TabsPanel value="one" ref={panelRef} className="panel" onClick={panelClick}
          render={<section ref={surfaceRef} className="surface" onClick={surfaceClick} />}>
          <input aria-label="Draft" defaultValue="Saved text" />
        </TabsPanel>
        <TabsPanel value="two" render={(props, state) => <article {...props} data-panel-hidden={state.hidden} />}>Second</TabsPanel>
      </Tabs>,
    );
    const panel = screen.getByRole("tabpanel", { name: "One" });
    expect(panel.tagName).toBe("SECTION");
    expect(panel).toHaveClass("panel", "surface");
    expect(panelRef.current).toBe(panel);
    expect(surfaceRef.current).toBe(panel);
    await user.click(screen.getByRole("textbox", { name: "Draft" }));
    expect(panelClick).toHaveBeenCalledOnce();
    expect(surfaceClick).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("tab", { name: "Two" }));
    const second = screen.getByRole("tabpanel", { name: "Two" });
    expect(second.tagName).toBe("ARTICLE");
    expect(second).toHaveAttribute("data-panel-hidden", "false");
    expect(panel).toHaveAttribute("hidden");
    await user.click(screen.getByRole("tab", { name: "One" }));
    expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("Saved text");
  });

  it("scrolls a height-constrained vertical list and updates top/bottom fades", () => {
    render(<Tabs orientation="vertical" defaultValue="one"><TabsList>
      <TabsTab value="one">One</TabsTab><TabsTab value="two">Two</TabsTab>
    </TabsList></Tabs>);
    const list = screen.getByRole("tablist");
    const two = screen.getByRole("tab", { name: "Two" });
    Object.defineProperties(list, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 240 },
    });
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue({ top: 0, bottom: 100, height: 100 } as DOMRect);
    vi.spyOn(two, "getBoundingClientRect").mockReturnValue({ top: 140, bottom: 170, height: 30 } as DOMRect);
    list.scrollTo = vi.fn();
    fireEvent.scroll(list);
    expect(list).toHaveAttribute("data-overflow-bottom");
    expect(list).not.toHaveAttribute("data-overflow-top");
    fireEvent.click(two);
    expect(list.scrollTo).toHaveBeenCalledWith({ top: 105, behavior: "smooth" });
    act(() => { list.scrollTop = 140; fireEvent.scroll(list); });
    expect(list).toHaveAttribute("data-overflow-top");
    expect(list).not.toHaveAttribute("data-overflow-bottom");
  });

  it("keeps state-based styles when an optional width limit is supplied", () => {
    render(<Tabs orientation="vertical" defaultValue="one"><TabsList maxWidth={180}
      style={(state) => ({ color: state.orientation === "vertical" ? "red" : "blue" })}>
      <TabsTab value="one">One</TabsTab>
    </TabsList></Tabs>);
    expect(screen.getByRole("tablist")).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(screen.getByRole("tablist").style.maxWidth.replaceAll(" ", "")).toBe("min(100%,180px)");
  });

  it("includes the indicator and its positioning script in server-rendered HTML", () => {
    const html = renderToString(<Tabs defaultValue="two"><TabsList>
      <TabsTab value="one">One</TabsTab><TabsTab value="two">Two</TabsTab>
    </TabsList></Tabs>);
    expect(html).toContain('data-slot="tabs-indicator"');
    expect(html).toContain("<script");
    expect(html).toContain("--active-tab-left");
  });
});
