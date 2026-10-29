import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { InstallCommand } from "./install-command";

afterEach(() => vi.useRealTimers());

const command = (container: HTMLElement) => container.querySelector("button")?.textContent;
const url = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="install-command-url"]')!;

describe("InstallCommand", () => {
  it("swaps the whole URL, keeping only the visible one in the command text", () => {
    vi.useFakeTimers();
    const { container } = render(<InstallCommand names={["button", "dialog"]} />);
    expect(command(container)).toBe("npx shadcn@latest add https://4af.selfsimilar.dev/r/button.json");
    // Nothing to leave on first paint, so nothing animates.
    expect(url(container)).not.toHaveAttribute("data-previous");

    act(() => vi.advanceTimersByTime(2400));
    expect(command(container)).toBe("npx shadcn@latest add https://4af.selfsimilar.dev/r/dialog.json");
    // The outgoing URL is generated content, so a copy mid-swap never holds both.
    expect(url(container)).toHaveAttribute(
      "data-previous",
      "https://4af.selfsimilar.dev/r/button.json",
    );
  });

  it("copies the command on screen when clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const { container } = render(<InstallCommand names={["button", "dialog"]} />);

    await act(async () => fireEvent.click(container.querySelector("button")!));
    expect(writeText).toHaveBeenCalledWith("npx shadcn@latest add https://4af.selfsimilar.dev/r/button.json");
  });

  it("holds the current URL while the pointer is on the block", () => {
    vi.useFakeTimers();
    const { container } = render(<InstallCommand names={["button", "dialog"]} />);

    fireEvent.pointerEnter(container.firstElementChild!);
    act(() => vi.advanceTimersByTime(5000));
    expect(command(container)).toContain("/r/button.json");

    fireEvent.pointerLeave(container.firstElementChild!);
    act(() => vi.advanceTimersByTime(2400));
    expect(command(container)).toContain("/r/dialog.json");
  });
});
