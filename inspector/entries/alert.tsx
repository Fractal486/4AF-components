"use client";

import { useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Alert, AlertTitle, AlertDescription, AlertClose } from "@/registry/ui/alert/alert";
import { Button } from "@/registry/ui/button/button";
import { bool, defineEntry, select, withIcons } from "../schema";
import { ALERT_VARIANT_ICONS } from "../setting-icons";

const VARIANTS = ["error", "warning", "success", "info", "loading"] as const;
const MESSAGES: Record<(typeof VARIANTS)[number], string> = {
  error: "Please enter a valid email address.",
  warning: "This address is unverified — we may not be able to reach you.",
  success: "Address verified.",
  info: "We'll only use this to send receipts.",
  loading: "Checking whether this address is reachable…",
};

function AlertPreview({ variant, title, dismissible, icon }: {
  variant: (typeof VARIANTS)[number]; title: boolean;
  dismissible: boolean; icon: "default" | "custom" | "none";
}) {
  const [open, setOpen] = useState(true);
  const frameRef = useRef<HTMLDivElement>(null);
  const [alertElement, setAlertElement] = useState<HTMLDivElement | null>(null);
  const [exitSize, setExitSize] = useState<{ width: number; height: number }>();

  function changeOpen(next: boolean) {
    if (!next && frameRef.current) {
      const { width, height } = frameRef.current.getBoundingClientRect();
      setExitSize({ width, height });
    }
    setOpen(next);
  }

  return (
    // Keep the centered canvas steady while the alert fades. The panel's ref clears
    // after Base UI finishes the exit, including reduced motion; no duplicate timer.
    <div ref={frameRef} className="relative w-full max-w-lg" style={open ? undefined : exitSize}>
      <Alert ref={setAlertElement} variant={variant} open={open} onOpenChange={changeOpen}
        icon={icon === "none" ? null : icon === "custom" ? <Bell /> : undefined}>
        {title && <AlertTitle>Email address</AlertTitle>}
        <AlertDescription>{MESSAGES[variant]}</AlertDescription>
        {dismissible && <AlertClose />}
      </Alert>
      {!open && !alertElement && <Button size="sm" variant="outline-ghost"
        className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-(--duration-base) starting:opacity-0"
        onClick={() => changeOpen(true)}>Show alert</Button>}
    </div>
  );
}

export const alertEntry = defineEntry({
  slug: "alert",
  name: "Alert",
  controls: {
    variant: withIcons(select(VARIANTS, "error"), ALERT_VARIANT_ICONS),
    icon: select(["default", "custom", "none"] as const, "default", "Icon"),
    title: bool(false, "Title"),
    dismissible: bool(false, "Dismissible"),
  },
  render(values) {
    return <AlertPreview key={JSON.stringify(values)} {...values} />;
  },
});
