import { Tabs, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { bool, defineEntry, select } from "../schema";

const VARIANTS = ["segment", "pill", "underline"] as const;
const SIZES = ["sm", "md"] as const;

const TABS = [
  { value: "account", label: "Account" },
  { value: "notifications", label: "Notifications" },
  { value: "billing", label: "Billing" },
] as const;

export const tabsEntry = defineEntry({
  slug: "tabs",
  name: "Tabs",
  controls: {
    variant: select(VARIANTS, "segment"),
    size: select(SIZES, "md", "Size"),
    // A dark, borderless pill on a brighter track — segment/pill only, so it's disabled
    // for underline (which has no pill to fill).
    solid: bool(false, "Solid", (v) => v.variant === "underline"),
  },
  render({ variant, size, solid }) {
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
          <TabsList className="self-center">
            {TABS.map((tab) => (
              <TabsTab key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </div>
    );
  },
});
