import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { DocsCodeBlock, DocsCodePre } from "./docs-code-block";

it("copies only its own snippet and omits non-copyable annotations", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(
    <>
      <DocsCodePre><code>First snippet</code></DocsCodePre>
      <DocsCodeBlock title="example.ts">
        <pre><code>Second<span className="nd-copy-ignore">Annotation</span>snippet</code></pre>
      </DocsCodeBlock>
    </>,
  );

  const copyButton = screen.getAllByRole("button", { name: "Copy" }).at(1);
  expect(copyButton).toBeDefined();
  await userEvent.click(copyButton!);
  await waitFor(() => expect(writeText).toHaveBeenCalledWith("Second\nsnippet"));
  expect(screen.getByText("Annotation")).toBeInTheDocument();
});

it("honors code blocks that disable copying", () => {
  render(
    <DocsCodeBlock allowCopy="false">
      <pre><code>No copy control</code></pre>
    </DocsCodeBlock>,
  );
  expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
});
