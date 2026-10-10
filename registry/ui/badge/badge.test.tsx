import { render, screen } from "@testing-library/react";
import { CircleX, Hash, Star } from "lucide-react";
import { Badge, BadgeIconsProvider } from "./badge";

describe("Badge", () => {
  it("defaults to the small size", () => {
    render(
      <Badge data-testid="badge">
        Approved
      </Badge>,
    );

    expect(screen.getByTestId("badge")).toHaveClass(
      "h-4",
      "rounded-[4px]",
      "px-1",
      "gap-1",
      "text-2xs",
    );
    expect(screen.getByTestId("badge").querySelectorAll('[data-slot="morph"]')).toHaveLength(2);
  });

  it("sizes a caller's own glyph the way it sizes its status ones", () => {
    // A lucide icon written inline says nothing about its size and draws at 24px, several
    // times the badge's own — it used to arrive towering over the text.
    render(
      <>
        <Badge data-testid="default" icon={<Hash />}>
          reading
        </Badge>
        <Badge data-testid="md" size="md" icon={<Hash />}>
          reading
        </Badge>
        <Badge data-testid="asked" icon={<Hash className="size-4" />}>
          reading
        </Badge>
      </>,
    );

    expect(screen.getByTestId("default").querySelector("svg")).toHaveClass("size-2.5");
    expect(screen.getByTestId("md").querySelector("svg")).toHaveClass("size-3");
    // Said outright, so it wins: the badge sets the default, not the rule.
    expect(screen.getByTestId("asked").querySelector("svg")).toHaveClass("size-4");
    expect(screen.getByTestId("asked").querySelector("svg")).not.toHaveClass("size-2.5");
  });

  it.each([
    ["sm", "h-4", "rounded-[4px]", "gap-1"],
    ["md", "h-5", "rounded-[4px]", "gap-1.5"],
    ["lg", "h-6", "rounded-[6px]", "gap-2"],
  ] as const)("uses the %s boxed geometry", (size, height, radius, gap) => {
    render(
      <Badge data-testid="badge" size={size}>
        Approved
      </Badge>,
    );

    expect(screen.getByTestId("badge")).toHaveClass(height, radius, gap);
  });

  it("supports a pill shape alongside the current rounded shape", () => {
    render(
      <>
        <Badge data-testid="rounded">Rounded</Badge>
        <Badge data-testid="pill" shape="pill">
          Pill
        </Badge>
        <Badge data-testid="outline-pill" variant="outline" shape="pill">
          Outline pill
        </Badge>
      </>,
    );

    expect(screen.getByTestId("rounded")).toHaveClass("rounded-[4px]");
    expect(screen.getByTestId("rounded")).not.toHaveClass("rounded-full");
    expect(screen.getByTestId("pill")).toHaveClass("rounded-full");
    expect(screen.getByTestId("pill")).not.toHaveClass("rounded-[4px]");
    expect(screen.getByTestId("outline-pill")).toHaveClass("rounded-full");
  });

  it("keeps plain unboxed, gives solid a status wash, and keeps outline gray", () => {
    render(
      <>
        <Badge data-testid="plain" variant="plain" status="danger">
          Plain
        </Badge>
        <Badge data-testid="solid" variant="solid" status="success">
          Solid
        </Badge>
        <Badge data-testid="outline" variant="outline" status="danger">
          Outline
        </Badge>
      </>,
    );

    expect(screen.getByTestId("plain")).toHaveClass("text-destructive");
    expect(screen.getByTestId("plain")).not.toHaveClass("border", "bg-destructive/10");

    expect(screen.getByTestId("solid")).toHaveClass("text-success", "bg-success/10");
    expect(screen.getByTestId("solid")).not.toHaveClass("border");

    expect(screen.getByTestId("outline")).toHaveClass("text-destructive", "border-border-strong");
    expect(screen.getByTestId("outline")).not.toHaveClass("bg-destructive/10");
  });
});

