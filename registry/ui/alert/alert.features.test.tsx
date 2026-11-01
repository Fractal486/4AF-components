import { createRef, useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Alert, AlertTitle, AlertDescription, AlertClose } from "./alert";

// jsdom has no layout. Keep tabbable's visibility/disabled/inert checks, supplying only geometry.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (this: HTMLElement) {
    return (this.closest("[hidden]") ? [] : [{}]) as unknown as DOMRectList;
  });
});
afterEach(() => vi.restoreAllMocks());

it("composes title-only, description-only and a heading without extra root wrappers", () => {
  const ref = createRef<HTMLDivElement>();
  const titleRef = createRef<HTMLHeadingElement>();
  const { container, rerender } = render(<Alert ref={ref} render={<section />} variant="info">
    <AlertTitle render={<h3 />} ref={titleRef}>Saved</AlertTitle>
    <AlertDescription><p>Your <a href="#settings">settings</a> are up to date.</p></AlertDescription>
    <AlertClose />
  </Alert>);
  expect(ref.current).toBe(container.firstElementChild);
  expect(ref.current?.tagName).toBe("SECTION");
  expect(titleRef.current).toBe(screen.getByRole("heading", { name: "Saved", level: 3 }));
  expect(screen.getByRole("button", { name: "Dismiss" })).not.toHaveAttribute("aria-expanded");
  rerender(<Alert><AlertTitle>Title alone</AlertTitle></Alert>);
  expect(screen.getByRole("alert")).toHaveTextContent("Title alone");
  rerender(<Alert><AlertDescription>Description alone</AlertDescription></Alert>);
  expect(screen.getByRole("alert")).toHaveTextContent("Description alone");
});

it("supports custom and absent icons, including a custom loading icon", () => {
  const { container, rerender } = render(<Alert variant="loading" icon={<span data-testid="custom" />}>Waiting</Alert>);
  expect(screen.getByTestId("custom").parentElement).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector('[data-slot="classic-loader"]')).toBeNull();
  for (const icon of [null, false]) {
    rerender(<Alert icon={icon}>Message</Alert>);
    expect(container.querySelector('[data-slot="alert-glyph"]')).toBeNull();
  }
});

it("dismisses by keyboard, skips hidden and disabled controls, and focuses the next available control", async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  render(<><button>Before</button><Alert onOpenChange={changed}>
    <AlertDescription>Message</AlertDescription><AlertClose />
  </Alert><button disabled>Disabled</button><div hidden><button>Hidden</button></div><button>After</button></>);
  screen.getByRole("button", { name: "Dismiss" }).focus();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(changed).toHaveBeenCalledWith(false, expect.any(Object));
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
});

it("falls back to the previous control or the body", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<><button>Before</button><Alert>Message<AlertClose /></Alert></>);
  await user.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
  unmount();
  render(<Alert>Message<AlertClose /></Alert>);
  await user.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(document.body).toHaveFocus();
  expect(document.body).not.toHaveAttribute("tabindex");
});

it("can cancel from the close handler or the visibility callback", async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  const { rerender } = render(<Alert onOpenChange={changed}>Message<AlertClose onClick={(event) => event.preventDefault()} /></Alert>);
  await user.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.getByRole("button", { name: "Dismiss" })).toHaveFocus();
  rerender(<Alert onOpenChange={(_, details) => details.cancel()}>Message<AlertClose /></Alert>);
  await user.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.getByRole("button", { name: "Dismiss" })).toHaveFocus();
});

it("waits for the controlled owner and also moves focus on external closure", async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  const view = (open: boolean) => <><Alert open={open} onOpenChange={changed}>Message<AlertClose /></Alert><button>After</button></>;
  const { rerender } = render(view(true));
  await user.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(changed).toHaveBeenCalledWith(false, expect.any(Object));
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.getByRole("button", { name: "Dismiss" })).toHaveFocus();
  rerender(view(false));
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  rerender(view(true));
  expect(screen.getByRole("alert")).toBeVisible();
  screen.getByRole("button", { name: "After" }).focus();
  rerender(view(false));
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
});

it("starts hidden and supports controlled reopening and state-based rendering", async () => {
  let setOpen!: (open: boolean) => void;
  function Controlled() {
    const [open, update] = useState(false);
    setOpen = update;
    return <Alert open={open} onOpenChange={update} className={(state) => state.open ? "visible-alert" : "hidden-alert"}
      render={(props, state) => <section {...props} data-test-open={state.open} />}>
      Message<AlertClose nativeButton={false} render={<span />} />
    </Alert>;
  }
  const { unmount } = render(<Alert defaultOpen={false}>Hidden</Alert>);
  expect(screen.queryByRole("alert")).toBeNull();
  unmount();
  render(<Controlled />);
  expect(screen.queryByRole("alert")).toBeNull();
  act(() => setOpen(true));
  expect(screen.getByRole("alert")).toHaveClass("visible-alert");
  expect(screen.getByRole("alert")).toHaveAttribute("data-test-open", "true");
  const user = userEvent.setup();
  screen.getByRole("button", { name: "Dismiss" }).focus();
  await user.keyboard(" ");
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});
