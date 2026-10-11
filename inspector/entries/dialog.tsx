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
import { ProfileDialogSteps } from "./dialog.demo";
import { bool, defineEntry } from "../schema";

export const dialogEntry = defineEntry({
  slug: "dialog",
  name: "Dialog",
  controls: {
    showClose: bool(true, "Close button"),
    phases: bool(false, "Phased flow"),
  },
  render({ showClose, phases }) {
    return (
      <Dialog key={phases ? "phased" : "simple"}>
        <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
        {phases ? (
          <DialogContent showClose={showClose}>
            <ProfileDialogSteps />
          </DialogContent>
        ) : (
          <DialogContent showClose={showClose}>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Update your profile details.
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
        )}
      </Dialog>
    );
  },
});
