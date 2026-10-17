"use client";

import { Rocket } from "lucide-react";
import { ActionButton } from "@/registry/ui/action-button/action-button";

export function ActionButtonDemo({
  variant,
  size,
  shape,
  revertAfter,
  duration,
  fail,
  withIcon,
  pendingMode,
  sizing,
}: {
  variant: "primary" | "outline" | "plain" | "destructive";
  size: "xs" | "sm" | "md" | "lg";
  shape: "rectangular" | "pill";
  revertAfter: number;
  duration: number;
  fail: boolean;
  withIcon: boolean;
  pendingMode: "label" | "icon";
  sizing: "widest" | "current";
}) {
  async function deploy() {
    await new Promise((resolve, reject) =>
      setTimeout(() => (fail ? reject(new Error("Deploy failed")) : resolve(null)), duration),
    );
  }

  return (
    <ActionButton
      // Remounted when the settings change so it starts from idle rather than
      // mid-flight — an uncontrolled state machine ignores changed props otherwise.
      key={`${variant}-${size}-${revertAfter}-${duration}-${fail}-${withIcon}-${pendingMode}`}
      action={deploy}
      variant={variant}
      size={size}
      shape={shape}
      revertAfter={revertAfter}
      pendingMode={pendingMode}
      sizing={sizing}
      icon={withIcon ? <Rocket /> : undefined}
      labels={{ pending: "Deploying", success: "Deployed", error: "Failed" }}
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
