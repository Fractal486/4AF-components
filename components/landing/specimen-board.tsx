"use client";

import { Star } from "lucide-react";
import { ActionButton } from "@/registry/ui/action-button/action-button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { Slider } from "@/registry/ui/slider/slider";
import { Switch } from "@/registry/ui/switch/switch";
import { Tabs, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { Toggle } from "@/registry/ui/toggle/toggle";
import { Specimen } from "./specimen";

const REGIONS = {
  ams: "Amsterdam",
  fra: "Frankfurt",
  iad: "Washington",
  sin: "Singapore",
  syd: "Sydney",
} as const;

function deploy() {
  return new Promise((resolve) => setTimeout(resolve, 1400));
}

export function SpecimenBoard() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl bg-border shadow-border sm:grid-cols-2 lg:grid-cols-4">
      <Specimen name="action-button" target="button">
        <ActionButton
          action={deploy}
          labels={{ pending: "Deploying", success: "Deployed", error: "Failed" }}
          announce={{ pending: "Deploying", success: "Deployed", error: "Deploy failed" }}
        >
          Deploy
        </ActionButton>
      </Specimen>

      <Specimen name="switch" target='[role="switch"]'>
        <Switch defaultChecked aria-label="Preview deploys" />
      </Specimen>

      <Specimen name="tabs" target='[role="tablist"]'>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTab value="overview">Overview</TabsTab>
            <TabsTab value="logs">Logs</TabsTab>
            <TabsTab value="settings">Settings</TabsTab>
          </TabsList>
        </Tabs>
      </Specimen>

      <Specimen name="select" target='[role="combobox"]'>
        <Select items={REGIONS} defaultValue="fra">
          <SelectTrigger aria-label="Region" className="w-44">
            <SelectValue placeholder="Pick a region" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(REGIONS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Specimen>

      <Specimen name="slider" target='[role="group"]'>
        <div className="w-full max-w-48">
          <Slider defaultValue={40} aria-label="Volume" />
        </div>
      </Specimen>

      <Specimen name="checkbox" target='[role="checkbox"]'>
        <Checkbox label="Email me on failure" />
      </Specimen>

      <Specimen name="toggle" target="button">
        <Toggle fillIcon aria-label="Star">
          <Star />
        </Toggle>
      </Specimen>

      <Specimen name="copy-button" target="button">
        <CopyButton value="pnpm 4af install copy-button">Copy command</CopyButton>
      </Specimen>
    </div>
  );
}
