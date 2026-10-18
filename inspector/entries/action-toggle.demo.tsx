"use client";

import { Check, Plus } from "lucide-react";
import { ActionToggle } from "@/registry/ui/action-toggle/action-toggle";
import type { ControlVariant, TextSize } from "../button-options";

export function ActionToggleDemo({
  variant,
  size,
  shape,
  duration,
  fail,
  sizing,
}: {
  variant: ControlVariant;
  size: TextSize;
  shape: "rectangular" | "pill";
  duration: number;
  fail: boolean;
  sizing: "widest" | "current";
}) {
  async function follow() {
    await new Promise((resolve, reject) =>
      setTimeout(() => (fail ? reject(new Error("Network error")) : resolve(null)), duration),
    );
  }

  return (
    <ActionToggle
      // Remounted when the settings change so it starts from unpressed rather than
      // mid-flight — an uncontrolled state machine ignores changed props otherwise.
      key={`${variant}-${size}-${duration}-${fail}`}
      action={follow}
      variant={variant}
      size={size}
      shape={shape}
      sizing={sizing}
      icon={<Plus />}
      icons={{ pressed: <Check /> }}
      labels={{ pressed: "Following", error: "Try again" }}
      announce={{ pending: "Updating follow status", error: "Could not update follow status" }}
    >
      Follow
    </ActionToggle>
  );
}
