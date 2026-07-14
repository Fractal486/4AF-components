import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CopyButton } from "./copy-button";

describe("CopyButton", () => {
  it("composes onCopy with the inherited onSuccess callback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const onCopy = vi.fn();
    const onSuccess = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <CopyButton value="hello" onCopy={onCopy} onSuccess={onSuccess}>
        Copy
      </CopyButton>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("hello");
      expect(onCopy).toHaveBeenCalledWith("hello");
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });
});
