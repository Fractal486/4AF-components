import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { vi } from "vitest";
import { TableOfContents } from "./table-of-contents";
import { TableOfContentsLines } from "../table-of-contents-lines/table-of-contents-lines";

vi.mock("@/registry/lib/table-of-contents-tracking", () => ({
  useTableOfContentsTracking: () => ({
    visibleIds: ["last"], currentId: "last", scrollVisibleIds: [], scrollTo: vi.fn(),
  }),
}));

afterEach(() => vi.restoreAllMocks());

describe.each([
  ["rail", TableOfContents, 40],
  ["lines", TableOfContentsLines, 43],
] as const)("%s table of contents forwarded refs", (_name, Component, startPadding) => {
  it.each(["object", "callback"])("retains edge padding and active scrolling with a %s ref", (kind) => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(20);
    const originalMatchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({ ...originalMatchMedia(query), matches: true }));
    const objectRef = createRef<HTMLElement>();
    const cleanup = vi.fn();
    const callbackRef = vi.fn(() => cleanup);
    const ref = kind === "object" ? objectRef : callbackRef;
    const { unmount } = render(<Component ref={ref} items={[
      { id: "first", title: "First" }, { id: "last", title: "Last" },
    ]} />);
    const nav = screen.getByRole("navigation");
    if (kind === "object") expect(objectRef.current).toBe(nav);
    else expect(callbackRef).toHaveBeenCalledWith(nav);
    expect(nav.querySelector("ul")).toHaveStyle({ paddingBlockStart: `${startPadding}px`, paddingBlockEnd: "40px" });
    expect(nav.scrollTop).toBe(200);
    unmount();
    if (kind === "object") expect(objectRef.current).toBeNull();
    else expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
