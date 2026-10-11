import { createRef } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs";

describe("Tabs", () => {
  it.each(["segment", "pill", "underline"] as const)("fades only hidden edges and scrolls clicked tabs in %s", async (variant) => {
    render(
      <Tabs variant={variant} defaultValue="one">
        <TabsList maxWidth={200} aria-label="Scrollable">
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
    await waitFor(() => expect(list.querySelector('[aria-hidden="true"]')).toHaveStyle({ left: "140px" }));
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
    await waitFor(() => expect(screen.getByText("Second panel")).toBeVisible());
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
      expect(list.querySelector('[aria-hidden="true"]')).toHaveClass("inset-y-[3px]", "rounded-[4px]"),
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
