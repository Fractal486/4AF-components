import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { duration, ease } from "./motion";

const css = readFileSync(resolve("app/globals.css"), "utf8");

describe("JavaScript motion defaults", () => {
  it.each(Object.entries(duration))("mirrors --duration-%s", (name, seconds) => {
    // The first declaration is the default; reduced-motion overrides follow it.
    const token = css.match(new RegExp(`--duration-${name}:\\s*([\\d.]+)ms`));
    expect(token, `Missing CSS duration token: ${name}`).not.toBeNull();
    expect(Number(token![1])).toBeCloseTo(seconds * 1000);
  });

  it.each(Object.entries(ease))("mirrors --ease-%s", (name, curve) => {
    const token = css.match(new RegExp(`--ease-${name}:\\s*cubic-bezier\\(([^)]+)\\)`));
    expect(token, `Missing CSS easing token: ${name}`).not.toBeNull();
    expect(token![1]!.split(",").map(Number)).toEqual(curve);
  });
});
