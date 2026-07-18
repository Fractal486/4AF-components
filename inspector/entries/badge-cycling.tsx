"use client";

import { useEffect, useState } from "react";
import { Badge, type BadgeProps } from "@/registry/ui/badge/badge";

// A representative status flow, so the badge rolls through the whole set on its own.
const CYCLE: { status: NonNullable<BadgeProps["status"]>; label: string }[] = [
  { status: "neutral", label: "Draft" },
  { status: "info", label: "In review" },
  { status: "loading", label: "Processing" },
  { status: "success", label: "Approved" },
  { status: "warning", label: "Needs changes" },
  { status: "danger", label: "Rejected" },
];

/**
 * Its own client component (not inline in the entry) so the entry module stays free of
 * React-hook imports — the entry is also read on the server for page metadata.
 */
export function CyclingBadge({
  variant,
  size,
  dot,
}: {
  variant: BadgeProps["variant"];
  size: BadgeProps["size"];
  dot?: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((n) => (n + 1) % CYCLE.length), 1800);
    return () => window.clearInterval(id);
  }, []);

  const { status, label } = CYCLE[index] ?? CYCLE[0]!;
  return (
    <Badge variant={variant} status={status} size={size} dot={dot}>
      {label}
    </Badge>
  );
}
