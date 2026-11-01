"use client";

import { useState } from "react";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Button } from "@/registry/ui/button/button";
import {
  createDialogHandle,
  Dialog,
  DialogBody,
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

const UPDATES = ["Product updates", "Weekly digest", "Tips and tutorials"] as const;

type Profile = { name: string; email: string };
const PROFILES: readonly [Profile, Profile] = [
  { name: "Alex Morgan", email: "alex@example.com" },
  { name: "Taylor Chen", email: "taylor@example.com" },
];

export function DialogDemo({ showClose, autoSize, phases, content, nested, shared, footerClose }: {
  showClose: boolean; autoSize: boolean; phases: boolean; content: string;
  nested: boolean; shared: boolean; footerClose: boolean;
}) {
  const [handle] = useState(() => createDialogHandle<typeof PROFILES[number]>());
  return (
    <>
      <div className="flex flex-wrap justify-center gap-3">
        <DialogTrigger handle={handle} payload={PROFILES[0]} render={<Button variant="outline" />}>
          {shared ? "Edit Alex" : "Open dialog"}
        </DialogTrigger>
        {shared && <DialogTrigger handle={handle} payload={PROFILES[1]} render={<Button variant="outline" />}>Edit Taylor</DialogTrigger>}
      </div>
      <Dialog handle={handle}>
        {({ payload = PROFILES[0] }) => (
          <DialogContent showClose={showClose} autoSize={autoSize} className={autoSize ? undefined : "h-[32rem]"}>
            {phases ? <ProfileDialogSteps key={payload.email} profile={payload} /> : (
              <>
                <DialogHeader>
                  <DialogTitle>{shared ? `Edit ${payload.name}` : "Edit profile"}</DialogTitle>
                  <DialogDescription>Update your profile details.</DialogDescription>
                </DialogHeader>
                <DialogBody key={payload.email} contentClassName="space-y-3 py-1">
                  {(content === "long" ? ["Name", "Email", "Username", "Bio", "Location", "Website", "Company", "Phone", "Pronouns", "Time zone"] : ["Name", "Email"]).map((label) => (
                    <label key={label} className="flex flex-col gap-1.5">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <Input tone="accent" defaultValue={label === "Name" ? payload.name : label === "Email" ? payload.email : ""} />
                    </label>
                  ))}
                  {nested && (
                    <Dialog>
                      <DialogTrigger render={<Button variant="outline" />}>Profile visibility</DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Profile visibility</DialogTitle>
                          <DialogDescription>Choose who can find your profile.</DialogDescription>
                        </DialogHeader>
                        <DialogBody><Checkbox defaultChecked label="Show my profile to teammates" /></DialogBody>
                        <DialogFooter showCloseButton />
                      </DialogContent>
                    </Dialog>
                  )}
                </DialogBody>
                <DialogFooter showCloseButton={footerClose}>
                  {!footerClose && <DialogClose render={<Button variant="ghost">Cancel</Button>} />}
                  <DialogClose render={<Button variant="primary">Save changes</Button>} />
                </DialogFooter>
              </>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

export function ProfileDialogSteps({ profile = PROFILES[0] }: { profile?: typeof PROFILES[number] }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [updates, setUpdates] = useState<Record<(typeof UPDATES)[number], boolean>>({
    "Product updates": true,
    "Weekly digest": true,
    "Tips and tutorials": false,
  });
  const selectedUpdates = UPDATES.filter((label) => updates[label]);

  return (
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
            <Input tone="accent" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Email</span>
            <Input tone="accent" value={email} onChange={(event) => setEmail(event.target.value)} />
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
          {UPDATES.map((label) => (
            <Checkbox
              key={label}
              checked={updates[label]}
              onCheckedChange={(checked) =>
                setUpdates((current) => ({ ...current, [label]: checked }))
              }
              label={label}
            />
          ))}
        </div>
      </DialogStep>

      <DialogStep>
        <DialogHeader>
          <DialogTitle>Review</DialogTitle>
          <DialogDescription>
            Review your profile details and notification preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{name || "No name entered"}</p>
          <p>{email || "No email entered"}</p>
          <p className="mt-2">
            {selectedUpdates.length > 0
              ? `Updates: ${selectedUpdates.join(", ")}.`
              : "No updates enabled."}
          </p>
        </div>
      </DialogStep>
    </DialogSteps>
  );
}
