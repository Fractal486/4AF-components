import { DialogDemo } from "./dialog.demo";
import { bool, defineEntry, select } from "../schema";

export const dialogEntry = defineEntry({
  slug: "dialog",
  name: "Dialog",
  controls: {
    showClose: bool(true, "Close button"),
    autoSize: bool(true, "Size to content"),
    // A short or long form, or a phased flow that steps between views of one dialog.
    content: select(["short", "long", "phased"], "short", "Content"),
    nested: bool(false, "Nested dialog", (v) => v.content === "phased"),
    footerClose: bool(false, "Footer close button", (v) => v.content === "phased"),
    shared: bool(false, "Shared dialog"),
  },
  render({ content, ...props }) {
    return <DialogDemo {...props} phases={content === "phased"} content={content} />;
  },
});
