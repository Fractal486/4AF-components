"use client";

import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Languages,
  Download,
  File,
  Folder,
  Link2,
  Mail,
  Pencil,
  RefreshCw,
  RotateCw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";
import {
  ContextMenu,
  ContextMenuActionItem,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/ui/context-menu/context-menu";
import { bool, defineEntry, select } from "../schema";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const FILES = [
  { name: "Quarterly report.pdf", kind: "file" },
  { name: "Brand assets", kind: "folder" },
  { name: "Roadmap 2027.md", kind: "file" },
] as const;

export const contextMenuEntry = defineEntry({
  slug: "context-menu",
  name: "Context Menu",
  controls: {
    target: select(["area", "rows"], "area", "Target"),
    holdFeedback: bool(true, "Hold feedback"),
    disabled: bool(false, "Disabled"),
  },
  render: ({ target, holdFeedback, disabled }) =>
    target === "rows" ? (
      <FileList holdFeedback={holdFeedback} disabled={disabled} />
    ) : (
      <PageArea holdFeedback={holdFeedback} disabled={disabled} />
    ),
});

interface DemoProps {
  holdFeedback: boolean;
  disabled: boolean;
}

function PageArea({ holdFeedback, disabled }: DemoProps) {
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu disabled={disabled}>
      <ContextMenuTrigger
        holdFeedback={holdFeedback}
        className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
      >
        {disabled ? "Browser menu" : "Right click or long press"}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem>
          <ArrowLeft />
          Back
          <ContextMenuShortcut keys="mod+[" />
        </ContextMenuItem>
        <ContextMenuItem disabled disabledReason="There is no next page.">
          <ArrowRight />
          Forward
          <ContextMenuShortcut keys="mod+]" />
        </ContextMenuItem>
        <ContextMenuItem>
          <RotateCw />
          Reload
          <ContextMenuShortcut keys="mod+r" />
        </ContextMenuItem>
        {/* A persistent state, so a deferred toggle rather than a transient action: the
            loader takes the icon's place until the work settles, then the label morphs. */}
        <ContextMenuCheckboxItem
          indicator={false}
          icon={<Languages />}
          action={() => wait(1200)}
          announce={{ pending: "Translating page" }}
        >
          {(checked) => (
            <Morph activeKey={checked ? "on" : "off"} items={{ on: "Show original", off: "Translate page" }} />
          )}
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>More tools</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52">
            <ContextMenuItem>
              Save page as…
              <ContextMenuShortcut keys="mod+shift+s" />
            </ContextMenuItem>
            <ContextMenuItem>Create shortcut…</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Developer tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem defaultChecked>Show bookmarks bar</ContextMenuCheckboxItem>
        {/* Deferred: the tick waits and the loader runs in its slot until the save settles. */}
        <ContextMenuCheckboxItem action={() => wait(1200)} announce={{ pending: "Updating URL setting" }}>
          Show full URLs
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuGroup aria-label="Zoom">
          <ContextMenuLabel>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
            <ContextMenuRadioItem value="90">90%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="125">125%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function FileList({ holdFeedback, disabled }: DemoProps) {
  const [removed, setRemoved] = useState<string[]>([]);
  const files = FILES.filter((file) => !removed.includes(file.name));

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex min-h-[46px] flex-col gap-0.5">
        {files.map((file) => (
          <FileRow
            key={file.name}
            name={file.name}
            kind={file.kind}
            holdFeedback={holdFeedback}
            disabled={disabled}
            onDelete={() => setRemoved((value) => [...value, file.name])}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        disabled={removed.length === 0}
        onClick={() => setRemoved([])}
      >
        <RefreshCw />
        Restore files
      </Button>
    </div>
  );
}

function FileRow({
  name,
  kind,
  holdFeedback,
  disabled,
  onDelete,
}: DemoProps & { name: string; kind: "file" | "folder"; onDelete: () => void }) {
  const [starred, setStarred] = useState(false);
  const Icon = kind === "folder" ? Folder : File;

  return (
    <ContextMenu disabled={disabled}>
      {/* The open row keeps the hover fill, so it's clear which file the menu acts on. */}
      <ContextMenuTrigger
        holdFeedback={holdFeedback}
        className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-foreground hover:bg-muted/50 data-[popup-open]:bg-muted/50 [&_svg]:size-4 [&_svg]:text-muted-foreground"
      >
        <Icon aria-hidden />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        {starred && <Star aria-label="Starred" />}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem>
          <Pencil />
          Rename…
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy />
          Duplicate
          <ContextMenuShortcut keys="mod+d" />
        </ContextMenuItem>
        <ContextMenuActionItem
          icon={<Download />}
          action={() => wait(1200)}
          labels={{ pending: "Downloading…", success: "Downloaded" }}
          announce={{ pending: `Downloading ${name}`, success: `${name} downloaded` }}
        >
          Download
        </ContextMenuActionItem>
        <ContextMenuCheckboxItem checked={starred} onCheckedChange={setStarred}>
          <Star />
          Starred
        </ContextMenuCheckboxItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Share2 />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>
              <Mail />
              Email
            </ContextMenuItem>
            <ContextMenuItem>
              <Link2 />
              Copy link
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
