import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, type ReactNode } from "react";
import { vi } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/ui/popover/popover";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/registry/ui/dialog/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/registry/ui/select/select";
import { Tooltip, TooltipProvider } from "@/registry/ui/tooltip/tooltip";
import { CommandPaletteDemo } from "./entries/command-palette-demo";
import { MeasureOverlay } from "./measure-overlay";

function Harness({ children }: { children?: ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={canvasRef} data-testid="canvas">
      <div ref={contentRef}>{children}</div>
      <MeasureOverlay canvasRef={canvasRef} contentRef={contentRef} />
    </div>
  );
}

const popover = (
  <Popover>
    <PopoverTrigger>Open</PopoverTrigger>
    <PopoverContent aria-label="Panel">Panel body</PopoverContent>
  </Popover>
);

// Base UI's Select dismisses on the press itself, where Popover waits for the click.
const select = (
  <Select items={{ apple: "Apple", banana: "Banana" }}>
    <SelectTrigger aria-label="Fruit" />
    <SelectContent>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
    </SelectContent>
  </Select>
);

// A dialog's backdrop covers the canvas, so presses land on it.
const dialog = (
  <Dialog>
    <DialogTrigger>Open dialog</DialogTrigger>
    <DialogContent>
      <DialogTitle>Dialog title</DialogTitle>
    </DialogContent>
  </Dialog>
);

const canvas = () => screen.getByTestId("canvas");

