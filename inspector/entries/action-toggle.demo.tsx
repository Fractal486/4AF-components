"use client";

import { Check, Plus } from "lucide-react";
import { ActionToggle } from "@/registry/ui/action-toggle/action-toggle";
import type { ControlVariant, TextSize } from "../button-options";

export function ActionToggleDemo({
  variant,
  size,
  shape,
  status,
  fail,
  sizing,
}: {
  variant: ControlVariant;
  size: TextSize;
  shape: "rectangular" | "pill";
  status: "automatic" | "pending" | "error";
  fail: boolean;
  sizing: "widest" | "current";
}) {
  async function follow() {
    await new Promise((resolve, reject) =>
      setTimeout(() => (fail ? reject(new Error("Network error")) : resolve(null)), 1200),
    );
  }

  return (
    <ActionToggle
      // Changing a simulation setting starts a fresh demo action.
      key={`${variant}-${size}-${fail}-${status}`}
      action={follow}
      status={status === "automatic" ? undefined : status}
      error={status === "error" ? new Error("Network error") : undefined}
      variant={variant}
      size={size}
      shape={shape}
      sizing={sizing}
      icon={<Plus />}
      icons={{ pressed: <Check /> }}
      labels={{ pressed: "Following", error: error => error instanceof Error ? error.message : "Try again" }}
      announce={{ pending: "Updating follow status", error: "Could not update follow status" }}
    >
      Follow
    </ActionToggle>
  );
}
