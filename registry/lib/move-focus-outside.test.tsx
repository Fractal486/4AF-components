import { render, screen } from "@testing-library/react";
import { moveFocusOutside } from "./move-focus-outside";

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (this: HTMLElement) {
    return (this.closest("[hidden]") ? [] : [{}]) as unknown as DOMRectList;
  });
});
afterEach(() => vi.restoreAllMocks());

it("skips hidden, disabled and inert controls when moving to the next control", () => {
  render(<><button>Before</button><section data-testid="closing"><button>Dismiss</button></section>
    <button disabled>Disabled</button><div hidden><button>Hidden</button></div>
    <div inert><button>Inert</button></div><button>After</button></>);
  screen.getByText("Dismiss").focus();
  moveFocusOutside(screen.getByTestId("closing"));
  expect(screen.getByText("After")).toHaveFocus();
});

it("prefers related controls even when another control is closer", () => {
  render(<><button data-related>Previous tag</button><section data-testid="closing"><button>Dismiss</button></section>
    <button>Unrelated</button><button data-related>Next tag</button></>);
  screen.getByText("Dismiss").focus();
  moveFocusOutside(screen.getByTestId("closing"), { prefer: node => node.hasAttribute("data-related") });
  expect(screen.getByText("Next tag")).toHaveFocus();
});

it("falls back to the previous control when there is no next or preferred control", () => {
  render(<><button>Before</button><section data-testid="closing"><button>Dismiss</button></section></>);
  screen.getByText("Dismiss").focus();
  moveFocusOutside(screen.getByTestId("closing"), { prefer: () => false });
  expect(screen.getByText("Before")).toHaveFocus();
});

it.each([null, "0"])("preserves the body's existing tabindex (%s) on fallback", (tabIndex) => {
  const original = document.body.getAttribute("tabindex");
  if (tabIndex !== null) document.body.setAttribute("tabindex", tabIndex);
  try {
    render(<section data-testid="closing"><button>Dismiss</button></section>);
    screen.getByText("Dismiss").focus();
    moveFocusOutside(screen.getByTestId("closing"));
    expect(document.body).toHaveFocus();
    expect(document.body.getAttribute("tabindex")).toBe(tabIndex);
  } finally {
    if (original === null) document.body.removeAttribute("tabindex");
    else document.body.setAttribute("tabindex", original);
  }
});

it("restores a retained exit from body only when asked, without stealing moved focus", () => {
  render(<><section data-testid="closing"><button>Dismiss</button></section><button>After</button><button>Chosen</button></>);
  const closing = screen.getByTestId("closing");
  screen.getByText("Dismiss").focus();
  screen.getByText("Dismiss").blur();
  moveFocusOutside(closing);
  expect(document.body).toHaveFocus();
  moveFocusOutside(closing, { restoreFromBody: true });
  expect(screen.getByText("After")).toHaveFocus();
  screen.getByText("Chosen").focus();
  moveFocusOutside(closing, { restoreFromBody: true });
  expect(screen.getByText("Chosen")).toHaveFocus();
});
