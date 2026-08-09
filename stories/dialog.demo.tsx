"use client";

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

export interface DialogStoryProps {
  showClose: boolean;
  phases: boolean;
}

export function DialogStory({ showClose, phases }: DialogStoryProps) {
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
                  Start with the details you want to update, then move through the phases.
                </DialogDescription>
              </DialogHeader>
              <Input tone="accent" defaultValue="Alex Morgan" aria-label="Name" />
            </DialogStep>

            <DialogStep>
              <DialogHeader>
                <DialogTitle>Preferences</DialogTitle>
                <DialogDescription>
                  Choose how you would like to hear about product updates.
                </DialogDescription>
              </DialogHeader>
              <Input tone="accent" defaultValue="Weekly digest" aria-label="Preference" />
            </DialogStep>

            <DialogStep>
              <DialogHeader>
                <DialogTitle>Review</DialogTitle>
                <DialogDescription>
                  Everything looks ready. Save when you are happy with these changes.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Alex Morgan · Weekly digest
              </div>
            </DialogStep>
          </DialogSteps>
        </DialogContent>
      ) : (
        <DialogContent showClose={showClose}>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Focus is trapped inside; Escape or a click outside closes the dialog.
            </DialogDescription>
          </DialogHeader>
          <Input tone="accent" defaultValue="Alex Morgan" aria-label="Name" />
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancel</Button>} />
            <DialogClose render={<Button>Save changes</Button>} />
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
