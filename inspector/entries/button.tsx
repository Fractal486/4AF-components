import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { bool, defineEntry, select, text } from "../schema";

const VARIANTS = ["primary", "brand", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["sm", "md", "lg"] as const;

export const buttonEntry = defineEntry({
  slug: "button",
  name: "Button",
  summary: "Six variants, six sizes, loading without layout shift, and asChild.",
  controls: {
    variant: select(VARIANTS, "primary"),
    size: select([...SIZES, "icon-sm", "icon", "icon-lg"], "md"),
    label: text("Deploy", "Label"),
    icon: select(["none", "leading", "trailing"], "none"),
    loading: bool(false),
    disabled: bool(false),
    asChild: bool(false, "asChild (render as link)"),
  },
  notes: [
    "Press and hold: the button scales to 0.97 and stays there. Set motion to SLOW to see the ease — it decelerates in, and springs back out on release.",
    "Toggle `loading` on: the width doesn't change. The label stays in the layout and fades; the spinner sits on top of it.",
    "The spinner keeps spinning under REDUCED motion. Scaling it to zero would turn a 1s rotation into a strobe.",
    "With an icon, the padding on the icon's side is 2px tighter — optical, not geometric, centring.",
    "Turn on `asChild`: the styles move onto a real <a>. Right-click it — it offers 'Open link in new tab', because it *is* a link.",
  ],
  render({ variant, size, label, icon, loading, disabled, asChild }) {
    const isIconOnly = size.startsWith("icon");

    const content = isIconOnly ? (
      <Plus />
    ) : (
      <>
        {icon === "leading" && <Plus />}
        {label}
        {icon === "trailing" && <ArrowRight />}
      </>
    );

    if (asChild) {
      return (
        <Button
          asChild
          variant={variant}
          size={size}
          loading={loading}
          disabled={disabled}
        >
          <a href="https://example.com" target="_blank" rel="noreferrer">
            {content}
          </a>
        </Button>
      );
    }

    return (
      <Button
        variant={variant}
        size={size}
        loading={loading}
        disabled={disabled}
        aria-label={isIconOnly ? label : undefined}
      >
        {content}
      </Button>
    );
  },
  matrix() {
    return (
      <div className="flex flex-col gap-6">
        {SIZES.map((size) => (
          <div key={size} className="flex flex-col gap-2">
            <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
              {size}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant}
                </Button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            states
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button loading>Deploying</Button>
            <Button disabled>Disabled</Button>
            <Button variant="outline" loading>
              Saving
            </Button>
            <Button variant="brand" size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Add">
              <Plus />
            </Button>
          </div>
        </div>
      </div>
    );
  },
});
