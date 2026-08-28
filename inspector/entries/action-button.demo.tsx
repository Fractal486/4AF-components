"use client";

import { Rocket } from "lucide-react";
import { ActionButton } from "@/registry/ui/action-button/action-button";

export function ActionButtonDemo({
  variant,
  size,
  revertAfter,
  duration,
  fail,
  withIcon,
  pendingMode,
}: {
  variant: "primary" | "outline" | "plain" | "destructive";
  size: "xs" | "sm" | "md" | "lg";
  revertAfter: number;
  duration: number;
  fail: boolean;
  withIcon: boolean;
  pendingMode: "label" | "icon";
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
      revertAfter={revertAfter}
      pendingMode={pendingMode}
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
