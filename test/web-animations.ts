/** Controllable WAAPI lifecycle; cancellation rejects `finished`, as in a browser. */
export function mockWebAnimations() {
  const original = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
  const records: {
    element: Element;
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
    animation: Animation;
    finish: () => void;
  }[] = [];
  const animate = vi.fn(function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    let playState: AnimationPlayState = "running";
    const finished = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
    void finished.catch(() => {});
    const animation = {
      finished,
      get playState() { return playState; },
      cancel: vi.fn(() => { playState = "idle"; reject(new DOMException("Cancelled", "AbortError")); }),
    } as unknown as Animation;
    records.push({ element: this, keyframes, options, animation, finish: () => { playState = "finished"; resolve(); } });
    return animation;
  });
  Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: animate });
  const getAnimations = vi.spyOn(Element.prototype, "getAnimations").mockImplementation(function (this: Element, options) {
    return records.filter(record => record.animation.playState === "running"
      && (record.element === this || (options?.subtree && this.contains(record.element))))
      .map(record => record.animation);
  });
  return {
    animate,
    records,
    restore() {
      getAnimations.mockRestore();
      if (original) Object.defineProperty(Element.prototype, "animate", original);
      else Reflect.deleteProperty(Element.prototype, "animate");
    },
  };
}