describe("Badge status icons", () => {
  // Morph keeps every status's glyph mounted as an invisible sizer; the shown one isn't.
  const glyph = (id: string) =>
    screen.getByTestId(id).querySelector('[data-slot="morph"] > span:not(.invisible) svg');

  it("uses OctagonAlert for danger by default", () => {
    render(<Badge data-testid="danger" status="danger">Failed</Badge>);
    expect(glyph("danger")).toHaveClass("lucide-octagon-alert", "size-2.5");
  });

  it("replaces only the statuses named in `icons`, sized like the defaults", () => {
    render(
      <>
        <Badge data-testid="danger" status="danger" icons={{ danger: <CircleX /> }}>Failed</Badge>
        <Badge data-testid="info" status="info" icons={{ danger: <CircleX /> }}>Note</Badge>
      </>,
    );
    expect(glyph("danger")).toHaveClass("lucide-circle-x", "size-2.5");
    expect(glyph("info")).toHaveClass("lucide-info");
  });

  it("layers per-badge icons over the provider, and `icon` over both", () => {
    render(
      <BadgeIconsProvider icons={{ danger: <CircleX />, success: <Star /> }}>
        <Badge data-testid="provided" status="danger">Failed</Badge>
        <Badge data-testid="own" status="success" icons={{ success: <Hash /> }}>Done</Badge>
        <Badge data-testid="single" status="danger" icons={{ danger: <Star /> }} icon={<Hash />}>
          Failed
        </Badge>
      </BadgeIconsProvider>,
    );
    expect(glyph("provided")).toHaveClass("lucide-circle-x");
    expect(glyph("own")).toHaveClass("lucide-hash");
    expect(glyph("single")).toHaveClass("lucide-hash");
  });

  it("nests providers, and a null entry hides that status's icon", () => {
    render(
      <BadgeIconsProvider icons={{ danger: <CircleX />, info: <Star /> }}>
        <BadgeIconsProvider icons={{ info: null }}>
          <Badge data-testid="outer" status="danger">Failed</Badge>
          <Badge data-testid="hidden" status="info">Note</Badge>
        </BadgeIconsProvider>
      </BadgeIconsProvider>,
    );
    expect(glyph("outer")).toHaveClass("lucide-circle-x");
    expect(glyph("hidden")).toBeNull();
  });

  it("lets a loading entry in `icons` win over `loader`", () => {
    render(
      <Badge data-testid="loading" status="loading" loader={<span>spin</span>} icons={{ loading: <Star /> }}>
        Syncing
      </Badge>,
    );
    expect(glyph("loading")).toHaveClass("lucide-star");
    expect(screen.queryByText("spin")).toBeNull();
  });
});

describe("Badge color", () => {
  it("replaces the solid fill with the given colour and keeps the status ink", () => {
    render(
      <Badge data-testid="badge" status="success" color="oklch(0.7 0.15 250 / 0.2)">
        Beta
      </Badge>,
    );
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveClass("bg-(--badge-fill)", "text-success");
    expect(badge).not.toHaveClass("bg-success/10");
    expect(badge.style.getPropertyValue("--badge-fill")).toBe("oklch(0.7 0.15 250 / 0.2)");
    expect(badge).toHaveAttribute("data-color", "");
  });

  it.each(["plain", "outline"] as const)("is ignored by the %s variant", (variant) => {
    render(
      <Badge data-testid="badge" variant={variant} color="red">
        Beta
      </Badge>,
    );
    const badge = screen.getByTestId("badge");
    expect(badge).not.toHaveClass("bg-(--badge-fill)");
    expect(badge).not.toHaveAttribute("data-color");
    expect(badge.style.getPropertyValue("--badge-fill")).toBe("");
  });

  it("keeps a caller's own style alongside the fill", () => {
    render(
      <Badge data-testid="badge" color="red" style={{ marginLeft: 4 }}>
        Beta
      </Badge>,
    );
    const badge = screen.getByTestId("badge");
    expect(badge.style.marginLeft).toBe("4px");
    expect(badge.style.getPropertyValue("--badge-fill")).toBe("red");
  });
});
