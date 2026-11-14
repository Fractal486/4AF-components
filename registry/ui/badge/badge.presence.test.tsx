import { act, cleanup, render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { vi } from "vitest";
import { BadgeSurface } from "./badge.presence";

const { reducedMotion } = vi.hoisted(() => ({ reducedMotion: vi.fn(() => false) }));
vi.mock("motion/react", async (importOriginal) => ({
  ...await importOriginal<typeof import("motion/react")>(),
  useReducedMotion: reducedMotion,
}));

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
const running: { finish: () => void; cancel: ReturnType<typeof vi.fn> }[] = [];
const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => Animation>(() => {
  let finish!: () => void;
  const finished = new Promise<void>((resolve) => { finish = resolve; });
  const cancel = vi.fn();
  running.push({ finish, cancel });
  return { finished, cancel } as unknown as Animation;
});

beforeEach(() => {
  running.length = 0;
  animate.mockClear();
  reducedMotion.mockReturnValue(false);
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
});

afterEach(() => {
  cleanup();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

function surface(open: boolean, tokens: Record<string, string> = {}, onComplete?: (open: boolean) => void) {
  return <BadgeSurface state={{ open, disabled: false, transitionStatus: undefined }}
    render={<span />} motionProps={{}} style={tokens as CSSProperties}
    onOpenChangeComplete={onComplete}>Tag</BadgeSurface>;
}

function durations() {
  return animate.mock.calls.map(([, options]) => options.duration);
}

describe("Badge presence timing", () => {
  it("falls back to the shared base, slow, and fast defaults", () => {
    const { rerender } = render(surface(true));
    rerender(surface(false));
    expect(durations()).toEqual([200, 300, 150]);
  });

  it("reads current millisecond and second tokens on each change, including 4× duration", () => {
    const { rerender } = render(surface(true, { "--duration-base": "0.8s" }));
    rerender(surface(false, { "--duration-slow": "1.2s", "--duration-fast": "600ms" }));
    rerender(surface(true, { "--duration-base": "160ms" }));
    expect(durations()).toEqual([800, 1200, 600, 160]);
  });

  it("falls back for invalid tokens and accepts zero duration", () => {
    const { rerender } = render(surface(true, { "--duration-base": "invalid" }));
    rerender(surface(false, { "--duration-slow": "500", "--duration-fast": "badms" }));
    rerender(surface(true, { "--duration-base": "0ms" }));
    expect(durations()).toEqual([200, 300, 150, 0]);
  });

  it("completes removal only after both the fade and width collapse settle", async () => {
    const onComplete = vi.fn();
    const { rerender } = render(surface(true, {}, onComplete));
    await act(async () => running[0]!.finish());
    expect(onComplete.mock.calls).toEqual([[true]]);

    rerender(surface(false, { "--duration-slow": "1200ms", "--duration-fast": "600ms" }, onComplete));
    await act(async () => running[2]!.finish());
    expect(onComplete.mock.calls).toEqual([[true]]);
    await act(async () => running[1]!.finish());
    expect(onComplete.mock.calls).toEqual([[true], [false]]);
  });

  it("skips animation under reduced motion even with slow tokens", () => {
    reducedMotion.mockReturnValue(true);
    const onComplete = vi.fn();
    const { rerender } = render(surface(true, { "--duration-base": "800ms" }, onComplete));
    rerender(surface(false, { "--duration-slow": "1200ms" }, onComplete));
    expect(animate).not.toHaveBeenCalled();
    expect(onComplete.mock.calls).toEqual([[true], [false]]);
  });
});
