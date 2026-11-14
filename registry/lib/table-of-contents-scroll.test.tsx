import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCenterActiveTableOfContentsItem,
  useTableOfContentsEdgeFade,
} from "./table-of-contents-scroll";

const ITEMS = [{ id: "first" }, { id: "second" }, { id: "third" }];

const ROWS = ["first", "second", "third", "fourth"];

function ScrollHarness({
  initialActiveId = "first",
}: {
  initialActiveId?: string | readonly string[];
}) {
  const navRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState(initialActiveId);
  useCenterActiveTableOfContentsItem(navRef, activeId, ITEMS);

  return (
    <>
      <button type="button" onClick={() => setActiveId("first")}>
        Activate first
      </button>
      <button type="button" onClick={() => setActiveId("second")}>
        Activate second
      </button>
      <button type="button" onClick={() => setActiveId(["second", "third"])}>
        Activate second and third
      </button>
      <nav ref={navRef} aria-label="Contents">
        <ul>
          {ROWS.map((id) => (
            <li key={id} data-toc-id={id}>
              {id}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

function EdgeFadeHarness() {
  const navRef = useRef<HTMLElement>(null);
  const edges = useTableOfContentsEdgeFade(navRef, ITEMS);

  return (
    <nav ref={navRef} aria-label="Fade contents" data-top={edges.top} data-bottom={edges.bottom}>
      <ul>
        {ITEMS.map((item) => (
          <li key={item.id} data-toc-id={item.id}>
            {item.id}
          </li>
        ))}
      </ul>
    </nav>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useCenterActiveTableOfContentsItem", () => {
  it("centers a newly active entry inside a constrained contents viewport", () => {
    const { container } = render(<ScrollHarness />);
    const nav = screen.getByRole("navigation", { name: "Contents" });
    const rows = container.querySelectorAll<HTMLElement>("[data-toc-id]");

    Object.defineProperties(nav, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 1_000 },
    });
    vi.spyOn(nav, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(rows[0]!, "getBoundingClientRect").mockReturnValue({ top: 0, height: 20 } as DOMRect);
    vi.spyOn(rows[1]!, "getBoundingClientRect").mockReturnValue({ top: 150, height: 20 } as DOMRect);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));

    fireEvent.click(screen.getByRole("button", { name: "Activate second" }));

    expect(nav.scrollTop).toBe(110);
  });

  it("centres a whole highlighted range rather than its first row", () => {
    const { container } = render(<ScrollHarness />);
    const nav = screen.getByRole("navigation", { name: "Contents" });
    const rows = container.querySelectorAll<HTMLElement>("[data-toc-id]");

    Object.defineProperties(nav, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 1_000 },
    });
    vi.spyOn(nav, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(rows[1]!, "getBoundingClientRect").mockReturnValue({ top: 150, height: 20 } as DOMRect);
    vi.spyOn(rows[2]!, "getBoundingClientRect").mockReturnValue({ top: 170, height: 20 } as DOMRect);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));

    fireEvent.click(screen.getByRole("button", { name: "Activate second and third" }));

    // The range runs 150–190, so its middle (170) lands on the viewport's (50).
    expect(nav.scrollTop).toBe(120);
  });

  it("returns the rail to its start when the first document section becomes active", () => {
    const { container } = render(<ScrollHarness initialActiveId="second" />);
    const nav = screen.getByRole("navigation", { name: "Contents" });
    const rows = container.querySelectorAll<HTMLElement>("[data-toc-id]");

    Object.defineProperties(nav, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 1_000 },
    });
    nav.scrollTop = 900;
    vi.spyOn(nav, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(rows[0]!, "getBoundingClientRect").mockReturnValue({ top: -900, height: 20 } as DOMRect);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));

    fireEvent.click(screen.getByRole("button", { name: "Activate first" }));

    expect(nav.scrollTop).toBe(0);
  });

  it("finishes a smooth adjustment when the browser rounds every scrollTop write", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((frame) => {
      frames.push(frame);
      return frames.length;
    });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));

    const { container } = render(<ScrollHarness />);
    const nav = screen.getByRole("navigation", { name: "Contents" });
    const rows = container.querySelectorAll<HTMLElement>("[data-toc-id]");
    let scrollTop = 47;
    Object.defineProperties(nav, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 1_000 },
      scrollTop: {
        configurable: true,
        get: () => scrollTop,
        set: (value: number) => {
          scrollTop = Math.round(value);
        },
      },
    });
    vi.spyOn(nav, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(rows[1]!, "getBoundingClientRect").mockReturnValue({ top: 49, height: 20 } as DOMRect);

    fireEvent.click(screen.getByRole("button", { name: "Activate second" }));

    const startedAt = performance.now();
    for (let index = 1; index <= 200; index += 1) {
      const frame = frames.shift();
      if (!frame) break;
      act(() => frame(startedAt + index * 4));
    }

    expect(nav.scrollTop).toBe(56);
  });
});

describe("useTableOfContentsEdgeFade", () => {
  it("reports only the edges with content past them", () => {
    render(<EdgeFadeHarness />);
    const nav = screen.getByRole("navigation", { name: "Fade contents" });
    Object.defineProperties(nav, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
    });

    fireEvent.scroll(nav);
    expect(nav).toHaveAttribute("data-top", "false");
    expect(nav).toHaveAttribute("data-bottom", "true");

    nav.scrollTop = 200;
    fireEvent.scroll(nav);
    expect(nav).toHaveAttribute("data-top", "true");
    expect(nav).toHaveAttribute("data-bottom", "false");
  });
});
