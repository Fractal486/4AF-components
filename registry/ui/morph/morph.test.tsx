import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
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
      disconnect() { this.targets.length = 0; }
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

  it("keeps measurement and transition cleanup working with a caller ref, styles and handler", () => {
    const report = stubResizeObserver();
    const ref = createRef<HTMLSpanElement>();
    const onTransitionEnd = vi.fn();
    const items = { off: "Follow", on: "Following" };
    const view = (activeKey: "off" | "on") => <Morph activeKey={activeKey} items={items} sizing="current"
      ref={ref} style={{ width: 100, color: "red" }} onTransitionEnd={onTransitionEnd} />;
    const { rerender, unmount } = render(view("off"));
    const box = ref.current!;
    expect(box.style.width).toBe("100px");
    report(target => (target as HTMLElement).dataset.morphSizer === "on" ? 72 : 48);
    expect(box.style.width).toBe("48px");
    expect(box.style.color).toBe("red");
    rerender(view("on"));
    expect(ref.current).toBe(box);
    expect(box).toHaveAttribute("data-resizing");
    act(() => { box.dispatchEvent(Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "width" })); });
    expect(box).not.toHaveAttribute("data-resizing");
    expect(onTransitionEnd).toHaveBeenCalledOnce();
    unmount();
    expect(ref.current).toBeNull();
  });

  it("does not render a duplicate sizer for a single state", () => {
    const { container } = render(
      <Morph activeKey="idle" items={{ idle: <span>Pending</span> }} />,
    );

    expect(screen.getAllByText("Pending")).toHaveLength(1);
    expect(container.querySelector('[data-slot="morph"] [aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it("mounts only the showing item in a fixed box", () => {
    const { container } = render(
      <Morph
        activeKey={"off" as "off" | "on"}
        sizing="fixed"
        className="size-4"
        items={{ off: <span>Unchecked</span>, on: <span>Checked</span> }}
      />,
    );

    const box = container.querySelector<HTMLElement>('[data-slot="morph"]')!;
    expect(box).toHaveAttribute("data-sizing", "fixed");
    expect(screen.getAllByText("Unchecked")).toHaveLength(1);
    expect(screen.queryByText("Checked")).not.toBeInTheDocument();
    expect(box.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
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

  it("keeps the previous width until a new single-item label is measured", () => {
    const report = stubResizeObserver();
    const { container, rerender } = render(<Morph activeKey="follow" items={{ follow: "Follow" }} sizing="current" />);
    const box = container.querySelector<HTMLElement>('[data-slot="morph"]')!;
    report(() => 48);
    expect(box.style.width).toBe("48px");

    rerender(<Morph activeKey="following" items={{ following: "Following" }} sizing="current" />);
    expect(container.querySelector('[data-slot="morph"]')).toBe(box);
    expect(box.style.width).toBe("48px");
    report(() => 72.5);
    expect(box.style.width).toBe("72.5px");
    expect(box).toHaveClass("transition-[width]", "duration-(--duration-base)");

    rerender(<Morph activeKey="follow" items={{ follow: "Follow" }} sizing="current" />);
    expect(box.style.width).toBe("72.5px");
    report(() => 48);
    expect(box.style.width).toBe("48px");
  });

  it("marks the box as resizing until its width transition ends", () => {
    const report = stubResizeObserver();
    const items = { off: "Follow", on: "Following" };
    const { container, rerender } = render(<Morph activeKey="off" items={items} sizing="current" />);
    const box = container.querySelector<HTMLElement>('[data-slot="morph"]')!;
    report((target) => ((target as HTMLElement).dataset.morphSizer === "on" ? 72.5 : 48));
    // The first measurement only sets the size; nothing was transitioning from.
    expect(box).not.toHaveAttribute("data-resizing");

    rerender(<Morph activeKey="on" items={items} sizing="current" />);
    expect(box).toHaveAttribute("data-resizing");

    // A child's transition bubbling up does not end the box's own.
    act(() => {
      box.firstElementChild!.dispatchEvent(Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "width" }));
    });
    expect(box).toHaveAttribute("data-resizing");

    act(() => {
      box.dispatchEvent(Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "width" }));
    });
    expect(box).not.toHaveAttribute("data-resizing");
  });

  describe('effect="characters"', () => {
    it("keeps one text element mounted and rewrites its letters", () => {
      const items = { idle: "Save", pending: "Saving" };
      const { container, rerender } = render(<Morph activeKey="idle" items={items} effect="characters" />);
      const box = container.querySelector('[data-slot="morph"]')!;
      expect(box).toHaveAttribute("data-effect", "characters");
      const text = box.querySelector(":scope > :not([aria-hidden])")!;
      expect(text).toHaveTextContent("Save");

      rerender(<Morph activeKey="pending" items={items} effect="characters" />);
      // The same element, not a new keyed one swapped in beside it.
      expect(box.querySelector(":scope > :not([aria-hidden])")).toBe(text);
      expect(text).toHaveTextContent("Saving");
    });

    it("reserves the widest item under both effects", () => {
      const items = { off: "Follow", on: "Following" };
      const { container } = render(<Morph activeKey="off" items={items} effect="characters" />);
      const sizers = [...container.querySelectorAll('[data-slot="morph"] > [aria-hidden="true"]')];
      expect(sizers.map((sizer) => sizer.textContent)).toEqual(["Follow", "Following"]);
    });

    it("joins text arrays and leaves empty items blank", () => {
      const items = { a: ["Step ", 2], b: null };
      const { container, rerender } = render(<Morph activeKey="a" items={items} effect="characters" sizing="fixed" />);
      const box = container.querySelector('[data-slot="morph"]')!;
      expect(box).toHaveAttribute("data-effect", "characters");
      expect(box).toHaveTextContent("Step 2");
      rerender(<Morph activeKey="b" items={items} effect="characters" sizing="fixed" />);
      expect(box.textContent).toBe("");
    });

    it("falls back to the whole-item swap when any item is JSX", () => {
      const items = { idle: "Copy", done: <strong>Copied</strong> };
      const { container } = render(<Morph activeKey="idle" items={items} effect="characters" />);
      expect(container.querySelector('[data-slot="morph"]')).toHaveAttribute("data-effect", "swap");
      expect(screen.getAllByText("Copied")).toHaveLength(1);
    });

    it("defaults to the swap", () => {
      const items = { a: "A", b: "B" };
      const { container } = render(<Morph activeKey="a" items={items} />);
      expect(container.querySelector('[data-slot="morph"]')).toHaveAttribute("data-effect", "swap");
    });
  });
});
