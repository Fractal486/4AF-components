import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { DocsHeading } from "./docs-heading";

it("copies the current page's section URL and keeps the heading anchor", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(<DocsHeading id="press-behavior">Press behavior</DocsHeading>);

  expect(screen.getByRole("link", { name: "Press behavior" })).toHaveAttribute("href", "#press-behavior");
  expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "press-behavior");
  await userEvent.click(screen.getByRole("button", { name: "Copy section link" }));
  const expected = new URL(window.location.href);
  expected.hash = "press-behavior";
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(expected.href));
});

it("renders headings without ids without a copy control", () => {
  render(<DocsHeading as="h3">Notes</DocsHeading>);
  expect(screen.getByRole("heading", { name: "Notes", level: 3 })).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
