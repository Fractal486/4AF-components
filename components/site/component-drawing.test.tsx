import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ComponentDrawing } from "./component-drawing";

const drawing = {
  title: "Button",
  svg: '<svg role="img" aria-label="Button dimensional drawing" viewBox="0 0 1700 1060"></svg>',
  sheetUrl: "/drawings/button.html",
  filmUrl: "/drawings/button-motion.mp4",
};

let reduced = false;
let media: MediaQueryList;
const intersections = new Map<Element, (visible: boolean) => void>();

beforeEach(() => {
  reduced = false;
  media = new EventTarget() as MediaQueryList;
  Object.defineProperty(media, "matches", { get: () => reduced });
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((query) =>
    query === "(prefers-reduced-motion: reduce)" ? media : original(query),
  );
  vi.stubGlobal("IntersectionObserver", class {
    private target?: Element;
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.target = target;
      intersections.set(target, (visible) => this.callback(
        [{ target, isIntersecting: visible } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ));
    }
    disconnect() {
      if (this.target) intersections.delete(this.target);
    }
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  intersections.clear();
});

it("replaces the server-rendered film with the sheet after reduced-motion hydration", () => {
  reduced = true;
  const container = document.createElement("div");
  container.innerHTML = renderToString(<ComponentDrawing {...drawing} />);
  expect(container.querySelector("video")).not.toHaveAttribute("src");
  document.body.append(container);

  render(<ComponentDrawing {...drawing} />, { container, hydrate: true });

  expect(screen.getByRole("img", { name: "Button dimensional drawing" })).toBeInTheDocument();
  expect(container.querySelector("video")).toBeNull();
});

it("attaches the film URL and plays only on first visibility, including after a source change", () => {
  const { container, rerender } = render(<ComponentDrawing {...drawing} />);
  const first = container.querySelector("video")!;
  expect(first).not.toHaveAttribute("src");
  intersections.get(first)!(false);
  expect(first).not.toHaveAttribute("src");
  expect(first.play).not.toHaveBeenCalled();
  intersections.get(first)!(true);
  expect(first).toHaveAttribute("src", drawing.filmUrl);
  expect(first.play).toHaveBeenCalledOnce();
  expect(intersections.has(first)).toBe(false);

  rerender(<ComponentDrawing {...drawing} filmUrl="/drawings/next.mp4" />);
  const next = container.querySelector("video")!;
  expect(next).not.toHaveAttribute("src");
  intersections.get(next)!(true);
  expect(next).toHaveAttribute("src", "/drawings/next.mp4");
});

it("switches between the film and static sheet as the device preference changes", () => {
  const { container } = render(<ComponentDrawing {...drawing} />);
  const initial = container.querySelector("video")!;
  expect(initial).not.toHaveAttribute("src");

  act(() => { reduced = true; media.dispatchEvent(new Event("change")); });
  expect(screen.getByRole("img", { name: "Button dimensional drawing" })).toBeInTheDocument();
  expect(container.querySelector("video")).toBeNull();

  act(() => { reduced = false; media.dispatchEvent(new Event("change")); });
  const restored = container.querySelector("video")!;
  expect(restored).not.toHaveAttribute("src");
  intersections.get(restored)!(true);
  expect(restored).toHaveAttribute("src", drawing.filmUrl);
  expect(screen.queryByRole("img", { name: "Button dimensional drawing" })).not.toBeInTheDocument();
});

it("keeps paint and use references local to the enlarged drawing", async () => {
  const svg = '<svg><style>.hatched{fill:url(#sheet-hatch)}</style><defs><pattern id="sheet-hatch"></pattern></defs><rect id="sheet-box" class="hatched"/><use href="#sheet-box"/></svg>';
  const { container } = render(<ComponentDrawing {...drawing} svg={svg} filmUrl={undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Open the Button drawing" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.querySelector("style")).toHaveTextContent("url(#dialog-sheet-hatch)");
  expect(dialog.querySelector("pattern")).toHaveAttribute("id", "dialog-sheet-hatch");
  expect(dialog.querySelector("use")).toHaveAttribute("href", "#dialog-sheet-box");
  expect(dialog.querySelector("rect")).toHaveAttribute("id", "dialog-sheet-box");
  expect(container.querySelector("use")).toHaveAttribute("href", "#sheet-box");
});
