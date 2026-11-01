import { AlertDialogDemo } from "./alert-dialog.demo";
import { bool, defineEntry } from "../schema";

export const alertDialogEntry = defineEntry({
  slug: "alert-dialog",
  name: "Alert Dialog",
  controls: {
    destructive: bool(true, "Destructive action"),
    icon: bool(false, "Icon"),
    asyncAction: bool(false, "Async action"),
    fail: bool(false, "Simulate error", (v) => !v.asyncAction),
    outsideDismiss: bool(false, "Close on outside click"),
  },
  render(props) {
    return <AlertDialogDemo {...props} />;
  },
});
