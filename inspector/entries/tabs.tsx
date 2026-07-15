import { Tabs, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { defineEntry, select } from "../schema";

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
  },
  render({ variant }) {
    return (
      <div className="w-full max-w-md">
        <Tabs
          // Remounted per variant so the indicator measures against the new geometry
          // from a clean slate rather than animating between two variants' shapes.
          key={variant}
          variant={variant}
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
