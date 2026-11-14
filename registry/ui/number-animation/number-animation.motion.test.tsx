import { act, cleanup, render } from "@testing-library/react";
import { mockWebAnimations } from "../../../test/web-animations";
import { NumberAnimation } from "./number-animation";

let waapi: ReturnType<typeof mockWebAnimations>;
let reduced: boolean;
let media: MediaQueryList;
beforeEach(() => {
  waapi = mockWebAnimations();
  reduced = false;
  media = new EventTarget() as MediaQueryList;
  Object.defineProperty(media, "matches", { get: () => reduced });
  vi.spyOn(window, "matchMedia").mockReturnValue(media);
});
afterEach(() => { cleanup(); waapi.restore(); vi.restoreAllMocks(); });
const preference = (value: boolean) => act(() => { reduced = value; media.dispatchEvent(new Event("change")); });

it("updates both the accessible value and visible digits immediately under reduced motion", () => {
  reduced = true;
  const start = vi.fn(), finish = vi.fn();
  const { container, rerender } = render(<NumberAnimation value={1234} onAnimationsStart={start} onAnimationsFinish={finish} />);
  rerender(<NumberAnimation value={8} onAnimationsStart={start} onAnimationsFinish={finish} />);
  expect(container.querySelector('[data-slot="number-animation-text"]')).toHaveTextContent("8");
  expect(container.querySelectorAll('[data-slot="number-animation-digit"]')).toHaveLength(1);
  expect(container.querySelector('[data-slot="number-animation-column"]')).toHaveAttribute("data-digit", "8");
  expect(container.querySelector("[data-turning]")).toBeNull();
  expect(waapi.animate).not.toHaveBeenCalled();
  expect(start).not.toHaveBeenCalled();
  expect(finish).not.toHaveBeenCalled();
});

it("cancels rolls and exits when reduced motion turns on, then animates fresh updates when it turns off", async () => {
  const start = vi.fn(), finish = vi.fn();
  const view = (value: number) => <NumberAnimation value={value} onAnimationsStart={start} onAnimationsFinish={finish} />;
  const { container, rerender } = render(view(123));
  rerender(view(8));
  const firstBatch = [...waapi.records];
  expect(firstBatch.length).toBeGreaterThan(0);
  expect(container.querySelectorAll('[data-slot="number-animation-digit"]')).toHaveLength(3);
  expect(container.querySelector("[data-turning]")).not.toBeNull();
  preference(true);
  for (const record of firstBatch) expect(record.animation.cancel).toHaveBeenCalled();
  expect(container.querySelectorAll('[data-slot="number-animation-digit"]')).toHaveLength(1);
  expect(container.querySelector("[data-turning]")).toBeNull();
  await act(async () => firstBatch.forEach(record => record.finish()));
  expect(finish).not.toHaveBeenCalled();
  const count = waapi.records.length;
  rerender(view(7));
  expect(waapi.records).toHaveLength(count);
  preference(false);
  expect(waapi.records).toHaveLength(count);
  rerender(view(9));
  expect(start).toHaveBeenCalledTimes(2);
  await act(async () => waapi.records.slice(count).forEach(record => record.finish()));
  expect(finish).toHaveBeenCalledOnce();
  expect(container.querySelector('[data-slot="number-animation-text"]')).toHaveTextContent("9");
});

it("cancels unfinished animations and removes the preference listener when unmounted", async () => {
  const remove = vi.spyOn(media, "removeEventListener");
  const finish = vi.fn();
  const { rerender, unmount } = render(<NumberAnimation value={1} onAnimationsFinish={finish} />);
  rerender(<NumberAnimation value={2} onAnimationsFinish={finish} />);
  const batch = [...waapi.records];
  expect(batch.length).toBeGreaterThan(0);
  unmount();
  for (const record of batch) expect(record.animation.cancel).toHaveBeenCalled();
  expect(remove).toHaveBeenCalledWith("change", expect.any(Function));
  await act(async () => batch.forEach(record => record.finish()));
  expect(finish).not.toHaveBeenCalled();
});

it("keeps a new batch when reduced motion is disabled in the same update as the value", async () => {
  reduced = true;
  const finish = vi.fn();
  const { rerender } = render(<NumberAnimation value={1} onAnimationsFinish={finish} />);
  act(() => {
    reduced = false;
    media.dispatchEvent(new Event("change"));
    rerender(<NumberAnimation value={2} onAnimationsFinish={finish} />);
  });
  expect(waapi.records.length).toBeGreaterThan(0);
  for (const record of waapi.records) expect(record.animation.cancel).not.toHaveBeenCalled();
  await act(async () => waapi.records.forEach(record => record.finish()));
  expect(finish).toHaveBeenCalledOnce();
});
