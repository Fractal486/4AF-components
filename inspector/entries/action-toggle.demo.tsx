"use client";

import { Check, Plus } from "lucide-react";
import { ActionToggle } from "@/registry/ui/action-toggle/action-toggle";
import type { ControlVariant, TextSize } from "../button-options";

export function ActionToggleDemo({
  variant,
  size,
  shape,
  status,
  duration,
  fail,
  sizing,
}: {
  variant: ControlVariant;
  size: TextSize;
  shape: "rectangular" | "pill";
  status: "automatic" | "idle" | "pending" | "error";
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
      // Changing a simulation setting starts a fresh demo action.
      key={`${variant}-${size}-${duration}-${fail}-${status}`}
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
