import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrambleText } from "./scramble-text";

afterEach(() => {
  vi.useRealTimers();
});

describe("ScrambleText", () => {
  it("reveals the complete string over its configured interval", () => {
    vi.useFakeTimers();
    const { container } = render(
      <ScrambleText intervalMs={10}>Launch sequence</ScrambleText>,
    );
    const visibleText = () =>
      container.querySelector('[aria-hidden="true"]')?.textContent;

    expect(visibleText()).not.toBe("Launch sequence");
    expect(visibleText()).toContain(" ");

    act(() => vi.advanceTimersByTime(10 * 48));

    expect(visibleText()).toBe("Launch sequence");
  });

  it("shows the final text immediately when animation is disabled", () => {
    const { container } = render(
      <ScrambleText intervalMs={0}>Reduced motion</ScrambleText>,
    );

    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      "Reduced motion",
    );
  });

  it("shows the final text when reduced motion is preferred", () => {
    const originalMatchMedia = window.matchMedia;
    const reducedMotionMatchMedia = (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: reducedMotionMatchMedia,
    });

    try {
      render(<ScrambleText>Reduced motion</ScrambleText>);

      expect(document.querySelector('[aria-hidden="true"]')).toHaveTextContent(
        "Reduced motion",
      );
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it("keeps the complete text available to assistive technology", () => {
    const { container } = render(<ScrambleText>Accessible text</ScrambleText>);

    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      "Accessible text",
    );
  });
});
