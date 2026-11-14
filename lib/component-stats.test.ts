import { componentStats } from "./component-stats";

describe("componentStats", () => {
  it("counts the item's own source and links its component dependencies", () => {
    const stats = componentStats("date-picker");

    expect(stats?.files).toBe(4);
    expect(stats?.lines).toBeGreaterThan(100);
    // Theme and utility items are not components, so only Button and Popover remain.
    expect(stats?.dependencies).toEqual([
      { name: "button", title: "Button", href: "/docs/button" },
      { name: "popover", title: "Popover", href: "/docs/popover" },
    ]);
  });

  it("has no stats for names that are not installable components", () => {
    expect(componentStats("cn")).toBeUndefined();
    expect(componentStats("not-a-component")).toBeUndefined();
  });
});
