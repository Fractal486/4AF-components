import { Tabs, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { bool, defineEntry, select } from "../schema";

const VARIANTS = ["segment", "pill", "underline"] as const;

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
    // A dark, borderless pill on a brighter track — segment/pill only, so it's disabled
    // for underline (which has no pill to fill).
    solid: bool(false, "Solid", (v) => v.variant === "underline"),
  },
  render({ variant, solid }) {
    return (
      <div className="w-full max-w-md">
        <Tabs
          // Remounted per variant so the indicator measures against the new geometry
          // from a clean slate rather than animating between two variants' shapes.
          key={variant}
          variant={variant}
          solid={solid}
          defaultValue="account"
        >
          <TabsList>
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
