import { fireEvent, render, screen } from "@testing-library/react";
import { createRef, type ComponentProps } from "react";
import { Morph } from "@/registry/ui/morph/morph";
import { ScrambleText } from "@/registry/ui/scramble-text/scramble-text";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";

const cases = [
  ["Morph single", (props: ComponentProps<"span">) => <Morph {...props} activeKey="a" items={{ a: "A" }} />],
  ["Morph widest", (props: ComponentProps<"span">) => <Morph<"a" | "b"> {...props} activeKey="a" items={{ a: "A", b: "B" }} />],
  ["Morph fixed", (props: ComponentProps<"span">) => <Morph<"a" | "b"> {...props} sizing="fixed" activeKey="a" items={{ a: "A", b: "B" }} />],
  ["Morph current", (props: ComponentProps<"span">) => <Morph<"a" | "b"> {...props} sizing="current" activeKey="a" items={{ a: "A", b: "B" }} />],
  ["ScrambleText", (props: ComponentProps<"span">) => <ScrambleText {...props} intervalMs={0}>Ready</ScrambleText>],
  ["AsciiLoader", (props: ComponentProps<"span">) => <AsciiLoader {...props} />],
] as const;

it.each(cases)("forwards DOM props, events and the root ref for %s", (_, component) => {
  const ref = createRef<HTMLSpanElement>();
  const click = vi.fn();
  const { unmount } = render(component({ ref, id: "status", "aria-label": "Work", title: "Details", style: { marginLeft: 7 }, onClick: click, className: "custom" }));
  const root = document.getElementById("status")!;
  expect(ref.current).toBe(root);
  expect(root.tagName).toBe("SPAN");
  expect(root).toHaveAttribute("aria-label", "Work");
  expect(root).toHaveAttribute("title", "Details");
  expect(root).toHaveStyle({ marginLeft: "7px" });
  expect(root).toHaveClass("custom");
  fireEvent.click(root);
  expect(click).toHaveBeenCalledOnce();
  unmount();
  expect(ref.current).toBeNull();
});

it("cleans up callback refs once when an ASCII loader is hidden", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const { rerender } = render(<AsciiLoader ref={ref} data-testid="spinner" />);
  expect(ref).toHaveBeenCalledExactlyOnceWith(screen.getByTestId("spinner"));
  rerender(<AsciiLoader ref={ref} data-testid="spinner" className="changed" />);
  expect(cleanup).not.toHaveBeenCalled();
  rerender(<AsciiLoader ref={ref} loading={false} />);
  expect(cleanup).toHaveBeenCalledOnce();
});
