"use client";

import { Rocket } from "lucide-react";
import { ActionButton } from "@/registry/ui/action-button/action-button";
import type { MorphStyle } from "@/registry/ui/morph/morph";

export function ActionButtonDemo({
  variant,
  size,
  morph,
  revertAfter,
  duration,
  fail,
}: {
  variant: "primary" | "brand" | "outline" | "destructive";
  size: "sm" | "md" | "lg";
  morph: MorphStyle;
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
      key={`${variant}-${size}-${morph}-${revertAfter}-${duration}-${fail}`}
      action={deploy}
      variant={variant}
      size={size}
      morph={morph}
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
