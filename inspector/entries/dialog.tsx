import { Button } from "@/registry/ui/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/ui/dialog/dialog";
import { Input } from "@/registry/ui/input/input";
import { bool, defineEntry } from "../schema";

export const dialogEntry = defineEntry({
  slug: "dialog",
  name: "Dialog",
  controls: {
    showClose: bool(true, "Close button"),
  },
  render({ showClose }) {
    return (
      <Dialog>
        <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
        <DialogContent showClose={showClose}>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile. Focus is trapped inside, the page behind is
              inert, and Escape or a click outside closes it.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {["Name", "Email"].map((label) => (
              <label key={label} className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Input tone="accent" defaultValue={label} />
              </label>
            ))}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancel</Button>} />
            <DialogClose render={<Button variant="primary">Save changes</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
});
