import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/ui/alert-dialog/alert-dialog";
import { Button } from "@/registry/ui/button/button";
import { bool, defineEntry } from "../schema";

export const alertDialogEntry = defineEntry({
  slug: "alert-dialog",
  name: "Alert Dialog",
  controls: {
    destructive: bool(true, "Destructive action"),
  },
  render({ destructive }) {
    return (
      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant={destructive ? "destructive" : "outline"}>Delete project</Button>}
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project and everything in it. You can&apos;t undo
              this — clicking outside won&apos;t dismiss it, so choose below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant={destructive ? "destructive" : "primary"}>
              {destructive ? "Delete" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
});
