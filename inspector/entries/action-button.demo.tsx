"use client";

import { Rocket } from "lucide-react";
import { ActionButton } from "@/registry/ui/action-button/action-button";
import type { ControlVariant, TextSize } from "../button-options";

export function ActionButtonDemo({
  variant,
  size,
  shape,
  status,
  fail,
  withIcon,
  pendingMode,
  sizing,
}: {
  variant: ControlVariant;
  size: TextSize;
  shape: "rectangular" | "pill";
  status: "automatic" | "pending" | "success" | "error";
  fail: boolean;
  withIcon: boolean;
  pendingMode: "label" | "icon";
  sizing: "widest" | "current";
}) {
  async function deploy() {
    await new Promise((resolve, reject) =>
      setTimeout(() => (fail ? reject(new Error("Deploy failed")) : resolve(null)), 1200),
    );
  }

  return (
    <ActionButton
      // Changing a simulation setting starts a fresh demo action.
      key={`${variant}-${size}-${fail}-${withIcon}-${pendingMode}-${status}`}
      action={deploy}
      status={status === "automatic" ? undefined : status}
      error={status === "error" ? new Error("Deploy failed") : undefined}
      variant={variant}
      size={size}
      shape={shape}
      revertAfter={{ success: 2000, error: 4000 }}
      pendingMode={pendingMode}
      sizing={sizing}
      icon={withIcon ? <Rocket /> : undefined}
      labels={{ pending: "Deploying", success: "Deployed", error: error => error instanceof Error ? error.message : "Failed" }}
      announce={{
        pending: "Deploying",
        success: "Deployed successfully",
        error: "Deploy failed",
      }}
    >
      Deploy
    </ActionButton>
  );
}
