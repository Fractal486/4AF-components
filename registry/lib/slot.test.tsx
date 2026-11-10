import { fireEvent, render, screen } from "@testing-library/react";
import { act, createRef, StrictMode, Suspense, type ReactElement } from "react";
import { vi } from "vitest";
import { Slot } from "./slot";

/** The shape React's RSC client hands a client component for a child it hasn't resolved. */
function lazyChild(element: ReactElement) {
  return {
    $$typeof: Symbol.for("react.lazy"),
    _payload: Promise.resolve(element),
    _init: (payload: unknown) => payload,
  } as unknown as ReactElement;
}

describe("Slot", () => {
  it.each([false, true])("keeps stable refs attached during rerenders (StrictMode=%s)", (strict) => {
    const childCleanup = vi.fn();
    const slotCleanup = vi.fn();
    const childRef = vi.fn(() => childCleanup);
    const slotRef = vi.fn(() => slotCleanup);
    const view = (label: string) => {
      const child = <Slot ref={slotRef} className={label}><button ref={childRef}>{label}</button></Slot>;
      return strict ? <StrictMode>{child}</StrictMode> : child;
    };
    const { rerender, unmount } = render(view("First"));
    const button = screen.getByRole("button");
    for (const spy of [childRef, slotRef, childCleanup, slotCleanup]) spy.mockClear();
    rerender(view("Second"));
    expect(screen.getByRole("button")).toBe(button);
    for (const spy of [childRef, slotRef, childCleanup, slotCleanup]) expect(spy).not.toHaveBeenCalled();
    unmount();
    expect(childCleanup).toHaveBeenCalledOnce();
    expect(slotCleanup).toHaveBeenCalledOnce();
  });

  it("reattaches changed refs in order and clears refs when its child disappears", () => {
    const calls: string[] = [];
    const slotRef = (node: HTMLElement | null) => { if (node) calls.push("slot attach"); return () => { calls.push("slot cleanup"); }; };
    const oldRef = (node: HTMLButtonElement | null) => { if (node) calls.push("child attach"); return () => { calls.push("child cleanup"); }; };
    const nextRef = createRef<HTMLButtonElement>();
    const { rerender } = render(<Slot ref={slotRef}><button ref={oldRef}>First</button></Slot>);
    expect(calls).toEqual(["slot attach", "child attach"]);
    calls.length = 0;
    rerender(<Slot ref={slotRef}><button ref={nextRef}>Next</button></Slot>);
    expect(calls).toEqual(["child cleanup", "slot cleanup", "slot attach"]);
    expect(nextRef.current).toBe(screen.getByRole("button"));
    rerender(<Slot ref={slotRef}>{null}</Slot>);
    expect(nextRef.current).toBeNull();
    rerender(<Slot ref={slotRef}><button ref={nextRef}>Back</button></Slot>);
    expect(nextRef.current).toBe(screen.getByRole("button"));
  });

  it("lets a child cancel the slot handler", () => {
    const slotClick = vi.fn();
    const childClick = vi.fn((event: React.MouseEvent) => event.preventDefault());

    render(
      <Slot onClick={slotClick}>
        <button onClick={childClick}>Cancel</button>
      </Slot>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(childClick).toHaveBeenCalledOnce();
    expect(slotClick).not.toHaveBeenCalled();
  });

  it("renders onto a child that arrives as a lazy server reference", async () => {
    await act(async () => {
      render(
        <Suspense>
          <Slot className="slotted">{lazyChild(<a href="/docs">Docs</a>)}</Slot>
        </Suspense>,
      );
    });

    expect(await screen.findByRole("link", { name: "Docs" })).toHaveClass("slotted");
  });
});
