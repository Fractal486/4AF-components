import { Button } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/ui/sheet/sheet";
import { defineEntry, select } from "../schema";

const SIDES = ["right", "left", "top", "bottom"] as const;

export const sheetEntry = defineEntry({
  slug: "sheet",
  name: "Sheet",
  controls: {
    side: select(SIDES, "right"),
    exitMotion: select(["fade", "slide"] as const, "fade", "Exit motion"),
  },
  render({ side, exitMotion }) {
    return (
      <Sheet>
        <SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
        <SheetContent side={side} exitMotion={exitMotion}>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Update your profile details.
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="flex flex-col gap-3 py-2">
            {[
              "Name",
              "Username",
              "Email",
              "Bio",
              "Location",
              "Website",
              "Company",
              "Phone",
            ].map((label) => (
              <label key={label} className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Input tone="accent" defaultValue={label} />
              </label>
            ))}
          </SheetBody>

          <SheetFooter>
            <SheetClose render={<Button variant="ghost">Cancel</Button>} />
            <SheetClose render={<Button variant="primary">Save changes</Button>} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
});
