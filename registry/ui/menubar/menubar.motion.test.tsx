import { act, cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { mockWebAnimations } from "../../../test/web-animations";
import { createMenubarHandoffGroup, useMenubarHandoff, type MenubarHandoffGroup } from "./menubar.handoff";
import { useMenubarHighlight } from "./menubar.highlight";

let waapi: ReturnType<typeof mockWebAnimations>;
beforeEach(() => { vi.useFakeTimers(); waapi = mockWebAnimations(); });
afterEach(() => { cleanup(); waapi.restore(); vi.restoreAllMocks(); vi.useRealTimers(); });
const flush = () => act(async () => {});
const frame = () => act(() => vi.advanceTimersToNextFrame());

function Popup({ group, name, open = true, slow }: { group: MenubarHandoffGroup; name: string; open?: boolean; slow?: string }) {
  const ref = useMenubarHandoff(group);
  return <div ref={ref} data-testid={name} data-open={open ? "" : undefined}
    style={{ boxSizing: "border-box", width: name === "First" ? 200 : 300, height: 100, "--duration-slow": slow } as React.CSSProperties}>
    <div id={`${name}-rows`} data-testid={`${name}-rows`} tabIndex={0}>{name}</div>
  </div>;
}

it("waits for placement and hands over a just-unmounted popup without copying interactive identities", async () => {
  const group = createMenubarHandoffGroup();
  const { rerender, getByTestId } = render(<Popup key="first" group={group} name="First" />);
  getByTestId("First-rows").scrollTop = 24;
  rerender(<></>);
  rerender(<Popup key="second" group={group} name="Second" />);
  const incoming = getByTestId("Second");
  expect(incoming).toHaveAttribute("data-handoff");
  expect(incoming.style.opacity).toBe("0");
  expect(waapi.animate).not.toHaveBeenCalled();
  frame();
  const copy = incoming.querySelector('[data-slot="menubar-handoff-copy"]')!;
  expect(copy).toHaveTextContent("First");
  expect(copy).toHaveAttribute("inert");
  expect(copy).toHaveAttribute("aria-hidden", "true");
  expect(copy.querySelector("[id], [tabindex], [data-testid]")).toBeNull();
  expect(copy.firstElementChild?.scrollTop).toBe(24);
  const resize = waapi.records.find(record => record.element === incoming && record.keyframes[0]?.width);
  expect(resize?.keyframes.map(keyframe => keyframe.width)).toEqual(["200px", "300px"]);
  await act(async () => waapi.records.forEach(record => record.finish()));
  expect(incoming).not.toHaveAttribute("data-handoff");
  expect(incoming.style.opacity).toBe("");
  expect(incoming.querySelector('[data-slot="menubar-handoff-copy"]')).toBeNull();
});

it("cancels an interrupted handoff and copies only the most recent menu", async () => {
  const group = createMenubarHandoffGroup();
  const view = (active: string) => <>{["First", "Second", "Third"].map(name =>
    <Popup key={name} group={group} name={name} open={active === name} />)}</>;
  const { rerender, getByTestId } = render(view("First"));
  rerender(view("Second")); await flush(); frame();
  const firstBatch = [...waapi.records];
  expect(getByTestId("First").style.visibility).toBe("hidden");
  rerender(view("Third")); await flush(); frame();
  expect(firstBatch.length).toBeGreaterThan(0);
  for (const record of firstBatch) expect(record.animation.cancel).toHaveBeenCalled();
  const third = getByTestId("Third");
  const copy = third.querySelector('[data-slot="menubar-handoff-copy"]')!;
  expect(copy).toHaveTextContent("Second");
  expect(copy).not.toHaveTextContent("First");
  expect(copy.querySelector('[data-slot="menubar-handoff-copy"]')).toBeNull();
  await act(async () => firstBatch.forEach(record => record.finish()));
  expect(third).toHaveAttribute("data-handoff");
  rerender(view("First")); await flush(); frame();
  expect(getByTestId("First").style.visibility).toBe("");
});

it("cleans up a handoff closed before its placement frame", async () => {
  const group = createMenubarHandoffGroup();
  const { rerender, getByTestId } = render(<><Popup group={group} name="First" /><Popup group={group} name="Second" open={false} /></>);
  rerender(<><Popup group={group} name="First" open={false} /><Popup group={group} name="Second" /></>);
  await flush();
  const second = getByTestId("Second");
  expect(second).toHaveAttribute("data-handoff");
  rerender(<><Popup group={group} name="First" open={false} /><Popup group={group} name="Second" open={false} /></>);
  await flush(); frame();
  expect(second).not.toHaveAttribute("data-handoff");
  expect(second.style.opacity).toBe("");
  expect(waapi.animate).not.toHaveBeenCalled();
});

it.each(["preference", "token", "unsupported"])("uses the CSS swap when animation is disabled by %s", async reason => {
  if (reason === "preference") vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
  if (reason === "unsupported") Object.defineProperty(Element.prototype, "animate", { configurable: true, value: undefined });
  const group = createMenubarHandoffGroup();
  const { rerender, getByTestId } = render(<Popup key="first" group={group} name="First" />);
  rerender(<Popup key="second" group={group} name="Second" slow={reason === "token" ? "1ms" : undefined} />);
  await flush(); frame();
  expect(getByTestId("Second")).not.toHaveAttribute("data-handoff");
  expect(getByTestId("Second").style.opacity).toBe("");
  expect(waapi.animate).not.toHaveBeenCalled();
});

it("does not reuse an expired close snapshot", () => {
  const group = createMenubarHandoffGroup();
  const { rerender, getByTestId } = render(<Popup key="first" group={group} name="First" />);
  rerender(<></>);
  act(() => vi.advanceTimersByTime(1000));
  rerender(<Popup key="second" group={group} name="Second" />);
  frame();
  expect(getByTestId("Second")).not.toHaveAttribute("data-handoff");
  expect(waapi.animate).not.toHaveBeenCalled();
});

function HighlightBar({ open }: { open: string | null }) {
  const bar = useRef<HTMLDivElement>(null), highlight = useRef<HTMLSpanElement>(null);
  useMenubarHighlight(bar, highlight);
  return <div ref={bar} data-slot="menubar"><span ref={highlight} data-testid="highlight" />
    {["First", "Second"].map(name => <button key={name} data-slot="menubar-trigger" data-popup-open={open === name ? "" : undefined}>{name}</button>)}
  </div>;
}

it("keeps the highlight through a handoff gap, then resets its placement after closing", async () => {
  const { rerender, getByTestId } = render(<HighlightBar open={null} />);
  const highlight = getByTestId("highlight");
  const attributes = vi.spyOn(highlight, "setAttribute");
  rerender(<HighlightBar open="First" />); await flush();
  expect(highlight).toHaveAttribute("data-visible");
  expect(attributes).toHaveBeenCalledWith("data-instant", "");
  attributes.mockClear();
  rerender(<HighlightBar open={null} />); await flush();
  expect(highlight).toHaveAttribute("data-visible");
  rerender(<HighlightBar open="Second" />); await flush(); frame();
  expect(highlight).toHaveAttribute("data-visible");
  expect(attributes).not.toHaveBeenCalledWith("data-instant", "");
  rerender(<HighlightBar open={null} />); await flush(); frame();
  expect(highlight).not.toHaveAttribute("data-visible");
  rerender(<HighlightBar open="First" />); await flush();
  expect(highlight).toHaveAttribute("data-visible");
  expect(attributes).toHaveBeenCalledWith("data-instant", "");
});
