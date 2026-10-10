import { Tabs, TabsCount, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { bool, defineEntry, num, select } from "../schema";

const VARIANTS = ["segment", "pill", "underline", "outline"] as const;
const SIZES = ["sm", "md"] as const;

const TABS: readonly { value: string; label: string; count?: number }[] = [
  { value: "account", label: "Account" },
  { value: "notifications", label: "Notifications", count: 12 },
  { value: "billing", label: "Billing", count: 3 },
];

export const tabsEntry = defineEntry({
  slug: "tabs",
  name: "Tabs",
  controls: {
    variant: select(VARIANTS, "segment"),
    size: select(SIZES, "md", "Size"),
    overflow: bool(false, "Scrollable"),
    maxWidth: num(280, { min: 160, max: 440, step: 20, label: "Max width" }),
    // A dark, borderless pill on a brighter track — segment/pill only, so it's disabled
    // for underline (which has no pill to fill).
    solid: bool(false, "Solid", (v) => v.variant === "underline" || v.variant === "outline"),
    counts: bool(false, "Counts"),
  },
  render({ variant, size, solid, overflow, maxWidth, counts }) {
    return (
      <div className="w-full max-w-md">
        <Tabs
          // Remounted per variant and size so the indicator measures against the new
          // geometry from a clean slate rather than animating between two shapes.
          key={`${variant}-${size}`}
          variant={variant}
          size={size}
          solid={solid}
          defaultValue="account"
        >
          {/* The track hugs its tabs and sits at the start of the column, which is right in a
              page and wrong in a centred preview — it would sit against the left edge of the
              28rem box the demo gives it. Only `align-self` changes; the underline variant is
              `w-full` and spans the box either way. */}
          <TabsList className="self-center" maxWidth={overflow ? maxWidth : undefined}>
            {[...TABS, ...(overflow ? [
              { value: "team", label: "Team members" },
              { value: "security", label: "Security" },
              { value: "integrations", label: "Integrations" },
            ] : [])].map((tab) => (
              <TabsTab key={tab.value} value={tab.value}>
                {tab.label}
                {counts && tab.count !== undefined && <TabsCount>{tab.count}</TabsCount>}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </div>
    );
  },
});
