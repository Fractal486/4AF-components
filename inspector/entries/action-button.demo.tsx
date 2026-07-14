"use client";

import { Rocket } from "lucide-react";
import { ActionButton } from "@/registry/ui/action-button/action-button";

export function ActionButtonDemo({
  variant,
  size,
  revertAfter,
  duration,
  fail,
}: {
  variant: "primary" | "outline" | "plain" | "destructive";
  size: "sm" | "md" | "lg";
  revertAfter: number;
  duration: number;
  fail: boolean;
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
      key={`${variant}-${size}-${revertAfter}-${duration}-${fail}`}
      action={deploy}
      variant={variant}
      size={size}
      revertAfter={revertAfter}
      icon={<Rocket />}
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
