import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { BlurText } from "./blur-text";

const segments = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[aria-hidden="true"] .animate-blur-text-in')];

describe("BlurText", () => {
  it("falls back to code points when Intl.Segmenter is unavailable", () => {
    vi.stubGlobal("Intl", Object.create(Intl, { Segmenter: { value: undefined } }));
    try {
      const { container } = render(<BlurText>😀a</BlurText>);
      expect(segments(container).map((segment) => segment.textContent)).toEqual(["😀", "a"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("animates combined emoji, flags, and accented letters as whole characters", () => {
    const text = "👨‍👩‍👧‍👦🇭🇺e\u0301";
    const { container } = render(<BlurText>{text}</BlurText>);

    expect(segments(container).map((segment) => segment.textContent)).toEqual(["👨‍👩‍👧‍👦", "🇭🇺", "e\u0301"]);
    expect(segments(container).map((segment) => segment.style.animationDelay)).toEqual(["0ms", "150ms", "300ms"]);
    expect(container.querySelector(".sr-only")).toHaveTextContent(text);
  });

  it("animates each letter in order, spreading the starts across 300ms by default", () => {
    const { container } = render(<BlurText>Hi you</BlurText>);
    const letters = segments(container);

    expect(letters.map((letter) => letter.textContent)).toEqual(["H", "i", "y", "o", "u"]);
    expect(letters.map((letter) => letter.style.animationDelay)).toEqual([
      "0ms",
      "75ms",
      "150ms",
      "225ms",
      "300ms",
    ]);
  });

  it("keeps each word's letters together so a line never breaks mid-word", () => {
    const { container } = render(<BlurText>{"Base UI rocks"}</BlurText>);
    const words = [...container.querySelectorAll('[aria-hidden="true"] > .whitespace-nowrap')];

    // The no-break space is not a split point, so "Base UI" is one unbreakable word.
    expect(words.map((word) => word.textContent)).toEqual(["Base UI", "rocks"]);
  });

  it("animates whole words with a start delay and explicit stagger", () => {
    const { container } = render(
      <BlurText by="word" delay={100} stagger={50}>
        One two three
      </BlurText>,
    );
    const words = segments(container);

    expect(words.map((word) => word.textContent)).toEqual(["One", "two", "three"]);
    expect(words.map((word) => word.style.animationDelay)).toEqual(["100ms", "150ms", "200ms"]);
  });

  it("renders the requested element with the full text readable once", () => {
    render(
      <BlurText as="h1" className="text-4xl">
        Minimal components
      </BlurText>,
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Minimal components" });
    expect(heading).toHaveAttribute("data-slot", "blur-text");
    expect(heading).toHaveAttribute("data-by", "character");
    expect(heading).toHaveClass("text-4xl");
    expect(screen.getAllByText("Minimal components")).toHaveLength(1);
  });
});
