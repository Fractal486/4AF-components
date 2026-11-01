import { Bell, CreditCard, Plug, Shield, User, Users } from "lucide-react";
import { Tabs, TabsCount, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { bool, defineEntry, select } from "../schema";

const VARIANTS = ["segment", "pill", "underline"] as const;
const SIZES = ["sm", "md"] as const;
const APPEARANCES = ["default", "solid", "outline"] as const;

const TABS = [
  { value: "account", label: "Account", icon: User, count: undefined },
  { value: "notifications", label: "Notifications", icon: Bell, count: 12 },
  { value: "billing", label: "Billing", icon: CreditCard, count: 3 },
];

export const tabsEntry = defineEntry({
  slug: "tabs",
  name: "Tabs",
  controls: {
    variant: select(VARIANTS, "segment"),
    size: select(SIZES, "md", "Size"),
    orientation: select(["horizontal", "vertical"], "horizontal", "Orientation"),
    overflow: bool(false, "Many tabs"),
    // The track treatment — segment/pill only, so it's disabled for underline.
    appearance: select(APPEARANCES, "default", "Appearance", (v) => v.variant === "underline"),
    counts: bool(false, "Counts"),
    icons: bool(false, "Icons"),
  },
  render({ variant, size, appearance, orientation, overflow, counts, icons }) {
    return (
      <div className="w-full max-w-md">
        <Tabs
          // Remounted per variant and size so the indicator measures against the new
          // geometry from a clean slate rather than animating between two shapes.
          key={`${variant}-${size}`}
          variant={variant}
          size={size}
          appearance={appearance}
          orientation={orientation}
          defaultValue="account"
        >
          {/* The track hugs its tabs and sits at the start of the column, which is right in a
              page and wrong in a centred preview — it would sit against the left edge of the
              28rem box the demo gives it. Only `align-self` changes; the underline variant is
              `w-full` and spans the box either way. */}
          <TabsList className={orientation === "vertical" ? "mx-auto" : "self-center"}
            style={orientation === "vertical" && overflow ? { maxHeight: 160 } : undefined}
            maxWidth={orientation === "horizontal" && overflow ? 280 : undefined}>
            {[...TABS, ...(overflow ? [
              { value: "team", label: "Team members", icon: Users, count: undefined },
              { value: "security", label: "Security", icon: Shield, count: undefined },
              { value: "integrations", label: "Integrations", icon: Plug, count: undefined },
            ] : [])].map((tab) => (
              <TabsTab key={tab.value} value={tab.value}>
                {icons && <tab.icon aria-hidden />}
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
