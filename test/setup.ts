import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";
import { MotionGlobalConfig } from "motion/react";

// Behaviour tests assert settled state; animation frames are not a reliable clock.
MotionGlobalConfig.skipAnimations = true;
configure({ asyncUtilTimeout: 3000 });

afterEach(() => cleanup());

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  configurable: true,
  value: ResizeObserverStub,
});

// jsdom has no Web Animations API. Base UI's Scroll Area waits on the viewport's animations
// after a scroll settles; with none running, an empty list is the honest answer. Base UI's
// popups read the same method's presence to decide whether to wait for exit animations, so
// the flag keeps them finishing synchronously, as they did before the stub existed.
(globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean }).BASE_UI_ANIMATIONS_DISABLED = true;
if (!Element.prototype.getAnimations) {
  Object.defineProperty(Element.prototype, "getAnimations", {
    configurable: true,
    value: () => [],
  });
}
