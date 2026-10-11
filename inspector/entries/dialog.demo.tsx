"use client";

import { useState } from "react";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  DialogDescription,
  DialogHeader,
  DialogStep,
  DialogSteps,
  DialogTitle,
} from "@/registry/ui/dialog/dialog";
import { Input } from "@/registry/ui/input/input";

const UPDATES = ["Product updates", "Weekly digest", "Tips and tutorials"] as const;

export function ProfileDialogSteps() {
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@example.com");
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
