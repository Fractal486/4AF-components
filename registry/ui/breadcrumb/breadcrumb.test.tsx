import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { vi } from "vitest";
import {
  Breadcrumb,
  BreadcrumbCollapse,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

function Trail({
  collapse,
}: {
  collapse?: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void };
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {collapse ? (
          <BreadcrumbCollapse {...collapse}>
            <BreadcrumbItem>
              <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/docs/components">Components</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </BreadcrumbCollapse>
        ) : null}
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

describe("Breadcrumb", () => {
  it("is a labelled nav landmark with an ordered list and the current page marked", () => {
    render(<Trail />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav.querySelector("ol")).toHaveAttribute("data-size", "md");
    expect(screen.getByText("Breadcrumb")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("hides separators from assistive technology", () => {
    const { container } = render(<Trail />);
    const separator = container.querySelector('[data-slot="breadcrumb-separator"]')!;
    expect(separator).toHaveAttribute("aria-hidden", "true");
    expect(separator).toHaveAttribute("role", "presentation");
    expect(separator.querySelector("svg")).not.toBeNull();
  });

  it("renders a link's styles onto its child with asChild", () => {
    render(
      <BreadcrumbLink asChild className="extra">
        <a href="/x" data-testid="child">
          X
        </a>
      </BreadcrumbLink>,
    );
    const child = screen.getByTestId("child");
    expect(child).toHaveAttribute("data-slot", "breadcrumb-link");
    expect(child).toHaveClass("extra", "rounded-[4px]");
  });

  it("is decorative alone, and interactive with dots filled in when rendered onto a button", () => {
    const { container } = render(
      <>
        <BreadcrumbEllipsis />
        <BreadcrumbEllipsis asChild>
          <button type="button" aria-label="More crumbs" />
        </BreadcrumbEllipsis>
      </>,
    );
    expect(container.querySelector("span[data-slot=breadcrumb-ellipsis]")).toHaveAttribute("aria-hidden", "true");
    const button = screen.getByRole("button", { name: "More crumbs" });
    expect(button).toHaveAttribute("data-slot", "breadcrumb-ellipsis");
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("sizes the trail from the list", () => {
    const { container } = render(
      <BreadcrumbList size="sm">
        <BreadcrumbItem>One</BreadcrumbItem>
      </BreadcrumbList>,
    );
    const list = container.querySelector("ol")!;
    expect(list).toHaveAttribute("data-size", "sm");
    expect(list).toHaveClass("text-xs", "gap-1");
  });

  const parts = [Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis]
    .map((Part) => ({ name: Part.name, Part }));

  it.each(parts)("$name supports render with merged props, handlers, and refs", async ({ Part }) => {
    const user = userEvent.setup();
    const partRef = vi.fn();
    const buttonRef = createRef<HTMLButtonElement>();
    const partClick = vi.fn();
    const buttonClick = vi.fn();
    const { container } = render(
      <Part ref={partRef} className="part" onClick={partClick} title="Details"
        render={<button ref={buttonRef} type="button" className="replacement" onClick={buttonClick} />}>
        Details
      </Part>,
    );
    const button = container.querySelector("button")!;
    expect(container.firstElementChild).toBe(button);
    expect(partRef).toHaveBeenCalledWith(button);
    expect(buttonRef.current).toBe(button);
    expect(button).toHaveClass("part", "replacement");
    expect(button).toHaveAttribute("data-slot");
    expect(button).toHaveAttribute("title", "Details");
    await user.click(button);
    expect(partClick).toHaveBeenCalledOnce();
    expect(buttonClick).toHaveBeenCalledOnce();
  });

  it.each(parts)("$name supports asChild and gives it precedence over render", ({ Part }) => {
    const partRef = vi.fn();
    const childRef = createRef<HTMLDivElement>();
    const { container } = render(
      <Part asChild ref={partRef} render={<aside />} className="part">
        <div ref={childRef} className="child">Content</div>
      </Part>,
    );
    const child = container.firstElementChild!;
    expect(child.tagName).toBe("DIV");
    expect(child).toHaveTextContent("Content");
    expect(child).toHaveClass("part", "child");
    expect(child).toHaveAttribute("data-slot");
    expect(child).not.toHaveAttribute("asChild");
    expect(partRef).toHaveBeenCalledWith(child);
    expect(childRef.current).toBe(child);
  });

  it("supports render functions and retains collapse attributes on custom list items", () => {
    render(
      <Breadcrumb render={(props) => <nav {...props} aria-label="Location" />}>
        <BreadcrumbList render={<ol aria-label="Path" />}>
          <BreadcrumbCollapse>
            <BreadcrumbItem render={<li title="Hidden" />}><BreadcrumbLink href="/docs">Docs</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator render={<li title="Separator" />} />
          </BreadcrumbCollapse>
          <BreadcrumbItem><BreadcrumbPage render={<strong />}>Current</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByRole("navigation", { name: "Location" })).toContainElement(screen.getByRole("list", { name: "Path" }));
    expect(screen.getByTitle("Hidden")).toHaveAttribute("data-collapsed");
    expect(screen.getByTitle("Separator")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Current").tagName).toBe("STRONG");
    expect(screen.getByText("Current")).toHaveAttribute("aria-current", "page");
  });
});

function mockAnimations() {
  const pending: { target: Element; finish: () => void; cancel: ReturnType<typeof vi.fn> }[] = [];
  const original = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
  const animate = vi.fn(function (this: Element) {
    const { promise: finished, resolve, reject } = Promise.withResolvers<void>();
    const cancel = vi.fn(() => reject(new DOMException("Canceled", "AbortError")));
    pending.push({ target: this, finish: () => resolve(), cancel });
    return { finished, cancel };
  });
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
  return {
    pending,
    animate,
    async finish() {
      await act(async () => { pending.filter(({ cancel }) => !cancel.mock.calls.length).forEach(({ finish }) => finish()); });
    },
    restore() {
      if (original) Object.defineProperty(Element.prototype, "animate", original);
      else Reflect.deleteProperty(Element.prototype, "animate");
    },
  };
}

describe("BreadcrumbCollapse animation lifecycle", () => {
  let animations: ReturnType<typeof mockAnimations>;
  beforeEach(() => { animations = mockAnimations(); });
  afterEach(() => { animations.restore(); vi.restoreAllMocks(); });

  it("keeps outgoing crumbs until exit finishes and transfers focus only after each animation", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Trail collapse={{ open: false }} />);
    const trigger = screen.getByRole("button", { name: "Show full path" });
    await user.click(trigger);
    rerender(<Trail collapse={{ open: true }} />);
    expect(trigger).toHaveFocus();
    expect(trigger.parentElement).not.toHaveAttribute("data-collapsed");
    expect(trigger.parentElement).toHaveAttribute("data-transitioning");
    await animations.finish();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
    expect(trigger.parentElement).toHaveAttribute("data-collapsed");

    rerender(<Trail collapse={{ open: false }} />);
    expect(container.querySelectorAll("[data-breadcrumb-group][data-collapsed]")).toHaveLength(0);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
    await animations.finish();
    expect(container.querySelectorAll("[data-breadcrumb-group][data-collapsed]")).toHaveLength(4);
    expect(trigger).toHaveFocus();
    expect(trigger.parentElement).not.toHaveAttribute("data-transitioning");
  });

  it("does not steal focus when the user leaves the trail during an animation", async () => {
    const user = userEvent.setup();
    render(<><Trail collapse={{}} /><button>Elsewhere</button></>);
    await user.click(screen.getByRole("button", { name: "Show full path" }));
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    await animations.finish();
    expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
  });

  it("ignores canceled animation completions when direction reverses", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Trail collapse={{ open: false }} />);
    const trigger = screen.getByRole("button", { name: "Show full path" });
    await user.click(trigger);
    rerender(<Trail collapse={{ open: true }} />);
    const firstRun = [...animations.pending];
    rerender(<Trail collapse={{ open: false }} />);
    await act(async () => { firstRun.forEach(({ finish }) => finish()); });
    expect(firstRun.every(({ cancel }) => cancel.mock.calls.length === 1)).toBe(true);
    expect(trigger.parentElement).toHaveAttribute("data-transitioning");
    expect(trigger).toHaveFocus();
    await animations.finish();
    expect(trigger.parentElement).not.toHaveAttribute("data-transitioning");
    expect(trigger.parentElement).toHaveAttribute("data-state", "closed");
    expect(trigger).toHaveFocus();
  });

  it("skips animation and focuses immediately under reduced motion", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ matches: true, media: query }) as MediaQueryList);
    const user = userEvent.setup();
    render(<Trail collapse={{}} />);
    await user.click(screen.getByRole("button", { name: "Show full path" }));
    expect(animations.animate).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
  });

  it("restores caller inline styles after settling and cancels pending work on unmount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Trail collapse={{}} />);
    const item = screen.getByRole("link", { name: "Docs" }).parentElement!;
    item.style.whiteSpace = "pre-wrap";
    item.style.overflow = "visible";
    await user.click(screen.getByRole("button", { name: "Show full path" }));
    expect(item.style.whiteSpace).toBe("nowrap");
    await animations.finish();
    expect(item.style.whiteSpace).toBe("pre-wrap");
    expect(item.style.overflow).toBe("visible");
    expect(item.style.flexShrink).toBe("");
    unmount();

    const next = render(<Trail collapse={{}} />);
    await user.click(screen.getByRole("button", { name: "Show full path" }));
    const running = animations.pending.filter(({ cancel }) => !cancel.mock.calls.length);
    next.unmount();
    expect(running.every(({ cancel }) => cancel.mock.calls.length === 1)).toBe(true);
    await animations.finish();
  });
});

