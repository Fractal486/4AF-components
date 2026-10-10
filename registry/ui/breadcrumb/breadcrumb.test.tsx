import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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
