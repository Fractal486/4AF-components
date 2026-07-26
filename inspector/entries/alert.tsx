import { Alert } from "@/registry/ui/alert/alert";
import { defineEntry, select, text } from "../schema";

const VARIANTS = ["error", "warning", "success", "info", "loading"] as const;

/** Each variant carries a message that reads like the thing it is. */
const MESSAGES: Record<(typeof VARIANTS)[number], string> = {
  error: "Please enter a valid email address.",
  warning: "This address is unverified — we may not be able to reach you.",
  success: "Address verified.",
  info: "We'll only use this to send receipts.",
  loading: "Checking whether this address is reachable…",
};

export const alertEntry = defineEntry({
  slug: "alert",
  name: "Alert",
  controls: {
    variant: select(VARIANTS, "error"),
    message: text("", "Message", "Leave empty for the variant's own"),
  },
  render({ variant, message }) {
    return <Alert variant={variant}>{message || MESSAGES[variant]}</Alert>;
  },
});
