"use client";

import type { ReactNode } from "react";
import { ActionButton } from "@/registry/ui/action-button/action-button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Badge } from "@/registry/ui/badge/badge";
import { ClassicLoader } from "@/registry/ui/classic-loader/classic-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { Slider } from "@/registry/ui/slider/slider";
import { Tabs, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";

const SORTS = {
  newest: "Newest",
  oldest: "Oldest",
  name: "Name",
  size: "Size",
} as const;

const TABS = ["Preview", "Usage", "API", "Examples", "Accessibility", "Changelog"];

function save() {
  return new Promise((resolve) => setTimeout(resolve, 1400));
}

/** One live component, centred in its tile. */
function Cell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-44 items-center justify-center bg-background px-6 py-10">{children}</div>;
}

/** The landing page's standout components, each live. */
export function SpecimenBoard() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-3">
      <Cell>
        <Select items={SORTS} defaultValue="name">
          <SelectTrigger aria-label="Sort" label="Sort" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORTS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Cell>

      <Cell>
        <ActionButton
          action={save}
          pendingMode="icon"
          loader={<ClassicLoader />}
          labels={{ pending: "Saving", success: "Saved", error: "Failed" }}
          announce={{ pending: "Saving", success: "Saved", error: "Save failed" }}
        >
          Save changes
        </ActionButton>
      </Cell>

      <Cell>
        <Tabs
          variant="segment"
          appearance="outline"
          defaultValue="preview"
          // Full width of the tile, so the list's `min(100%, maxWidth)` has a real width to
          // resolve against; a content-sized root would grow to fit every tab and never clip.
          className="w-full min-w-0 items-center"
        >
          {/* Narrower than its tabs, so the list scrolls with fades at the clipped edges. */}
          <TabsList maxWidth={240} className="self-center">
            {TABS.map((tab) => (
              <TabsTab key={tab} value={tab.toLowerCase()}>
                {tab}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </Cell>

      <Cell>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge size="md" status="neutral">Draft</Badge>
          <Badge size="md" status="info">In review</Badge>
          <Badge size="md" status="success">Approved</Badge>
          <Badge size="md" status="warning">Needs changes</Badge>
          <Badge size="md" status="danger">Rejected</Badge>
        </div>
      </Cell>

      <Cell>
        <Checkbox label="Remember me" />
      </Cell>

      <Cell>
        <div className="w-full max-w-60">
          <Slider thumb="bar" label="Volume" inlineLabel showTicks step={25} defaultValue={50} />
        </div>
      </Cell>
    </div>
  );
}
