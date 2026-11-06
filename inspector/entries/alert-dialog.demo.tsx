"use client";

import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogBody, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/registry/ui/alert-dialog/alert-dialog";
import { Button } from "@/registry/ui/button/button";

export function AlertDialogDemo({ destructive, icon, asyncAction, fail, outsideDismiss }: {
  destructive: boolean; icon: boolean; asyncAction: boolean; fail: boolean; outsideDismiss: boolean;
}) {
  const [error, setError] = useState(false);
  const Icon = destructive ? Trash2 : Send;
  return (
    <AlertDialog disablePointerDismissal={!outsideDismiss} onOpenChange={open => { if (open) setError(false); }}>
      <AlertDialogTrigger render={<Button variant={destructive ? "destructive" : "outline-ghost"} />}>
        {destructive ? "Delete project" : "Publish changes"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogBody>
          <AlertDialogHeader>
            {icon && <AlertDialogMedia variant={destructive ? "destructive" : "default"}><Icon /></AlertDialogMedia>}
            <AlertDialogTitle>{destructive ? "Delete this project?" : "Publish these changes?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {error ? <span role="alert">Something went wrong. Try again.</span>
                : destructive ? "This permanently deletes the project and its contents."
                : "Your changes will be visible to everyone in the workspace."}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-ghost" />
          <AlertDialogAction variant={destructive ? "destructive" : "outline-ghost"}
            onClick={() => {
              setError(false);
              if (asyncAction) return new Promise<void>((resolve, reject) => {
                setTimeout(() => fail ? reject(new Error("Demo request failed")) : resolve(), 1200);
              });
            }}
            onError={() => setError(true)}
          >
            {destructive ? "Delete" : "Publish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
