import { Button } from "@/registry/ui/button/button";
import {
  ToastProvider,
  useToast,
  type ToastPosition,
  type ToastStack,
} from "@/registry/ui/toast/toast";
import { defineEntry, num, select } from "../schema";

const POSITIONS = ["bottom-right", "bottom-center"] as const;
const STACKS = ["list", "collapse"] as const;

function ToastDemo({ limit }: { limit: number }) {
  const toast = useToast();

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast.add({
            title: "Changes saved",
            description: "Your profile has been updated.",
            type: "success",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast.add({
            title: "Couldn't save changes",
            description: "Check your connection and try again.",
            type: "error",
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast.add({
            title: "New comment",
            description: "Alex mentioned you in “Q3 planning”.",
            type: "info",
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // `data.morph` makes the title cross-fade between states instead of snapping.
          const id = toast.add({
            title: "Uploading…",
            description: "Sending report.pdf to the server.",
            type: "loading",
            timeout: 0,
            data: { morph: true },
          });
          window.setTimeout(
            () =>
              toast.update(id, {
                title: "Upload complete",
                description: "report.pdf is now available to your team.",
                type: "success",
                timeout: 4000,
                data: { morph: true },
              }),
            2000,
          );
        }}
      >
        Loading → done
      </Button>
      <Button
        className="col-span-2"
        variant="outline"
        size="sm"
        onClick={() =>
          toast.add({
            title: "Message archived",
            description: "Moved out of your inbox to Archive.",
            type: "neutral",
            actionProps: {
              children: "Undo",
              onClick: () =>
                toast.add({
                  title: "Restored",
                  description: "The message is back in your inbox.",
                  type: "success",
                }),
            },
          })
        }
      >
        With action · stack (limit {limit})
      </Button>
    </div>
  );
}

export const toastEntry = defineEntry({
  slug: "toast",
  name: "Toast",
  controls: {
    stack: select(STACKS, "list", "Stack style"),
    position: select(POSITIONS, "bottom-right"),
    limit: num(3, { min: 1, max: 5, step: 1, label: "Stack limit" }),
  },
  render({ stack, position, limit }) {
    return (
      // Remount when the provider props change so it picks them up.
      <ToastProvider
        key={`${stack}-${position}-${limit}`}
        stack={stack as ToastStack}
        position={position as ToastPosition}
        limit={limit}
      >
        <ToastDemo limit={limit} />
      </ToastProvider>
    );
  },
});
