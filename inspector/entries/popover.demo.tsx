"use client";

import { useState } from "react";
import { Button } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/ui/select/select";
import { Switch } from "@/registry/ui/switch/switch";
import {
  Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverHeader,
  PopoverTitle, PopoverTrigger, createPopoverHandle, type PopoverContentProps,
} from "@/registry/ui/popover/popover";

const UNITS = [
  { value: "px", label: "Pixels" },
  { value: "%", label: "Percent" },
  { value: "rem", label: "Rem" },
] as const;

export function PopoverDemo({ side, modal, content, shared, autoSize }: {
  side: PopoverContentProps["side"];
  modal: boolean;
  content: "short" | "long";
  shared: boolean;
  autoSize: boolean;
}) {
  const [handle] = useState(() => createPopoverHandle<string>());
  const [expanded, setExpanded] = useState(false);
  const trigger = (name: string) => (
    <PopoverTrigger key={name} handle={handle} payload={name}
      render={(props, state) => <Button {...props} variant="outline-ghost" pressed={state.open}>{name}</Button>} />
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {shared ? [trigger("Layer"), trigger("Frame")] : trigger("Dimensions")}
      <Popover handle={handle} modal={modal}>
        {({ payload }) => (
          <PopoverContent side={side} autoSize={autoSize}>
            <PopoverHeader>
              <PopoverTitle>{shared ? `${payload} dimensions` : "Dimensions"}</PopoverTitle>
              <PopoverDescription>
                {content === "long"
                  ? "https://example.com/projects/design-system/components/responsive-layout/dimensions-and-spacing"
                  : "Set the dimensions for the layer."}
              </PopoverDescription>
            </PopoverHeader>
            <div className="flex flex-col gap-2.5">
              {[
                ["Width", "100%"], ["Height", "25px"],
                ...(expanded ? [["Max. width", "300px"], ["Max. height", "none"]] : []),
              ].map(([label, value]) => (
                <label key={label} className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Input tone="accent" defaultValue={value} className="h-8" />
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
              <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
                <span className="text-sm text-muted-foreground">Units</span>
                <Select items={UNITS} defaultValue="px" size="sm">
                  <SelectTrigger variant="outline-ghost" aria-label="Units"><SelectValue /></SelectTrigger>
                  <SelectContent width="trigger">
                    {UNITS.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Lock aspect ratio</span>
                <Switch defaultChecked aria-label="Lock aspect ratio" />
              </div>
            </div>
            {content === "long" && (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 24 }, (_, index) => (
                  <p key={index} className="text-sm text-muted-foreground">Layout rule {index + 1}: keep the layer within its parent’s bounds.</p>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-between gap-2">
              <Button variant="outline-ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
                {expanded ? "Fewer options" : "More options"}
              </Button>
              <PopoverClose render={<Button variant="outline-ghost" size="sm">Done</Button>} />
            </div>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
