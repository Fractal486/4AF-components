import { act, render, screen } from "@testing-library/react";
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

beforeEach(() => {
  reduced = false;
  media = new EventTarget() as MediaQueryList;
  Object.defineProperty(media, "matches", { get: () => reduced });
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((query) =>
    query === "(prefers-reduced-motion: reduce)" ? media : original(query),
  );
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("replaces the server-rendered film with the sheet after reduced-motion hydration", () => {
  reduced = true;
  const container = document.createElement("div");
  container.innerHTML = renderToString(<ComponentDrawing {...drawing} />);
  expect(container.querySelector("video")).not.toBeNull();
  document.body.append(container);

  render(<ComponentDrawing {...drawing} />, { container, hydrate: true });

  expect(screen.getByRole("img", { name: "Button dimensional drawing" })).toBeInTheDocument();
  expect(container.querySelector("video")).toBeNull();
});

it("switches between the film and static sheet as the device preference changes", () => {
  const { container } = render(<ComponentDrawing {...drawing} />);
  expect(container.querySelector("video")).toHaveAttribute("src", drawing.filmUrl);

  act(() => { reduced = true; media.dispatchEvent(new Event("change")); });
  expect(screen.getByRole("img", { name: "Button dimensional drawing" })).toBeInTheDocument();
  expect(container.querySelector("video")).toBeNull();

  act(() => { reduced = false; media.dispatchEvent(new Event("change")); });
  expect(container.querySelector("video")).toHaveAttribute("src", drawing.filmUrl);
  expect(screen.queryByRole("img", { name: "Button dimensional drawing" })).not.toBeInTheDocument();
});
