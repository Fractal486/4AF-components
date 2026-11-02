import { AlertDialogDemo } from "./alert-dialog.demo";
import { bool, defineEntry, select } from "../schema";

export const alertDialogEntry = defineEntry({
  slug: "alert-dialog",
  name: "Alert Dialog",
  controls: {
    destructive: bool(true, "Destructive action"),
    icon: bool(false, "Icon"),
    // Instant closes on press; async shows the pending state, and failing ends in an error.
    action: select(["instant", "async", "failing"], "instant", "Action"),
    outsideDismiss: bool(false, "Close on outside click"),
  },
  render({ action, ...props }) {
    return <AlertDialogDemo {...props} asyncAction={action !== "instant"} fail={action === "failing"} />;
  },
});
