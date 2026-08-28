import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CopyButton } from "./copy-button";

/** Records every `data-status` the button passes through, in order. */
function trackStatus(button: HTMLElement) {
  const seen: string[] = [button.getAttribute("data-status") ?? "none"];
  const observer = new MutationObserver(() => {
    const status = button.getAttribute("data-status");
    if (status && seen.at(-1) !== status) seen.push(status);
  });
  observer.observe(button, { attributes: true, attributeFilter: ["data-status"] });
  return () => {
    observer.disconnect();
    return seen;
  };
}

describe("CopyButton", () => {
  it("applies an explicit size to the labelled button", () => {
    render(
      <CopyButton value="hello" size="lg">
        Copy
      </CopyButton>,
    );

    const button = screen.getByRole("button", { name: "Copy" });
    expect(button).toHaveAttribute("data-size", "lg");
    expect(button).toHaveClass("h-[38px]", "px-5");
  });

  it("maps an explicit size to the corresponding square icon button", () => {
    render(<CopyButton value="hello" size="sm" />);

    const button = screen.getByRole("button", { name: "Copy" });
    expect(button).toHaveAttribute("data-size", "icon-sm");
    expect(button).toHaveClass("size-[30px]");
  });

  it("uses the 24px xs geometry for both labelled and icon-only buttons", () => {
    render(
      <>
        <CopyButton value="hello" size="xs">
          Copy
        </CopyButton>
        <CopyButton value="hello" size="xs" />
      </>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("data-size", "xs");
    expect(buttons[0]).toHaveClass("h-6", "px-2.5");
    expect(buttons[1]).toHaveAttribute("data-size", "icon-xs");
    expect(buttons[1]).toHaveClass("size-6");
  });

  it("uses the standard action-button icon-label gap", () => {
    render(<CopyButton value="hello">Copy</CopyButton>);

    const content = screen
      .getByRole("button", { name: "Copy" })
      .querySelector('[data-slot="action-button-content"]');

    expect(content).toHaveClass("gap-[inherit]");
    expect(content?.firstElementChild).toHaveClass("gap-[inherit]");
  });

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

  it("resolves a lazy value at press time, not on render", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const value = vi.fn().mockReturnValue("assembled");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CopyButton value={value}>Copy</CopyButton>);

    // Rendering must not do the work — that is the whole point of the function form.
    expect(value).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(value).toHaveBeenCalledOnce();
      expect(writeText).toHaveBeenCalledWith("assembled");
    });
  });

  it("awaits an async value and reports the resolved text to onCopy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const onCopy = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <CopyButton value={async () => "fetched"} onCopy={onCopy}>
        Copy
      </CopyButton>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("fetched");
      expect(onCopy).toHaveBeenCalledWith("fetched");
    });
  });

  it("never shows pending for a copy that was instant", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CopyButton value={() => "instant"}>Copy</CopyButton>);
    const button = screen.getByRole("button", { name: "Copy" });
    const seen = trackStatus(button);

    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute("data-status", "success"));

    // A spinner that appears and vanishes inside a frame reads as a glitch.
    expect(seen()).toEqual(["idle", "success"]);
  });

  it("shows pending promptly when the value actually has to wait", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <CopyButton
        value={async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          return "fetched";
        }}
      >
        Copy
      </CopyButton>,
    );
    const button = screen.getByRole("button", { name: "Copy" });
    const seen = trackStatus(button);

    await userEvent.click(button);

    // Well before the value resolves — the press has to be answered, not deferred until
    // after the press animation has settled.
    await waitFor(() => expect(button).toHaveAttribute("data-status", "pending"), {
      timeout: 100,
    });
    await waitFor(() => expect(button).toHaveAttribute("data-status", "success"));
    expect(seen()).toEqual(["idle", "pending", "success"]);
  });

  it("fails without copying when a lazy value rejects", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const onCopy = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <CopyButton
        value={() => Promise.reject(new Error("could not assemble"))}
        onCopy={onCopy}
      >
        Copy
      </CopyButton>,
    );

    const button = screen.getByRole("button", { name: "Copy" });
    await userEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute("data-status", "error");
    });
    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
  });
});