describe("BreadcrumbCollapse", () => {
  it("hides the group behind an ellipsis until pressed, then moves focus to the first revealed crumb", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(<Trail collapse={{ onOpenChange }} />);

    const hidden = container.querySelectorAll("[data-breadcrumb-group][data-collapsed]");
    // Two crumbs and two separators.
    expect(hidden).toHaveLength(4);

    const trigger = screen.getByRole("button", { name: "Show full path" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector('[data-slot="breadcrumb-collapse"]')).toHaveAttribute("data-state", "closed");

    await user.click(trigger);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(container.querySelectorAll("[data-breadcrumb-group][data-collapsed]")).toHaveLength(0);
    const collapse = container.querySelector('[data-slot="breadcrumb-collapse"]')!;
    expect(collapse).toHaveAttribute("data-state", "open");
    expect(collapse).toHaveAttribute("data-collapsed", "");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
  });

  it("follows a controlled open state", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Trail collapse={{ open, onOpenChange: setOpen }} />
          <button type="button" onClick={() => setOpen(false)}>
            Collapse again
          </button>
        </>
      );
    }

    const { container } = render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Show full path" }));
    expect(container.querySelectorAll("[data-breadcrumb-group][data-collapsed]")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Collapse again" }));
    expect(container.querySelectorAll("[data-breadcrumb-group][data-collapsed]")).toHaveLength(4);
    expect(container.querySelector('[data-slot="breadcrumb-collapse"]')).toHaveAttribute("data-state", "closed");
  });

  it("can start open", () => {
    const { container } = render(<Trail collapse={{ defaultOpen: true }} />);
    expect(container.querySelectorAll("[data-breadcrumb-group][data-collapsed]")).toHaveLength(0);
    expect(container.querySelector('[data-slot="breadcrumb-collapse"]')).toHaveAttribute("data-collapsed", "");
  });
});
