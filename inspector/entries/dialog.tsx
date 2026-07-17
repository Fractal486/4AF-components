import { Button } from "@/registry/ui/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogStep,
  DialogSteps,
  DialogTitle,
  DialogTrigger,
} from "@/registry/ui/dialog/dialog";
import { Input } from "@/registry/ui/input/input";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
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
            <DialogSteps labels={["Profile", "Preferences", "Review"]}>
              <DialogStep>
                <DialogHeader>
                  <DialogTitle>Profile</DialogTitle>
                  <DialogDescription>
                    Start with the details you want to update. Use the arrows or dots to move
                    between phases.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <Input tone="accent" defaultValue="Alex Morgan" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <Input tone="accent" defaultValue="alex@example.com" />
                  </label>
                </div>
              </DialogStep>

              <DialogStep>
                <DialogHeader>
                  <DialogTitle>Preferences</DialogTitle>
                  <DialogDescription>
                    Choose which updates you want to receive. Your choices can be changed later.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                  {["Product updates", "Weekly digest", "Tips and tutorials"].map((label) => (
                    <Checkbox
                      key={label}
                      size="sm"
                      defaultChecked={label !== "Tips and tutorials"}
                      label={label}
                    />
                  ))}
                </div>
              </DialogStep>

              <DialogStep>
                <DialogHeader>
                  <DialogTitle>Review</DialogTitle>
                  <DialogDescription>
                    Everything looks ready. Save when you are happy with these changes.
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Alex Morgan</p>
                  <p>alex@example.com</p>
                  <p className="mt-2">Product updates and weekly digest enabled.</p>
                </div>

              </DialogStep>
            </DialogSteps>
          </DialogContent>
        ) : (
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
        )}
      </Dialog>
    );
  },
});
