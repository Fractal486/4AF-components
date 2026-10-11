import { fireEvent, render, screen } from "@testing-library/react";
import { act, Suspense, type ReactElement } from "react";
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
