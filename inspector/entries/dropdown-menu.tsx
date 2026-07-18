import { Bookmark, CreditCard, Download, LogOut, Settings, Trash2, Upload, User } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
import { defineEntry, select } from "../schema";

const SIDES = ["bottom", "top", "right", "left"] as const;
const ALIGNS = ["start", "center", "end"] as const;

export const dropdownMenuEntry = defineEntry({
  slug: "dropdown-menu",
  name: "Dropdown Menu",
  controls: {
    side: select(SIDES, "bottom"),
    align: select(ALIGNS, "start"),
  },
  render({ side, align }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline">Options</Button>} />
        <DropdownMenuContent side={side} align={align} className="w-56">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User />
              Profile
              <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
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

          {/* A toggle button: no left tick. `fillIcon` fills the one bookmark glyph on
              check (a fill transition, not a morph); the label text-morphs between states. */}
          <DropdownMenuCheckboxItem fillIcon indicator={false}>
            {(checked) => (
              <>
                <Bookmark />
                <Morph
                  // Left-align both states (the shorter one would otherwise sit centred
                  // in the reserved width of the longer).
                  className="place-items-start"
                  activeKey={checked ? "on" : "off"}
                  items={{ on: "Bookmarked", off: "Bookmark" }}
                />
              </>
            )}
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem defaultChecked>Show toolbar</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Show sidebar</DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup defaultValue="system">
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Upload />
              Transfer
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
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
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
});
