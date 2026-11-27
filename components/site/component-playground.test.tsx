import { act, fireEvent, render, screen } from "@testing-library/react";
import { ComponentPlayground } from "./component-playground";

vi.mock("@/stories/component-demo", () => ({
  DemoCanvas: () => null,
  DemoSettings: () => null,
  hasDemoSettings: () => false,
  useComponentDemo: () => ({ status: "ready" }),
}));

function renderPlayground() {
  return render(
    <ComponentPlayground
      title="Button"
      demos={[{ name: "button", label: "Button" }]}
      toc={[{ id: "api", title: "API" }]}
      installCommand="install button"
      markdownUrl="/docs/button.md"
    >
      <h2 id="api">API</h2>
    </ComponentPlayground>,
  );
}

let desktop: boolean;
let media: MediaQueryList;
const scrollIntoView = vi.fn();

beforeEach(() => {
  desktop = true;
  media = new EventTarget() as MediaQueryList;
  Object.defineProperty(media, "matches", { get: () => desktop });
  const matchMedia = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((query) =>
    query === "(min-width: 1024px)" ? media : matchMedia(query),
  );
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
  scrollIntoView.mockClear();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
  vi.restoreAllMocks();
});

it.each(["#demo", "#%64emo"])("opens the preview for a shared %s link", (hash) => {
  window.history.replaceState(null, "", hash);
  renderPlayground();
  expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true");
  expect(scrollIntoView.mock.contexts).toContain(document.getElementById("demo"));
});

it("scrolls to a linked heading and recovers from a malformed heading", () => {
  window.history.replaceState(null, "", "#%61pi");
  renderPlayground();
  expect(screen.getByRole("tab", { name: "Docs" })).toHaveAttribute("aria-selected", "true");
  expect(scrollIntoView.mock.contexts).toContain(document.getElementById("api"));

  act(() => {
    window.history.replaceState(null, "", "#api%");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
  expect(screen.getByRole("tab", { name: "Docs" })).toHaveAttribute("aria-selected", "true");
});

it("releases the fixed playground when the full-view control becomes unavailable", () => {
  const { container } = renderPlayground();
  fireEvent.click(screen.getByRole("button", { name: "Full view" }));
  const frame = container.querySelector("[data-view]")!;
  expect(frame).toHaveAttribute("data-expanded");
  act(() => {
    desktop = false;
    media.dispatchEvent(new Event("change"));
  });
  expect(frame).not.toHaveAttribute("data-expanded");
  expect(frame.firstElementChild).not.toHaveClass("fixed");
});
