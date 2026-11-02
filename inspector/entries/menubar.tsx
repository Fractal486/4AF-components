"use client";

import {
  Clipboard,
  Copy,
  Ellipsis,
  Eye,
  FilePlus,
  FileText,
  FolderOpen,
  Mail,
  MessageSquare,
  Pencil,
  Printer,
  Redo2,
  Scissors,
  Search,
  Settings,
  StickyNote,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import {
  Menubar,
  MenubarActionItem,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/registry/ui/menubar/menubar";
import { bool, defineEntry, select } from "../schema";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const menubarEntry = defineEntry({
  slug: "menubar",
  name: "Menubar",
  controls: {
    size: select(["sm", "md"], "md", "Size"),
    variant: select(["outline", "plain"], "outline", "Variant"),
    orientation: select(["horizontal", "vertical"], "horizontal", "Orientation"),
    icons: bool(false, "Trigger icons"),
    // One menu (View) or the whole bar.
    disabled: select(["none", "menu", "bar"], "none", "Disabled"),
  },
  render: ({ size, variant, orientation, icons, disabled }) => (
    <Menubar
      // Remounted per geometry so the highlight measures the new layout from a clean slate.
      key={`${size}-${orientation}`}
      aria-label="Editor"
      size={size}
      variant={variant}
      orientation={orientation}
      disabled={disabled === "bar"}
    >
      <MenubarMenu>
        <MenubarTrigger>{icons && <FileText />}File</MenubarTrigger>
        <MenubarContent className="w-56">
          <MenubarItem>
            <FilePlus />
            New file
            <MenubarShortcut keys="mod+n" />
          </MenubarItem>
          <MenubarItem>
            <FolderOpen />
            Open…
            <MenubarShortcut keys="mod+o" />
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger inset>Share</MenubarSubTrigger>
            <MenubarSubContent className="w-44">
              <MenubarItem><Mail />Email link</MenubarItem>
              <MenubarItem><MessageSquare />Messages</MenubarItem>
              <MenubarItem><StickyNote />Notes</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem>
            <Printer />
            Print…
            <MenubarShortcut keys="mod+p" />
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem variant="destructive">
            <Trash2 />
            Move to trash
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>{icons && <Pencil />}Edit</MenubarTrigger>
        <MenubarContent className="w-56">
          <MenubarItem>
            <Undo2 />
            Undo
            <MenubarShortcut keys="mod+z" />
          </MenubarItem>
          <MenubarItem>
            <Redo2 />
            Redo
            <MenubarShortcut keys="mod+shift+z" />
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Scissors />
            Cut
            <MenubarShortcut keys="mod+x" />
          </MenubarItem>
          <MenubarItem>
            <Copy />
            Copy
            <MenubarShortcut keys="mod+c" />
          </MenubarItem>
          <MenubarItem disabled disabledReason="The clipboard is empty.">
            <Clipboard />
            Paste
            <MenubarShortcut keys="mod+v" />
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Search />
            Find…
            <MenubarShortcut keys="mod+f" />
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu disabled={disabled === "menu"}>
        <MenubarTrigger>{icons && <Eye />}View</MenubarTrigger>
        <MenubarContent className="w-56">
          <MenubarCheckboxItem defaultChecked>Show toolbar</MenubarCheckboxItem>
          <MenubarCheckboxItem>Show minimap</MenubarCheckboxItem>
          <MenubarCheckboxItem action={() => wait(1200)} announce={{ pending: "Updating word wrap" }}>
            Word wrap
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarItem inset>
            Toggle full screen
            <MenubarShortcut keys="mod+ctrl+f" />
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>{icons && <User />}Profiles</MenubarTrigger>
        <MenubarContent className="w-48">
          <MenubarGroup aria-label="Switch profile">
            <MenubarLabel>Switch profile</MenubarLabel>
            <MenubarRadioGroup defaultValue="mira">
              <MenubarRadioItem value="jun">Jun</MenubarRadioItem>
              <MenubarRadioItem value="mira">Mira</MenubarRadioItem>
              <MenubarRadioItem value="sol">Sol</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarActionItem
            icon={<Settings />}
            action={() => wait(1200)}
            labels={{ pending: "Syncing…", success: "Synced" }}
            announce={{ pending: "Syncing profiles", success: "Profiles synced" }}
          >
            Sync profiles
          </MenubarActionItem>
        </MenubarContent>
      </MenubarMenu>
      {icons && (
        <MenubarMenu>
          <MenubarTrigger aria-label="More">
            <Ellipsis />
          </MenubarTrigger>
          <MenubarContent align={orientation === "vertical" ? "start" : "end"} className="w-48">
            <MenubarItem><Settings />Preferences</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      )}
    </Menubar>
  ),
});
