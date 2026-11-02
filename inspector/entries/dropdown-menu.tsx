"use client";

import {
  Archive,
  Bell,
  BellOff,
  Bookmark,
  CreditCard,
  Download,
  Ellipsis,
  Link2,
  LogOut,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";
import {
  DropdownMenu,
  createDropdownMenuHandle,
  DropdownMenuActionItem,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSelect,
  DropdownMenuSelectContent,
  DropdownMenuSelectItem,
  DropdownMenuSelectTrigger,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
import { bool, defineEntry, select } from "../schema";
import { SafeTriangleOverlay } from "./dropdown-menu.safe-triangle";

const SIDES = ["bottom", "top", "right", "left"] as const;
const ALIGNS = ["start", "center", "end"] as const;
// One menu per row type, matching the docs sections, so no single menu runs to twenty rows.
const ROWS = ["items", "checkboxes", "toggles", "radio", "actions", "panels"] as const;
type RowKind = (typeof ROWS)[number];
const ROW_LABELS: Record<RowKind, string> = {
  items: "Items",
  checkboxes: "Checkboxes",
  toggles: "Toggles",
  radio: "Radio",
  actions: "Actions",
  panels: "Panels",
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ROWS_BY_KIND: Record<RowKind, () => ReactNode> = {
  items: () => (
    <>
      <DropdownMenuLabel>My account</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <User />
          Profile
          <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled disabledReason="Billing is available on the Pro plan.">
          <CreditCard />
          Billing
          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings />
          Settings
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">
        <Trash2 />
        Delete account
        <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <LogOut />
        Sign out
      </DropdownMenuItem>
    </>
  ),
  checkboxes: () => (
    <>
      <DropdownMenuLabel>View</DropdownMenuLabel>
      <DropdownMenuCheckboxItem defaultChecked>Show toolbar</DropdownMenuCheckboxItem>
      {/* A shortcut sits just before the check, so shortcuts still line up. */}
      <DropdownMenuCheckboxItem>
        Show sidebar
        <DropdownMenuShortcut>⌘\</DropdownMenuShortcut>
      </DropdownMenuCheckboxItem>
      {/* Deferred: the check holds and the loader runs in its slot until the work settles,
          so the row never claims to be on before it is. */}
      <DropdownMenuCheckboxItem action={() => wait(1200)} announce={{ pending: "Updating sync" }}>
        Sync across devices
      </DropdownMenuCheckboxItem>
    </>
  ),
  toggles: () => (
    <>
      {/* A toggle button: no check. `fillIcon` fills the one bookmark glyph on
          check (a fill transition, not a morph); the label text-morphs between states. */}
      <DropdownMenuCheckboxItem fillIcon indicator={false}>
        {(checked) => (
          <>
            <Bookmark />
            <Morph activeKey={checked ? "on" : "off"} items={{ on: "Bookmarked", off: "Bookmark" }} />
          </>
        )}
      </DropdownMenuCheckboxItem>
      {/* The other toggle shape: the glyph genuinely changes, so both the icon and the
          label morph. It is also deferred: the loader takes the icon's place until the
          work settles. */}
      <DropdownMenuCheckboxItem
        indicator={false}
        icon={(checked) => (checked ? <BellOff /> : <Bell />)}
        action={() => wait(1200)}
        announce={{ pending: "Updating mute status" }}
      >
        {(checked) => (
          <Morph activeKey={checked ? "on" : "off"} items={{ on: "Unmute thread", off: "Mute thread" }} />
        )}
      </DropdownMenuCheckboxItem>
      {/* No check and no icon: the loader still shows in the trailing slot. */}
      <DropdownMenuCheckboxItem
        indicator={false}
        action={() => wait(1200)}
        announce={{ pending: "Updating follow status" }}
      >
        {(checked) => (
          <Morph activeKey={checked ? "on" : "off"} items={{ on: "Unfollow thread", off: "Follow thread" }} />
        )}
      </DropdownMenuCheckboxItem>
    </>
  ),
  radio: () => (
    <>
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup defaultValue="system">
        <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  ),
  actions: () => (
    <>
      {/* Transient rows: they run, confirm, and put themselves back. They keep the menu
          open while they do, since an outcome on a row the user can no longer see is no
          outcome at all. */}
      <DropdownMenuActionItem
        icon={<Link2 />}
        action={() => navigator.clipboard?.writeText("https://example.com/i/4af")}
        labels={{ success: "Copied" }}
        announce={{ success: "Link copied" }}
      >
        Copy link
      </DropdownMenuActionItem>
      <DropdownMenuActionItem
        icon={<Archive />}
        action={() => wait(1200)}
        labels={{ pending: "Archiving…", success: "Archived" }}
        announce={{ pending: "Archiving thread", success: "Thread archived" }}
      >
        Archive thread
      </DropdownMenuActionItem>
      <DropdownMenuActionItem
        icon={<RefreshCw />}
        action={() => wait(1200).then(() => Promise.reject(new Error("offline")))}
        labels={{ pending: "Syncing…", error: "Sync failed" }}
        announce={{ pending: "Syncing", error: "Sync failed" }}
      >
        Sync now
      </DropdownMenuActionItem>
    </>
  ),
  panels: () => (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Upload />
          Transfer (menu)
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-56">
          <DropdownMenuItem>
            <Download />
            Import
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Upload />
            Export
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSelect<string> defaultValue="import">
        <DropdownMenuSelectTrigger icon={<Upload />} placeholder="Transfer" aria-label="Transfer" />
        <DropdownMenuSelectContent className="w-56" searchable searchPlaceholder="Search transfers">
          <DropdownMenuSelectItem value="import" icon={<Upload />}>
            Import
          </DropdownMenuSelectItem>
          <DropdownMenuSelectItem value="export" icon={<Download />}>
            Export
          </DropdownMenuSelectItem>
        </DropdownMenuSelectContent>
      </DropdownMenuSelect>
      <DropdownMenuSelect<string, true> multiple defaultValue={["pdf", "csv"]}>
        <DropdownMenuSelectTrigger icon={<Download />} placeholder="Formats" aria-label="Transfer formats" />
        <DropdownMenuSelectContent className="w-56" searchable searchPlaceholder="Search formats">
          <DropdownMenuSelectItem value="pdf">PDF</DropdownMenuSelectItem>
          <DropdownMenuSelectItem value="csv">CSV</DropdownMenuSelectItem>
          <DropdownMenuSelectItem value="json">JSON</DropdownMenuSelectItem>
        </DropdownMenuSelectContent>
      </DropdownMenuSelect>
    </>
  ),
};

export const dropdownMenuEntry = defineEntry({
  slug: "dropdown-menu",
  name: "Dropdown Menu",
  controls: {
    side: select(SIDES, "bottom"),
    align: select(ALIGNS, "start"),
    longLabels: bool(false, "Long labels"),
    shared: bool(false, "Shared menu"),
    safeTriangle: bool(false, "Show safe triangle"),
  },
  render: ({ side, align, safeTriangle, longLabels, shared }) => (
    <>
      <DropdownMenuDemo side={side} align={align} longLabels={longLabels} shared={shared} />
      {safeTriangle && <SafeTriangleOverlay />}
    </>
  ),
});

function DropdownMenuDemo({
  side,
  align,
  longLabels,
  shared,
}: {
  side: (typeof SIDES)[number];
  align: (typeof ALIGNS)[number];
  longLabels: boolean;
  shared: boolean;
}) {
  const [rows, setRows] = useState<RowKind>("items");
  const [handle] = useState(() => createDropdownMenuHandle<string>());

  return (
    <>
      {/* The row type picks which menu the trigger opens; the current one reads at full
          strength, the rest muted. Pinned to the middle of the canvas's left edge, at the
          toolbar's inset, so the trigger stays centred. */}
      <div
        role="group"
        aria-labelledby="dropdown-menu-variants"
        className="absolute top-1/2 left-3 z-10 flex w-28 -translate-y-1/2 flex-col items-stretch"
      >
        <p
          id="dropdown-menu-variants"
          className="mb-2.5 px-2 text-2xs text-subtle-foreground"
        >
          Variants
        </p>
        {ROWS.map((kind) => (
          <Button
            key={kind}
            type="button"
            variant="plain"
            size="sm"
            aria-pressed={rows === kind}
            // The rail's pace for the same muted-to-full change; the button's own fast hover
            // reads as a snap on text alone.
            className="justify-start px-2 text-muted-foreground duration-(--duration-slow) hover:text-foreground aria-pressed:text-foreground"
            onClick={() => setRows(kind)}
          >
            {ROW_LABELS[kind]}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        {(shared ? ["Alex", "Taylor"] : ["Options"]).map(name => (
          <DropdownMenuTrigger key={name} handle={handle} payload={name}
            render={(props, state) => (
              <Button {...props} variant={shared ? "outline" : "plain"} size={shared ? "sm" : "icon"}
                aria-label={shared ? `Options for ${name}` : "Options"} pressed={state.open} pressScale={false}
                className="transition-[background-color,box-shadow,color,opacity,scale] active:scale-[0.95] motion-reduce:active:scale-100 data-[popup-open]:scale-[0.95] motion-reduce:data-[popup-open]:scale-100">
                {shared ? <><User />{name}</> : <Ellipsis />}
              </Button>
            )} />
        ))}
      </div>
      <DropdownMenu handle={handle}>
        {({payload}) => (
          <DropdownMenuContent side={side} align={align} className={longLabels ? undefined : "w-56"}>
            {shared && <DropdownMenuLabel>Actions for {payload}</DropdownMenuLabel>}
            {longLabels ? <LongLabelRows kind={rows} /> : ROWS_BY_KIND[rows]()}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </>
  );
}

const longLabel = "Review the accessibility improvements across all shared workspace components";
const longUrl = "https://example.com/projects/design-system/accessible-component-library/release-notes";

function LongLabelRows({kind}: {kind:RowKind}) {
  if (kind === "checkboxes" || kind === "toggles") return <>
    <DropdownMenuCheckboxItem defaultChecked indicator={kind === "checkboxes"} icon={kind === "toggles" ? <Bell /> : undefined}>
      {longLabel}
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem>{longUrl}</DropdownMenuCheckboxItem>
  </>;
  if (kind === "radio") return <DropdownMenuRadioGroup defaultValue="review">
    <DropdownMenuRadioItem value="review">{longLabel}</DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="notes">{longUrl}</DropdownMenuRadioItem>
  </DropdownMenuRadioGroup>;
  if (kind === "actions") return <DropdownMenuActionItem icon={<RefreshCw />} action={() => wait(1200)}
    labels={{pending:"Updating every shared workspace component",success:"All shared workspace components are now up to date"}}>
    {longLabel}
  </DropdownMenuActionItem>;
  if (kind === "panels") return <>
    <DropdownMenuSub><DropdownMenuSubTrigger>{longLabel}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent><DropdownMenuItem>{longUrl}<DropdownMenuShortcut>⌘P</DropdownMenuShortcut></DropdownMenuItem></DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSelect<string> defaultValue="review"><DropdownMenuSelectTrigger placeholder="Workspace review settings" />
      <DropdownMenuSelectContent searchable><DropdownMenuSelectItem value="review">{longLabel}</DropdownMenuSelectItem>
        <DropdownMenuSelectItem value="notes">{longUrl}</DropdownMenuSelectItem>
      </DropdownMenuSelectContent>
    </DropdownMenuSelect>
  </>;
  return <>
    <DropdownMenuItem><User />{longLabel}<DropdownMenuShortcut>⌘P</DropdownMenuShortcut></DropdownMenuItem>
    <DropdownMenuItem><Link2 />{longUrl}</DropdownMenuItem>
    <DropdownMenuItem variant="destructive"><Trash2 />Permanently delete every archived project in this workspace</DropdownMenuItem>
  </>;
}
