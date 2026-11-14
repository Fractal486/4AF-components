import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { Kbd, KbdGroup } from "./kbd";
import { formatKbdKeys, parseKbdKeys } from "./kbd.keys";
import { Kbd as PaletteKbd } from "@/registry/ui/command-palette/command-palette";
import { DropdownMenuShortcut } from "@/registry/ui/dropdown-menu/dropdown-menu";

afterEach(() => vi.restoreAllMocks());

it("preserves keycap semantics, native props, refs, and custom classes", () => {
  const ref = createRef<HTMLElement>();
  render(<Kbd ref={ref} aria-label="Escape" title="Close panel" className="bg-transparent">Esc</Kbd>);
  const keycap = screen.getByText("Esc");
  expect(keycap.tagName).toBe("KBD");
  expect(ref.current).toBe(keycap);
  expect(keycap).toHaveAttribute("aria-label", "Escape");
  expect(keycap).toHaveAttribute("title", "Close panel");
  expect(keycap).toHaveClass("bg-transparent");
  expect(keycap).not.toHaveClass("bg-foreground/8");
  expect(keycap).not.toHaveAttribute("tabindex");
});

it("composes onto a child with both refs and event handlers intact", () => {
  const outerRef = createRef<HTMLElement>();
  const childRef = createRef<HTMLSpanElement>();
  const onClick = vi.fn();
  const onChildClick = vi.fn();
  render(<Kbd asChild ref={outerRef} size="md" onClick={onClick} className="text-foreground">
    <span ref={childRef} onClick={onChildClick} className="bg-transparent">Enter</span>
  </Kbd>);
  const keycap = screen.getByText("Enter");
  expect(keycap.tagName).toBe("SPAN");
  expect(outerRef.current).toBe(keycap);
  expect(childRef.current).toBe(keycap);
  expect(keycap).toHaveAttribute("data-size", "md");
  expect(keycap).toHaveClass("text-foreground", "bg-transparent");
  fireEvent.click(keycap);
  expect(onClick).toHaveBeenCalledOnce();
  expect(onChildClick).toHaveBeenCalledOnce();
});

it("keeps the palette export identical and gives dropdown shortcuts the shared API", () => {
  expect(PaletteKbd).toBe(Kbd);
  const ref = createRef<HTMLElement>();
  render(<DropdownMenuShortcut ref={ref} size="md" aria-label="Command P">⌘P</DropdownMenuShortcut>);
  const keycap = screen.getByText("⌘P");
  expect(ref.current).toBe(keycap);
  expect(keycap).toHaveAttribute("data-slot", "kbd");
  expect(keycap).toHaveAttribute("data-size", "md");
  expect(keycap).toHaveAttribute("aria-label", "Command P");
  expect(keycap).toHaveClass("ml-auto", "self-start");
});

it.each([
  ["Win32", "Ctrl+Shift+K", ["Ctrl", "Shift", "K"]],
  ["MacIntel", "⌘⇧K", ["⌘", "⇧", "K"]],
  ["iPad", "⌘⇧K", ["⌘", "⇧", "K"]],
])("formats generated labels for %s while preserving literal children", (platform, label, keys) => {
  vi.spyOn(window.navigator, "platform", "get").mockReturnValue(platform);
  render(<><Kbd keys="mod+shift+k" data-testid="single" />
    <KbdGroup keys="mod+shift+k" data-testid="group" />
    <Kbd>Command K</Kbd></>);
  expect(screen.getByTestId("single")).toHaveTextContent(label);
  expect([...screen.getByTestId("group").querySelectorAll('[data-slot="kbd"]')].map(key => key.textContent)).toEqual(keys);
  expect(screen.getByText("Command K")).toBeVisible();
});

it("parses sequences, aliases, compact symbols, spacing, and the plus key", () => {
  expect(parseKbdKeys(" ctrl + shift + k   g g ")).toEqual([["ctrl", "shift", "k"], ["g"], ["g"]]);
  expect(parseKbdKeys("⌘⇧P mod++ g")).toEqual([["meta", "shift", "p"], ["mod", "+"], ["g"]]);
  expect(parseKbdKeys("mod+plus")).toEqual([["mod", "+"]]);
  expect(parseKbdKeys("CtrlK")).toEqual([["ctrl", "k"]]);
  expect(parseKbdKeys("  ")).toEqual([]);
  expect(formatKbdKeys("control+option+return", true)).toBe("⌃⌥↵");
  expect(formatKbdKeys("mod+k mod+c", false)).toBe("Ctrl+K then Ctrl+C");
  expect(formatKbdKeys("constructor", false)).toBe("Constructor");
});

it("renders separate sequence steps with a custom separator and shared sizes", () => {
  const ref = createRef<HTMLElement>();
  const { rerender } = render(<KbdGroup ref={ref} keys="g g" size="md" separator={<span>followed by</span>} />);
  expect(ref.current?.tagName).toBe("KBD");
  const keycaps = ref.current!.querySelectorAll('[data-slot="kbd"]');
  expect(keycaps).toHaveLength(2);
  keycaps.forEach(keycap => expect(keycap).toHaveAttribute("data-size", "md"));
  expect(screen.getByText("followed by")).toBeVisible();
  rerender(<KbdGroup ref={ref} keys="g g" separator={null} />);
  expect(ref.current!.querySelector('[data-slot="kbd-separator"]')).toBeNull();
});

it("inherits group size through wrappers and lets keycaps and nested groups override it", () => {
  render(<KbdGroup size="md"><span><Kbd>A</Kbd></span><Kbd size="sm">B</Kbd>
    <KbdGroup><Kbd>C</Kbd></KbdGroup><KbdGroup size="sm"><Kbd>D</Kbd></KbdGroup>
  </KbdGroup>);
  for (const key of ["A", "C"]) expect(screen.getByText(key)).toHaveAttribute("data-size", "md");
  for (const key of ["B", "D"]) expect(screen.getByText(key)).toHaveAttribute("data-size", "sm");
});

it("preserves custom elements and refs when keys generate their contents", () => {
  const ref = createRef<HTMLElement>();
  const childRef = createRef<HTMLSpanElement>();
  render(<><Kbd asChild keys="escape"><span data-testid="custom-key">Old</span></Kbd>
    <KbdGroup asChild ref={ref} keys="g g"><span ref={childRef} data-testid="custom-group">Old</span></KbdGroup></>);
  expect(screen.getByTestId("custom-key")).toHaveTextContent("Esc");
  expect(screen.getByTestId("custom-key").tagName).toBe("SPAN");
  expect(screen.getByTestId("custom-group").querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
  expect(ref.current).toBe(childRef.current);
  expect(screen.queryByText("Old")).not.toBeInTheDocument();
});

it("hydrates the same markup before updating to the Apple platform", async () => {
  vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");
  const container = document.createElement("div");
  container.innerHTML = renderToString(<Kbd keys="mod+k" />);
  expect(container).toHaveTextContent("Ctrl+K");
  document.body.appendChild(container);
  const onRecoverableError = vi.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => { root = hydrateRoot(container, <Kbd keys="mod+k" />, { onRecoverableError }); });
    expect(container).toHaveTextContent("⌘K");
    expect(onRecoverableError).not.toHaveBeenCalled();
  } finally {
    act(() => root?.unmount());
    container.remove();
  }
});
