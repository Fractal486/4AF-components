import { cn } from "./cn";

describe("cn", () => {
  it("lets consumers override Tailwind 4 custom-property utilities", () => {
    expect(cn("duration-(--duration-fast)", "duration-(--duration-slow)")).toBe("duration-(--duration-slow)");
    expect(cn("w-(--sidebar-width)", "w-64")).toBe("w-64");
    expect(cn("max-w-(--skeleton-width)", "max-w-full")).toBe("max-w-full");
    expect(cn("h-(--collapsible-panel-height)", "h-auto")).toBe("h-auto");
  });

  it("merges semantic elevation tokens as shadow sizes while preserving shadow colors", () => {
    expect(cn("shadow-border", "shadow-none")).toBe("shadow-none");
    expect(cn("shadow-lg", "shadow-overlay-drop")).toBe("shadow-overlay-drop");
    expect(cn("shadow-overlay", "shadow-raised", "shadow-black/10")).toBe("shadow-raised shadow-black/10");
    expect(cn("hover:shadow-border", "shadow-none")).toBe("hover:shadow-border shadow-none");
  });
});
