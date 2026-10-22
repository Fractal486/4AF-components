import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { Morph } from "./morph";

afterEach(() => vi.unstubAllGlobals());

/** Records each observer so a test can report sizes the way a browser would. */
function stubResizeObserver() {
  const observers: { callback: ResizeObserverCallback; targets: Element[] }[] = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      targets: Element[] = [];
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, targets: this.targets });
      }
      observe(target: Element) {
        this.targets.push(target);
      }
      unobserve() {}
      disconnect() {
        this.targets.length = 0;
      }
    },
  );
  return (widthOf: (target: Element) => number) =>
    act(() => {
      for (const { callback, targets } of observers) {
        const entries = targets.map(
          (target) =>
            ({ target, borderBoxSize: [{ inlineSize: widthOf(target), blockSize: 20 }] }) as unknown as ResizeObserverEntry,
        );
        callback(entries, {} as ResizeObserver);
      }
    });
}

describe("Morph", () => {
  it("swaps fixed-size states without mounting hidden controls or measuring widths", async () => {
    const observer = vi.fn();
    vi.stubGlobal("ResizeObserver", observer);
    const onSelect = vi.fn();
    const items = {
      icon: <span>Source</span>,
      select: <button onClick={onSelect}>Select</button>,
    };
    const { container, rerender } = render(
      <Morph sizing="fixed" className="size-4" activeKey="icon" items={items} />,
    );

    const box = container.querySelector<HTMLElement>('[data-slot="morph"]')!;
    expect(box).toHaveAttribute("data-sizing", "fixed");
    expect(box).toHaveClass("size-4");
    expect(box.style.width).toBe("");
    expect(screen.getAllByText("Source")).toHaveLength(1);
    expect(screen.queryByRole("button", { hidden: true })).not.toBeInTheDocument();

    rerender(<Morph sizing="fixed" className="size-4" activeKey="select" items={items} />);
    const button = screen.getByRole("button", { name: "Select" });
    expect(screen.getAllByRole("button", { hidden: true })).toHaveLength(1);
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText("Source")).not.toBeInTheDocument());

    rerender(<Morph sizing="fixed" className="size-4" activeKey="icon" items={items} />);
    await waitFor(() => expect(screen.queryByRole("button", { hidden: true })).not.toBeInTheDocument());
    expect(screen.getAllByText("Source")).toHaveLength(1);
    expect(observer).not.toHaveBeenCalled();
  });

  it("does not render a duplicate sizer for a single state", () => {
    const { container } = render(
      <Morph activeKey="idle" items={{ idle: <span>Pending</span> }} />,
    );

    expect(screen.getAllByText("Pending")).toHaveLength(1);
    expect(container.querySelector('[data-slot="morph"] [aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it("reserves the widest item by default without setting a width", () => {
    const report = stubResizeObserver();
    const items = { off: "Follow", on: "Following" };
    const { container } = render(<Morph activeKey="off" items={items} />);
    report(() => 80);

    const box = container.querySelector<HTMLElement>('[data-slot="morph"]')!;
    expect(box).toHaveAttribute("data-sizing", "widest");
    expect(box.style.width).toBe("");
    expect(box.querySelector("[data-morph-sizer]")).not.toBeInTheDocument();
  });

  it("sizes the box to the showing item with sizing=\"current\"", () => {
    const report = stubResizeObserver();
    const items = { off: "Follow", on: "Following" };
    const { container, rerender } = render(<Morph activeKey="off" items={items} sizing="current" />);
    const box = container.querySelector<HTMLElement>('[data-slot="morph"]')!;

    expect(box).toHaveAttribute("data-sizing", "current");
    // Unmeasured, the box takes its size from the showing item rather than a guess.
    expect(box.style.width).toBe("");

    report((target) => ((target as HTMLElement).dataset.morphSizer === "on" ? 72.5 : 48));
    expect(box.style.width).toBe("48px");

    rerender(<Morph activeKey="on" items={items} sizing="current" />);
    expect(box.style.width).toBe("72.5px");
  });

  it("drops measured sizing in fixed mode and resumes measuring when switched back", () => {
    const report = stubResizeObserver();
    const items = { off: "Follow", on: "Following" };
    const { container, rerender } = render(<Morph activeKey="off" items={items} sizing="current" />);
    report(() => 48);
    expect(container.querySelector<HTMLElement>('[data-slot="morph"]')!.style.width).toBe("48px");

    rerender(<Morph activeKey="off" items={items} sizing="fixed" className="h-5 w-20" />);
    const fixed = container.querySelector<HTMLElement>('[data-slot="morph"]')!;
    expect(fixed.style.width).toBe("");
    expect(fixed.querySelector("[data-morph-sizer]")).not.toBeInTheDocument();
    expect(screen.queryByText("Following")).not.toBeInTheDocument();

    rerender(<Morph activeKey="off" items={items} sizing="current" />);
    report(() => 60);
    expect(container.querySelector<HTMLElement>('[data-slot="morph"]')!.style.width).toBe("60px");
  });
});
