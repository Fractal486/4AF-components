import { DialogDemo } from "./dialog.demo";
import { bool, defineEntry, select } from "../schema";

export const dialogEntry = defineEntry({
  slug: "dialog",
  name: "Dialog",
  controls: {
    showClose: bool(true, "Close button"),
    autoSize: bool(true, "Size to content"),
    phases: bool(false, "Phased flow"),
    content: select(["short", "long"], "short", "Content", (v) => Boolean(v.phases)),
    nested: bool(false, "Nested dialog", (v) => Boolean(v.phases)),
    shared: bool(false, "Shared dialog"),
    footerClose: bool(false, "Footer close button", (v) => Boolean(v.phases)),
  },
  render(props) {
    return <DialogDemo {...props} />;
  },
});