const cases = [
  {
    name: "popover",
    demo: popover,
    open: (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Open" })),
    panel: () => screen.queryByText("Panel body"),
    surface: canvas,
  },
  {
    name: "select",
    demo: select,
    open: (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("combobox", { name: "Fruit" })),
    panel: () => screen.queryByRole("option", { name: "Banana" }),
    surface: canvas,
  },
  {
    name: "dialog",
    demo: dialog,
    open: (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Open dialog" })),
    panel: () => screen.queryByText("Dialog title"),
    surface: () => document.querySelector<HTMLElement>('[data-slot="dialog-backdrop"]')!,
  },
  {
    name: "command palette",
    demo: <CommandPaletteDemo grouped search={false} />,
    open: (user: ReturnType<typeof userEvent.setup>) => user.keyboard("{Control>}{Shift>}p{/Shift}{/Control}"),
    panel: () => screen.queryByRole("dialog"),
    surface: () => document.querySelector<HTMLElement>('[data-slot="command-palette-backdrop"]')!,
  },
];

const overlay = () => document.querySelector('[data-slot="measure-overlay"]');

beforeEach(() => {
  // jsdom has no 2D context; the overlay skips painting without one.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

it.each(cases)("keeps an open $name open while dragging across the canvas", async ({ demo, open, panel, surface }) => {
  const user = userEvent.setup();
  render(<Harness>{demo}</Harness>);
  await open(user);
  await waitFor(() => expect(panel()).toBeInTheDocument());

  // The selection is held inside the canvas, which jsdom otherwise lays out at zero size.
  vi.spyOn(canvas(), "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 200));
  vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(800);
  vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(600);
  const target = surface();
  fireEvent.pointerDown(target, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(target, { clientX: 80, clientY: 60 });
  expect(overlay()).toBeInTheDocument();
  fireEvent.pointerUp(target, { clientX: 80, clientY: 60 });
  fireEvent.click(target, { detail: 1 });

  expect(panel()).toBeInTheDocument();
  await waitFor(() => expect(overlay()).not.toBeInTheDocument());
});

it.each(cases)("leaves a plain click on the canvas to dismiss the $name", async ({ demo, open, panel, surface }) => {
  const user = userEvent.setup();
  render(<Harness>{demo}</Harness>);
  await open(user);
  await waitFor(() => expect(panel()).toBeInTheDocument());

  // Capture would retarget the click away from a modal's backdrop, which then wouldn't dismiss.
  const capture = vi.fn();
  Object.defineProperty(canvas(), "setPointerCapture", { configurable: true, value: capture });
  await user.click(surface());
  await waitFor(() => expect(panel()).not.toBeInTheDocument());
  expect(capture).not.toHaveBeenCalled();
  expect(overlay()).not.toBeInTheDocument();
});

it("opens a hover panel while the selection covers its trigger, and closes it after", async () => {
  render(
    <Harness>
      <TooltipProvider delay={0} closeDelay={0}>
        <Tooltip content="Deploys to production">
          <button type="button">Hover me</button>
        </Tooltip>
      </TooltipProvider>
    </Harness>,
  );
  vi.spyOn(canvas(), "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 200));
  vi.spyOn(screen.getByRole("button", { name: "Hover me" }), "getBoundingClientRect").mockReturnValue(new DOMRect(40, 40, 60, 24));

  fireEvent.pointerDown(canvas(), { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(canvas(), { clientX: 120, clientY: 90 });
  expect(await screen.findByText("Deploys to production")).toBeInTheDocument();

  fireEvent.pointerUp(canvas(), { clientX: 120, clientY: 90 });
  await waitFor(() => expect(screen.queryByText("Deploys to production")).not.toBeInTheDocument());
});

it("starts on a demo's empty layout space, but not on its surfaces, text, or controls", () => {
  render(
    <Harness>
      <div data-testid="wrapper" style={{ display: "flex", padding: 40 }}>
        <div data-testid="card" style={{ backgroundColor: "rgb(20, 20, 20)" }}>
          <div data-testid="inner" />
        </div>
        <span data-testid="text">Label</span>
        <button type="button">Action</button>
      </div>
    </Harness>,
  );
  vi.spyOn(canvas(), "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 200));
  const drag = (target: Element) => {
    fireEvent.pointerDown(target, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(target, { clientX: 80, clientY: 60 });
    // A finished drag's layer may still be fading; a live one is fully opaque.
    const started = (overlay() as HTMLElement | null)?.style.opacity === "1";
    fireEvent.pointerUp(target, { clientX: 80, clientY: 60 });
    return started;
  };

  expect(drag(screen.getByTestId("wrapper"))).toBe(true);
  expect(drag(screen.getByTestId("inner"))).toBe(false);
  expect(drag(screen.getByTestId("text"))).toBe(false);
  expect(drag(screen.getByRole("button", { name: "Action" }))).toBe(false);
});

it("ends a text edit in the demo on a plain click elsewhere, as a real press would", async () => {
  const user = userEvent.setup();
  const blur = vi.fn();
  render(
    <Harness>
      <input aria-label="Value" onBlur={blur} />
    </Harness>,
  );
  const field = screen.getByRole("textbox", { name: "Value" });
  field.focus();
  await user.click(canvas());
  expect(blur).toHaveBeenCalledOnce();
  expect(field).not.toHaveFocus();
});

describe("touch", () => {
  const touch = { pointerType: "touch", pointerId: 7, button: 0, isPrimary: true };
  const live = () => (overlay() as HTMLElement | null)?.style.opacity === "1";

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("measures from a press held still, without blocking the press itself", () => {
    render(<Harness />);
    vi.spyOn(canvas(), "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 200));
    const down = fireEvent.pointerDown(canvas(), { ...touch, clientX: 10, clientY: 10 });
    expect(down).toBe(true);
    expect(live()).toBe(false);

    act(() => vi.advanceTimersByTime(400));
    expect(live()).toBe(true);
    fireEvent.pointerMove(canvas(), { ...touch, clientX: 80, clientY: 60 });
    // The finger draws the selection instead of scrolling the page.
    const move = new TouchEvent("touchmove", { bubbles: true, cancelable: true });
    canvas().dispatchEvent(move);
    expect(move.defaultPrevented).toBe(true);
    fireEvent.pointerUp(canvas(), { ...touch, clientX: 80, clientY: 60 });
    expect(live()).toBe(false);
  });

  it("leaves a swipe to scroll and a tap to tap", () => {
    render(<Harness />);
    vi.spyOn(canvas(), "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 200));
    fireEvent.pointerDown(canvas(), { ...touch, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas(), { ...touch, clientX: 10, clientY: 40 });
    act(() => vi.advanceTimersByTime(400));
    expect(live()).toBe(false);
    const move = new TouchEvent("touchmove", { bubbles: true, cancelable: true });
    canvas().dispatchEvent(move);
    expect(move.defaultPrevented).toBe(false);
    fireEvent.pointerUp(canvas(), { ...touch, clientX: 10, clientY: 40 });

    fireEvent.pointerDown(canvas(), { ...touch, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(canvas(), { ...touch, clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(400));
    expect(live()).toBe(false);
  });
});
