"use client";

import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/registry/ui/button/button";

type ButtonVariant = "primary" | "outline" | "ghost" | "plain" | "destructive" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon" | "icon-lg";

export interface ButtonStoryProps {
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
  icon: "none" | "leading" | "trailing";
  loading: boolean;
  disabled: boolean;
  asChild: boolean;
}

export function ButtonStory({
  variant,
  size,
  label,
  icon,
  loading,
  disabled,
  asChild,
}: ButtonStoryProps) {
  const isIconOnly = size.startsWith("icon");
  const content = isIconOnly ? (
    <Plus />
  ) : (
    <>
      {icon === "leading" && <Plus />}
      {label}
      {icon === "trailing" && <ArrowRight />}
    </>
  );

  if (asChild) {
    return (
      <Button asChild variant={variant} size={size} loading={loading} disabled={disabled}>
        <a href="https://example.com" target="_blank" rel="noreferrer">
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      loading={loading}
      disabled={disabled}
      aria-label={isIconOnly ? label : undefined}
    >
      {content}
    </Button>
  );
}
